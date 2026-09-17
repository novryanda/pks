import { z } from "zod";

// Schema for tanggal kerja (attendance per day)
export const tanggalKerjaSchema = z.record(z.string(), z.string().optional());

// Schema for remarks detail (SPPD and Lain-lain)
export const keteranganDetailSchema = z.object({
  sppd: z.string().optional().nullable(),
  tunjanganLainLain: z.string().optional().nullable(),
}).optional().nullable();

// Lembur types
export const LEMBUR_TYPES = {
  HARI_BIASA: "hari_biasa",
  HARI_LIBUR: "hari_libur",
  HARI_BESAR: "hari_besar",
} as const;

export type LemburType = typeof LEMBUR_TYPES[keyof typeof LEMBUR_TYPES];

// Schema for lembur detail per day
export const lemburDetailItemSchema = z.object({
  type: z.enum(["hari_biasa", "hari_libur", "hari_besar"]).default("hari_biasa"),
  hours: z.number().default(0),
  x15: z.number().default(0),
  x2: z.number().default(0),
  x3: z.number().default(0),
  x4: z.number().default(0),
  keterangan: z.string().optional().nullable(),
});

export const lemburDetailSchema = z.record(z.string(), lemburDetailItemSchema.optional());

// Attendance categories
// countAsBelumMasuk: untuk karyawan yang masuk di pertengahan bulan (mengurangi gaji tapi tidak tampil sebagai potongan di PDF)
export const ATTENDANCE_CATEGORIES = [
  { code: "WK", label: "Masuk Kerja", color: "green", countAsHK: true, countAsLiburDibayar: false, countAsHKTidakDibayar: false, countAsBelumMasuk: false },
  { code: "Off", label: "Libur", color: "blue", countAsHK: false, countAsLiburDibayar: true, countAsHKTidakDibayar: false, countAsBelumMasuk: false },
  { code: "PH", label: "Hari Libur Nasional", color: "red", countAsHK: false, countAsLiburDibayar: true, countAsHKTidakDibayar: false, countAsBelumMasuk: false },
  { code: "Cuti (AL)", label: "Cuti Tahunan", color: "cyan", countAsHK: false, countAsLiburDibayar: true, countAsHKTidakDibayar: false, countAsBelumMasuk: false },
  { code: "IB", label: "Izin Berbayar", color: "blue", countAsHK: false, countAsLiburDibayar: true, countAsHKTidakDibayar: false, countAsBelumMasuk: false },
  { code: "PC", label: "Pinjam Cuti", color: "orange", countAsHK: false, countAsLiburDibayar: false, countAsHKTidakDibayar: false, countAsBelumMasuk: false },
  { code: "Sakit (sc)", label: "Sakit", color: "yellow", countAsHK: false, countAsLiburDibayar: true, countAsHKTidakDibayar: false, countAsBelumMasuk: false },
  { code: "P1", label: "Libur Tidak Dibayar", color: "gray", countAsHK: false, countAsLiburDibayar: false, countAsHKTidakDibayar: true, countAsBelumMasuk: false },
  { code: "M", label: "Mangkir", color: "red", countAsHK: false, countAsLiburDibayar: false, countAsHKTidakDibayar: true, countAsBelumMasuk: false },
  { code: "SK", label: "Skorsing", color: "purple", countAsHK: false, countAsLiburDibayar: false, countAsHKTidakDibayar: true, countAsBelumMasuk: false },
  { code: "BM", label: "Belum Masuk", color: "amber", countAsHK: false, countAsLiburDibayar: false, countAsHKTidakDibayar: false, countAsBelumMasuk: true },
] as const;

export type AttendanceCategory = typeof ATTENDANCE_CATEGORIES[number];

