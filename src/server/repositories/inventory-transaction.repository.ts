import { db } from "../db";
import { TipeMovement } from "@prisma/client";

export const inventoryTransactionRepository = {
  async findAll(companyId: string, filters?: {
    materialId?: string;
    tipeTransaksi?: TipeMovement;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { companyId };
    
    if (filters?.materialId) {
      where.materialId = filters.materialId;
    }
    if (filters?.tipeTransaksi) {
      where.tipeTransaksi = filters.tipeTransaksi;
    }
    if (filters?.vendorId) {
      where.vendorId = filters.vendorId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.tanggalTransaksi = {};
      if (filters.startDate) {
        where.tanggalTransaksi.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalTransaksi.lte = filters.endDate;
      }
    }

    const transactions = await db.inventoryTransaction.findMany({
      where,
      include: {
        material: {
          include: {
            kategoriMaterial: true,
            satuanMaterial: true,
          },
        },
      },
      orderBy: { tanggalTransaksi: "desc" },
    });

    const pengeluaranReferences = [
      ...new Set(
        transactions
          .filter((transaction) => transaction.tipeTransaksi === TipeMovement.OUT && transaction.referensi)
          .map((transaction) => transaction.referensi!)
      ),
    ];

    if (pengeluaranReferences.length === 0) {
      return transactions;
    }

    const pengeluaranList = await db.pengeluaranBarang.findMany({
      where: {
        companyId,
        nomorPengeluaran: {
          in: pengeluaranReferences,
        },
      },
      select: {
        nomorPengeluaran: true,
        requestedBy: true,
      },
    });

    const requestedByByReference = new Map(
      pengeluaranList.map((pengeluaran) => [
        pengeluaran.nomorPengeluaran,
        pengeluaran.requestedBy,
      ])
    );

    return transactions.map((transaction) => ({
      ...transaction,
      requestedBy: transaction.referensi
        ? requestedByByReference.get(transaction.referensi) ?? null
        : null,
    }));
  },

  async findByMaterial(materialId: string, companyId: string, limit?: number) {
    return db.inventoryTransaction.findMany({
      where: { materialId, companyId },
      include: {
        material: {
          include: {
            kategoriMaterial: true,
            satuanMaterial: true,
          },
        },
      },
      orderBy: { tanggalTransaksi: "desc" },
      take: limit,
    });
  },

  async create(companyId: string, data: {
    materialId: string;
    tipeTransaksi: TipeMovement;
    referensi?: string;
    vendorId?: string;
    vendorName?: string;
    jumlahMasuk?: number;
    jumlahKeluar?: number;
    stockOnHand: number;
    hargaSatuan?: number;
    totalHarga?: number;
    keterangan?: string;
    operator: string;
    tanggalTransaksi?: Date;
  }) {
    return db.inventoryTransaction.create({
      data: {
        companyId,
        materialId: data.materialId,
        tipeTransaksi: data.tipeTransaksi,
        referensi: data.referensi,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        jumlahMasuk: data.jumlahMasuk ?? 0,
        jumlahKeluar: data.jumlahKeluar ?? 0,
        stockOnHand: data.stockOnHand,
        hargaSatuan: data.hargaSatuan ?? 0,
        totalHarga: data.totalHarga ?? 0,
        keterangan: data.keterangan,
        operator: data.operator,
        tanggalTransaksi: data.tanggalTransaksi,
      },
      include: {
        material: {
          include: {
            kategoriMaterial: true,
            satuanMaterial: true,
          },
        },
      },
    });
  },

  async getStockSummary(companyId: string) {
    const materials = await db.materialInventaris.findMany({
      where: { companyId },
      select: {
        id: true,
        partNumber: true,
        namaMaterial: true,
        stockOnHand: true,
        kategoriMaterial: {
          select: {
            name: true,
          },
        },
        satuanMaterial: {
          select: {
            name: true,
            symbol: true,
          },
        },
      },
    });

    const summary = await Promise.all(
      materials.map(async (material) => {
        // Get last transaction for this material
        const lastTransaction = await db.inventoryTransaction.findFirst({
          where: {
            companyId,
            materialId: material.id,
          },
          orderBy: { tanggalTransaksi: "desc" },
        });

        // Get total in and out
        const transactions = await db.inventoryTransaction.groupBy({
          by: ['materialId'],
          where: {
            companyId,
            materialId: material.id,
          },
          _sum: {
            jumlahMasuk: true,
            jumlahKeluar: true,
            totalHarga: true,
          },
        });

        const totals = transactions[0] ?? {
          _sum: { jumlahMasuk: 0, jumlahKeluar: 0, totalHarga: 0 },
        };

        return {
          ...material,
          totalMasuk: totals._sum.jumlahMasuk ?? 0,
          totalKeluar: totals._sum.jumlahKeluar ?? 0,
          totalNilai: totals._sum.totalHarga ?? 0,
          lastTransactionDate: lastTransaction?.tanggalTransaksi,
        };
      })
    );

    return summary;
  },
};
