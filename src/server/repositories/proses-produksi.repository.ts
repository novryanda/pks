import { db } from "@/server/db";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import type {
  CreateProsesProduksi,
  GetLogProsesProduksiQuery,
  KoreksiTanggalProduksi,
  UpdateProsesProduksi,
  GetProsesProduksiQuery,
} from "@/server/schema/proses-produksi";
import type { Prisma } from "@prisma/client";
import {
  findNegativeMaterialLedger,
  recomputeMaterialLedgers,
} from "@/server/services/pt-pks/stock-ledger.service";

type DbClient = Prisma.TransactionClient;
const PRODUCTION_STOCK_TRANSACTION_OPTIONS = {
  maxWait: 15_000,
  timeout: 120_000,
};

const buildProductionMovementWindowStart = (
  tanggalProduksiBaru: string,
  totalMovements: number
) => {
  const endOfDay = parseJakartaDateBoundary(tanggalProduksiBaru, {
    endOfDay: true,
  });

  if (!endOfDay || Number.isNaN(endOfDay.getTime())) {
    throw new Error("Tanggal produksi baru tidak valid");
  }

  return new Date(endOfDay.getTime() - Math.max(totalMovements - 1, 0));
};

const buildProductionStockNotes = (nomorProduksi: string) => ({
  input: `Penggunaan TBS untuk produksi ${nomorProduksi}`,
  output: `Hasil produksi dari ${nomorProduksi}`,
});

const toProductionDateString = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Tanggal produksi tidak valid");
  }

  return date.toISOString().split("T")[0] ?? "";
};

