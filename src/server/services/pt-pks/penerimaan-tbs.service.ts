import { penerimaanTBSRepository } from "@/server/repositories/penerimaan-tbs.repository";
import { materialRepository } from "@/server/repositories/material.repository";
import { transporterRepository } from "@/server/repositories/transporter.repository";
import { prosesProduksiRepository } from "@/server/repositories/proses-produksi.repository";
import {
  recomputeMaterialLedgers,
  STOCK_LEDGER_TRANSACTION_OPTIONS,
} from "@/server/services/pt-pks/stock-ledger.service";
import { db } from "@/server/db";
import type {
  CreatePenerimaanTBSInput,
  UpdatePenerimaanTBSInput,
  CreatePenerimaanTimbangInput,
} from "@/server/schema/penerimaan-tbs";
import { getJakartaDateKey, parseJakartaDateBoundary } from "@/lib/date-time";

const STOCK_RECORDED_STATUSES = new Set([
  "TIMBANG_TARRA",
  "PENDING_HARGA",
  "COMPLETED",
]);

function hasRecordedTBSStock(status?: string | null) {
  return !!status && STOCK_RECORDED_STATUSES.has(status);
}

function getMovementDelta(movement: {
  tipeMovement: "IN" | "OUT" | "ADJUSTMENT";
  jumlah: number;
  stockSebelum: number;
  stockSesudah: number;
}) {
  if (movement.tipeMovement === "OUT") {
    return -movement.jumlah;
  }

  if (movement.tipeMovement === "ADJUSTMENT") {
    return movement.stockSesudah - movement.stockSebelum;
  }

  return movement.jumlah;
}

function getTBSStockRecordedAt(penerimaan: {
  tanggalTerima: Date;
  waktuTimbangTarra?: Date | null;
}) {
  return penerimaan.waktuTimbangTarra ?? penerimaan.tanggalTerima;
}

export class PenerimaanTBSService {
  private async reconcileRecordedStockForPenerimaan(penerimaan: {
    companyId: string;
    materialId: string;
    nomorPenerimaan: string;
    beratNetto2: number;
    status?: string | null;
    tanggalTerima: Date;
    waktuTimbangTarra?: Date | null;
    operatorPenimbang?: string | null;
  }) {
    const expectedDelta = hasRecordedTBSStock(penerimaan.status)
      ? penerimaan.beratNetto2
      : 0;
    const expectedStockDate = getTBSStockRecordedAt(penerimaan);

    await db.$transaction(async (tx) => {
      const movements = await tx.stockMovement.findMany({
        where: {
          companyId: penerimaan.companyId,
          materialId: penerimaan.materialId,
          referensi: penerimaan.nomorPenerimaan,
        },
        select: {
          id: true,
          tipeMovement: true,
          jumlah: true,
          stockSebelum: true,
          stockSesudah: true,
          tanggalTransaksi: true,
        },
      });

      const actualDelta = movements.reduce(
        (sum, movement) => sum + getMovementDelta(movement as any),
        0,
      );
      const difference = expectedDelta - actualDelta;
      let shouldRecomputeLedger = false;

      const movementIdsWithDifferentDate = movements
        .filter(
          (movement) =>
            movement.tanggalTransaksi.getTime() !== expectedStockDate.getTime(),
        )
        .map((movement) => movement.id);

      if (movementIdsWithDifferentDate.length > 0) {
        await tx.stockMovement.updateMany({
          where: {
            id: {
              in: movementIdsWithDifferentDate,
            },
          },
          data: {
            tanggalTransaksi: expectedStockDate,
          },
        });
        shouldRecomputeLedger = true;
      }

      if (!shouldRecomputeLedger && movements.length > 0) {
        const laterMovement = await tx.stockMovement.findFirst({
          where: {
            companyId: penerimaan.companyId,
            materialId: penerimaan.materialId,
            tanggalTransaksi: {
              gt: expectedStockDate,
            },
          },
          select: {
            id: true,
          },
        });

        shouldRecomputeLedger = !!laterMovement;
      }

      if (difference !== 0) {
        await tx.stockMovement.create({
          data: {
            companyId: penerimaan.companyId,
            materialId: penerimaan.materialId,
            tipeMovement: difference > 0 ? "IN" : "OUT",
            jumlah: Math.abs(difference),
            stockSebelum: 0,
            stockSesudah: 0,
            referensi: penerimaan.nomorPenerimaan,
            keterangan:
              difference > 0
                ? "Sinkronisasi stok penerimaan TBS"
                : "Koreksi sinkronisasi stok penerimaan TBS",
            operator: penerimaan.operatorPenimbang || "system",
            tanggalTransaksi: expectedStockDate,
          },
        });

        shouldRecomputeLedger = true;
      }

      if (shouldRecomputeLedger) {
        await recomputeMaterialLedgers(tx, penerimaan.companyId, [
          penerimaan.materialId,
        ]);
      }
    }, STOCK_LEDGER_TRANSACTION_OPTIONS);
  }

