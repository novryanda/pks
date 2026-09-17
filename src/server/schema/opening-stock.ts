import { z } from "zod";

export const openingStockEntrySchema = z.object({
  materialId: z.string().min(1, "Material wajib dipilih"),
  quantity: z.number().min(0, "Stock awal tidak boleh negatif").nullable(),
});

export const saveOpeningStockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  entries: z.array(openingStockEntrySchema),
});

export type OpeningStockEntryInput = z.infer<typeof openingStockEntrySchema>;
export type SaveOpeningStockInput = z.infer<typeof saveOpeningStockSchema>;
