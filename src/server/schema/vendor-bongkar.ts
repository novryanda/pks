import { z } from "zod";

// Enum schemas
export const statusVendorBongkarSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const tipeVendorBongkarSchema = z.enum(["SPSI", "SPLO"]);

// Bank Account schema (untuk array)
export const bankAccountSchema = z.object({
    bankName: z.string().min(1, "Nama bank wajib diisi"),
    accountNumber: z.string().min(1, "Nomor rekening wajib diisi"),
    accountName: z.string().min(1, "Nama pemilik rekening wajib diisi"),
    isDefault: z.boolean().optional(),
});

// VendorBongkar schemas
export const createVendorBongkarSchema = z.object({
    code: z.string().min(1, "Kode vendor wajib diisi"),
    name: z.string().min(1, "Nama vendor wajib diisi"),
    contactPerson: z.string().min(1, "Contact person wajib diisi"),
    email: z.string().email("Format email tidak valid").optional().nullable(),
    phone: z.string().min(1, "Nomor telepon wajib diisi"),
    address: z.string().min(1, "Alamat wajib diisi"),
    // Tipe vendor (bukan kategori)
    tipe: tipeVendorBongkarSchema,
    // Informasi Rekening (array)
    bankAccounts: z.array(bankAccountSchema).optional().nullable(),
    status: statusVendorBongkarSchema.default("ACTIVE"),
});

export const updateVendorBongkarSchema = z.object({
    code: z.string().min(1, "Kode vendor wajib diisi").optional(),
    name: z.string().min(1, "Nama vendor wajib diisi").optional(),
    contactPerson: z.string().min(1, "Contact person wajib diisi").optional(),
    email: z.string().email("Format email tidak valid").optional().nullable(),
    phone: z.string().min(1, "Nomor telepon wajib diisi").optional(),
    address: z.string().min(1, "Alamat wajib diisi").optional(),
    // Tipe vendor
    tipe: tipeVendorBongkarSchema.optional(),
    // Informasi Rekening
    bankAccounts: z.array(bankAccountSchema).optional().nullable(),
    status: statusVendorBongkarSchema.optional(),
});

export const vendorBongkarIdSchema = z.object({
    id: z.string().cuid("ID vendor tidak valid"),
});

export const vendorBongkarQuerySchema = z.object({
    search: z.string().optional(),
    status: statusVendorBongkarSchema.optional(),
    tipe: tipeVendorBongkarSchema.optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});

// Type exports
export type BankAccount = z.infer<typeof bankAccountSchema>;
export type CreateVendorBongkarInput = z.infer<typeof createVendorBongkarSchema>;
export type UpdateVendorBongkarInput = z.infer<typeof updateVendorBongkarSchema>;
export type VendorBongkarIdInput = z.infer<typeof vendorBongkarIdSchema>;
export type VendorBongkarQueryInput = z.infer<typeof vendorBongkarQuerySchema>;