  // Method untuk create timbangan saja (Step 1-3), tanpa harga
  async createPenerimaanTimbang(
    companyId: string,
    data: CreatePenerimaanTimbangInput & {
      transporterType?: "existing" | "new";
      nomorKendaraan?: string;
      namaSupir?: string;
    },
  ) {
    let transporterId = data.transporterId;

    // If creating new transporter
    if (
      data.transporterType === "new" &&
      data.nomorKendaraan &&
      data.namaSupir
    ) {
      const existing =
        await transporterRepository.getTransporterByPlatAndDriver(
          companyId,
          data.nomorKendaraan,
          data.namaSupir,
        );

      if (existing) {
        transporterId = existing.id;
      } else {
        const newTransporter = await transporterRepository.createTransporter(
          companyId,
          {
            nomorKendaraan: data.nomorKendaraan,
            namaSupir: data.namaSupir,
          },
        );
        transporterId = newTransporter.id;
      }
    }

    if (!transporterId) {
      throw new Error("Transporter harus dipilih atau dibuat");
    }

    const { transporterType, nomorKendaraan, namaSupir, ...penerimaanData } =
      data;

    const penerimaan = await penerimaanTBSRepository.createPenerimaanTimbang(
      companyId,
      {
        ...penerimaanData,
        transporterId,
      },
    );

    if (hasRecordedTBSStock(penerimaan.status) && penerimaan.beratNetto2 > 0) {
      await materialRepository.updateStockMaterial(
        companyId,
        penerimaan.materialId,
        penerimaan.beratNetto2,
        {
          referensi: penerimaan.nomorPenerimaan,
          keterangan: "Penerimaan TBS dari supplier",
          operator: penerimaan.operatorPenimbang || "system",
          tanggalTransaksi: getTBSStockRecordedAt(penerimaan),
        },
      );
    }

    await this.reconcileRecordedStockForPenerimaan(penerimaan);

    return penerimaan;
  }

  // Method untuk update timbang tarra saja (ketika kendaraan kembali)
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
    const current = await penerimaanTBSRepository.getPenerimaanTBSById(id);
    if (!current) {
      throw new Error("Penerimaan TBS tidak ditemukan");
    }

    if (current.status === "CANCELLED") {
      throw new Error(
        "Penerimaan TBS yang sudah dibatalkan tidak dapat diubah",
      );
    }

    const updated = await penerimaanTBSRepository.updateTimbangTarra(id, data);

    const previouslyRecorded = hasRecordedTBSStock(current.status);
    const isNowRecorded = hasRecordedTBSStock(updated.status);

    if (!previouslyRecorded && isNowRecorded) {
      await materialRepository.updateStockMaterial(
        current.companyId,
        current.materialId,
        updated.beratNetto2,
        {
          referensi: updated.nomorPenerimaan,
          keterangan: "Penerimaan TBS dari supplier",
          operator: updated.operatorPenimbang || "system",
          tanggalTransaksi: getTBSStockRecordedAt(updated),
        },
      );
    } else if (
      previouslyRecorded &&
      isNowRecorded &&
      updated.beratNetto2 !== current.beratNetto2
    ) {
      await materialRepository.updateStockMaterial(
        current.companyId,
        current.materialId,
        updated.beratNetto2 - current.beratNetto2,
        {
          referensi: updated.nomorPenerimaan,
          keterangan: `Update penerimaan TBS (perubahan berat: ${current.beratNetto2} kg → ${updated.beratNetto2} kg)`,
          operator: updated.operatorPenimbang || "system",
          tanggalTransaksi: getTBSStockRecordedAt(updated),
        },
      );
    }

    await this.reconcileRecordedStockForPenerimaan(updated);

