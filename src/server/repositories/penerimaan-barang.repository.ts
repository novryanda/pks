import { db } from "../db";
import type { PenerimaanBarangInput, UpdatePenerimaanBarangInput } from "../schema/penerimaan-barang";
import { StatusPenerimaanBarang } from "@prisma/client";

export const penerimaanBarangRepository = {
  async findAll(companyId: string, filters?: {
    status?: StatusPenerimaanBarang;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { companyId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.vendorId) {
      where.vendorId = filters.vendorId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.tanggalPenerimaan = {};
      if (filters.startDate) {
        where.tanggalPenerimaan.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalPenerimaan.lte = filters.endDate;
      }
    }

    return db.penerimaanBarang.findMany({
      where,
      include: {
        purchaseOrder: true,
        purchaseRequest: true,
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
            purchaseOrderItem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string, companyId: string) {
    return db.penerimaanBarang.findFirst({
      where: { id, companyId },
      include: {
        purchaseOrder: {
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
        purchaseRequest: {
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
            purchaseOrderItem: true,
          },
        },
      },
    });
  },

  async create(companyId: string, nomorPenerimaan: string, data: PenerimaanBarangInput) {
    return db.penerimaanBarang.create({
      data: {
        companyId,
        nomorPenerimaan,
        purchaseOrderId: data.purchaseOrderId,
        purchaseRequestId: data.purchaseRequestId,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        nomorSuratJalan: data.nomorSuratJalan,
        tanggalSuratJalan: data.tanggalSuratJalan ? new Date(data.tanggalSuratJalan) : undefined,
        nomorInvoice: data.nomorInvoice,
        tanggalInvoice: data.tanggalInvoice ? new Date(data.tanggalInvoice) : undefined,
        receivedBy: data.receivedBy,
        checkedBy: data.checkedBy,
        keterangan: data.keterangan,
        items: {
          create: data.items.map(item => ({
            materialId: item.materialId,
            purchaseOrderItemId: item.purchaseOrderItemId,
            jumlahDiterima: item.jumlahDiterima,
            hargaSatuan: item.hargaSatuan,
            totalHarga: item.jumlahDiterima * item.hargaSatuan,
            lokasiPenyimpanan: item.lokasiPenyimpanan,
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

  async update(id: string, companyId: string, data: UpdatePenerimaanBarangInput) {
    const updateData: any = {};
    
    if (data.vendorId) updateData.vendorId = data.vendorId;
    if (data.vendorName) updateData.vendorName = data.vendorName;
    if (data.nomorSuratJalan !== undefined) updateData.nomorSuratJalan = data.nomorSuratJalan;
    if (data.tanggalSuratJalan) updateData.tanggalSuratJalan = new Date(data.tanggalSuratJalan);
    if (data.nomorInvoice !== undefined) updateData.nomorInvoice = data.nomorInvoice;
    if (data.tanggalInvoice) updateData.tanggalInvoice = new Date(data.tanggalInvoice);
    if (data.receivedBy) updateData.receivedBy = data.receivedBy;
    if (data.checkedBy !== undefined) updateData.checkedBy = data.checkedBy;
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;

    // If items are provided, delete old items and create new ones
    if (data.items) {
      await db.penerimaanBarangItem.deleteMany({
        where: { penerimaanBarangId: id },
      });

      updateData.items = {
        create: data.items.map(item => ({
          materialId: item.materialId,
          purchaseOrderItemId: item.purchaseOrderItemId,
          jumlahDiterima: item.jumlahDiterima,
          hargaSatuan: item.hargaSatuan,
          totalHarga: item.jumlahDiterima * item.hargaSatuan,
          lokasiPenyimpanan: item.lokasiPenyimpanan,
          keterangan: item.keterangan,
        })),
      };
    }

    return db.penerimaanBarang.update({
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

  async updateStatus(id: string, companyId: string, status: StatusPenerimaanBarang, additionalData?: any) {
    return db.penerimaanBarang.update({
      where: { id, companyId },
      data: {
        status,
        ...additionalData,
      },
    });
  },

  async complete(id: string, companyId: string, checkedBy: string) {
    return db.penerimaanBarang.update({
      where: { id, companyId },
      data: {
        status: StatusPenerimaanBarang.COMPLETED,
        checkedBy,
      },
    });
  },

  async delete(id: string, companyId: string) {
    return db.penerimaanBarang.delete({
      where: { id, companyId },
    });
  },

  async generateNomorPenerimaan(companyId: string) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    
    const prefix = `GR/${year}${month}`;
    
    const lastGR = await db.penerimaanBarang.findFirst({
      where: {
        companyId,
        nomorPenerimaan: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = 1;
    if (lastGR) {
      const lastNumber = parseInt(lastGR.nomorPenerimaan.split("/").pop() ?? "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}/${String(nextNumber).padStart(4, "0")}`;
  },
};
