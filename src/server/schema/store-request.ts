import { z } from "zod";

// Schema untuk Store Request Item
export const storeRequestItemSchema = z.object({
  materialId: z.string().min(1, "Material wajib dipilih"),
  jumlahRequest: z.number().min(0.01, "Jumlah harus lebih dari 0"),
  keterangan: z.string().optional(),
});

// Schema untuk Store Request
export const storeRequestSchema = z.object({
  divisi: z.string().min(1, "Divisi wajib diisi"),
  requestedBy: z.string().min(1, "Nama pemohon wajib diisi"),
  keterangan: z.string().optional(),
  items: z.array(storeRequestItemSchema).min(1, "Minimal 1 item"),
});

export const updateStoreRequestSchema = z.object({
  divisi: z.string().optional(),
  requestedBy: z.string().optional(),
  keterangan: z.string().optional(),
  items: z.array(storeRequestItemSchema).optional(),
});

export const approveStoreRequestSchema = z.object({
  approvedBy: z.string().min(1, "Nama approver wajib diisi"),
});

export const completeStoreRequestSchema = z.object({
  action: z.enum(["complete", "need_pr"]),
});

export type StoreRequestInput = z.infer<typeof storeRequestSchema>;
export type UpdateStoreRequestInput = z.infer<typeof updateStoreRequestSchema>;
export type ApproveStoreRequestInput = z.infer<typeof approveStoreRequestSchema>;
export type CompleteStoreRequestInput = z.infer<typeof completeStoreRequestSchema>;
