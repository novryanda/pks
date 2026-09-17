import { db } from "@/server/db";
import { masterKaryawanRepository } from "@/server/repositories/master-karyawan.repository";
import { penggajianRepository } from "@/server/repositories/penggajian.repository";
import { karyawanChangeLogRepository } from "@/server/repositories/karyawan-change-log.repository";
import { createKaryawanSchema, updateKaryawanSchema } from "@/server/schema/master-karyawan";
import type { CreateKaryawanInput, UpdateKaryawanInput, KaryawanQueryInput } from "@/server/schema/master-karyawan";
import type { CreatePenggajianInput } from "@/server/schema/penggajian";
import { TRACKED_FIELDS, type CreateChangeLogInput } from "@/server/schema/karyawan-change-log";

export class MasterKaryawanService {
  /**
   * Get all master karyawan with pagination and filters
   */
  async getMasterKaryawan(query?: KaryawanQueryInput) {
    return masterKaryawanRepository.findAll(query);
  }

  /**
   * Get master karyawan by id
   */
  async getMasterKaryawanById(id: string) {
    const karyawan = await masterKaryawanRepository.findById(id);
    if (!karyawan) {
      throw new Error("Data karyawan tidak ditemukan");
    }
    return karyawan;
  }

  /**
   * Get distinct divisi list (for backward compatibility)
   */
  async getDevisiList() {
    return masterKaryawanRepository.getDistinctDivisi();
  }

  /**
   * Create new master karyawan
   */
  async createMasterKaryawan(data: CreateKaryawanInput) {
    const validatedData = createKaryawanSchema.parse(data);

    // Check if karyawan with same name exists
    const existing = await masterKaryawanRepository.findByName(validatedData.namaKaryawan);
    if (existing) {
      throw new Error(`Karyawan dengan nama "${validatedData.namaKaryawan}" sudah ada`);
    }
    return masterKaryawanRepository.create(validatedData);
  }

  /**
   * Update master karyawan with change logging
   */
  async updateMasterKaryawan(id: string, data: UpdateKaryawanInput, changedBy: string = "system") {
    const validatedData = updateKaryawanSchema.parse(data);

    const existing = await db.masterKaryawan.findUnique({
      where: { id },
      include: { divisi: true, jabatan: true },
    });
    if (!existing) {
      throw new Error("Data karyawan tidak ditemukan");
    }

    // Check for duplicate name if name is being updated
    if (validatedData.namaKaryawan && validatedData.namaKaryawan !== existing.namaKaryawan) {
      const duplicate = await masterKaryawanRepository.findByName(validatedData.namaKaryawan);
      if (duplicate) {
        throw new Error(`Karyawan dengan nama "${validatedData.namaKaryawan}" sudah ada`);
      }
    }

    // Track changes for logging
    const changeLogs: CreateChangeLogInput[] = [];

    for (const { field, displayName } of TRACKED_FIELDS) {
      const oldVal = existing[field as keyof typeof existing];
      const newVal = validatedData[field as keyof typeof validatedData];

      // Only log if the field is being updated and the value changed
      if (newVal !== undefined && String(oldVal ?? "") !== String(newVal ?? "")) {
        let oldDisplay = String(oldVal ?? "");
        let newDisplay = String(newVal ?? "");

        // Get display values for relation fields
        if (field === "divisiId") {
          oldDisplay = existing.divisi?.nama || "-";
          if (newVal) {
            const newDivisi = await db.masterDivisi.findUnique({ where: { id: newVal as string } });
            newDisplay = newDivisi?.nama || String(newVal);
          } else {
            newDisplay = "-";
          }
        } else if (field === "jabatanId") {
          oldDisplay = existing.jabatan?.nama || "-";
          if (newVal) {
            const newJabatan = await db.masterJabatan.findUnique({ where: { id: newVal as string } });
            newDisplay = newJabatan?.nama || String(newVal);
          } else {
            newDisplay = "-";
          }
        } else if (field === "isActive") {
          oldDisplay = oldVal ? "Aktif" : "Non-Aktif";
          newDisplay = newVal ? "Aktif" : "Non-Aktif";
        } else if (field === "gajiPokok" || field === "tunjanganJabatan" || field === "tunjanganPerumahan" || field.startsWith("potBpjs")) {
          oldDisplay = `Rp ${Number(oldVal || 0).toLocaleString("id-ID")}`;
          newDisplay = `Rp ${Number(newVal || 0).toLocaleString("id-ID")}`;
        }

        changeLogs.push({
          masterKaryawanId: id,
          fieldName: displayName,
          oldValue: String(oldVal ?? ""),
          newValue: String(newVal ?? ""),
          oldDisplayValue: oldDisplay,
          newDisplayValue: newDisplay,
          changedBy,
        });
      }
    }

    // Save change logs if any
    if (changeLogs.length > 0) {
      await karyawanChangeLogRepository.createMany(changeLogs);
    }

    return masterKaryawanRepository.update(id, validatedData);
  }

