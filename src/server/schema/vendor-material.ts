import { z } from "zod";
import { TaxStatus } from "@prisma/client";

// Enum schemas
export const statusVendorMaterialSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const taxStatusSchema = z.nativeEnum(TaxStatus);

// VendorMaterial schemas
export const createVendorMaterialSchema = z.object({
    code: z.string().min(1, "Kode vendor wajib diisi"),
    name: z.string().min(1, "Nama vendor wajib diisi"),
    contactPerson: z.string().min(1, "Contact person wajib diisi"),
    email: z.string().email("Format email tidak valid").optional().nullable(),
    phone: z.string().min(1, "Nomor telepon wajib diisi"),
    address: z.string().min(1, "Alamat wajib diisi"),
    // Informasi Pajak
    npwp: z.string().optional().nullable(),
    taxStatus: taxStatusSchema,
    // Informasi Rekening
    bankName: z.string().optional().nullable(),
    accountNumber: z.string().optional().nullable(),
    accountName: z.string().optional().nullable(),
    // Kategori
    kategori: z.string().optional().nullable(),
    status: statusVendorMaterialSchema.default("ACTIVE"),
});

export const updateVendorMaterialSchema = z.object({
    code: z.string().min(1, "Kode vendor wajib diisi").optional(),
    name: z.string().min(1, "Nama vendor wajib diisi").optional(),
    contactPerson: z.string().min(1, "Contact person wajib diisi").optional(),
    email: z.string().email("Format email tidak valid").optional().nullable(),
    phone: z.string().min(1, "Nomor telepon wajib diisi").optional(),
    address: z.string().min(1, "Alamat wajib diisi").optional(),
    // Informasi Pajak
    npwp: z.string().optional().nullable(),
    taxStatus: taxStatusSchema.optional(),
    // Informasi Rekening
    bankName: z.string().optional().nullable(),
    accountNumber: z.string().optional().nullable(),
    accountName: z.string().optional().nullable(),
    // Kategori
    kategori: z.string().optional().nullable(),
    status: statusVendorMaterialSchema.optional(),
});

export const vendorMaterialIdSchema = z.object({
    id: z.string().cuid("ID vendor tidak valid"),
});

export const vendorMaterialQuerySchema = z.object({
    search: z.string().optional(),
    status: statusVendorMaterialSchema.optional(),
    kategori: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
});

// Type exports
export type CreateVendorMaterialInput = z.infer<typeof createVendorMaterialSchema>;
export type UpdateVendorMaterialInput = z.infer<typeof updateVendorMaterialSchema>;
export type VendorMaterialIdInput = z.infer<typeof vendorMaterialIdSchema>;
export type VendorMaterialQueryInput = z.infer<typeof vendorMaterialQuerySchema>;
