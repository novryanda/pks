import { z } from "zod";

// Enum schemas
export const statusContractSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const paymentMethodSchema = z.enum([
  "LUNAS_AWAL",
  "SEBAGIAN",
  "SETELAH_PENGIRIMAN",
]);

export const paymentStatusSchema = z.enum([
  "UNPAID",
  "PARTIAL",
  "PAID",
]);

// Types & Labels
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  LUNAS_AWAL: "Lunas di Awal",
  SEBAGIAN: "Pembayaran Sebagian",
  SETELAH_PENGIRIMAN: "Setelah Pengiriman Produk",
};

export const paymentStatusLabels: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  UNPAID: { label: "Belum Dibayar", variant: "destructive" },
  PARTIAL: { label: "Dibayar Sebagian", variant: "secondary" },
  PAID: { label: "Lunas", variant: "default" },
};

// Contract Item schema
export const contractItemSchema = z.object({
  materialId: z.string().cuid("ID material tidak valid"),
  quantity: z.number().min(0.01, "Kuantitas harus lebih dari 0"),
  unitPrice: z.number().min(0, "Harga satuan tidak boleh negatif"),
  notes: z.string().optional().nullable(),
});

export const updateContractItemSchema = contractItemSchema.extend({
  contractItemId: z.string().cuid("ID item kontrak tidak valid").optional(),
});

// Helper untuk handle empty string pada date
const optionalDateSchema = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.coerce.date().optional().nullable()
);

// Helper untuk handle empty string pada string opsional
const optionalStringSchema = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.string().optional().nullable()
);

// Contract schemas
export const createContractSchema = z.object({
  buyerId: z.string().cuid("ID buyer tidak valid"),
  contractNumber: optionalStringSchema, // Nomor kontrak manual (opsional, jika tidak diisi akan auto-generate)
  contractDate: z.coerce.date(),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  deliveryDate: optionalDateSchema,
  deliveryAddress: z.string().min(1, "Alamat pengiriman wajib diisi"),
  notes: z.string().optional().nullable(),
  status: statusContractSchema.default("DRAFT"),
  paymentMethod: paymentMethodSchema.default("SETELAH_PENGIRIMAN"),
  paidAmount: z.number().min(0).optional().default(0),
  items: z
    .array(contractItemSchema)
    .min(1, "Minimal 1 item produk harus dipilih"),
  customFields: z.array(z.object({
    fieldName: z.string(),
    fieldValue: z.string(),
  })).optional().nullable(),
  attachments: z.array(z.any()).optional().nullable(),
}).refine((data) => {
  // Only validate if both dates are provided
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "Tanggal berakhir harus setelah atau sama dengan tanggal mulai",
  path: ["endDate"],
});

export const updateContractSchema = z
  .object({
    buyerId: z.string().cuid("ID buyer tidak valid").optional(),
    contractNumber: optionalStringSchema,
    contractDate: z.coerce.date().optional(),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
    deliveryDate: optionalDateSchema,
    deliveryAddress: z
      .string()
      .min(1, "Alamat pengiriman wajib diisi")
      .optional(),
    notes: z.string().optional().nullable(),
    status: statusContractSchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
    paidAmount: z.number().min(0).optional(),
    items: z
      .array(updateContractItemSchema)
      .min(1, "Minimal 1 item produk harus dipilih")
      .optional(),
    customFields: z.array(z.object({
      fieldName: z.string(),
      fieldValue: z.string(),
    })).optional().nullable(),
    attachments: z.array(z.any()).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "Tanggal berakhir harus setelah atau sama dengan tanggal mulai",
      path: ["endDate"],
    }
  );

export const contractIdSchema = z.object({
  id: z.string().cuid("ID kontrak tidak valid"),
});

export const contractQuerySchema = z.object({
  search: z.string().optional(),
  buyerId: z.string().cuid().optional(),
  materialId: z.string().cuid().optional(),
  status: statusContractSchema.optional(),
  statuses: z.string().optional(), // Daftar status dipisah koma, mis. "ACTIVE,COMPLETED"
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  excludeInvoiced: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(10),
});

// Type exports
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractIdInput = z.infer<typeof contractIdSchema>;
export type ContractQueryInput = z.infer<typeof contractQuerySchema>;
export type ContractItemInput = z.infer<typeof contractItemSchema>;