  /**
   * Delete master karyawan
   */
  async deleteMasterKaryawan(id: string) {
    const existing = await masterKaryawanRepository.findById(id);
    if (!existing) {
      throw new Error("Data karyawan tidak ditemukan");
    }
    return masterKaryawanRepository.delete(id);
  }

  /**
   * Generate penggajian for next period from master data
   */
  async generatePenggajian(periodeBulan: number, periodeTahun: number) {
    // Check if data already exists for this period
    const existing = await db.penggajianKaryawan.findFirst({
      where: { periodeBulan, periodeTahun },
    });

    if (existing) {
      throw new Error(
        `Data penggajian untuk periode ${periodeBulan}/${periodeTahun} sudah ada. Hapus terlebih dahulu jika ingin generate ulang.`
      );
    }

    // Get all active employees
    const karyawanList = await masterKaryawanRepository.getActiveKaryawan();
    if (karyawanList.length === 0) {
      throw new Error(
        "Tidak ada data master karyawan aktif. Silakan tambah data master karyawan terlebih dahulu."
      );
    }

    // Create penggajian entries with default values
    const penggajianData: CreatePenggajianInput[] = karyawanList.map((k) => ({
      periodeBulan,
      periodeTahun,
      masterKaryawanId: k.id,
      // Salary from master
      gajiPokok: Number(k.gajiPokok),
      tunjanganJabatan: Number(k.tunjanganJabatan),
      tunjanganPerumahan: Number(k.tunjanganPerumahan),
      tunjanganLainLain: 0,
      // Default attendance
      hk: 0,
      hkDibayar: 0,
      hkTidakDibayar: 0,
      liburDibayar: 0,
      hariBelumMasuk: 0,
      tanggalKerja: null,
      // Default overtime
      overtime: 0,
      lemburHari: 0,
      totalMenit: 0,
      totalMenitDibayar: 0,
      lemburDetail: null,
      // Default potongan
      potKehadiran: 0,
      potPinjaman: 0,
      potLainLain: 0,
      potBpjsTkJht: Number(k.potBpjsTkJht),
      potBpjsTkJn: Number(k.potBpjsTkJn),
      potBpjsKesehatan: Number(k.potBpjsKesehatan),
      potPph21: 0,
      totalPotongan: 0,
      // Result
      totalSebelumPotongan: 0,
      upahDiterima: 0,
      // Additional
      thr: 0,
      sppd: 0,
    }));

    // Bulk create
    const result = await penggajianRepository.createMany(penggajianData);

    return {
      generated: result.count,
      period: `${periodeBulan}/${periodeTahun}`,
    };
  }

