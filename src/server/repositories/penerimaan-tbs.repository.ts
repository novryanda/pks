import { db } from "@/server/db";
import { materialRepository } from "@/server/repositories/material.repository";
import type {
  CreatePenerimaanTBSInput,
  UpdatePenerimaanTBSInput,
  CreatePenerimaanTimbangInput,
} from "@/server/schema/penerimaan-tbs";
import { Prisma } from "@prisma/client";
import { getJakartaDateKey, parseJakartaDateBoundary } from "@/lib/date-time";

const STOCK_RECORDED_STATUSES = [
  "TIMBANG_TARRA",
  "PENDING_HARGA",
  "COMPLETED",
] as const;

function getEffectiveTanggalTerima(data: {
  tanggalTerima: Date;
  waktuTimbangTarra?: Date | null;
}) {
  return data.waktuTimbangTarra ?? data.tanggalTerima;
}

function calculatePaymentTotals(
  beratNetto2: number,
  hargaPerKg: number,
  upahBongkar: number,
  ppnPersen = 0,
  pphPersen = 0,
) {
  const totalBayar = Math.round(beratNetto2 * hargaPerKg);
  const nilaiPpn = Math.round((totalBayar * ppnPersen) / 100);
  const nilaiPph = Math.round((totalBayar * pphPersen) / 100);
  const jumlahBayarFinal = totalBayar + nilaiPpn - nilaiPph;
  const totalUpahBongkar = Math.round(beratNetto2 * upahBongkar);

  return {
    totalBayar,
    nilaiPpn,
    nilaiPph,
    jumlahBayarFinal,
    totalUpahBongkar,
  };
}

