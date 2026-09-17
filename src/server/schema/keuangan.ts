import { z } from "zod";

// Enum untuk status pembayaran
export const StatusPembayaranEnum = z.enum(["UNPAID", "PARTIAL", "PAID"]);

// Enum untuk tipe transaksi keuangan
export const TipeTransaksiKeuanganEnum = z.enum([
  "PENERIMAAN_TBS",
  "PURCHASE_ORDER",
  "PEMBELIAN_LANGSUNG",
  "PENGIRIMAN_PRODUCT",
]);

// Schema untuk pembayaran hutang
export const pembayaranHutangSchema = z.object({
  hutangId: z.string().min(1, "Hutang ID wajib diisi"),
  jumlahBayar: z.number().positive("Jumlah bayar harus lebih dari 0"),
  metodePembayaran: z.string().optional(),
  nomorReferensi: z.string().optional(),
  keterangan: z.string().optional(),
  tanggalBayar: z.date().optional(),
});

export type PembayaranHutangInput = z.infer<typeof pembayaranHutangSchema>;

export const inputHargaVendorTransportirSchema = z.object({
  pengirimanId: z.string().min(1, "Pengiriman wajib dipilih"),
  hargaPerKg: z.number().min(0, "Harga vendor transportir tidak boleh negatif"),
  ppnPersen: z.number().min(0).max(100).optional().default(0),
  pphPersen: z.number().min(0).max(100).optional().default(0),
});

export type InputHargaVendorTransportirInput = z.infer<typeof inputHargaVendorTransportirSchema>;

// Schema untuk penerimaan piutang
export const penerimaanPiutangSchema = z.object({
  piutangId: z.string().min(1, "Piutang ID wajib diisi"),
  jumlahTerima: z.number().positive("Jumlah terima harus lebih dari 0"),
  metodePembayaran: z.string().optional(),
  nomorReferensi: z.string().optional(),
  keterangan: z.string().optional(),
  tanggalTerima: z.date().optional(),
});

export type PenerimaanPiutangInput = z.infer<typeof penerimaanPiutangSchema>;

// Schema untuk query hutang
export const hutangQuerySchema = z.object({
  status: StatusPembayaranEnum.optional(),
  tipeTransaksi: TipeTransaksiKeuanganEnum.optional(),
  pihakKetigaId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export type HutangQueryInput = z.infer<typeof hutangQuerySchema>;

// Schema untuk query piutang
export const piutangQuerySchema = z.object({
  status: StatusPembayaranEnum.optional(),
  buyerId: z.string().optional(),
  contractId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export type PiutangQueryInput = z.infer<typeof piutangQuerySchema>;

// Schema untuk create hutang manual
export const createHutangSchema = z.object({
  tipeTransaksi: TipeTransaksiKeuanganEnum,
  referensiId: z.string(),
  referensiNomor: z.string(),
  tanggalTransaksi: z.date(),
  tanggalJatuhTempo: z.date().optional().nullable(),
  pihakKetigaId: z.string().optional().nullable(),
  pihakKetigaNama: z.string(),
  pihakKetigaTipe: z.string().optional().nullable(),
  totalNilai: z.number().min(0),
  keterangan: z.string().optional().nullable(),
});

export type CreateHutangInput = z.infer<typeof createHutangSchema>;

// Schema untuk create piutang manual
export const createPiutangSchema = z.object({
  tipeTransaksi: TipeTransaksiKeuanganEnum.default("PENGIRIMAN_PRODUCT"),
  referensiId: z.string(),
  referensiNomor: z.string(),
  tanggalTransaksi: z.date(),
  tanggalJatuhTempo: z.date().optional().nullable(),
  buyerId: z.string().optional().nullable(),
  buyerNama: z.string(),
  contractId: z.string().optional().nullable(),
  contractNumber: z.string().optional().nullable(),
  totalNilai: z.number().min(0),
  keterangan: z.string().optional().nullable(),
});

export type CreatePiutangInput = z.infer<typeof createPiutangSchema>;

// ============================================
// BIAYA PENGELUARAN SCHEMAS
// ============================================

// Enum untuk kategori biaya (dipertahankan sebagai referensi string)
export const KategoriBiayaEnum = z.string().min(1, "Kategori wajib diisi");

// Enum untuk status biaya
export const StatusBiayaEnum = z.enum(["DRAFT", "ACTIVE", "PAID", "CANCELLED"]);

// Schema untuk create biaya pengeluaran
export const createBiayaPengeluaranSchema = z.object({
  tanggalBiaya: z.union([z.string(), z.date()]).transform((val) =>
    typeof val === "string" ? new Date(val) : val
  ),
  kategoriBiaya: z.string().min(1, "Kategori wajib diisi"),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  jumlahBiaya: z.number().positive("Jumlah biaya harus lebih dari 0"),
  periodeBulan: z.number().int().min(1).max(12).optional().nullable(),
  periodeTahun: z.number().int().min(2000).max(2100).optional().nullable(),
  keterangan: z.string().optional().nullable(),
});

export type CreateBiayaPengeluaranInput = z.infer<typeof createBiayaPengeluaranSchema>;

// Schema untuk update biaya pengeluaran
export const updateBiayaPengeluaranSchema = z.object({
  tanggalBiaya: z.union([z.string(), z.date()]).transform((val) =>
    typeof val === "string" ? new Date(val) : val
  ).optional(),
  kategoriBiaya: z.string().min(1).optional(),
  deskripsi: z.string().min(1).optional(),
  jumlahBiaya: z.number().positive().optional(),
  periodeBulan: z.number().int().min(1).max(12).optional().nullable(),
  periodeTahun: z.number().int().min(2000).max(2100).optional().nullable(),
  keterangan: z.string().optional().nullable(),
  status: StatusBiayaEnum.optional(),
});

export type UpdateBiayaPengeluaranInput = z.infer<typeof updateBiayaPengeluaranSchema>;

// Schema untuk query biaya pengeluaran
export const biayaPengeluaranQuerySchema = z.object({
  kategoriBiaya: z.string().optional(),
  status: StatusBiayaEnum.optional(),
  startDate: z.union([z.string(), z.date()]).optional(),
  endDate: z.union([z.string(), z.date()]).optional(),
  periodeBulan: z.number().int().min(1).max(12).optional(),
  periodeTahun: z.number().int().min(2000).max(2100).optional(),
});

export type BiayaPengeluaranQueryInput = z.infer<typeof biayaPengeluaranQuerySchema>;

