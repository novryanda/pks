import { db } from "@/server/db";
import { getJakartaDateKey, parseJakartaDateBoundary } from "@/lib/date-time";
import { materialRepository } from "@/server/repositories/material.repository";
import type {
  CreateTangkiInput,
  UpdateTangkiInput,
  CreateStockTangkiInput,
  FilterStockTangkiInput,
} from "../schema/tangki";
import type { Prisma } from "@prisma/client";

export const tangkiRepository = {
  // ==================== TANGKI OPERATIONS ====================

  /**
   * Get all tangki by company
   */
  async getAllTangki(companyId: string, materialId?: string) {
    const where: { companyId: string; materialId?: string } = { companyId };
    if (materialId) {
      where.materialId = materialId;
    }

    return await db.tangki.findMany({
      where,
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
      orderBy: {
        namaTangki: "asc",
      },
    });
  },

  /**
   * Get tangki by ID
   */
  async getTangkiById(id: string, companyId: string) {
    return await db.tangki.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        riwayatStockTangki: {
          take: 10,
          orderBy: {
            tanggalTransaksi: "desc",
          },
        },
      },
    });
  },

  /**
   * Create new tangki
   */
  async createTangki(companyId: string, data: CreateTangkiInput) {
    return await db.tangki.create({
      data: {
        companyId,
        ...data,
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
    });
  },

  /**
   * Update tangki
   */
  async updateTangki(id: string, companyId: string, data: UpdateTangkiInput) {
    return await db.tangki.update({
      where: {
        id,
        companyId,
      },
      data,
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
    });
  },

  /**
   * Delete tangki
   */
  async deleteTangki(id: string, companyId: string) {
    return await db.tangki.delete({
      where: {
        id,
        companyId,
      },
    });
  },

  /**
   * Check if tangki name already exists
   */
  async isTangkiNameExists(
    namaTangki: string,
    companyId: string,
    excludeId?: string,
  ) {
    const tangki = await db.tangki.findFirst({
      where: {
        namaTangki,
        companyId,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });
    return !!tangki;
  },

  // ==================== STOCK TANGKI OPERATIONS ====================

  getTransactionDate(tanggalTransaksi?: Date | string | null) {
    if (!tanggalTransaksi) {
      return new Date();
    }

    if (tanggalTransaksi instanceof Date) {
      return tanggalTransaksi;
    }

    return (
      parseJakartaDateBoundary(tanggalTransaksi) ?? new Date(tanggalTransaksi)
    );
  },

  getDayRange(date: Date) {
    const dateKey = getJakartaDateKey(date);

    return {
      startOfDay: dateKey
        ? (parseJakartaDateBoundary(dateKey) ?? new Date(date))
        : new Date(date),
      endOfDay: dateKey
        ? (parseJakartaDateBoundary(dateKey, { endOfDay: true }) ??
          new Date(date))
        : new Date(date),
    };
  },

  getTankTransactionImpact(entry: {
    tipeTransaksi: string;
    jumlah: number;
    stockSebelum: number;
    stockSesudah: number;
  }) {
    if (entry.tipeTransaksi === "KELUAR") {
      return -entry.jumlah;
    }

    if (entry.tipeTransaksi === "TRANSFER") {
      return entry.stockSesudah < entry.stockSebelum
        ? -entry.jumlah
        : entry.jumlah;
    }

    return entry.jumlah;
  },

  /**
   * Add stock transaction (MASUK/KELUAR/TRANSFER/ADJUSTMENT)
   */
  async addStockTransaction(
    data: CreateStockTangkiInput & { companyId: string },
  ) {
    const tangki = await db.tangki.findFirst({
      where: {
        id: data.tangkiId,
        companyId: data.companyId,
      },
      include: {
        material: true,
      },
    });

    if (!tangki) {
      throw new Error("Tangki tidak ditemukan");
    }

    const transDate = this.getTransactionDate(data.tanggalTransaksi);
    const { startOfDay, endOfDay } = this.getDayRange(transDate);

    // Get the logical "Stock Sebelum" at that specific date (Isolated per day)
    const lastTransaction = await db.stockTangki.findFirst({
      where: {
        tangkiId: data.tangkiId,
        tanggalTransaksi: { gte: startOfDay, lte: transDate },
      },
      orderBy: [{ tanggalTransaksi: "desc" }, { id: "desc" }],
    });

    const stockSebelum = lastTransaction?.stockSesudah ?? 0;
    let stockSesudah = stockSebelum;

    // Calculate stock based on transaction type
    switch (data.tipeTransaksi) {
      case "MASUK":
      case "ADJUSTMENT":
        stockSesudah = stockSebelum + data.jumlah;
        break;
      case "TRANSFER":
        throw new Error("Transfer harus menggunakan method transferStock");
    }

    // Validate against Total Production Balance (Sum of all tanks <= Production - Shipping)
    if (data.tipeTransaksi === "MASUK" || data.tipeTransaksi === "ADJUSTMENT") {
      const totalBalance = await materialRepository.getStockBalanceAtDate(
        tangki.companyId,
        tangki.materialId,
        endOfDay,
      );

      // 2. Validate ONLY against today's distribution across ALL tanks
      const dailyTransactions = await db.stockTangki.findMany({
        where: {
          tanggalTransaksi: { gte: startOfDay, lte: endOfDay },
          tangki: {
            companyId: tangki.companyId,
            materialId: tangki.materialId,
          },
        },
      });

      const totalDistributedToday = dailyTransactions.reduce(
        (sum, tx) => sum + this.getTankTransactionImpact(tx),
        0,
      );

      const totalInTanksAfter = totalDistributedToday + data.jumlah;

      if (totalInTanksAfter > totalBalance + 0.01) {
        throw new Error(
          "jumlah yang anda masuki melebihi jumlah stok produksi saat ini",
        );
      }
    }

    // Create transaction and update tangki in a transaction
    return await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create stock transaction record
      const stockTransaction = await tx.stockTangki.create({
        data: {
          tangkiId: data.tangkiId,
          tipeTransaksi: data.tipeTransaksi,
          jumlah: data.jumlah,
          stockSebelum,
          stockSesudah,
          keterangan: data.keterangan,
          operator: data.operator,
          tanggalTransaksi: transDate,
        },
      });

      return stockTransaction;
    });
  },

  /**
   * Transfer stock between tanks
   */
  async transferStock(
    companyId: string,
    tangkiAsalId: string,
    tangkiTujuanId: string,
    jumlah: number,
    operator: string,
    keterangan?: string,
    tanggalTransaksi?: Date | string,
  ) {
    const tangkiAsal = await db.tangki.findFirst({
      where: {
        id: tangkiAsalId,
        companyId,
      },
    });
    const tangkiTujuan = await db.tangki.findFirst({
      where: {
        id: tangkiTujuanId,
        companyId,
      },
    });

    if (!tangkiAsal || !tangkiTujuan) {
      throw new Error("Tangki tidak ditemukan");
    }

    if (tangkiAsal.materialId !== tangkiTujuan.materialId) {
      throw new Error("Material tangki harus sama untuk transfer");
    }

    // In flexible logging mode, we allow recording any amount for documentation.

    return await db.$transaction(async (tx) => {
      const transDate = this.getTransactionDate(tanggalTransaksi);
      const { startOfDay, endOfDay } = this.getDayRange(transDate);

      // 1. Get historical balances for both tanks (Isolated per day)
      const lastAsal = await tx.stockTangki.findFirst({
        where: {
          tangkiId: tangkiAsalId,
          tanggalTransaksi: { gte: startOfDay, lte: transDate },
        },
        orderBy: [{ tanggalTransaksi: "desc" }, { id: "desc" }],
      });
      const lastTujuan = await tx.stockTangki.findFirst({
        where: {
          tangkiId: tangkiTujuanId,
          tanggalTransaksi: { gte: startOfDay, lte: transDate },
        },
        orderBy: [{ tanggalTransaksi: "desc" }, { id: "desc" }],
      });

      const asalSebelum = lastAsal?.stockSesudah ?? 0;
      const tujuanSebelum = lastTujuan?.stockSesudah ?? 0;

      // VALIDATION: Check destination tank capacity
      const tujuanAvailableCapacity = tangkiTujuan.kapasitas - tujuanSebelum;
      if (jumlah > tujuanAvailableCapacity) {
        throw new Error("kapasitas tangki yang anda transfer tidak mencukupi");
      }

      const asalSesudah = Math.max(0, asalSebelum - jumlah);
      const tujuanSesudah = tujuanSebelum + jumlah;

      const totalBalance = await materialRepository.getStockBalanceAtDate(
        tangkiAsal.companyId,
        tangkiAsal.materialId,
        endOfDay,
      );

      // 2. Validate ONLY against today's distribution across ALL tanks
      const dailyTransactions = await tx.stockTangki.findMany({
        where: {
          tanggalTransaksi: { gte: startOfDay, lte: endOfDay },
          tangki: {
            companyId: tangkiAsal.companyId,
            materialId: tangkiAsal.materialId,
          },
        },
      });

      const totalDistributedToday = dailyTransactions.reduce(
        (sum, entry) => sum + this.getTankTransactionImpact(entry),
        0,
      );

      // A transfer is zero-sum, so it shouldn't change the daily total.
      const totalInTanksAfter = totalDistributedToday;

      if (totalInTanksAfter > totalBalance + 0.01) {
        throw new Error(
          `Total isi seluruh tangki (${totalInTanksAfter.toLocaleString("id-ID")}) melebihi Sisa Stok Produksi (${totalBalance.toLocaleString("id-ID")}). ` +
            `Sisa jatah yang bisa ditambahkan: ${Math.max(0, totalBalance - (totalInTanksAfter - 0 /* zero net change for transfer */)).toLocaleString("id-ID")}`,
        );
      }

      // Record KELUAR from source tank
      await tx.stockTangki.create({
        data: {
          tangkiId: tangkiAsalId,
          tipeTransaksi: "TRANSFER",
          jumlah,
          stockSebelum: asalSebelum,
          stockSesudah: asalSesudah,
          referensi: `TRANSFER-${tangkiTujuanId}`,
          keterangan: keterangan ?? `Transfer ke ${tangkiTujuan.namaTangki}`,
          operator,
          tanggalTransaksi: transDate,
        },
      });

      // Record MASUK to destination tank
      await tx.stockTangki.create({
        data: {
          tangkiId: tangkiTujuanId,
          tipeTransaksi: "TRANSFER",
          jumlah,
          stockSebelum: tujuanSebelum,
          stockSesudah: tujuanSesudah,
          referensi: `TRANSFER-${tangkiAsalId}`,
          keterangan: keterangan ?? `Transfer dari ${tangkiAsal.namaTangki}`,
          operator,
          tanggalTransaksi: transDate,
        },
      });

      return { success: true };
    });
  },

  /**
   * Get stock history with filters
   */
  async getStockHistory(
    filter: FilterStockTangkiInput & { companyId: string },
  ) {
    const {
      companyId,
      tangkiId,
      tipeTransaksi,
      tanggalMulai,
      tanggalSelesai,
      page,
      limit,
    } = filter;

    const where: {
      tangki?: {
        companyId: string;
      };
      tangkiId?: string;
      tipeTransaksi?: "MASUK" | "KELUAR" | "TRANSFER" | "ADJUSTMENT";
      tanggalTransaksi?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      tangki: {
        companyId,
      },
    };

    if (tangkiId) where.tangkiId = tangkiId;
    if (tipeTransaksi) where.tipeTransaksi = tipeTransaksi;
    if (tanggalMulai || tanggalSelesai) {
      where.tanggalTransaksi = {};
      if (tanggalMulai) where.tanggalTransaksi.gte = new Date(tanggalMulai);
      if (tanggalSelesai) where.tanggalTransaksi.lte = new Date(tanggalSelesai);
    }

    const skip = ((page ?? 1) - 1) * (limit ?? 10);

    const [data, total] = await Promise.all([
      db.stockTangki.findMany({
        where,
        include: {
          tangki: {
            include: {
              material: true,
            },
          },
        },
        orderBy: {
          tanggalTransaksi: "desc",
        },
        skip,
        take: limit,
      }),
      db.stockTangki.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: page ?? 1,
        limit: limit ?? 10,
        total,
        totalPages: Math.ceil(total / (limit ?? 10)),
      },
    };
  },

  /**
   * Get stock summary by material
   */
  async getStockSummaryByMaterial(companyId: string) {
    const tangkis = await db.tangki.findMany({
      where: { companyId },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
    });

    // Group by material
    const summary = tangkis.reduce(
      (
        acc: Record<
          string,
          {
            material: {
              id: string;
              name: string;
              code: string;
              kategori: { id: string; name: string };
              satuan: { id: string; name: string; symbol: string };
            };
            totalKapasitas: number;
            totalIsi: number;
            jumlahTangki: number;
            tangkis: typeof tangkis;
          }
        >,
        tangki: (typeof tangkis)[0],
      ) => {
        const materialId = tangki.materialId;
        if (!acc[materialId]) {
          acc[materialId] = {
            material: tangki.material,
            totalKapasitas: 0,
            totalIsi: 0,
            jumlahTangki: 0,
            tangkis: [],
          };
        }
        acc[materialId]!.totalKapasitas += tangki.kapasitas;
        acc[materialId]!.jumlahTangki += 1;
        acc[materialId]!.tangkis.push(tangki);
        return acc;
      },
      {} as Record<
        string,
        {
          material: {
            id: string;
            name: string;
            code: string;
            kategori: { id: string; name: string };
            satuan: { id: string; name: string; symbol: string };
          };
          totalKapasitas: number;
          totalIsi: number;
          jumlahTangki: number;
          tangkis: typeof tangkis;
        }
      >,
    );

    return Object.values(summary).sort((a, b) =>
      a.material.code.localeCompare(b.material.code),
    );
  },
};
