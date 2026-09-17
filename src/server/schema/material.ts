import { z } from "zod";

// Schema untuk Kategori Material
export const createKategoriMaterialSchema = z.object({
    name: z.string().min(1, "Nama kategori harus diisi"),
    description: z.string().optional(),
});

export const updateKategoriMaterialSchema = createKategoriMaterialSchema.partial();

export type CreateKategoriMaterialInput = z.infer<typeof createKategoriMaterialSchema>;
export type UpdateKategoriMaterialInput = z.infer<typeof updateKategoriMaterialSchema>;

// Schema untuk Satuan Material
export const createSatuanMaterialSchema = z.object({
    name: z.string().min(1, "Nama satuan harus diisi"),
    symbol: z.string().min(1, "Simbol satuan harus diisi"),
});

export const updateSatuanMaterialSchema = createSatuanMaterialSchema.partial();

export type CreateSatuanMaterialInput = z.infer<typeof createSatuanMaterialSchema>;
export type UpdateSatuanMaterialInput = z.infer<typeof updateSatuanMaterialSchema>;

// Schema untuk Material
export const createMaterialSchema = z.object({
    kategoriId: z.string().min(1, "Kategori harus dipilih"),
    satuanId: z.string().min(1, "Satuan harus dipilih"),
    name: z.string().min(1, "Nama material harus diisi"),
    code: z.string().min(1, "Kode material harus diisi"),
    description: z.string().optional(),
    hargaPerUnit: z.number().min(0, "Harga tidak boleh negatif").optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// Schema khusus untuk update harga material
export const updateMaterialHargaSchema = z.object({
    hargaPerUnit: z.number().min(0, "Harga tidak boleh negatif"),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type UpdateMaterialHargaInput = z.infer<typeof updateMaterialHargaSchema>;