    return updated;
  }

  // Method untuk input harga (halaman terpisah)
  async inputHarga(
    companyId: string,
    data: {
      id: string;
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
    const current = await penerimaanTBSRepository.getPenerimaanTBSById(data.id);
    if (!current) {
      throw new Error("Penerimaan TBS tidak ditemukan");
    }

    if (current.companyId !== companyId) {
      throw new Error("Tidak memiliki akses ke penerimaan ini");
    }

    if (
      current.status !== "PENDING_HARGA" &&
      current.status !== "TIMBANG_TARRA"
    ) {
      throw new Error("Penerimaan TBS tidak dalam status menunggu input harga");
    }

    const updated = await penerimaanTBSRepository.inputHarga(data.id, {
      hargaPerKg: data.hargaPerKg,
      ppnPersen: data.ppnPersen,
      pphPersen: data.pphPersen,
      upahBongkar: data.upahBongkar,
      selectedBankAccount: data.selectedBankAccount,
    });

    await this.reconcileRecordedStockForPenerimaan(updated);

    return updated;
  }

  // Method untuk get penerimaan yang menunggu input harga
  async getPendingHarga(companyId: string) {
    return penerimaanTBSRepository.getPendingHarga(companyId);
  }

  // Method untuk get penerimaan yang menunggu timbang tarra
  async getPendingTarra(companyId: string) {
    return penerimaanTBSRepository.getPendingTarra(companyId);
  }

  async createPenerimaanTBS(
    companyId: string,
    data: CreatePenerimaanTBSInput & {
      transporterType?: "existing" | "new";
      nomorKendaraan?: string;
      namaSupir?: string;
    },
  ) {
    let transporterId = data.transporterId;

    // If creating new transporter
    if (
      data.transporterType === "new" &&
      data.nomorKendaraan &&
      data.namaSupir
    ) {
      const existing =
        await transporterRepository.getTransporterByPlatAndDriver(
          companyId,
          data.nomorKendaraan,
          data.namaSupir,
        );

      if (existing) {
        transporterId = existing.id;
      } else {
        const newTransporter = await transporterRepository.createTransporter(
          companyId,
          {
            nomorKendaraan: data.nomorKendaraan,
            namaSupir: data.namaSupir,
          },
        );
        transporterId = newTransporter.id;
      }
    }

    if (!transporterId) {
      throw new Error("Transporter harus dipilih atau dibuat");
    }

    // Remove fields that don't exist in Prisma schema
    const { transporterType, nomorKendaraan, namaSupir, ...penerimaanData } =
      data;

    const penerimaan = await penerimaanTBSRepository.createPenerimaanTBS(
      companyId,
      {
        ...penerimaanData,
        transporterId,
      },
    );

    if (hasRecordedTBSStock(penerimaan.status) && penerimaan.beratNetto2 > 0) {
      await materialRepository.updateStockMaterial(
        companyId,
        penerimaan.materialId,
        penerimaan.beratNetto2,
        {
          referensi: penerimaan.nomorPenerimaan,
          keterangan: `Penerimaan TBS dari supplier`,
          operator: penerimaan.operatorPenimbang || "system",
          tanggalTransaksi: getTBSStockRecordedAt(penerimaan),
        },
      );
    }

    await this.reconcileRecordedStockForPenerimaan(penerimaan);

    return penerimaan;
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
    return penerimaanTBSRepository.getPenerimaanTBSByCompany(
      companyId,
      filters,
    );
  }

  async getPenerimaanTBSById(id: string) {
    const penerimaan = await penerimaanTBSRepository.getPenerimaanTBSById(id);
    if (!penerimaan) {
      throw new Error("Penerimaan TBS tidak ditemukan");
    }
    return penerimaan;
  }

  async updatePenerimaanTBS(id: string, data: UpdatePenerimaanTBSInput) {
    const current = await penerimaanTBSRepository.getPenerimaanTBSById(id);
    if (!current) {
      throw new Error("Penerimaan TBS tidak ditemukan");
    }

    const updated = await penerimaanTBSRepository.updatePenerimaanTBS(id, data);

    // Handle stock adjustment based on status changes and weight changes
    const hadRecordedStock = hasRecordedTBSStock(current.status);
    const hasRecordedStock = hasRecordedTBSStock(updated.status);
    const oldWeight = current.beratNetto2;
    const newWeight = updated.beratNetto2;

    if (hadRecordedStock && hasRecordedStock) {
      if (newWeight !== oldWeight) {
        const difference = newWeight - oldWeight;
        await materialRepository.updateStockMaterial(
          current.companyId,
          current.materialId,
          difference,
          {
            referensi: updated.nomorPenerimaan,
            keterangan: `Update penerimaan TBS (perubahan berat: ${oldWeight} kg → ${newWeight} kg)`,
            operator: updated.operatorPenimbang || "system",
            tanggalTransaksi: getTBSStockRecordedAt(updated),
          },
        );
      }
    } else if (!hadRecordedStock && hasRecordedStock) {
      await materialRepository.updateStockMaterial(
        current.companyId,
        current.materialId,
        newWeight,
        {
          referensi: updated.nomorPenerimaan,
          keterangan: `Penerimaan TBS disetujui (status: ${current.status} → COMPLETED)`,
          operator: updated.operatorPenimbang || "system",
          tanggalTransaksi: getTBSStockRecordedAt(updated),
        },
      );
    } else if (hadRecordedStock && !hasRecordedStock) {
      await materialRepository.updateStockMaterial(
        current.companyId,
        current.materialId,
        -oldWeight,
        {
          referensi: updated.nomorPenerimaan,
          keterangan: `Penerimaan TBS dibatalkan (status: COMPLETED → ${updated.status})`,
          operator: updated.operatorPenimbang || "system",
          tanggalTransaksi: getTBSStockRecordedAt(current),
        },
      );
    }

    await this.reconcileRecordedStockForPenerimaan(updated);

    return updated;
  }

  async cancelPenerimaanTBS(id: string, companyId: string) {
    const penerimaan = await penerimaanTBSRepository.getPenerimaanTBSById(id);
    if (!penerimaan) {
      throw new Error("Penerimaan TBS tidak ditemukan");
    }

    if (penerimaan.companyId !== companyId) {
      throw new Error("Tidak memiliki akses ke penerimaan ini");
    }

    if (penerimaan.status === "CANCELLED") {
      throw new Error("Penerimaan TBS sudah dibatalkan");
    }

    if (penerimaan.status !== "TIMBANG_BRUTO") {
      throw new Error(
        "Hanya tiket pada tahap input tarra yang dapat dibatalkan",
      );
    }

    return penerimaanTBSRepository.cancelPenerimaanTBS(id);
  }

  async deletePenerimaanTBS(id: string) {
    const penerimaan = await penerimaanTBSRepository.getPenerimaanTBSById(id);
    if (!penerimaan) {
      throw new Error("Penerimaan TBS tidak ditemukan");
    }

    if (hasRecordedTBSStock(penerimaan.status)) {
      await materialRepository.updateStockMaterial(
        penerimaan.companyId,
        penerimaan.materialId,
        -penerimaan.beratNetto2,
        {
          referensi: penerimaan.nomorPenerimaan,
          keterangan: `Hapus penerimaan TBS`,
          operator: penerimaan.operatorPenimbang || "system",
          tanggalTransaksi: getTBSStockRecordedAt(penerimaan),
        },
      );
    }
    return penerimaanTBSRepository.deletePenerimaanTBS(id);
  }

  // Statistics with date range support
  async getTBSStatistics(
    companyId: string,
    materialId: string,
    filters?: { startDate?: Date; endDate?: Date },
  ) {
    // Use provided dates or default to today
    const endDate = filters?.endDate || new Date();
    const startDate = filters?.startDate || endDate;
    const startDateKey = getJakartaDateKey(startDate);
    const endDateKey = getJakartaDateKey(endDate);
    if (!startDateKey || !endDateKey) {
      throw new Error("Tanggal statistik TBS tidak valid");
    }

    const periodStart = parseJakartaDateBoundary(startDateKey) ?? startDate;
    const periodEnd =
      parseJakartaDateBoundary(endDateKey, { endOfDay: true }) ?? endDate;

    // Check if this is a period (range) or single date
    const isPeriodMode = startDateKey !== endDateKey;

    // When in period mode, use the full period for month/year calculations
    const [endYear, endMonth] = endDateKey.split("-").map(Number);
    const monthStartKey = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
    const yearStartKey = `${endYear}-01-01`;
    const monthStart = isPeriodMode
      ? periodStart
      : (parseJakartaDateBoundary(monthStartKey) ?? periodStart);
    const yearStart = isPeriodMode
      ? periodStart
      : (parseJakartaDateBoundary(yearStartKey) ?? periodStart);

    // Previous day for "sisa stok kemarin" (before start of period)
    const beforePeriodStart = new Date(periodStart.getTime() - 1);

    // Calculate balances:
    // 1. Stock at end of period (total TBS received minus total TBS processed up to endDate)
    // 2. TBS received during the period (startDate to endDate)
    // 3. TBS processed during the period
    const [
      stockAtEndDateFromLedger,
      tbsMasukPeriode,
      openingMasukPeriode,
      tbsOlahPeriode,
      stockBeforePeriod,
      tbsMasukBulanIni,
      openingMasukBulanIni,
      tbsMasukTahunIni,
      openingMasukTahunIni,
      tbsBySupplierRaw,
    ] = await Promise.all([
      materialRepository.getStockBalanceAtDate(
        companyId,
        materialId,
        periodEnd,
      ),
      // TBS received during the specified period
      penerimaanTBSRepository.getTBSMasukPeriode(
        companyId,
        materialId,
        periodStart,
        periodEnd,
      ),
      materialRepository.getOpeningStockTotalInPeriod(
        companyId,
        materialId,
        periodStart,
        periodEnd,
      ),
      // TBS processed during the specified period
      prosesProduksiRepository.getProcessedTBSPeriode(
        companyId,
        materialId,
        periodStart,
        periodEnd,
      ),
      materialRepository.getStockBalanceAtDate(
        companyId,
        materialId,
        beforePeriodStart,
      ),
      // Monthly accumulation (from month start to endDate)
      penerimaanTBSRepository.getTBSMasukPeriode(
        companyId,
        materialId,
        monthStart,
        periodEnd,
      ),
      materialRepository.getOpeningStockTotalInPeriod(
        companyId,
        materialId,
        monthStart,
        periodEnd,
      ),
      // Yearly accumulation
      penerimaanTBSRepository.getTBSMasukPeriode(
        companyId,
        materialId,
        yearStart,
        periodEnd,
      ),
      materialRepository.getOpeningStockTotalInPeriod(
        companyId,
        materialId,
        yearStart,
        periodEnd,
      ),
      // Supplier breakdown for the period
      penerimaanTBSRepository.getTBSBySupplier(
        companyId,
        materialId,
        periodStart,
        periodEnd,
      ),
    ]);

    const stockAtEndDateCalculated = Math.max(
      0,
      stockBeforePeriod +
        tbsMasukPeriode +
        openingMasukPeriode -
        tbsOlahPeriode,
    );

    // Get supplier details
    const tbsBySupplierWithDetails = await Promise.all(
      tbsBySupplierRaw.map(async (item) => {
        const { db } = await import("@/server/db");
        const supplier = await db.supplier.findUnique({
          where: { id: item.supplierId },
          select: { id: true, ownerName: true, type: true },
        });
        return { ...item, supplier };
      }),
    );

    // Response mapping:
    // - tbsHariIni: Stock before period start (sisa stok kemarin / awal periode)
    // - tbsBulanIni: TBS masuk dalam periode yang dipilih
    // - tbsPeriode: TBS masuk dari awal bulan sampai end date
    // - tbsMasukTahunIni: TBS masuk dari awal tahun sampai end date
    // - stockTBS: Total stok sampai akhir periode
    // - tbsOlahPeriode: TBS yang diolah dalam periode (for reference)
    return {
      tbsHariIni: stockBeforePeriod, // Stock before the period
      tbsBulanIni: tbsMasukPeriode + openingMasukPeriode, // TBS received/opening during the selected period
      tbsPeriode: tbsMasukBulanIni + openingMasukBulanIni, // TBS received/opening this month
      tbsMasukTahunIni: tbsMasukTahunIni + openingMasukTahunIni,
      stockTBS:
        stockAtEndDateCalculated !== stockAtEndDateFromLedger
          ? stockAtEndDateCalculated
          : stockAtEndDateFromLedger, // Total stock at end of period
      stockTBSYesterday: stockBeforePeriod,
      tbsOlahPeriode, // TBS processed during period (new field)
      tbsBySupplier: tbsBySupplierWithDetails,
    };
  }

  async getPembayaranSupplier(
    companyId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      supplierId?: string;
    },
  ) {
    return penerimaanTBSRepository.getPembayaranSupplier(companyId, filters);
  }
}

export const penerimaanTBSService = new PenerimaanTBSService();
