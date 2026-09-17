import { z } from "zod";
import { TaxStatus } from "@prisma/client";

// Enum schemas
export const statusVendorSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const taxStatusSchema = z.nativeEnum(TaxStatus);

// Vendor schemas (tanpa kendaraan dan supir)
export const createVendorSchema = z.object({
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
  status: statusVendorSchema.default("ACTIVE"),
});

export const updateVendorSchema = z.object({
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
  status: statusVendorSchema.optional(),
});

export const vendorIdSchema = z.object({
  id: z.string().cuid("ID vendor tidak valid"),
});

export const vendorQuerySchema = z.object({
  search: z.string().optional(),
  status: statusVendorSchema.optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// VendorVehicle schemas
export const createVendorVehicleSchema = z.object({
  nomorKendaraan: z.string().min(1, "Nomor kendaraan wajib diisi"),
  namaSupir: z.string().min(1, "Nama supir wajib diisi"),
  noHpSupir: z.string().optional().nullable(),
  noSim: z.string().optional().nullable(),
  status: statusVendorSchema,
});

export const updateVendorVehicleSchema = z.object({
  nomorKendaraan: z.string().min(1, "Nomor kendaraan wajib diisi").optional(),
  namaSupir: z.string().min(1, "Nama supir wajib diisi").optional(),
  noHpSupir: z.string().optional().nullable(),
  noSim: z.string().optional().nullable(),
  status: statusVendorSchema.optional(),
});

export const vendorVehicleIdSchema = z.object({
  id: z.string().cuid("ID kendaraan tidak valid"),
});

// Type exports
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type VendorIdInput = z.infer<typeof vendorIdSchema>;
export type VendorQueryInput = z.infer<typeof vendorQuerySchema>;

export type CreateVendorVehicleInput = z.infer<typeof createVendorVehicleSchema>;
export type UpdateVendorVehicleInput = z.infer<typeof updateVendorVehicleSchema>;
export type VendorVehicleIdInput = z.infer<typeof vendorVehicleIdSchema>;
