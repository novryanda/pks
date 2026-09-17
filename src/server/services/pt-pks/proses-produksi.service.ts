import { prosesProduksiRepository } from "@/server/repositories/proses-produksi.repository";
import type {
  CreateProsesProduksi,
  GetLogProsesProduksiQuery,
  KoreksiTanggalProduksi,
  UpdateProsesProduksi,
  GetProsesProduksiQuery,
} from "@/server/schema/proses-produksi";

export class ProsesProduksiService {
  /**
   * Create proses produksi
   */
  async createProsesProduksi(companyId: string, data: CreateProsesProduksi) {
    // Validasi: pastikan jumlah input tidak melebihi stock
    const stockTBS = await this.getStockMaterial(companyId, data.materialInputId);

    if (data.status === "COMPLETED" && stockTBS < data.jumlahInput) {
      throw new Error(
        `Stock TBS tidak mencukupi. Stock tersedia: ${stockTBS}, diminta: ${data.jumlahInput}`
      );
    }

    // Kalkulasi rendemen otomatis jika belum diisi
    data.hasilProduksi = data.hasilProduksi.map((hasil: any) => {
      const rendemen = (hasil.jumlahOutput / data.jumlahInput) * 100;
      return {
        ...hasil,
        rendemen: Number(rendemen.toFixed(2)),
      };
    });

    return prosesProduksiRepository.create(companyId, data);
  }

