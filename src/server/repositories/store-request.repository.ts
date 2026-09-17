import { db } from "../db";
import type { StoreRequestInput, UpdateStoreRequestInput } from "../schema/store-request";
import { StatusStoreRequest } from "@prisma/client";

export const storeRequestRepository = {
  async findAll(companyId: string, filters?: {
    status?: StatusStoreRequest;
    divisi?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { companyId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.divisi) {
      where.divisi = filters.divisi;
    }
    if (filters?.startDate || filters?.endDate) {
      where.tanggalRequest = {};
      if (filters.startDate) {
        where.tanggalRequest.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalRequest.lte = filters.endDate;
      }
    }

    return db.storeRequest.findMany({
      where,
      include: {
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string, companyId: string) {
    return db.storeRequest.findFirst({
      where: { id, companyId },
      include: {
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
          },
        },
        pengeluaranBarang: true,
        purchaseRequest: true,
      },
    });
  },

  async create(companyId: string, nomorSR: string, data: StoreRequestInput) {
    return db.storeRequest.create({
      data: {
        companyId,
        nomorSR,
        divisi: data.divisi,
        requestedBy: data.requestedBy,
        keterangan: data.keterangan,
        status: StatusStoreRequest.PENDING,
        items: {
          create: data.items.map(item => ({
            materialId: item.materialId,
            jumlahRequest: item.jumlahRequest,
            keterangan: item.keterangan,
          })),
        },
      },
      include: {
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
          },
        },
      },
    });
  },

  async update(id: string, companyId: string, data: UpdateStoreRequestInput) {
    const updateData: any = {};
    
    if (data.divisi) updateData.divisi = data.divisi;
    if (data.requestedBy) updateData.requestedBy = data.requestedBy;
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;

    // If items are provided, delete old items and create new ones
    if (data.items) {
      await db.storeRequestItem.deleteMany({
        where: { storeRequestId: id },
      });

      updateData.items = {
        create: data.items.map(item => ({
          materialId: item.materialId,
          jumlahRequest: item.jumlahRequest,
          keterangan: item.keterangan,
        })),
      };
    }

    return db.storeRequest.update({
      where: { id, companyId },
      data: updateData,
      include: {
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
          },
        },
      },
    });
  },

  async updateStatus(id: string, companyId: string, status: StatusStoreRequest, additionalData?: any) {
    return db.storeRequest.update({
      where: { id, companyId },
      data: {
        status,
        ...additionalData,
      },
    });
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    return db.storeRequest.update({
      where: { id, companyId },
      data: {
        status: StatusStoreRequest.APPROVED,
        approvedBy,
        tanggalApproval: new Date(),
      },
    });
  },

  async reject(id: string, companyId: string) {
    return db.storeRequest.update({
      where: { id, companyId },
      data: {
        status: StatusStoreRequest.REJECTED,
      },
    });
  },

  async complete(id: string, companyId: string) {
    return db.storeRequest.update({
      where: { id, companyId },
      data: {
        status: StatusStoreRequest.COMPLETED,
      },
    });
  },

  async needPR(id: string, companyId: string) {
    return db.storeRequest.update({
      where: { id, companyId },
      data: {
        status: StatusStoreRequest.NEED_PR,
      },
    });
  },

  async delete(id: string, companyId: string) {
    return db.storeRequest.delete({
      where: { id, companyId },
    });
  },

  async generateNomorSR(companyId: string) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    
    const prefix = `SR/${year}${month}`;
    
    const lastSR = await db.storeRequest.findFirst({
      where: {
        companyId,
        nomorSR: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = 1;
    if (lastSR) {
      const lastNumber = parseInt(lastSR.nomorSR.split("/").pop() ?? "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}/${String(nextNumber).padStart(4, "0")}`;
  },

  async findApprovedWithoutPengeluaran(companyId: string) {
    return db.storeRequest.findMany({
      where: {
        companyId,
        status: StatusStoreRequest.APPROVED,
        pengeluaranBarang: null, // Belum ada pengeluaran barang
      },
      include: {
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
          },
        },
      },
      orderBy: { tanggalRequest: "desc" },
    });
  },
};