  /**
   * Add a single employee to penggajian from master data
   */
  async addKaryawanToPenggajian(
    karyawanId: string,
    periodeBulan: number,
    periodeTahun: number
  ) {
    // 1. Check if employee exists in master
    const k = await masterKaryawanRepository.findById(karyawanId);
    if (!k) {
      throw new Error("Data karyawan tidak ditemukan");
    }

    // 2. Check if already exists in that period
    const existing = await db.penggajianKaryawan.findFirst({
      where: { masterKaryawanId: karyawanId, periodeBulan, periodeTahun },
    });
    if (existing) {
      throw new Error(`Karyawan "${k.namaKaryawan}" sudah ada di periode ini`);
    }

    // 3. Create entry
    const entry: CreatePenggajianInput = {
      periodeBulan,
      periodeTahun,
      masterKaryawanId: k.id,
      gajiPokok: Number(k.gajiPokok),
      tunjanganJabatan: Number(k.tunjanganJabatan),
      tunjanganPerumahan: Number(k.tunjanganPerumahan),
      tunjanganLainLain: 0,
      hk: 0,
      hkDibayar: 0,
      hkTidakDibayar: 0,
      liburDibayar: 0,
      hariBelumMasuk: 0,
      tanggalKerja: null,
      overtime: 0,
      lemburHari: 0,
      totalMenit: 0,
      totalMenitDibayar: 0,
      lemburDetail: null,
      potKehadiran: 0,
      potPinjaman: 0,
      potLainLain: 0,
      potBpjsTkJht: Number(k.potBpjsTkJht),
      potBpjsTkJn: Number(k.potBpjsTkJn),
      potBpjsKesehatan: Number(k.potBpjsKesehatan),
      potPph21: 0,
      totalPotongan: 0,
      totalSebelumPotongan: 0,
      upahDiterima: 0,
      thr: 0,
      sppd: 0,
    };

    return penggajianRepository.create(entry);
  }

  /**
   * Add multiple employees to penggajian from master data (bulk action)
   */
  async addMultipleKaryawanToPenggajian(
    karyawanIds: string[],
    periodeBulan: number,
    periodeTahun: number
  ) {
    if (!karyawanIds || karyawanIds.length === 0) {
      throw new Error("Pilih minimal satu karyawan");
    }

    // Get all selected employees
    const karyawanList = await db.masterKaryawan.findMany({
      where: { id: { in: karyawanIds }, isActive: true },
      include: {
        divisi: { select: { id: true, nama: true } },
        jabatan: { select: { id: true, nama: true } },
      },
    });

    if (karyawanList.length === 0) {
      throw new Error("Tidak ada karyawan aktif yang valid dari pilihan");
    }

    // Check which ones already exist in this period
    const existingRecords = await db.penggajianKaryawan.findMany({
      where: {
        masterKaryawanId: { in: karyawanIds },
        periodeBulan,
        periodeTahun,
      },
      select: { masterKaryawanId: true },
    });

    const existingIds = new Set(existingRecords.map((r) => r.masterKaryawanId));
    const karyawanToAdd = karyawanList.filter((k) => !existingIds.has(k.id));

    if (karyawanToAdd.length === 0) {
      throw new Error(
        `Semua karyawan yang dipilih sudah ada di periode ${periodeBulan}/${periodeTahun}`
      );
    }

    // Create penggajian entries
    const penggajianData: CreatePenggajianInput[] = karyawanToAdd.map((k) => ({
      periodeBulan,
      periodeTahun,
      masterKaryawanId: k.id,
      gajiPokok: Number(k.gajiPokok),
      tunjanganJabatan: Number(k.tunjanganJabatan),
      tunjanganPerumahan: Number(k.tunjanganPerumahan),
      tunjanganLainLain: 0,
      hk: 0,
      hkDibayar: 0,
      hkTidakDibayar: 0,
      liburDibayar: 0,
      hariBelumMasuk: 0,
      tanggalKerja: null,
      overtime: 0,
      lemburHari: 0,
      totalMenit: 0,
      totalMenitDibayar: 0,
      lemburDetail: null,
      potKehadiran: 0,
      potPinjaman: 0,
      potLainLain: 0,
      potBpjsTkJht: Number(k.potBpjsTkJht),
      potBpjsTkJn: Number(k.potBpjsTkJn),
      potBpjsKesehatan: Number(k.potBpjsKesehatan),
      potPph21: 0,
      totalPotongan: 0,
      totalSebelumPotongan: 0,
      upahDiterima: 0,
      thr: 0,
      sppd: 0,
    }));

    const result = await penggajianRepository.createMany(penggajianData);

    return {
      added: result.count,
      skipped: existingIds.size,
      period: `${periodeBulan}/${periodeTahun}`,
    };
  }