  /**
   * Get stock material
   */
  private async getStockMaterial(
    companyId: string,
    materialId: string
  ): Promise<number> {
    const { db } = await import("@/server/db");
    const stock = await db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
    });

    return stock?.jumlah || 0;
  }

  /**
   * Get all proses produksi
   */
  async getAllProsesProduksi(
    companyId: string,
    query: GetProsesProduksiQuery
  ) {
    return prosesProduksiRepository.findAll(companyId, query);
  }

  /**
   * Get production correction log
   */
  async getLogProsesProduksi(
    companyId: string,
    query: GetLogProsesProduksiQuery
  ) {
    return prosesProduksiRepository.findLog(companyId, query);
  }

  /**
   * Get proses produksi by id
   */
  async getProsesProduksiById(id: string, companyId: string) {
    const data = await prosesProduksiRepository.findById(id, companyId);

    if (!data) {
      throw new Error("Proses produksi tidak ditemukan");
    }

    return data;
  }

  /**
   * Update proses produksi
   */
  async updateProsesProduksi(
    id: string,
    companyId: string,
    data: UpdateProsesProduksi
  ) {
    // Kalkulasi rendemen otomatis jika ada hasil produksi dan jumlah input
    if (data.hasilProduksi && data.jumlahInput) {
      data.hasilProduksi = data.hasilProduksi.map((hasil: any) => {
        const rendemen = (hasil.jumlahOutput / data.jumlahInput!) * 100;
        return {
          ...hasil,
          rendemen: Number(rendemen.toFixed(2)),
        };
      });
    }

    return prosesProduksiRepository.update(id, companyId, data);
  }

  /**
   * Update status proses produksi
   */
  async updateStatusProsesProduksi(
    id: string,
    companyId: string,
    status: import("@prisma/client").StatusProsesProduksi | string
  ) {
    // Validasi stock jika mengubah ke COMPLETED
    if (status === "COMPLETED") {
      const proses = await prosesProduksiRepository.findById(id, companyId);

      if (!proses) {
        throw new Error("Proses produksi tidak ditemukan");
      }

      const stockTBS = await this.getStockMaterial(
        companyId,
        proses.materialInputId
      );

      if (stockTBS < proses.jumlahInput) {
        throw new Error(
          `Stock TBS tidak mencukupi. Stock tersedia: ${stockTBS}, diminta: ${proses.jumlahInput}`
        );
      }
    }

    // Pastikan status bertipe StatusProsesProduksi
    const prismaStatus = status as import("@prisma/client").StatusProsesProduksi;
    return prosesProduksiRepository.updateStatus(id, companyId, prismaStatus);
  }

  /**
   * Delete proses produksi
   */
  async deleteProsesProduksi(id: string, companyId: string) {
    return prosesProduksiRepository.delete(id, companyId);
  }

  /**
   * Correct completed production date
   */
  async correctTanggalProduksi(
    id: string,
    companyId: string,
    data: KoreksiTanggalProduksi
  ) {
    return prosesProduksiRepository.correctTanggalProduksi(id, companyId, data);
  }

  /**
   * Get laporan harian produksi
   */
  async getLaporanHarian(
    companyId: string,
    tanggalMulai: string,
    tanggalAkhir: string
  ) {
    return prosesProduksiRepository.getLaporanHarian(
      companyId,
      tanggalMulai,
      tanggalAkhir
    );
  }

  /**
   * Get stock TBS tersedia
   */
  async getStockTBSTersedia(companyId: string) {
    const { db } = await import("@/server/db");

    // Get material TBS (kategori TBS)
    const materials = await db.material.findMany({
      where: {
        companyId,
        kategori: {
          name: {
            contains: "TBS",
          },
        },
      },
      include: {
        stockMaterial: true,
        satuan: true,
        kategori: true,
      },
    });

    return materials.map((material: any) => ({
      id: material.id,
      name: material.name,
      code: material.code,
      kategori: material.kategori.name,
      satuan: material.satuan.name,
      stock: material.stockMaterial[0]?.jumlah || 0,
    }));
  }

  /**
   * Get material output (hasil produksi) by kategori
   */
  async getMaterialOutputByKategori(companyId: string, kategoriId: string) {
    const { db } = await import("@/server/db");

    const materials = await db.material.findMany({
      where: {
        companyId,
        kategoriId,
      },
      include: {
        satuan: true,
        kategori: true,
        stockMaterial: {
          where: {
            companyId,
          },
          select: {
            jumlah: true,
          },
        },
      },
    });

    return materials.map((material) => ({
      ...material,
      stock: material.stockMaterial[0]?.jumlah || 0,
    }));
  }

  /**
   * Get all kategori for output materials
   */
  async getKategoriOutput(companyId: string) {
    const { db } = await import("@/server/db");

    // Exclude kategori TBS
    const kategoris = await db.kategoriMaterial.findMany({
      where: {
        companyId,
        NOT: {
          name: {
            contains: "TBS",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return kategoris;
  }

  /**
   * Get production summary statistics
   */
  async getSummary(
    companyId: string,
    materialOutputId?: string,
    status?: string,
    date?: Date
  ) {
    // Get data from repository
    const { todayData, monthData, yearData } =
      await prosesProduksiRepository.getSummaryData(
        companyId,
        materialOutputId,
        status,
        date
      );

    // Helper to calculate statistics
    const calculateStats = (data: any[]) => {
      let totalProduksi = 0;
      let totalRendemen = 0;
      let countRendemen = 0;

      data.forEach((proses) => {
        // Total produksi = jumlah output hasil produksi (CPO, kernel, dll)
        proses.hasilProduksi.forEach((hasil: any) => {
          totalProduksi += hasil.jumlahOutput;
          totalRendemen += hasil.rendemen;
          countRendemen += 1;
        });
      });

      return {
        totalProduksi: Number(totalProduksi.toFixed(2)),
        rataRataRendemen:
          countRendemen > 0
            ? Number((totalRendemen / countRendemen).toFixed(2))
            : 0,
      };
    };

    // Calculate production breakdown by material
    const productionByMaterial: Record<
      string,
      { materialName: string; total: number }
    > = {};

    [...todayData, ...monthData, ...yearData].forEach((proses) => {
      proses.hasilProduksi.forEach((hasil: any) => {
        const key = hasil.materialOutputId;
        if (!productionByMaterial[key]) {
          productionByMaterial[key] = {
            materialName: hasil.materialOutput.name,
            total: 0,
          };
        }
        productionByMaterial[key]!.total += hasil.jumlahOutput;
      });
    });

    return {
      today: calculateStats(todayData),
      month: calculateStats(monthData),
      year: calculateStats(yearData),
      productionBreakdown: Object.entries(productionByMaterial).map(
        ([materialId, data]) => ({
          materialId,
          materialName: data.materialName,
          total: Number(data.total.toFixed(2)),
        })
      ),
    };
  }

  /**
   * Get production summary report (Day/Period, Month, Year)
   * @param companyId - Company ID
   * @param startDate - Start date of the period (optional, defaults to today)
   * @param endDate - End date of the period (optional, defaults to startDate or today)
   * @param materialOutputId - Filter by specific material output, or null for all
   */
  async getProductionSummaryReport(
    companyId: string,
    startDate?: Date | null,
    endDate?: Date | null,
    materialOutputId?: string | null
  ) {
    // Use current date if not provided
    const now = new Date();
    const periodEnd = endDate || startDate || now;
    const periodStart = startDate || periodEnd;

    const endYear = periodEnd.getFullYear();
    const endMonth = periodEnd.getMonth();
    const endDay = periodEnd.getDate();

    const startYear = periodStart.getFullYear();
    const startMonth = periodStart.getMonth();
    const startDay = periodStart.getDate();

    // Calculate date ranges for the selected period
    const periodStartDate = new Date(startYear, startMonth, startDay, 0, 0, 0);
    const periodEndDate = new Date(endYear, endMonth, endDay, 23, 59, 59, 999);

    // Check if this is a period (range) or single date
    const isPeriodMode = periodStartDate.getTime() !== periodEndDate.getTime() - 86399999;

    // When in period mode, use the full period for month/year calculations
    // This means all 3 cards (Periode, Bulan, Tahun) show the same accumulated total
    const startOfMonth = isPeriodMode ? periodStartDate : new Date(endYear, endMonth, 1, 0, 0, 0);
    const endOfMonth = periodEndDate;

    const startOfYear = isPeriodMode ? periodStartDate : new Date(endYear, 0, 1, 0, 0, 0);
    const endOfYear = periodEndDate;

    // If materialOutputId is provided, just return the single summary
    if (materialOutputId && materialOutputId !== "all") {
      return this.calculateSummaryForProduct(companyId, materialOutputId, periodStartDate, periodEndDate, startOfMonth, endOfMonth, startOfYear, endOfYear);
    }

    // Otherwise, fetch all relevant products and return a list
    const { db } = await import("@/server/db");
    const products = await db.material.findMany({
      where: {
        companyId,
        NOT: {
          OR: [
            { name: { contains: "TBS", mode: "insensitive" } },
            { code: { contains: "TBS", mode: "insensitive" } },
            { kategori: { name: { contains: "TBS", mode: "insensitive" } } }
          ]
        }
      },
      select: { id: true, name: true, code: true },
      orderBy: { code: "asc" }
    });

    const breakdown = await Promise.all(products.map(async (p) => {
      const stats = await this.calculateSummaryForProduct(companyId, p.id, periodStartDate, periodEndDate, startOfMonth, endOfMonth, startOfYear, endOfYear);
      return {
        materialId: p.id,
        materialName: p.name,
        materialCode: p.code,
        ...stats
      };
    }));

    // For "all" mode, we also need the common TBS input (this is shared)
    // We'll calculate it using null as materialOutputId to get global input
    const globalInput = await this.calculateSummaryForProduct(companyId, null, periodStartDate, periodEndDate, startOfMonth, endOfMonth, startOfYear, endOfYear);

    return {
      global: globalInput,
      products: breakdown
    };
  }

  private async calculateSummaryForProduct(
    companyId: string,
    materialOutputId: string | null,
    startOfDay: Date,
    endOfDay: Date,
    startOfMonth: Date,
    endOfMonth: Date,
    startOfYear: Date,
    endOfYear: Date
  ) {
    // Calculate stats for day (direct total)
    const dailyDataDay = await prosesProduksiRepository.calculateDailyStats(
      companyId,
      startOfDay,
      endOfDay,
      materialOutputId
    );

    const availableKeys = Object.keys(dailyDataDay);
    const todayKey: string =
      availableKeys.length > 0
        ? availableKeys[0]!
        : startOfDay.toISOString().split("T")[0]!;

    const statsDay = {
      totalInput: Number((dailyDataDay[todayKey]?.totalInput || 0).toFixed(2)),
      totalProduksi: Number(
        (dailyDataDay[todayKey]?.totalProduksi || 0).toFixed(2)
      ),
      totalRendemen:
        dailyDataDay[todayKey]?.totalInput && dailyDataDay[todayKey].totalInput > 0
          ? Number(
            (
              (dailyDataDay[todayKey].totalProduksi /
                dailyDataDay[todayKey].totalInput) *
              100
            ).toFixed(2)
          )
          : 0,
    };

    // Calculate stats for month
    const dailyDataMonth = await prosesProduksiRepository.calculateDailyStats(
      companyId,
      startOfMonth,
      endOfMonth,
      materialOutputId
    );
    const daysInMonth = Object.keys(dailyDataMonth).length;
    const monthTotalInput = Object.values(dailyDataMonth).reduce(
      (sum, d) => sum + d.totalInput,
      0
    );
    const monthTotalProduksi = Object.values(dailyDataMonth).reduce(
      (sum, d) => sum + d.totalProduksi,
      0
    );
    const monthTotalRendemen = Object.values(dailyDataMonth).reduce(
      (sum, d) => sum + d.totalRendemen,
      0
    );
    const statsMonth = {
      totalInput: Number(monthTotalInput.toFixed(2)),
      totalProduksi: Number(monthTotalProduksi.toFixed(2)),
      totalRendemen:
        monthTotalInput > 0
          ? Number(((monthTotalProduksi / monthTotalInput) * 100).toFixed(2))
          : 0,
    };

    // Calculate stats for year
    const dailyDataYear = await prosesProduksiRepository.calculateDailyStats(
      companyId,
      startOfYear,
      endOfYear,
      materialOutputId
    );

    const monthlyData: Record<
      number,
      {
        totalInput: number;
        totalProduksi: number;
        totalRendemen: number;
        days: number;
      }
    > = {};
    Object.entries(dailyDataYear).forEach(([dateKey, data]) => {
      const mKey = new Date(dateKey).getMonth();
      if (!monthlyData[mKey]) {
        monthlyData[mKey] = {
          totalInput: 0,
          totalProduksi: 0,
          totalRendemen: 0,
          days: 0,
        };
      }
      monthlyData[mKey].totalInput += data.totalInput;
      monthlyData[mKey].totalProduksi += data.totalProduksi;
      monthlyData[mKey].totalRendemen += data.totalRendemen;
      monthlyData[mKey].days++;
    });

    const monthsInYear = Object.keys(monthlyData).length;
    const yearTotalInput = Object.values(monthlyData).reduce(
      (sum, m) => sum + m.totalInput,
      0
    );
    const yearTotalProduksi = Object.values(monthlyData).reduce(
      (sum, m) => sum + m.totalProduksi,
      0
    );

    const monthlyAverages = Object.values(monthlyData).map((m) =>
      m.days > 0 ? m.totalRendemen / m.days : 0
    );
    const statsYear = {
      totalInput: Number(yearTotalInput.toFixed(2)),
      totalProduksi: Number(yearTotalProduksi.toFixed(2)),
      totalRendemen:
        yearTotalInput > 0
          ? Number(((yearTotalProduksi / yearTotalInput) * 100).toFixed(2))
          : 0,
    };

    return {
      day: statsDay,
      month: statsMonth,
      year: statsYear,
    };
  }
}

export const prosesProduksiService = new ProsesProduksiService();
