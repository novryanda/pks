import { z } from "zod";

// Enum untuk status proses produksi
export const StatusProsesProduksiEnum = z.enum([
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// Schema untuk hasil produksi (output)
export const hasilProduksiSchema = z.object({
  materialOutputId: z.string().min(1, "Material output harus dipilih"),
  jumlahOutput: z.number().positive("Jumlah output harus lebih dari 0"),
  rendemen: z.number().min(0).max(100, "Rendemen harus antara 0-100%"),
});

export const createHasilProduksiSchema = hasilProduksiSchema;
export const updateHasilProduksiSchema = hasilProduksiSchema.partial();

// Schema untuk proses produksi
export const prosesProduksiSchema = z.object({
  tanggalProduksi: z.string().or(z.date()),
  materialInputId: z.string().min(1, "Material input (TBS) harus dipilih"),
  jumlahInput: z.number().positive("Jumlah input harus lebih dari 0"),
  operatorProduksi: z.string().min(1, "Operator produksi harus diisi"),
  status: StatusProsesProduksiEnum.optional(),
  hasilProduksi: z.array(hasilProduksiSchema).min(1, "Minimal harus ada 1 hasil produksi"),
});

export const createProsesProduksiSchema = prosesProduksiSchema;

export const updateProsesProduksiSchema = prosesProduksiSchema.partial().extend({
  hasilProduksi: z.array(hasilProduksiSchema).optional(),
});

export const updateStatusProsesProduksiSchema = z.object({
  status: StatusProsesProduksiEnum,
});

export const koreksiTanggalProduksiSchema = z.object({
  tanggalProduksiBaru: z.string().min(1, "Tanggal produksi baru harus diisi"),
});

// Schema untuk filter/query
export const getProsesProduksiQuerySchema = z.object({
  tanggalMulai: z.string().optional(),
  tanggalAkhir: z.string().optional(),
  status: StatusProsesProduksiEnum.optional(),
  materialInputId: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

export const getLogProsesProduksiQuerySchema = z.object({
  tanggalMulai: z.string().optional(),
  tanggalAkhir: z.string().optional(),
  status: z.enum(["COMPLETED", "CANCELLED"]).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

// Types
export type HasilProduksi = z.infer<typeof hasilProduksiSchema>;
export type CreateHasilProduksi = z.infer<typeof createHasilProduksiSchema>;
export type UpdateHasilProduksi = z.infer<typeof updateHasilProduksiSchema>;

export type ProsesProduksi = z.infer<typeof prosesProduksiSchema>;
export type CreateProsesProduksi = z.infer<typeof createProsesProduksiSchema>;
export type UpdateProsesProduksi = z.infer<typeof updateProsesProduksiSchema>;
export type UpdateStatusProsesProduksi = z.infer<typeof updateStatusProsesProduksiSchema>;
export type GetProsesProduksiQuery = z.infer<typeof getProsesProduksiQuerySchema>;
export type KoreksiTanggalProduksi = z.infer<typeof koreksiTanggalProduksiSchema>;
export type GetLogProsesProduksiQuery = z.infer<typeof getLogProsesProduksiQuerySchema>;
