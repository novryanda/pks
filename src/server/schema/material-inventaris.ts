import { z } from "zod";

// Schema untuk MaterialInventaris
export const materialInventarisSchema = z.object({
  partNumber: z.string().min(1, "Part number wajib diisi"),
  namaMaterial: z.string().min(1, "Nama material wajib diisi"),
  kategoriMaterialId: z.string().min(1, "Kategori material wajib dipilih"),
  satuanMaterialId: z.string().min(1, "Satuan material wajib dipilih"),
  spesifikasi: z.string().optional(),
  lokasiDigunakan: z.string().optional(),
  stockOnHand: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
  maxStock: z.number().min(0).default(0),
  hargaSatuan: z.number().min(0).default(0),
});

export const updateMaterialInventarisSchema = materialInventarisSchema.partial();

export type MaterialInventarisInput = z.infer<typeof materialInventarisSchema>;
export type UpdateMaterialInventarisInput = z.infer<typeof updateMaterialInventarisSchema>;
