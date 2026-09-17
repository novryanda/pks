import { z } from "zod";

// Schema untuk Pengeluaran Barang Item
export const pengeluaranBarangItemSchema = z.object({
  materialId: z.string().min(1, "Material wajib dipilih"),
  jumlahKeluar: z.number().min(0.01, "Jumlah harus lebih dari 0"),
  hargaSatuan: z.number().min(0, "Harga satuan harus lebih dari atau sama dengan 0").optional(),
  keterangan: z.string().optional(),
});

// Schema untuk Pengeluaran Barang
export const pengeluaranBarangSchema = z.object({
  storeRequestId: z.string().optional(),
  tanggalPengeluaran: z.string().or(z.date()).optional(),
  divisi: z.string().min(1, "Divisi wajib diisi"),
  requestedBy: z.string().min(1, "Nama pemohon wajib diisi"),
  keterangan: z.string().optional(),
  items: z.array(pengeluaranBarangItemSchema).min(1, "Minimal 1 item"),
});

export const updatePengeluaranBarangSchema = z.object({
  tanggalPengeluaran: z.string().or(z.date()).optional(),
  divisi: z.string().optional(),
  requestedBy: z.string().optional(),
  keterangan: z.string().optional(),
  items: z.array(pengeluaranBarangItemSchema).optional(),
});

export const approvePengeluaranBarangSchema = z.object({
  approvedBy: z.string().min(1, "Nama approver wajib diisi"),
});

export const issuePengeluaranBarangSchema = z.object({
  issuedBy: z.string().min(1, "Issued by wajib diisi"),
});

export const completePengeluaranBarangSchema = z.object({
  receivedByDivisi: z.string().min(1, "Nama penerima wajib diisi"),
});

export type PengeluaranBarangInput = z.infer<typeof pengeluaranBarangSchema>;
export type UpdatePengeluaranBarangInput = z.infer<typeof updatePengeluaranBarangSchema>;
export type ApprovePengeluaranBarangInput = z.infer<typeof approvePengeluaranBarangSchema>;
export type IssuePengeluaranBarangInput = z.infer<typeof issuePengeluaranBarangSchema>;
export type CompletePengeluaranBarangInput = z.infer<typeof completePengeluaranBarangSchema>;
