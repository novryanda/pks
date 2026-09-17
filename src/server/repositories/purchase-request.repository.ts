import { db } from "../db";
import type { PurchaseRequestInput, UpdatePurchaseRequestInput } from "../schema/purchase-request";
import { StatusPurchaseRequest, TipePembelianPR } from "@prisma/client";

export const purchaseRequestRepository = {
  async findAll(companyId: string, filters?: {
    status?: StatusPurchaseRequest;
    tipePembelian?: TipePembelianPR;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { companyId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.tipePembelian) {
      where.tipePembelian = filters.tipePembelian;
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

    return db.purchaseRequest.findMany({
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
        purchaseOrders: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string, companyId: string) {
    return db.purchaseRequest.findFirst({
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
        purchaseOrders: true,
      },
    });
  },

  async create(companyId: string, nomorPR: string, data: PurchaseRequestInput) {
    return db.purchaseRequest.create({
      data: {
        companyId,
        nomorPR,
        tipePembelian: data.tipePembelian as TipePembelianPR,
        storeRequestId: data.storeRequestId,
        divisi: data.divisi,
        requestedBy: data.requestedBy,
        vendorNameDirect: data.vendorNameDirect,
        vendorAddressDirect: data.vendorAddressDirect,
        vendorPhoneDirect: data.vendorPhoneDirect,
        keterangan: data.keterangan,
        items: {
          create: data.items.map(item => ({
            materialId: item.materialId,
            jumlahRequest: item.jumlahRequest,
            estimasiHarga: item.estimasiHarga,
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

  async update(id: string, companyId: string, data: UpdatePurchaseRequestInput) {
    const updateData: any = {};
    
    if (data.tipePembelian) updateData.tipePembelian = data.tipePembelian;
    if (data.divisi !== undefined) updateData.divisi = data.divisi;
    if (data.requestedBy) updateData.requestedBy = data.requestedBy;
    if (data.vendorNameDirect !== undefined) updateData.vendorNameDirect = data.vendorNameDirect;
    if (data.vendorAddressDirect !== undefined) updateData.vendorAddressDirect = data.vendorAddressDirect;
    if (data.vendorPhoneDirect !== undefined) updateData.vendorPhoneDirect = data.vendorPhoneDirect;
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;

    // If items are provided, delete old items and create new ones
    if (data.items) {
      await db.purchaseRequestItem.deleteMany({
        where: { purchaseRequestId: id },
      });

      updateData.items = {
        create: data.items.map(item => ({
          materialId: item.materialId,
          jumlahRequest: item.jumlahRequest,
          estimasiHarga: item.estimasiHarga,
          keterangan: item.keterangan,
        })),
      };
    }

    return db.purchaseRequest.update({
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

  async updateStatus(id: string, companyId: string, status: StatusPurchaseRequest, additionalData?: any) {
    return db.purchaseRequest.update({
      where: { id, companyId },
      data: {
        status,
        ...additionalData,
      },
    });
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    return db.purchaseRequest.update({
      where: { id, companyId },
      data: {
        status: StatusPurchaseRequest.APPROVED,
        approvedBy,
        tanggalApproval: new Date(),
      },
    });
  },

  async reject(id: string, companyId: string) {
    return db.purchaseRequest.update({
      where: { id, companyId },
      data: {
        status: StatusPurchaseRequest.REJECTED,
      },
    });
  },

  async delete(id: string, companyId: string) {
    return db.purchaseRequest.delete({
      where: { id, companyId },
    });
  },

  // Get approved PRs yang siap untuk dijadikan PO (tipe PENGAJUAN_PO)
  // Fungsi ini sekarang tidak digunakan, pakai findPendingPRsForPO di purchase-order repository
  async findApprovedForPO(companyId: string) {
    return db.purchaseRequest.findMany({
      where: {
        companyId,
        tipePembelian: TipePembelianPR.PENGAJUAN_PO,
        status: {
          in: [StatusPurchaseRequest.APPROVED, StatusPurchaseRequest.PO_CREATED],
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
        purchaseOrders: true,
      },
      orderBy: { tanggalRequest: "desc" },
    });
  },

  // Get approved PRs untuk pembelian langsung (siap untuk penerimaan barang)
  async findApprovedDirectPurchase(companyId: string) {
    return db.purchaseRequest.findMany({
      where: {
        companyId,
        tipePembelian: TipePembelianPR.PEMBELIAN_LANGSUNG,
        status: StatusPurchaseRequest.APPROVED,
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
        penerimaanBarang: true,
      },
      orderBy: { tanggalRequest: "desc" },
    });
  },

  async generateNomorPR(companyId: string) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    
    const prefix = `PR/${year}${month}`;
    
    const lastPR = await db.purchaseRequest.findFirst({
      where: {
        companyId,
        nomorPR: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = 1;
    if (lastPR) {
      const lastNumber = parseInt(lastPR.nomorPR.split("/").pop() ?? "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}/${String(nextNumber).padStart(4, "0")}`;
  },

  // Find PR Item by ID with material info
  async findItemById(prItemId: string) {
    return db.purchaseRequestItem.findUnique({
      where: { id: prItemId },
      include: {
        material: {
          include: {
            kategoriMaterial: true,
            satuanMaterial: true,
          },
        },
        purchaseRequest: true,
      },
    });
  },
};