// Schema for creating penggajian
export const createPenggajianSchema = z.object({
  masterKaryawanId: z.string().min(1, "Karyawan wajib dipilih"),
  periodeBulan: z.number().min(1).max(12),
  periodeTahun: z.number().min(2000).max(2100),

  // Snapshot salary
  gajiPokok: z.number().default(0),
  tunjanganJabatan: z.number().default(0),
  tunjanganPerumahan: z.number().default(0),
  tunjanganLainLain: z.number().default(0),

  // Attendance
  hk: z.number().int().default(0),
  hkDibayar: z.number().int().default(0),
  hkTidakDibayar: z.number().int().default(0),
  liburDibayar: z.number().int().default(0),
  hariBelumMasuk: z.number().int().default(0), // Hari belum masuk kerja (karyawan masuk pertengahan bulan)
  tanggalKerja: tanggalKerjaSchema.optional().nullable(),

  // Overtime
  overtime: z.number().default(0),
  lemburHari: z.number().default(0),
  totalMenit: z.number().int().default(0),
  totalMenitDibayar: z.number().int().default(0),
  lemburDetail: lemburDetailSchema.optional().nullable(),

  // Potongan
  potKehadiran: z.number().default(0),
  potPinjaman: z.number().default(0),
  potLainLain: z.number().default(0),
  potBpjsTkJht: z.number().default(0),
  potBpjsTkJn: z.number().default(0),
  potBpjsKesehatan: z.number().default(0),
  potPph21: z.number().default(0),
  totalPotongan: z.number().default(0),

  // Result
  totalSebelumPotongan: z.number().default(0),
  upahDiterima: z.number().default(0),

  // Additional
  thr: z.number().default(0),
  sppd: z.number().default(0),
  keteranganDetail: keteranganDetailSchema,
});

// Schema for updating penggajian
export const updatePenggajianSchema = createPenggajianSchema.partial().omit({ masterKaryawanId: true });

// Schema for penggajian id
export const penggajianIdSchema = z.object({
  id: z.string().cuid("ID penggajian tidak valid"),
});

// Schema for query parameters
export const penggajianQuerySchema = z.object({
  search: z.string().optional(),
  divisiId: z.string().optional(),
  periodeBulan: z.coerce.number().optional(),
  periodeTahun: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(100),
});

// Type exports
export type CreatePenggajianInput = z.infer<typeof createPenggajianSchema>;
export type UpdatePenggajianInput = z.infer<typeof updatePenggajianSchema>;
export type PenggajianIdInput = z.infer<typeof penggajianIdSchema>;
export type PenggajianQueryInput = z.infer<typeof penggajianQuerySchema>;
export type TanggalKerja = z.infer<typeof tanggalKerjaSchema>;
export type LemburDetailItem = z.infer<typeof lemburDetailItemSchema>;
export type LemburDetail = z.infer<typeof lemburDetailSchema>;
export type KeteranganDetail = z.infer<typeof keteranganDetailSchema>;

// Schema for updating attendance and overtime
export const updateAttendanceSchema = z.object({
  tanggalKerja: tanggalKerjaSchema,
  lemburDetail: lemburDetailSchema,
});

export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;

// ============================================
// LEMBUR CALCULATION HELPERS
// ============================================

export function calculateLemburBreakdown(
  hours: number,
  type: LemburType = "hari_biasa"
): Pick<LemburDetailItem, "x15" | "x2" | "x3" | "x4"> {
  const totalMinutes = Math.round(hours * 60);

  if (type === "hari_biasa") {
    const firstHourMinutes = Math.min(totalMinutes, 60);
    const remainingMinutes = Math.max(totalMinutes - 60, 0);
    return { x15: firstHourMinutes, x2: remainingMinutes, x3: 0, x4: 0 };
  } else if (type === "hari_libur") {
    const first7HoursMinutes = Math.min(totalMinutes, 7 * 60);
    const hour8Minutes = Math.min(Math.max(totalMinutes - 7 * 60, 0), 60);
    const remainingMinutes = Math.max(totalMinutes - 8 * 60, 0);
    return { x15: 0, x2: first7HoursMinutes, x3: hour8Minutes, x4: remainingMinutes };
  } else {
    const firstHourMinutes = Math.min(totalMinutes, 60);
    const remainingMinutes = Math.max(totalMinutes - 60, 0);
    return { x15: 0, x2: 0, x3: firstHourMinutes, x4: remainingMinutes };
  }
}

export function calculateTotalMenitDibayar(item: Pick<LemburDetailItem, "x15" | "x2" | "x3" | "x4">): number {
  return Math.round((item.x15 * 1.5) + (item.x2 * 2) + (item.x3 * 3) + (item.x4 * 4));
}

export function calculateTotalMenit(item: Pick<LemburDetailItem, "x15" | "x2" | "x3" | "x4">): number {
  return item.x15 + item.x2 + item.x3 + item.x4;
}