  /**
   * Calculate salary for a penggajian record based on HK inputs
   * Updated to use new overtime calculation: (gajiPokok / 173) * (totalMenitDibayar / 60)
   * Updated potKehadiran formula: (gajiPokok + tunjanganJabatan) / 26 per day
   * Added hariBelumMasuk: reduces salary (like deduction) but not shown as deduction in PDF
   */
  calculateSalary(penggajian: {
    gajiPokok: number;
    tunjanganJabatan: number;
    tunjanganPerumahan: number;
    tunjanganLainLain?: number;
    sppd?: number;
    thr?: number;
    hkDibayar: number;
    hkTidakDibayar: number;
    hariBelumMasuk?: number;
    lemburHari: number;
    hk: number;
    totalMenitDibayar?: number;
    potBpjsTkJht?: number;
    potBpjsTkJn?: number;
    potBpjsKesehatan?: number;
    potPinjaman?: number;
    potLainLain?: number;
    potPph21?: number;
  }) {
    const {
      gajiPokok,
      tunjanganJabatan,
      tunjanganPerumahan,
      tunjanganLainLain = 0,
      sppd = 0,
      thr = 0,
      hkDibayar,
      hkTidakDibayar,
      hariBelumMasuk = 0,
      lemburHari,
      hk,
      totalMenitDibayar = 0,
      potBpjsTkJht = 0,
      potBpjsTkJn = 0,
      potBpjsKesehatan = 0,
      potPinjaman = 0,
      potLainLain = 0,
      potPph21 = 0,
    } = penggajian;

    // Calculate daily rate for attendance deduction and hariBelumMasuk
    // Formula: (gajiPokok + tunjanganJabatan) / 26 per day
    const dailyRateKehadiran = (gajiPokok + tunjanganJabatan) / 26;

    // Standard working days for legacy calculation
    const standardHK = 26;
    const dailyRate = hk > 0 ? gajiPokok / hk : gajiPokok / standardHK;

    // Calculate overtime using new formula: (gajiPokok / 173) * (totalMenitDibayar / 60)
    let overtime: number;
    if (totalMenitDibayar > 0) {
      const hourlyRate = gajiPokok / 173;
      const overtimeHours = totalMenitDibayar / 60;
      overtime = Math.round(hourlyRate * overtimeHours);
    } else {
      // Legacy calculation (1.5x daily rate per overtime day)
      const overtimeRate = dailyRate * 1.5;
      overtime = Math.round(lemburHari * overtimeRate);
    }

    // Calculate pengurangan untuk hari belum masuk kerja (tidak tampil sebagai potongan di PDF)
    // Untuk karyawan yang masuk di pertengahan bulan
    const penguranganBelumMasuk = hariBelumMasuk > 0 ? Math.round(hariBelumMasuk * dailyRateKehadiran) : 0;

    // Total before deductions (sudah dikurangi hariBelumMasuk)
    const totalSebelumPotongan =
      gajiPokok + tunjanganJabatan + tunjanganPerumahan + tunjanganLainLain + sppd + thr + overtime - penguranganBelumMasuk;

    // Deductions
    const potKehadiran = hkTidakDibayar > 0 ? Math.round(hkTidakDibayar * dailyRateKehadiran) : 0;
    // Manual deductions are already extracted from props


    const totalPotongan =
      potKehadiran + potBpjsTkJht + potBpjsTkJn + potBpjsKesehatan + potPph21 + potPinjaman + potLainLain;

    const upahDiterima = totalSebelumPotongan - totalPotongan;

    return {
      overtime,
      penguranganBelumMasuk,
      totalSebelumPotongan,
      potKehadiran,
      potBpjsTkJht,
      potBpjsTkJn,
      potBpjsKesehatan,
      potPph21,
      totalPotongan,
      upahDiterima,
    };
  }