export class ProsesProduksiRepository {
  /**
   * Generate nomor produksi otomatis
   */
  async generateNomorProduksi(companyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const prefix = `PROD-${year}${month}`;

    const lastProduksi = await db.prosesProduksi.findFirst({
      where: {
        companyId,
        nomorProduksi: {
          startsWith: prefix,
        },
      },
      orderBy: {
        nomorProduksi: "desc",
      },
    });

    let sequence = 1;
    if (lastProduksi) {
      const lastSequence = parseInt(
        lastProduksi.nomorProduksi.split("-").pop() || "0"
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, "0")}`;
  }

  /**
   * Create proses produksi dengan hasil produksi
   */
  async create(companyId: string, data: CreateProsesProduksi) {
    const nomorProduksi = await this.generateNomorProduksi(companyId);
    const tanggalProduksi = new Date(data.tanggalProduksi);

    return db.$transaction(async (tx) => {
      // Create proses produksi
      const prosesProduksi = await tx.prosesProduksi.create({
        data: {
          companyId,
          nomorProduksi,
          tanggalProduksi,
          materialInputId: data.materialInputId,
          jumlahInput: data.jumlahInput,
          operatorProduksi: data.operatorProduksi,
          status: data.status || "DRAFT",
        },
      });

      // Create hasil produksi
      const hasilProduksi = await Promise.all(
        data.hasilProduksi.map((hasil) =>
          tx.hasilProduksi.create({
            data: {
              prosesProduksiId: prosesProduksi.id,
              materialOutputId: hasil.materialOutputId,
              jumlahOutput: hasil.jumlahOutput,
              rendemen: hasil.rendemen,
            },
          })
        )
      );

      // Jika status COMPLETED, update stock
      if (data.status === "COMPLETED") {
        await this.replaceCompletedProductionStockEffects(tx, companyId, {
          nomorProduksi,
          operatorProduksi: data.operatorProduksi,
          materialInputId: data.materialInputId,
          jumlahInput: data.jumlahInput,
          hasilProduksi: data.hasilProduksi.map((hasil) => ({
            materialOutputId: hasil.materialOutputId,
            jumlahOutput: hasil.jumlahOutput,
          })),
        }, toProductionDateString(tanggalProduksi));
      }

      return {
        ...prosesProduksi,
        hasilProduksi,
      };
    }, PRODUCTION_STOCK_TRANSACTION_OPTIONS);
  }

  /**
   * Get all proses produksi with filters
   */
  async findAll(companyId: string, query: GetProsesProduksiQuery) {
    const { tanggalMulai, tanggalAkhir, status, materialInputId, page, limit } =
      query;

    const where: any = {
      companyId,
    };

    if (tanggalMulai || tanggalAkhir) {
      where.tanggalProduksi = {};
      if (tanggalMulai) {
        where.tanggalProduksi.gte = new Date(tanggalMulai);
      }
      if (tanggalAkhir) {
        where.tanggalProduksi.lte = new Date(tanggalAkhir);
      }
    }

    if (status) {
      where.status = status;
    }

    if (materialInputId) {
      where.materialInputId = materialInputId;
    }

    const [data, total] = await Promise.all([
      db.prosesProduksi.findMany({
        where,
        include: {
          materialInput: {
            include: {
              kategori: true,
              satuan: true,
            },
          },
          hasilProduksi: {
            include: {
              materialOutput: {
                include: {
                  kategori: true,
                  satuan: true,
                },
              },
            },
          },
        },
        orderBy: {
          tanggalProduksi: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.prosesProduksi.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get production log for completed/cancelled records
   */
  async findLog(companyId: string, query: GetLogProsesProduksiQuery) {
    const { tanggalMulai, tanggalAkhir, status, page, limit } = query;

    const where: Prisma.ProsesProduksiWhereInput = {
      companyId,
      status: status ? status : { in: ["COMPLETED", "CANCELLED"] },
    };

    if (tanggalMulai || tanggalAkhir) {
      where.tanggalProduksi = {};
      if (tanggalMulai) {
        where.tanggalProduksi.gte = new Date(tanggalMulai);
      }
      if (tanggalAkhir) {
        where.tanggalProduksi.lte = new Date(tanggalAkhir);
      }
    }

    const [data, total] = await Promise.all([
      db.prosesProduksi.findMany({
        where,
        include: {
          materialInput: {
            include: {
              kategori: true,
              satuan: true,
            },
          },
          hasilProduksi: {
            include: {
              materialOutput: {
                include: {
                  kategori: true,
                  satuan: true,
                },
              },
            },
          },
        },
        orderBy: [{ tanggalProduksi: "desc" }, { updatedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.prosesProduksi.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get proses produksi by id
   */
  async findById(id: string, companyId: string) {
    return this.findByIdWithClient(db, id, companyId);
  }

  private async findByIdWithClient(
    client: DbClient | typeof db,
    id: string,
    companyId: string
  ) {
    return client.prosesProduksi.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        materialInput: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        hasilProduksi: {
          include: {
            materialOutput: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update proses produksi
   */
  async update(id: string, companyId: string, data: UpdateProsesProduksi) {
    return db.$transaction(async (tx) => {
      const existing = await tx.prosesProduksi.findFirst({
        where: { id, companyId },
        include: {
          hasilProduksi: true,
        },
      });

      if (!existing) {
        throw new Error("Proses produksi tidak ditemukan");
      }

      // Tidak bisa update jika sudah COMPLETED
      if (existing.status === "COMPLETED") {
        throw new Error("Tidak dapat mengubah proses produksi yang sudah selesai");
      }

      // Update proses produksi
      const updated = await tx.prosesProduksi.update({
        where: { id },
        data: {
          tanggalProduksi: data.tanggalProduksi
            ? new Date(data.tanggalProduksi)
            : undefined,
          materialInputId: data.materialInputId,
          jumlahInput: data.jumlahInput,
          operatorProduksi: data.operatorProduksi,
          status: data.status,
        },
      });

      // Update hasil produksi jika ada
      const nextHasilProduksi =
        data.hasilProduksi && data.hasilProduksi.length > 0
          ? data.hasilProduksi
          : existing.hasilProduksi;

      if (data.hasilProduksi && data.hasilProduksi.length > 0) {
        // Hapus hasil produksi lama
        await tx.hasilProduksi.deleteMany({
          where: { prosesProduksiId: id },
        });

        // Create hasil produksi baru
        await Promise.all(
          data.hasilProduksi.map((hasil) =>
            tx.hasilProduksi.create({
              data: {
                prosesProduksiId: id,
                materialOutputId: hasil.materialOutputId,
                jumlahOutput: hasil.jumlahOutput,
                rendemen: hasil.rendemen,
              },
            })
          )
        );
      }

      if (data.status === "COMPLETED") {
        await this.replaceCompletedProductionStockEffects(
          tx,
          companyId,
          {
            nomorProduksi: existing.nomorProduksi,
            operatorProduksi: data.operatorProduksi ?? existing.operatorProduksi,
            materialInputId: data.materialInputId ?? existing.materialInputId,
            jumlahInput: data.jumlahInput ?? existing.jumlahInput,
            hasilProduksi: nextHasilProduksi.map((hasil) => ({
              materialOutputId: hasil.materialOutputId,
              jumlahOutput: hasil.jumlahOutput,
            })),
          },
          toProductionDateString(data.tanggalProduksi ?? existing.tanggalProduksi)
        );
      }

      return this.findByIdWithClient(tx, id, companyId);
    }, PRODUCTION_STOCK_TRANSACTION_OPTIONS);
  }

  /**
   * Update status proses produksi
   */
  async updateStatus(
    id: string,
    companyId: string,
    status: import("@prisma/client").StatusProsesProduksi
  ) {
    return db.$transaction(async (tx) => {
      const existing = await tx.prosesProduksi.findFirst({
        where: { id, companyId },
        include: {
          hasilProduksi: true,
        },
      });

      if (!existing) {
        throw new Error("Proses produksi tidak ditemukan");
      }

      // Jika mengubah dari non-COMPLETED ke COMPLETED, update stock
      if (existing.status !== "COMPLETED" && status === "COMPLETED") {
        await this.replaceCompletedProductionStockEffects(
          tx,
          companyId,
          existing,
          toProductionDateString(existing.tanggalProduksi)
        );
      }

      // Jika mengubah dari COMPLETED ke status lain, batalkan update stock
      if (existing.status === "COMPLETED" && status !== "COMPLETED") {
        await this.removeProductionStockEffects(tx, companyId, existing);
      }

      return tx.prosesProduksi.update({
        where: { id },
        data: { status },
        include: {
          materialInput: {
            include: {
              kategori: true,
              satuan: true,
            },
          },
          hasilProduksi: {
            include: {
              materialOutput: {
                include: {
                  kategori: true,
                  satuan: true,
                },
              },
            },
          },
        },
      });
    }, PRODUCTION_STOCK_TRANSACTION_OPTIONS);
  }

  /**
   * Correct completed production date and move stock effects to the new effective date
   */
  async correctTanggalProduksi(
    id: string,
    companyId: string,
    data: KoreksiTanggalProduksi
  ) {
    await db.$transaction(async (tx) => {
      const existing = await tx.prosesProduksi.findFirst({
        where: { id, companyId },
        include: {
          materialInput: true,
          hasilProduksi: {
            include: {
              materialOutput: true,
            },
          },
        },
      });

      if (!existing) {
        throw new Error("Proses produksi tidak ditemukan");
      }

      if (existing.status !== "COMPLETED") {
        throw new Error(
          "Hanya proses produksi berstatus COMPLETED yang dapat dikoreksi tanggalnya"
        );
      }

      const tanggalProduksiBaru = new Date(data.tanggalProduksiBaru);
      if (Number.isNaN(tanggalProduksiBaru.getTime())) {
        throw new Error("Tanggal produksi baru tidak valid");
      }

      const tanggalLama = existing.tanggalProduksi.toISOString().split("T")[0];
      const tanggalBaru = data.tanggalProduksiBaru;

      if (tanggalLama === tanggalBaru) {
        throw new Error("Tanggal produksi baru sama dengan tanggal produksi saat ini");
      }

      await tx.prosesProduksi.update({
        where: { id },
        data: {
          tanggalProduksi: tanggalProduksiBaru,
        },
      });

      await this.replaceCompletedProductionStockEffects(
        tx,
        companyId,
        existing,
        tanggalBaru
      );
    }, PRODUCTION_STOCK_TRANSACTION_OPTIONS);

    return this.findById(id, companyId);
  }

  /**
   * Delete proses produksi
   */
  async delete(id: string, companyId: string) {
    const existing = await db.prosesProduksi.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new Error("Proses produksi tidak ditemukan");
    }

    // Tidak bisa delete jika sudah COMPLETED
    if (existing.status === "COMPLETED") {
      throw new Error("Tidak dapat menghapus proses produksi yang sudah selesai");
    }

    return db.prosesProduksi.delete({
      where: { id },
    });
  }

  private async createCanonicalProductionStockMovements(
    tx: DbClient,
    companyId: string,
    proses: {
      nomorProduksi: string;
      operatorProduksi: string;
      materialInputId: string;
      jumlahInput: number;
      hasilProduksi: Array<{
        materialOutputId: string;
        jumlahOutput: number;
      }>;
    },
    tanggalProduksiBaru: string
  ) {
    const notes = buildProductionStockNotes(proses.nomorProduksi);
    const totalMovements = proses.hasilProduksi.length + 1;
    const movementStart = buildProductionMovementWindowStart(
      tanggalProduksiBaru,
      totalMovements
    );
    let movementOffset = 0;

    await tx.stockMovement.create({
      data: {
        companyId,
        materialId: proses.materialInputId,
        tipeMovement: "OUT",
        jumlah: proses.jumlahInput,
        stockSebelum: 0,
        stockSesudah: 0,
        referensi: proses.nomorProduksi,
        keterangan: notes.input,
        operator: proses.operatorProduksi,
        tanggalTransaksi: new Date(movementStart.getTime() + movementOffset++),
      },
    });

    for (const hasil of proses.hasilProduksi) {
      await tx.stockMovement.create({
        data: {
          companyId,
          materialId: hasil.materialOutputId,
          tipeMovement: "IN",
          jumlah: hasil.jumlahOutput,
          stockSebelum: 0,
          stockSesudah: 0,
          referensi: proses.nomorProduksi,
          keterangan: notes.output,
          operator: proses.operatorProduksi,
          tanggalTransaksi: new Date(movementStart.getTime() + movementOffset++),
        },
      });
    }
  }

  private getAffectedMaterialIds(proses: {
    materialInputId: string;
    hasilProduksi: Array<{ materialOutputId: string }>;
  }) {
    return [
      proses.materialInputId,
      ...proses.hasilProduksi.map((hasil) => hasil.materialOutputId),
    ];
  }

  private async removeProductionStockEffects(
    tx: DbClient,
    companyId: string,
    proses: {
      nomorProduksi: string;
      materialInputId: string;
      hasilProduksi: Array<{ materialOutputId: string }>;
    },
    options: { recomputeLedger?: boolean } = {}
  ) {
    const { recomputeLedger = true } = options;
    const affectedMaterialIds = this.getAffectedMaterialIds(proses);

    await tx.stockMovement.deleteMany({
      where: {
        companyId,
        referensi: proses.nomorProduksi,
        materialId: {
          in: affectedMaterialIds,
        },
      },
    });

    if (recomputeLedger) {
      await recomputeMaterialLedgers(tx, companyId, affectedMaterialIds);
    }
  }

  private async replaceCompletedProductionStockEffects(
    tx: DbClient,
    companyId: string,
    proses: {
      nomorProduksi: string;
      operatorProduksi: string;
      materialInputId: string;
      jumlahInput: number;
      hasilProduksi: Array<{
        materialOutputId: string;
        jumlahOutput: number;
      }>;
    },
    tanggalProduksi: string
  ) {
    const affectedMaterialIds = this.getAffectedMaterialIds(proses);

    await this.removeProductionStockEffects(tx, companyId, proses, {
      recomputeLedger: false,
    });
    await this.createCanonicalProductionStockMovements(
      tx,
      companyId,
      proses,
      tanggalProduksi
    );
    await recomputeMaterialLedgers(tx, companyId, affectedMaterialIds);

    const negativeLedger = await findNegativeMaterialLedger(
      tx,
      companyId,
      affectedMaterialIds
    );

    if (negativeLedger) {
      throw new Error(
        `Koreksi tanggal menyebabkan stok negatif untuk material ${negativeLedger.material.code} - ${negativeLedger.material.name}`
      );
    }
  }

  /**
   * Get laporan harian produksi
   */
  async getLaporanHarian(
    companyId: string,
    tanggalMulai: string,
    tanggalAkhir: string
  ) {
    const data = await db.prosesProduksi.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        tanggalProduksi: {
          gte: new Date(tanggalMulai),
          lte: new Date(tanggalAkhir),
        },
      },
      include: {
        materialInput: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        hasilProduksi: {
          include: {
            materialOutput: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
      },
      orderBy: {
        tanggalProduksi: "desc",
      },
    });

    // Aggregate data
    const summary = {
      totalInput: data.reduce((sum: number, item: any) => sum + item.jumlahInput, 0),
      totalProses: data.length,
      byMaterialInput: {} as Record<string, {
        materialName: string;
        totalInput: number;
        totalProses: number;
      }>,
      byMaterialOutput: {} as Record<string, {
        materialName: string;
        totalOutput: number;
        averageRendemen: number;
        count: number;
      }>,
    };

    // Aggregate by material input
    data.forEach((item: any) => {
      const key = item.materialInputId;
      if (!summary.byMaterialInput[key]) {
        summary.byMaterialInput[key] = {
          materialName: item.materialInput.name,
          totalInput: 0,
          totalProses: 0,
        };
      }
      summary.byMaterialInput[key]!.totalInput += item.jumlahInput;
      summary.byMaterialInput[key]!.totalProses += 1;
    });

    // Aggregate by material output
    data.forEach((item: any) => {
      item.hasilProduksi.forEach((hasil: any) => {
        const key = hasil.materialOutputId;
        if (!summary.byMaterialOutput[key]) {
          summary.byMaterialOutput[key] = {
            materialName: hasil.materialOutput.name,
            totalOutput: 0,
            averageRendemen: 0,
            count: 0,
          };
        }
        summary.byMaterialOutput[key]!.totalOutput += hasil.jumlahOutput;
        summary.byMaterialOutput[key]!.averageRendemen += hasil.rendemen;
        summary.byMaterialOutput[key]!.count += 1;
      });
    });

    // Calculate average rendemen
    Object.keys(summary.byMaterialOutput).forEach((key) => {
      const output = summary.byMaterialOutput[key]!;
      output.averageRendemen = output.averageRendemen / output.count;
    });

    return {
      data,
      summary,
    };
  }

  /**
   * Get total processed TBS (jumlah input) in a specific range
   */
  async getProcessedTBSPeriode(
    companyId: string,
    materialInputId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = {
      companyId,
      materialInputId,
      status: "COMPLETED",
    };

    if (startDate || endDate) {
      where.tanggalProduksi = {};
      if (startDate) where.tanggalProduksi.gte = startDate;
      if (endDate) where.tanggalProduksi.lte = endDate;
    }

    const result = await db.prosesProduksi.aggregate({
      where,
      _sum: {
        jumlahInput: true,
      },
    });

    return result._sum.jumlahInput || 0;
  }

  /**
   * Get summary data for production statistics
   */
  async getSummaryData(
    companyId: string,
    materialOutputId?: string,
    status?: string,
    baseDate?: Date
  ) {
    const referenceDate = baseDate || new Date();
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const day = referenceDate.getDate();

    const startOfDay = new Date(year, month, day, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    const startOfMonth = new Date(year, month, 1, 0, 0, 0);
    const endOfMonth = endOfDay;

    const startOfYear = new Date(year, 0, 1, 0, 0, 0);
    const endOfYear = endOfDay;

    // Build base where condition
    const buildWhere = (startDate: Date, endDate: Date) => {
      const where: any = {
        companyId,
        tanggalProduksi: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (status) {
        where.status = status;
      }

      // Filter by material output
      if (materialOutputId) {
        where.hasilProduksi = {
          some: {
            materialOutputId,
          },
        };
      }

      return where;
    };

    // Fetch data for all periods in parallel
    const [todayData, monthData, yearData] = await Promise.all([
      db.prosesProduksi.findMany({
        where: buildWhere(startOfDay, endOfDay),
        include: {
          hasilProduksi: {
            where: materialOutputId ? { materialOutputId } : {},
            include: {
              materialOutput: true,
            },
          },
        },
      }),
      db.prosesProduksi.findMany({
        where: buildWhere(startOfMonth, endOfMonth),
        include: {
          hasilProduksi: {
            where: materialOutputId ? { materialOutputId } : {},
            include: {
              materialOutput: true,
            },
          },
        },
      }),
      db.prosesProduksi.findMany({
        where: buildWhere(startOfYear, endOfYear),
        include: {
          hasilProduksi: {
            where: materialOutputId ? { materialOutputId } : {},
            include: {
              materialOutput: true,
            },
          },
        },
      }),
    ]);

    return {
      todayData,
      monthData,
      yearData,
    };
  }

  /**
   * Get production data grouped by date for summary
   */
  async calculateDailyStats(
    companyId: string,
    startDate: Date,
    endDate: Date,
    materialOutputId?: string | null
  ) {
    const prosesProduksiList = await db.prosesProduksi.findMany({
      where: {
        materialInput: {
          companyId: companyId,
        },
        status: {
          in: ["IN_PROGRESS", "COMPLETED"],
        },
        tanggalProduksi: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        hasilProduksi: {
          include: {
            materialOutput: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
          where: materialOutputId
            ? {
              materialOutputId: materialOutputId,
            }
            : undefined,
        },
      },
    });

    // Group by date to get daily totals
    const dailyData: Record<
      string,
      { totalInput: number; totalProduksi: number; totalRendemen: number }
    > = {};

    prosesProduksiList.forEach((proses: any) => {
      const dateKey = new Date(proses.tanggalProduksi)
        .toISOString()
        .split("T")[0]!;
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          totalInput: 0,
          totalProduksi: 0,
          totalRendemen: 0,
        };
      }

      // Add TBS input
      dailyData[dateKey]!.totalInput += proses.jumlahInput;

      proses.hasilProduksi.forEach((hasil: any) => {
        dailyData[dateKey]!.totalProduksi += hasil.jumlahOutput;
        dailyData[dateKey]!.totalRendemen += hasil.rendemen;
      });
    });

    return dailyData;
  }
}

export const prosesProduksiRepository = new ProsesProduksiRepository();
