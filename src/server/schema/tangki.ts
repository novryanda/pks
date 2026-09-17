import { z } from "zod";

// Enum untuk tipe transaksi
export const TipeTransaksiTangkiEnum = z.enum([
  "MASUK",
  "KELUAR",
  "TRANSFER",
  "ADJUSTMENT",
]);

// Schema untuk membuat tangki baru
export const createTangkiSchema = z.object({
  materialId: z.string().min(1, "Material harus dipilih"),
  namaTangki: z.string().min(1, "Nama tangki harus diisi"),
  kapasitas: z.number().positive("Kapasitas harus lebih dari 0"),
});

// Schema untuk update tangki
export const updateTangkiSchema = z.object({
  namaTangki: z.string().min(1, "Nama tangki harus diisi").optional(),
  kapasitas: z.number().positive("Kapasitas harus lebih dari 0").optional(),
});

// Schema untuk transaksi stock tangki
export const createStockTangkiSchema = z.object({
  tangkiId: z.string().min(1, "Tangki harus dipilih"),
  tipeTransaksi: TipeTransaksiTangkiEnum,
  jumlah: z.number().positive("Jumlah harus lebih dari 0"),
  referensi: z.string().optional(),
  keterangan: z.string().optional(),
  operator: z.string().min(1, "Operator harus diisi"),
  tanggalTransaksi: z.string().or(z.date()).optional(),
});

// Schema untuk filter riwayat stock tangki
export const filterStockTangkiSchema = z.object({
  tangkiId: z.string().optional(),
  tipeTransaksi: TipeTransaksiTangkiEnum.optional(),
  tanggalMulai: z.string().or(z.date()).optional(),
  tanggalSelesai: z.string().or(z.date()).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

// Types
export type CreateTangkiInput = z.infer<typeof createTangkiSchema>;
export type UpdateTangkiInput = z.infer<typeof updateTangkiSchema>;
export type CreateStockTangkiInput = z.infer<typeof createStockTangkiSchema>;
export type FilterStockTangkiInput = z.infer<typeof filterStockTangkiSchema>;
export type TipeTransaksiTangki = z.infer<typeof TipeTransaksiTangkiEnum>;
