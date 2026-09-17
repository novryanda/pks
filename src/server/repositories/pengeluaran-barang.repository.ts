import { db } from "../db";
import type { PengeluaranBarangInput, UpdatePengeluaranBarangInput } from "../schema/pengeluaran-barang";
import { StatusPengeluaranBarang } from "@prisma/client";

export const pengeluaranBarangRepository = {
  async findAll(companyId: string, filters?: {
    status?: StatusPengeluaranBarang;
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
      where.tanggalPengeluaran = {};
      if (filters.startDate) {
        where.tanggalPengeluaran.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalPengeluaran.lte = filters.endDate;
      }
    }

    return db.pengeluaranBarang.findMany({
      where,
      include: {
        storeRequest: true,
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
    return db.pengeluaranBarang.findFirst({
      where: { id, companyId },
      include: {
        storeRequest: {
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
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

  async create(companyId: string, nomorPengeluaran: string, data: PengeluaranBarangInput) {
    const tanggalPengeluaran = data.tanggalPengeluaran
      ? new Date(data.tanggalPengeluaran)
      : new Date();

    return db.pengeluaranBarang.create({
      data: {
        companyId,
        nomorPengeluaran,
        tanggalPengeluaran,
        storeRequestId: data.storeRequestId,
        divisi: data.divisi,
        requestedBy: data.requestedBy,
        issuedBy: data.requestedBy,
        keterangan: data.keterangan,
        status: "COMPLETED",
        items: {
          create: data.items.map(item => ({
            materialId: item.materialId,
            jumlahKeluar: item.jumlahKeluar,
            hargaSatuan: 0, // Will be calculated from stock
            totalHarga: 0,
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

  async update(id: string, companyId: string, data: UpdatePengeluaranBarangInput) {
    const updateData: any = {};
    
    if (data.tanggalPengeluaran) {
      updateData.tanggalPengeluaran = new Date(data.tanggalPengeluaran);
    }
    if (data.divisi) updateData.divisi = data.divisi;
    if (data.requestedBy) {
      updateData.requestedBy = data.requestedBy;
      updateData.issuedBy = data.requestedBy;
    }
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;

    // If items are provided, delete old items and create new ones
    if (data.items) {
      await db.pengeluaranBarangItem.deleteMany({
        where: { pengeluaranBarangId: id },
      });

      updateData.items = {
        create: data.items.map(item => ({
          materialId: item.materialId,
          jumlahKeluar: item.jumlahKeluar,
          hargaSatuan: 0,
          totalHarga: 0,
          keterangan: item.keterangan,
        })),
      };
    }

    return db.pengeluaranBarang.update({
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

  async updateStatus(id: string, companyId: string, status: StatusPengeluaranBarang, additionalData?: any) {
    return db.pengeluaranBarang.update({
      where: { id, companyId },
      data: {
        status,
        ...additionalData,
      },
    });
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    return db.pengeluaranBarang.update({
      where: { id, companyId },
      data: {
        status: StatusPengeluaranBarang.APPROVED,
        approvedBy,
        tanggalApproval: new Date(),
      },
    });
  },

  async reject(id: string, companyId: string) {
    return db.pengeluaranBarang.update({
      where: { id, companyId },
      data: {
        status: StatusPengeluaranBarang.REJECTED,
      },
    });
  },

  async issue(id: string, companyId: string, issuedBy: string) {
    return db.pengeluaranBarang.update({
      where: { id, companyId },
      data: {
        issuedBy,
      },
    });
  },

  async complete(id: string, companyId: string, receivedByDivisi: string) {
    return db.pengeluaranBarang.update({
      where: { id, companyId },
      data: {
        status: StatusPengeluaranBarang.COMPLETED,
        receivedByDivisi,
        tanggalDiterima: new Date(),
      },
    });
  },

  async updateItemPrice(itemId: string, hargaSatuan: number) {
    const item = await db.pengeluaranBarangItem.findUnique({
      where: { id: itemId },
      select: { jumlahKeluar: true },
    });

    if (!item) {
      throw new Error("Item tidak ditemukan");
    }

    return db.pengeluaranBarangItem.update({
      where: { id: itemId },
      data: {
        hargaSatuan,
        totalHarga: item.jumlahKeluar * hargaSatuan,
      },
    });
  },

  async delete(id: string, companyId: string) {
    return db.pengeluaranBarang.delete({
      where: { id, companyId },
    });
  },

  async generateNomorPengeluaran(companyId: string) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    
    const prefix = `GI/${year}${month}`;
    
    const lastGI = await db.pengeluaranBarang.findFirst({
      where: {
        companyId,
        nomorPengeluaran: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = 1;
    if (lastGI) {
      const lastNumber = parseInt(lastGI.nomorPengeluaran.split("/").pop() ?? "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}/${String(nextNumber).padStart(4, "0")}`;
  },
};