export class PenerimaanTBSRepository {
  async generateNomorPenerimaan(companyId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `TBS-${year}${month}`;

    const lastPenerimaan = await db.penerimaanTBS.findFirst({
      where: {
        companyId,
        nomorPenerimaan: {
          startsWith: prefix,
        },
      },
      orderBy: {
        nomorPenerimaan: "desc",
      },
    });

    let sequence = 1;
    if (lastPenerimaan) {
      const lastSequence = parseInt(
        lastPenerimaan.nomorPenerimaan.split("-").pop() || "0",
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(5, "0")}`;
  }

  // Method untuk create dengan timbangan saja (Step 1-3)
  async createPenerimaanTimbang(
    companyId: string,
    data: CreatePenerimaanTimbangInput & { transporterId: string },
  ) {
    const nomorPenerimaan = await this.generateNomorPenerimaan(companyId);

    // Kalkulasi jika data timbangan lengkap
    const beratBruto = data.beratBruto ?? 0;
    const beratTarra = data.beratTarra ?? 0;
    const potonganPersen = data.potonganPersen ?? 0;

    const beratNetto1 = Math.round(beratBruto - beratTarra);
    const potonganKg = Math.round((beratNetto1 * potonganPersen) / 100);
    const beratNetto2 = Math.round(beratNetto1 - potonganKg);

    // Tentukan status berdasarkan data yang tersedia
    let status: "DRAFT" | "TIMBANG_BRUTO" | "TIMBANG_TARRA" | "PENDING_HARGA" =
      "DRAFT";
    if (beratBruto > 0 && beratTarra > 0) {
      status = "PENDING_HARGA"; // Timbangan selesai, menunggu input harga
    } else if (beratBruto > 0) {
      status = "TIMBANG_BRUTO"; // Baru timbang bruto
    }

    console.log(
      "Creating penerimaan with status:",
      status,
      "beratBruto:",
      beratBruto,
    );

    return db.penerimaanTBS.create({
      data: {
        companyId,
        nomorPenerimaan,
        tanggalTerima:
          status === "PENDING_HARGA"
            ? getEffectiveTanggalTerima(data)
            : data.tanggalTerima,
        materialId: data.materialId,
        operatorPenimbang: data.operatorPenimbang,
        supplierId: data.supplierId,
        lokasiKebun: data.lokasiKebun,
        jenisBuah: data.jenisBuah,
        transporterId: data.transporterId,
        metodeBruto: data.metodeBruto ?? "MANUAL",
        beratBruto,
        waktuTimbangBruto: data.waktuTimbangBruto,
        metodeTarra: data.metodeTarra ?? "MANUAL",
        beratTarra,
        waktuTimbangTarra: data.waktuTimbangTarra,
        potonganPersen,
        beratNetto1,
        potonganKg,
        beratNetto2,
        hargaPerKg: 0,
        totalBayar: 0,
        ppnPersen: 0,
        pphPersen: 0,
        nilaiPpn: 0,
        nilaiPph: 0,
        jumlahBayarFinal: 0,
        upahBongkar: 16,
        totalUpahBongkar: 0,
        status,
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  // Method untuk update timbangan tarra (saat kendaraan kembali)
  async updateTimbangTarra(
    id: string,
    data: {
      metodeTarra: "MANUAL" | "SISTEM_TIMBANGAN";
      beratTarra: number;
      waktuTimbangTarra: Date;
      potonganPersen: number;
      jenisBuah?: string;
    },
  ) {
    const current = await db.penerimaanTBS.findUnique({ where: { id } });
    if (!current) throw new Error("Penerimaan TBS tidak ditemukan");

    const beratNetto1 = Math.round(current.beratBruto - data.beratTarra);
    const potonganKg = Math.round((beratNetto1 * data.potonganPersen) / 100);
    const beratNetto2 = Math.round(beratNetto1 - potonganKg);

    const {
      totalBayar,
      nilaiPpn,
      nilaiPph,
      jumlahBayarFinal,
      totalUpahBongkar,
    } = calculatePaymentTotals(
      beratNetto2,
      current.hargaPerKg,
      current.upahBongkar,
      current.ppnPersen,
      current.pphPersen,
    );

    // Jika status masih TIMBANG_BRUTO, pindahkan ke TIMBANG_TARRA
    // Jika sudah di tahap selanjutnya (PENDING_HARGA, COMPLETED, dll), biarkan statusnya
    const newStatus =
      current.status === "TIMBANG_BRUTO" ? "TIMBANG_TARRA" : current.status;

    return db.penerimaanTBS.update({
      where: { id },
      data: {
        tanggalTerima: data.waktuTimbangTarra,
        metodeTarra: data.metodeTarra,
        beratTarra: data.beratTarra,
        waktuTimbangTarra: data.waktuTimbangTarra,
        potonganPersen: data.potonganPersen,
        jenisBuah: data.jenisBuah,
        beratNetto1,
        potonganKg,
        beratNetto2,
        totalBayar,
        nilaiPpn,
        nilaiPph,
        jumlahBayarFinal,
        totalUpahBongkar,
        status: newStatus as any,
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  // Method untuk input harga (halaman terpisah)
  async inputHarga(
    id: string,
    data: {
      hargaPerKg: number;
      ppnPersen: number;
      pphPersen: number;
      upahBongkar: number;
      selectedBankAccount?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
      } | null;
    },
  ) {
    const current = await db.penerimaanTBS.findUnique({ where: { id } });
    if (!current) throw new Error("Penerimaan TBS tidak ditemukan");

    const {
      totalBayar,
      nilaiPpn,
      nilaiPph,
      jumlahBayarFinal,
      totalUpahBongkar,
    } = calculatePaymentTotals(
      current.beratNetto2,
      data.hargaPerKg,
      data.upahBongkar,
      data.ppnPersen,
      data.pphPersen,
    );

    return db.penerimaanTBS.update({
      where: { id },
      data: {
        hargaPerKg: data.hargaPerKg,
        ppnPersen: data.ppnPersen,
        pphPersen: data.pphPersen,
        upahBongkar: data.upahBongkar,
        totalBayar,
        nilaiPpn,
        nilaiPph,
        jumlahBayarFinal,
        totalUpahBongkar,
        selectedBankAccount: data.selectedBankAccount
          ? (data.selectedBankAccount as Prisma.InputJsonValue)
          : Prisma.DbNull,
        status: "COMPLETED",
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  // Method untuk get penerimaan yang menunggu input harga
  async getPendingHarga(companyId: string) {
    return db.penerimaanTBS.findMany({
      where: {
        companyId,
        status: "PENDING_HARGA",
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
        vendorBongkar: true,
      },
      orderBy: { tanggalTerima: "desc" },
    });
  }

  // Method untuk get penerimaan yang menunggu timbang tarra
  async getPendingTarra(companyId: string) {
    return db.penerimaanTBS.findMany({
      where: {
        companyId,
        status: "TIMBANG_BRUTO",
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
      orderBy: { tanggalTerima: "desc" },
    });
  }

  // Method untuk get daftar yang menunggu input tarra
  async getTarraList(
    companyId: string,
    filters?: { startDate?: Date; endDate?: Date },
  ) {
    const where: any = {
      companyId,
      status: "TIMBANG_BRUTO",
    };

    // Add date filter if provided
    if (filters?.startDate || filters?.endDate) {
      where.tanggalTerima = {};
      if (filters.startDate) {
        where.tanggalTerima.gte = filters.startDate;
      }
      if (filters.endDate) {
        // Set end date to end of day
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.tanggalTerima.lte = endOfDay;
      }
    }

    return db.penerimaanTBS.findMany({
      where,
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
        company: true,
      },
      orderBy: { tanggalTerima: "desc" },
    });
  }

  async createPenerimaanTBS(companyId: string, data: CreatePenerimaanTBSInput) {
    const nomorPenerimaan = await this.generateNomorPenerimaan(companyId);

    // Kalkulasi
    const beratNetto1 = Math.round(data.beratBruto - data.beratTarra);
    const potonganPersen = data.potonganPersen ?? 0;
    const potonganKg = Math.round((beratNetto1 * potonganPersen) / 100);
    const beratNetto2 = Math.round(beratNetto1 - potonganKg);
    const hargaPerKg = data.hargaPerKg ?? 0;
    const ppnPersen = data.ppnPersen ?? 0;
    const pphPersen = data.pphPersen ?? 0;
    const upahBongkarValue = data.upahBongkar ?? 16; // Default 16
    const {
      totalBayar,
      nilaiPpn,
      nilaiPph,
      jumlahBayarFinal,
      totalUpahBongkar,
    } = calculatePaymentTotals(
      beratNetto2,
      hargaPerKg,
      upahBongkarValue,
      ppnPersen,
      pphPersen,
    );

    // Extract fields we don't want to spread (calculated or non-db fields)
    const {
      upahBongkar: _,
      selectedVendorBongkarBank,
      tanggalTerima: _tanggalTerima,
      ...restData
    } = data;

    return db.penerimaanTBS.create({
      data: {
        companyId,
        nomorPenerimaan,
        ...(restData as any),
        tanggalTerima: getEffectiveTanggalTerima(data),
        transporterId: data.transporterId!, // pastikan string
        beratNetto1,
        potonganKg,
        beratNetto2,
        totalBayar,
        nilaiPpn,
        nilaiPph,
        jumlahBayarFinal,
        upahBongkar: upahBongkarValue,
        totalUpahBongkar,
        selectedVendorBongkarBank: selectedVendorBongkarBank as any,
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  async getPenerimaanTBSByCompany(
    companyId: string,
    filters?: {
      status?: string;
      supplierId?: string;
      materialId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    return db.penerimaanTBS.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.supplierId && { supplierId: filters.supplierId }),
        ...(filters?.materialId && { materialId: filters.materialId }),
        ...(filters?.startDate &&
          filters?.endDate && {
            tanggalTerima: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
      orderBy: { tanggalTerima: "desc" },
    });
  }

  async getPenerimaanTBSById(id: string) {
    return db.penerimaanTBS.findUnique({
      where: { id },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
        company: true,
      },
    });
  }

  async getPenerimaanTBSByNomor(nomorPenerimaan: string) {
    return db.penerimaanTBS.findUnique({
      where: { nomorPenerimaan },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  async updatePenerimaanTBS(id: string, data: UpdatePenerimaanTBSInput) {
    // Recalculate if necessary fields are provided
    const updateData: Record<string, unknown> = { ...data };

    if (
      data.beratBruto !== undefined ||
      data.beratTarra !== undefined ||
      data.potonganPersen !== undefined ||
      data.hargaPerKg !== undefined ||
      data.upahBongkar !== undefined ||
      data.ppnPersen !== undefined ||
      data.pphPersen !== undefined
    ) {
      const current = await db.penerimaanTBS.findUnique({ where: { id } });
      if (!current) throw new Error("Penerimaan TBS tidak ditemukan");

      const beratBruto = data.beratBruto ?? current.beratBruto;
      const beratTarra = data.beratTarra ?? current.beratTarra;
      const beratNetto1 = Math.round(beratBruto - beratTarra);
      updateData.beratNetto1 = beratNetto1;

      const potonganPersen = data.potonganPersen ?? current.potonganPersen;
      const potonganKg = Math.round((beratNetto1 * potonganPersen) / 100);
      updateData.potonganKg = potonganKg;

      const beratNetto2 = Math.round(beratNetto1 - potonganKg);
      updateData.beratNetto2 = beratNetto2;

      const hargaPerKg = data.hargaPerKg ?? current.hargaPerKg;
      const upahBongkar = data.upahBongkar ?? current.upahBongkar;
      const ppnPersen = data.ppnPersen ?? current.ppnPersen;
      const pphPersen = data.pphPersen ?? current.pphPersen;
      const {
        totalBayar,
        nilaiPpn,
        nilaiPph,
        jumlahBayarFinal,
        totalUpahBongkar,
      } = calculatePaymentTotals(
        beratNetto2,
        hargaPerKg,
        upahBongkar,
        ppnPersen,
        pphPersen,
      );

      updateData.totalBayar = totalBayar;
      updateData.nilaiPpn = nilaiPpn;
      updateData.nilaiPph = nilaiPph;
      updateData.jumlahBayarFinal = jumlahBayarFinal;
      updateData.totalUpahBongkar = totalUpahBongkar;
    }

    if (data.selectedBankAccount !== undefined) {
      updateData.selectedBankAccount = data.selectedBankAccount
        ? (data.selectedBankAccount as Prisma.InputJsonValue)
        : Prisma.DbNull;
    }

    if (data.waktuTimbangTarra !== undefined) {
      updateData.tanggalTerima = data.waktuTimbangTarra;
    }

    return db.penerimaanTBS.update({
      where: { id },
      data: {
        ...updateData,
        supplierId: data.supplierId,
        transporterId: data.transporterId,
        vendorBongkarId: data.vendorBongkarId,
        selectedVendorBongkarBank: data.selectedVendorBongkarBank as any,
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  async cancelPenerimaanTBS(id: string) {
    return db.penerimaanTBS.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  async deletePenerimaanTBS(id: string) {
    return db.penerimaanTBS.delete({
      where: { id },
    });
  }

  // Statistics
  async getTBSMasukHariIni(
    companyId: string,
    materialId: string,
    customDate?: Date,
  ) {
    const today = customDate ? new Date(customDate) : new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db.penerimaanTBS.aggregate({
      where: {
        companyId,
        materialId,
        status: {
          in: [...STOCK_RECORDED_STATUSES],
        },
        tanggalTerima: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        beratNetto2: true,
      },
    });

    return result._sum.beratNetto2 || 0;
  }

  async getTBSMasukPeriode(
    companyId: string,
    materialId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    if (!startDate || !endDate) return 0;

    const result = await db.penerimaanTBS.aggregate({
      where: {
        companyId,
        materialId,
        status: {
          in: [...STOCK_RECORDED_STATUSES],
        },
        tanggalTerima: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        beratNetto2: true,
      },
    });

    return result._sum.beratNetto2 || 0;
  }

  async getTBSMasukBulanIni(
    companyId: string,
    materialId: string,
    customDate?: Date,
  ) {
    const now = customDate ? new Date(customDate) : new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const result = await db.penerimaanTBS.aggregate({
      where: {
        companyId,
        materialId,
        status: {
          in: [...STOCK_RECORDED_STATUSES],
        },
        tanggalTerima: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      _sum: {
        beratNetto2: true,
      },
    });

    return result._sum.beratNetto2 || 0;
  }

  async getTBSBySupplier(
    companyId: string,
    materialId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    return db.penerimaanTBS.groupBy({
      by: ["supplierId"],
      where: {
        companyId,
        materialId,
        status: {
          in: [...STOCK_RECORDED_STATUSES],
        },
        ...(startDate &&
          endDate && {
            tanggalTerima: {
              gte: startDate,
              lte: endDate,
            },
          }),
      },
      _sum: {
        beratNetto2: true,
      },
      _count: {
        id: true,
      },
    });
  }

  async getPembayaranSupplier(
    companyId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      supplierId?: string;
    },
  ) {
    const where: Prisma.PenerimaanTBSWhereInput = {
      companyId,
      status: "COMPLETED",
    };

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.tanggalTerima = {};

      if (filters.startDate) {
        where.tanggalTerima.gte = filters.startDate;
      }

      if (filters.endDate) {
        where.tanggalTerima.lte = filters.endDate;
      }
    }

    return db.penerimaanTBS.findMany({
      where,
      include: {
        supplier: true,
        material: {
          include: {
            satuan: true,
          },
        },
        transporter: true,
        vendorBongkar: true,
      },
      orderBy: { tanggalTerima: "desc" },
    });
  }

  async getTBSStockAtDate(companyId: string, materialId: string, date: Date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db.penerimaanTBS.aggregate({
      where: {
        companyId,
        materialId,
        status: {
          in: [...STOCK_RECORDED_STATUSES],
        },
        tanggalTerima: {
          lte: endOfDay,
        },
      },
      _sum: {
        beratNetto2: true,
      },
    });

    // Note: If there are outgoing TBS movements, they should be subtracted here.
    // However, looking at the current repo, it seems TBS is only received (Stock In).
    // If there were Stock Out, we would need to check StockMovement table or similar.

    return result._sum.beratNetto2 || 0;
  }

  /**
   * Get daily trend data for TBS stock visualization
   * Returns data per date: TBS masuk, TBS terpakai (produksi), sisa stock
   */
  async getTBSDailyTrend(
    companyId: string,
    materialId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      date: string;
      tbsMasuk: number;
      tbsTerpakai: number;
      sisaStock: number;
    }>
  > {
    // Get all dates in range
    const dates: string[] = [];
    const startDateKey = getJakartaDateKey(startDate);
    const endDateKey = getJakartaDateKey(endDate);
    if (!startDateKey || !endDateKey) {
      return [];
    }

    const currentDate =
      parseJakartaDateBoundary(startDateKey) ?? new Date(startDate);
    const end =
      parseJakartaDateBoundary(endDateKey, { endOfDay: true }) ??
      new Date(endDate);

    while (currentDate <= end) {
      const currentDateKey = getJakartaDateKey(currentDate);
      if (currentDateKey) {
        dates.push(currentDateKey);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get TBS masuk grouped by date
    const tbsMasukData = await db.penerimaanTBS.groupBy({
      by: ["tanggalTerima"],
      where: {
        companyId,
        materialId,
        status: {
          in: [...STOCK_RECORDED_STATUSES],
        },
        tanggalTerima: {
          gte: startDate,
          lte: end,
        },
      },
      _sum: {
        beratNetto2: true,
      },
    });

    // Get TBS used in production grouped by date
    const tbsTerpakaiData = await db.prosesProduksi.groupBy({
      by: ["tanggalProduksi"],
      where: {
        companyId,
        materialInputId: materialId,
        status: { in: ["IN_PROGRESS", "COMPLETED"] },
        tanggalProduksi: {
          gte: startDate,
          lte: end,
        },
      },
      _sum: {
        jumlahInput: true,
      },
    });

    // Build result with cumulative stock calculation
    let cumulativeStock = 0;

    // Get initial stock before startDate
    const initialStock = await materialRepository.getStockBalanceAtDate(
      companyId,
      materialId,
      new Date(startDate.getTime() - 1),
    );
    cumulativeStock = initialStock;

    return dates.map((dateStr) => {
      // Find TBS masuk for this date
      const masukEntry = tbsMasukData.find((d) => {
        const entryDate = getJakartaDateKey(d.tanggalTerima);
        return entryDate === dateStr;
      });
      const tbsMasuk = masukEntry?._sum.beratNetto2 || 0;

      // Find TBS terpakai for this date
      const terpakaiEntry = tbsTerpakaiData.find((d) => {
        const entryDate = getJakartaDateKey(d.tanggalProduksi);
        return entryDate === dateStr;
      });
      const tbsTerpakai = terpakaiEntry?._sum.jumlahInput || 0;

      // Update cumulative stock
      cumulativeStock = cumulativeStock + tbsMasuk - tbsTerpakai;

      return {
        date: dateStr,
        tbsMasuk,
        tbsTerpakai,
        sisaStock: Math.max(0, cumulativeStock),
      };
    });
  }
}

export const penerimaanTBSRepository = new PenerimaanTBSRepository();
