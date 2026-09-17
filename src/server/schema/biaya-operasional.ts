import { z } from "zod";

export const StatusPengajuanBiayaEnum = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PAID",
  "CANCELLED",
]);

export type StatusPengajuanBiaya = z.infer<typeof StatusPengajuanBiayaEnum>;

// Schema item rincian pengajuan
export const itemPengajuanBiayaSchema = z.object({
  id: z.string().optional(),
  deskripsi: z.string().min(1, "Deskripsi/nama kebutuhan wajib diisi"),
  jumlah: z.number().positive("Jumlah harus lebih besar dari 0"),
  satuan: z.string().min(1, "Satuan wajib diisi"),
  estimasiHarga: z.number().min(0, "Estimasi harga tidak boleh negatif"),
  keterangan: z.string().optional().nullable(),
});

export type ItemPengajuanBiayaInput = z.infer<typeof itemPengajuanBiayaSchema>;

// Schema untuk membuat pengajuan baru
export const createPengajuanBiayaSchema = z.object({
  tanggalPengajuan: z.union([z.string(), z.date()]).transform((val) =>
    typeof val === "string" ? new Date(val) : val
  ),
  divisi: z.string().min(1, "Divisi pengaju wajib diisi"),
  kategoriBiaya: z.string().min(1, "Kategori biaya wajib dipilih"),
  keperluan: z.string().min(1, "Keperluan / uraian pengajuan wajib diisi"),
  catatan: z.string().optional().nullable(),
  items: z.array(itemPengajuanBiayaSchema).min(1, "Minimal harus ada 1 rincian item kebutuhan"),
});

export type CreatePengajuanBiayaInput = z.infer<typeof createPengajuanBiayaSchema>;

// Schema untuk update pengajuan
export const updatePengajuanBiayaSchema = z.object({
  tanggalPengajuan: z.union([z.string(), z.date()]).transform((val) =>
    typeof val === "string" ? new Date(val) : val
  ).optional(),
  divisi: z.string().min(1).optional(),
  kategoriBiaya: z.string().min(1).optional(),
  keperluan: z.string().min(1).optional(),
  catatan: z.string().optional().nullable(),
  items: z.array(itemPengajuanBiayaSchema).min(1).optional(),
});

export type UpdatePengajuanBiayaInput = z.infer<typeof updatePengajuanBiayaSchema>;

// Schema untuk aksi status (submit, approve, reject, cancel)
export const statusPengajuanBiayaActionSchema = z.object({
  action: z.enum(["submit", "approve", "reject", "cancel"]),
  alasanReject: z.string().optional(),
});

export type StatusPengajuanBiayaActionInput = z.infer<typeof statusPengajuanBiayaActionSchema>;

// Schema query pengajuan biaya operasional
export const pengajuanBiayaQuerySchema = z.object({
  search: z.string().optional(),
  kategoriBiaya: z.string().optional(),
  status: z.string().optional(),
  divisi: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type PengajuanBiayaQueryInput = z.infer<typeof pengajuanBiayaQuerySchema>;