  /**
   * Update penggajian with HK data and recalculate salary
   */
  async updatePenggajianWithHK(
    id: string,
    data: {
      hk: number;
      liburDibayar: number;
      hkTidakDibayar: number;
      hkDibayar: number;
      hariBelumMasuk?: number;
      lemburHari: number;
      tanggalKerja?: Record<string, string> | null;
      lemburDetail?: Record<string, { type?: string; hours?: number; x15: number; x2: number; x3: number; x4: number; keterangan?: string | null }> | null;
      totalMenit?: number;
      totalMenitDibayar?: number;
      tunjanganLainLain?: number;
      sppd?: number;
      thr?: number;
      potPinjaman?: number;
      potLainLain?: number;
      potPph21?: number;
      potBpjsTkJht?: number;
      potBpjsTkJn?: number;
      potBpjsKesehatan?: number;
      keteranganDetail?: any;
    }
  ) {
    // Get existing penggajian with master karyawan
    const existing = await db.penggajianKaryawan.findUnique({
      where: { id },
      include: { masterKaryawan: true },
    });
    if (!existing) {
      throw new Error("Data penggajian tidak ditemukan");
    }

    // Deductions will use provided values or existing manually set values
    const potBpjsTkJht = data.potBpjsTkJht ?? Number(existing.potBpjsTkJht) ?? 0;
    const potBpjsTkJn = data.potBpjsTkJn ?? Number(existing.potBpjsTkJn) ?? 0;
    const potBpjsKesehatan = data.potBpjsKesehatan ?? Number(existing.potBpjsKesehatan) ?? 0;

    // Get values from data or existing
    const tunjanganLainLain = data.tunjanganLainLain ?? Number(existing.tunjanganLainLain) ?? 0;
    const sppd = data.sppd ?? Number(existing.sppd) ?? 0;
    const thr = data.thr ?? Number(existing.thr) ?? 0;
    const potPinjaman = data.potPinjaman ?? Number(existing.potPinjaman) ?? 0;
    const potLainLain = data.potLainLain ?? Number(existing.potLainLain) ?? 0;
    const potPph21 = data.potPph21 ?? Number(existing.potPph21) ?? 0;
    const hariBelumMasuk = data.hariBelumMasuk ?? Number(existing.hariBelumMasuk) ?? 0;
    const keteranganDetail = data.keteranganDetail ?? existing.keteranganDetail;

    // Calculate salary
    const calculated = this.calculateSalary({
      gajiPokok: Number(existing.gajiPokok),
      tunjanganJabatan: Number(existing.tunjanganJabatan),
      tunjanganPerumahan: Number(existing.tunjanganPerumahan),
      tunjanganLainLain,
      sppd,
      thr,
      hkDibayar: data.hkDibayar,
      hkTidakDibayar: data.hkTidakDibayar,
      hariBelumMasuk,
      lemburHari: data.lemburHari,
      hk: data.hk,
      totalMenitDibayar: data.totalMenitDibayar || 0,
      potBpjsTkJht,
      potBpjsTkJn,
      potBpjsKesehatan,
      potPinjaman,
      potLainLain,
      potPph21,
    });

    // Update penggajian
    return db.penggajianKaryawan.update({
      where: { id },
      data: {
        hk: data.hk,
        liburDibayar: data.liburDibayar,
        hkTidakDibayar: data.hkTidakDibayar,
        hkDibayar: data.hkDibayar,
        hariBelumMasuk,
        lemburHari: data.lemburHari,
        tanggalKerja: data.tanggalKerja ?? undefined,
        lemburDetail: data.lemburDetail ?? undefined,
        totalMenit: data.totalMenit ?? 0,
        totalMenitDibayar: data.totalMenitDibayar ?? 0,
        keteranganDetail: keteranganDetail ?? undefined,
        tunjanganLainLain,
        sppd,
        thr,
        potPinjaman,
        potLainLain,
        overtime: calculated.overtime,
        totalSebelumPotongan: calculated.totalSebelumPotongan,
        potKehadiran: calculated.potKehadiran,
        potBpjsTkJht: calculated.potBpjsTkJht,
        potBpjsTkJn: calculated.potBpjsTkJn,
        potBpjsKesehatan: calculated.potBpjsKesehatan,
        potPph21: calculated.potPph21,
        totalPotongan: calculated.totalPotongan,
        upahDiterima: calculated.upahDiterima,
      },
    });
  }
}

export const masterKaryawanService = new MasterKaryawanService();
