import { z } from "zod";
import { TaxStatus } from "@prisma/client";

// Enum schemas
export const statusBuyerSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const taxStatusSchema = z.nativeEnum(TaxStatus);

// Buyer schemas
export const createBuyerSchema = z.object({
  code: z.string().min(1, "Kode buyer wajib diisi"),
  name: z.string().min(1, "Nama buyer wajib diisi"),
  contactPerson: z.string().min(1, "Contact person wajib diisi"),
  email: z.string().email("Format email tidak valid").optional().nullable(),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi"),
  npwp: z.string().optional().nullable(),
  taxStatus: taxStatusSchema,
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  accountName: z.string().optional().nullable(),
  status: statusBuyerSchema.default("ACTIVE"),
});

export const updateBuyerSchema = z.object({
  code: z.string().min(1, "Kode buyer wajib diisi").optional(),
  name: z.string().min(1, "Nama buyer wajib diisi").optional(),
  contactPerson: z.string().min(1, "Contact person wajib diisi").optional(),
  email: z.string().email("Format email tidak valid").optional().nullable(),
  phone: z.string().min(1, "Nomor telepon wajib diisi").optional(),
  address: z.string().min(1, "Alamat wajib diisi").optional(),
  npwp: z.string().optional().nullable(),
  taxStatus: taxStatusSchema.optional(),
  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  accountName: z.string().optional().nullable(),
  status: statusBuyerSchema.optional(),
});

export const buyerIdSchema = z.object({
  id: z.string().cuid("ID buyer tidak valid"),
});

export const buyerQuerySchema = z.object({
  search: z.string().optional(),
  status: statusBuyerSchema.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Type exports
export type CreateBuyerInput = z.infer<typeof createBuyerSchema>;
export type UpdateBuyerInput = z.infer<typeof updateBuyerSchema>;
export type BuyerIdInput = z.infer<typeof buyerIdSchema>;
export type BuyerQueryInput = z.infer<typeof buyerQuerySchema>;
