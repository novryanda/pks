import { db } from "@/server/db";
import {
  getJakartaDateParts,
  getJakartaDateKey,
  parseJakartaDateBoundary,
} from "@/lib/date-time";
import { Prisma } from "@prisma/client";
import type {
  CreatePengirimanProductInput,
  UpdatePengirimanProductInput,
  CreatePengirimanTarraInput,
  UpdatePengirimanGrossInput,
  UpdatePengirimanKontrakMutuInput,
  UpdatePengirimanMutuInput,
  UpdatePengirimanKontrakInput,
} from "@/server/schema/pengiriman-product";

export class PengirimanProductRepository {
  async generateNomorPengiriman(companyId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `DO-${year}${month}`;

    const lastPengiriman = await db.pengirimanProduct.findFirst({
      where: {
        companyId,
        nomorPengiriman: {
          startsWith: prefix,
        },
      },
      orderBy: {
        nomorPengiriman: "desc",
      },
    });

    let sequence = 1;
    if (lastPengiriman) {
      const lastSequence = parseInt(
        lastPengiriman.nomorPengiriman.split("-").pop() || "0",
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(5, "0")}`;
  }

  // Method untuk create pengiriman tahap 1 & 2 (vendor + tarra) - ALUR BARU
  async createPengirimanTarra(
    companyId: string,
    data: CreatePengirimanTarraInput,
  ) {
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const nomorPengiriman = await this.generateNomorPengiriman(companyId);

        return await db.pengirimanProduct.create({
          data: {
            companyId,
            nomorPengiriman,
            tanggalPengiriman: data.tanggalPengiriman,
            operatorPenimbang: data.operatorPenimbang,
            // Vendor diisi di awal
            vendorVehicleId: data.vendorVehicleId,
            // Produk yang dikirim
            materialId: data.materialId,
            // Timbang tarra
            metodeTarra: data.metodeTarra,
            beratTarra: data.beratTarra,
            waktuTimbangTarra: data.waktuTimbangTarra,
            // Buyer & Contract akan diisi nanti (nullable)
            // Gross dan mutu akan diisi nanti (nullable)
            metodeGross: "MANUAL",
            status: "TIMBANG_TARRA",
          } as any,
          include: {
            vendorVehicle: {
              include: {
                vendor: true,
              },
            },
            vendorBongkar: true,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes("nomorPengiriman")) {
            retries++;
            if (retries === maxRetries) throw error;
            continue;
          }
        }
        throw error;
      }
    }
    throw new Error("Failed to create pengiriman tarra after retries");
  }

  // Method untuk update tahap 3 (timbang gross saja) - ALUR BARU
  async updatePengirimanGross(id: string, data: UpdatePengirimanGrossInput) {
    const current = await this.getPengirimanProductById(id);
    if (!current) {
      throw new Error("Pengiriman tidak ditemukan");
    }

    const beratNetto = data.beratGross - current.beratTarra;
    const totalUpahBongkar = beratNetto * (current.upahBongkar || 0);
    const totalHargaVendorTransportir =
      beratNetto * (current.hargaVendorTransportir || 0);

    return db.pengirimanProduct.update({
      where: { id },
      data: {
        metodeGross: data.metodeGross,
        beratGross: data.beratGross,
        waktuTimbangGross: data.waktuTimbangGross,
        beratNetto,
        totalUpahBongkar,
        totalHargaVendorTransportir,
        status: "TIMBANG_GROSS" as any, // Status baru: menunggu pilih kontrak
      },
      include: {
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
        vendorBongkar: true,
      },
    });
  }

  // Method untuk update tahap 4 & 5 (pilih kontrak + mutu kernel) - ALUR LAMA
  async updatePengirimanKontrakMutu(
    id: string,
    data: UpdatePengirimanKontrakMutuInput,
  ) {
    return db.pengirimanProduct.update({
      where: { id },
      data: {
        buyerId: data.buyerId,
        contractId: data.contractId,
        contractItemId: data.contractItemId,
        mutuCustomFields: data.mutuCustomFields as any,
        status: "COMPLETED", // Selesai semua tahap
      },
      include: {
        buyer: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: true,
          },
        },
      },
    });
  }

  // Method untuk update mutu kernel saja - ALUR BARU TERPISAH (menggunakan mutuCustomFields JSON)
  async updatePengirimanMutu(id: string, data: UpdatePengirimanMutuInput) {
    return db.pengirimanProduct.update({
      where: { id },
      data: {
        mutuCustomFields: data.mutuCustomFields,
        // Status tetap TIMBANG_GROSS, menunggu pilih kontrak
      } as any,
      include: {
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
        vendorBongkar: true,
      },
    });
  }

  // Method untuk update kontrak saja (setelah mutu diisi) - ALUR BARU TERPISAH
  async updatePengirimanKontrak(
    id: string,
    data: UpdatePengirimanKontrakInput,
  ) {
    return db.pengirimanProduct.update({
      where: { id },
      data: {
        buyerId: data.buyerId,
        contractId: data.contractId,
        contractItemId: data.contractItemId,
        status: "COMPLETED", // Selesai semua tahap
      },
      include: {
        buyer: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
    });
  }

  // Method untuk mendapatkan pengiriman yang menunggu timbang gross (status: TIMBANG_TARRA)
  async getPendingGross(companyId: string) {
    return db.pengirimanProduct.findMany({
      where: {
        companyId,
        status: "TIMBANG_TARRA",
      },
      include: {
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
        vendorBongkar: true,
      },
      orderBy: { waktuTimbangTarra: "asc" },
    });
  }

  // Method untuk mendapatkan pengiriman yang menunggu input mutu (status: TIMBANG_GROSS, mutu belum diisi)
  async getPendingMutu(companyId: string) {
    return db.pengirimanProduct.findMany({
      where: {
        companyId,
        status: "TIMBANG_GROSS",
        // Mutu belum diisi (mutuCustomFields null atau empty array)
        OR: [
          { mutuCustomFields: { equals: Prisma.AnyNull } },
          { mutuCustomFields: { equals: [] as any } },
        ],
      } as any,
      include: {
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
        material: true,
        vendorBongkar: true,
      },
      orderBy: { waktuTimbangGross: "asc" },
    });
  }

  // Method untuk mendapatkan pengiriman yang menunggu pilih kontrak (status: TIMBANG_GROSS, mutu sudah diisi)
  async getPendingKontrak(companyId: string) {
    return db.pengirimanProduct.findMany({
      where: {
        companyId,
        status: "TIMBANG_GROSS",
        // Mutu sudah diisi (mutuCustomFields ada isinya)
        AND: [
          { NOT: { mutuCustomFields: { equals: Prisma.AnyNull } } },
          { NOT: { mutuCustomFields: { equals: [] as any } } },
        ],
      } as any,
      include: {
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
        material: {
          include: {
            satuan: true,
            kategori: true,
          },
        },
        vendorBongkar: true,
      },
      orderBy: { waktuTimbangGross: "asc" },
    });
  }

  async createPengirimanProduct(
    companyId: string,
    data: CreatePengirimanProductInput,
  ) {
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const nomorPengiriman = await this.generateNomorPengiriman(companyId);

        // Kalkulasi berat netto
        const beratNetto = data.beratGross - data.beratTarra;

        return await db.pengirimanProduct.create({
          data: {
            companyId,
            nomorPengiriman,
            ...data,
            beratNetto,
          } as any,
          include: {
            buyer: true,
            contract: {
              include: {
                buyer: true,
              },
            },
            contractItem: {
              include: {
                material: {
                  include: {
                    kategori: true,
                    satuan: true,
                  },
                },
              },
            },
            vendorVehicle: {
              include: {
                vendor: true,
              },
            },
            vendorBongkar: true,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes("nomorPengiriman")) {
            retries++;
            if (retries === maxRetries) throw error;
            continue;
          }
        }
        throw error;
      }
    }
    throw new Error("Failed to create pengiriman product after retries");
  }

  async getPengirimanProductByCompany(
    companyId: string,
    filters?: {
      status?: string;
      buyerId?: string;
      contractId?: string;
      materialId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return db.pengirimanProduct.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.buyerId && { buyerId: filters.buyerId }),
        ...(filters?.contractId && { contractId: filters.contractId }),
        ...(filters?.materialId && { materialId: filters.materialId }),
        ...(filters?.startDate || filters?.endDate
          ? {
              tanggalPengiriman: {
                ...(filters?.startDate ? { gte: filters.startDate } : {}),
                ...(filters?.endDate ? { lte: filters.endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        buyer: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
        vendorBongkar: true,
      },
      orderBy: { tanggalPengiriman: "desc" },
    });
  }

  async getPengirimanProductById(id: string) {
    return db.pengirimanProduct.findUnique({
      where: { id },
      include: {
        buyer: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
        vendorBongkar: true,
      },
    });
  }

  async updatePengirimanProduct(
    id: string,
    data: UpdatePengirimanProductInput,
  ) {
    // Recalculate beratNetto if beratGross or beratTarra changes
    const updateData: any = { ...data };

    if (data.beratGross !== undefined || data.beratTarra !== undefined) {
      const current = await this.getPengirimanProductById(id);
      if (current) {
        const beratGross = data.beratGross ?? current.beratGross ?? 0;
        const beratTarra = data.beratTarra ?? current.beratTarra;
        updateData.beratNetto = beratGross - beratTarra;
        updateData.totalUpahBongkar =
          updateData.beratNetto *
          (data.upahBongkar ?? current.upahBongkar ?? 0);
        updateData.totalHargaVendorTransportir =
          updateData.beratNetto *
          (data.hargaVendorTransportir ?? current.hargaVendorTransportir ?? 0);
      }
    } else if (
      data.upahBongkar !== undefined ||
      data.hargaVendorTransportir !== undefined
    ) {
      const current = await this.getPengirimanProductById(id);
      if (current) {
        if (data.upahBongkar !== undefined) {
          updateData.totalUpahBongkar =
            (current.beratNetto || 0) * data.upahBongkar;
        }

        if (data.hargaVendorTransportir !== undefined) {
          updateData.totalHargaVendorTransportir =
            (current.beratNetto || 0) * data.hargaVendorTransportir;
        }
      }
    }

    return db.pengirimanProduct.update({
      where: { id },
      data: updateData,
      include: {
        buyer: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
        vendorBongkar: true,
      },
    });
  }

  async deletePengirimanProduct(id: string) {
    return db.pengirimanProduct.delete({
      where: { id },
    });
  }

  async getStatistics(
    companyId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = {
      companyId,
      status: "COMPLETED",
    };

    if (filters?.startDate || filters?.endDate) {
      where.tanggalPengiriman = {
        ...(filters?.startDate ? { gte: filters.startDate } : {}),
        ...(filters?.endDate ? { lte: filters.endDate } : {}),
      };
    }

    const [totalPengiriman, totalBerat] = await Promise.all([
      db.pengirimanProduct.count({ where }),
      db.pengirimanProduct.aggregate({
        where,
        _sum: {
          beratNetto: true,
        },
      }),
    ]);

    return {
      totalPengiriman,
      totalBerat: totalBerat._sum.beratNetto || 0,
    };
  }

  /**
   * Get summary data for shipping statistics (Today, Month, Year)
   */
  async getSummaryData(
    companyId: string,
    materialId?: string,
    baseDate?: Date,
  ) {
    const referenceDate = baseDate || new Date();
    const parts = getJakartaDateParts(referenceDate);
    if (!parts) {
      return {
        todayData: [],
        monthData: [],
        yearData: [],
      };
    }

    const startOfDay = parseJakartaDateBoundary(
      `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
    )!;
    const endOfDay = parseJakartaDateBoundary(
      `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
      { endOfDay: true },
    )!;

    const startOfMonth = parseJakartaDateBoundary(
      `${parts.year}-${String(parts.month).padStart(2, "0")}-01`,
    )!;
    const endOfMonth = endOfDay;

    const startOfYear = parseJakartaDateBoundary(`${parts.year}-01-01`)!;
    const endOfYear = endOfDay;

    const buildWhere = (startDate: Date, endDate: Date) => {
      return {
        companyId,
        status: "COMPLETED" as any,
        tanggalPengiriman: {
          gte: startDate,
          lte: endDate,
        },
        ...(materialId && { materialId }),
      };
    };

    const [todayData, monthData, yearData] = await Promise.all([
      db.pengirimanProduct.findMany({
        where: buildWhere(startOfDay, endOfDay),
        include: { material: true },
      }),
      db.pengirimanProduct.findMany({
        where: buildWhere(startOfMonth, endOfMonth),
        include: { material: true },
      }),
      db.pengirimanProduct.findMany({
        where: buildWhere(startOfYear, endOfYear),
        include: { material: true },
      }),
    ]);

    return {
      todayData,
      monthData,
      yearData,
    };
  }

  async getConsolidatedSummary(
    companyId: string,
    filters?: {
      date?: Date;
      startDate?: Date;
      endDate?: Date;
      materialId?: string;
      buyerId?: string;
      contractId?: string;
    },
  ) {
    const periodEnd = filters?.endDate || filters?.date || new Date();
    const periodStart =
      filters?.startDate || (filters?.date ? filters.date : periodEnd);
    const periodEndKey = getJakartaDateKey(periodEnd);
    const periodStartKey = getJakartaDateKey(periodStart);
    const endParts = getJakartaDateParts(periodEnd);

    if (!periodEndKey || !periodStartKey || !endParts) {
      return [];
    }

    const startOfPeriod = parseJakartaDateBoundary(periodStartKey)!;
    const endOfPeriod = parseJakartaDateBoundary(periodEndKey, {
      endOfDay: true,
    })!;

    const isPeriodMode =
      startOfPeriod.getTime() !== endOfPeriod.getTime() - 86399999;

    const startOfMonth = isPeriodMode
      ? startOfPeriod
      : parseJakartaDateBoundary(
          `${endParts.year}-${String(endParts.month).padStart(2, "0")}-01`,
        )!;
    const startOfYear = isPeriodMode
      ? startOfPeriod
      : parseJakartaDateBoundary(`${endParts.year}-01-01`)!;

    // 1. Get relevant ContractItems
    const contractItems = await db.contractItem.findMany({
      where: {
        contract: {
          companyId,
          ...(filters?.buyerId && { buyerId: filters.buyerId }),
          ...(filters?.contractId && { id: filters.contractId }),
          status: { not: "CANCELLED" as any },
        },
        ...(filters?.materialId && { materialId: filters.materialId }),
      },
      orderBy: {
        contract: {
          contractNumber: "asc",
        },
      },
      include: {
        contract: {
          include: {
            buyer: true,
          },
        },
        material: {
          include: {
            satuan: true,
          },
        },
      },
    });

    // 2. Fetch Aggregates for HI, BI, TI
    const itemSummaries = await Promise.all(
      contractItems.map(async (item) => {
        const buildWhere = (startDate: Date, endDate: Date) => ({
          contractItemId: item.id,
          status: "COMPLETED" as any,
          tanggalPengiriman: {
            gte: startDate,
            lte: endDate,
          },
        });

        const [hi, bi, ti, historicalTotal] = await Promise.all([
          db.pengirimanProduct.aggregate({
            where: buildWhere(startOfPeriod, endOfPeriod),
            _sum: { beratNetto: true },
          }),
          db.pengirimanProduct.aggregate({
            where: buildWhere(startOfMonth, endOfPeriod),
            _sum: { beratNetto: true },
          }),
          db.pengirimanProduct.aggregate({
            where: buildWhere(startOfYear, endOfPeriod),
            _sum: { beratNetto: true },
          }),
          db.pengirimanProduct.aggregate({
            where: {
              contractItemId: item.id,
              status: "COMPLETED" as any,
              tanggalPengiriman: {
                lte: endOfPeriod,
              },
            },
            _sum: { beratNetto: true },
          }),
        ]);

        const totalDeliveredUntilThen = historicalTotal._sum.beratNetto || 0;
        const hiVal = hi._sum.beratNetto || 0;

        return {
          buyerName: item.contract.buyer.name,
          contractNumber: item.contract.contractNumber,
          materialName: item.material.name,
          materialCode: item.material.code,
          satuan: item.material.satuan.symbol,
          contractQuantity: item.quantity,
          deliveredQuantity: totalDeliveredUntilThen,
          hi: hiVal,
          bi: bi._sum.beratNetto || 0,
          ti: ti._sum.beratNetto || 0,
          remaining: Math.max(0, item.quantity - totalDeliveredUntilThen),
          contractCustomFields: item.contract.customFields,
        };
      }),
    );

    // Tampilkan semua kontrak aktif yang item-item-nya telah diambil di atas
    return itemSummaries;
  }
}

export const pengirimanProductRepository = new PengirimanProductRepository();
