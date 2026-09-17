import { z } from "zod";

// Enums
export const SupplierTypeEnum = z.enum([
  "RAMP_PERON",
  "KUD",
  "KELOMPOK_TANI",
]);

export const CertificationTypeEnum = z.enum(["ISPO", "RSPO"]);

export const TaxStatusEnum = z.enum(["NON_PKP", "PKP_11", "PKP_1_1"]);

export const SalesChannelEnum = z.enum(["LANGSUNG_PKS", "AGEN"]);

export const TransportationTypeEnum = z.enum([
  "MILIK_SENDIRI",
  "JASA_PIHAK_KE_3",
]);

// Garden Profile Schema
export const GardenProfileSchema = z.object({
  tahunTanam: z.number().int().min(1900).max(new Date().getFullYear()),
  luasKebun: z.number().positive(),
  estimasiSupplyTBS: z.number().positive(),
});

// Bank Account Schema
export const BankAccountSchema = z.object({
  bankName: z.string().min(1, "Nama bank harus diisi"),
  accountNumber: z.string().min(1, "Nomor rekening harus diisi"),
  accountName: z.string().min(1, "Nama pemilik rekening harus diisi"),
  isDefault: z.boolean().optional().default(false),
});

// Create Supplier Schema
export const CreateSupplierSchema = z.object({
  companyId: z.string().cuid(),
  type: SupplierTypeEnum,

  // Identitas
  ownerName: z.string().min(1, "Nama pemilik harus diisi"),
  address: z.string().min(1, "Alamat harus diisi"),
  companyPhone: z.string().optional(),
  personalPhone: z.string().min(1, "Nomor HP/Telp pribadi harus diisi"),
  companyName: z.string().optional(),
  rampPeronAddress: z.string().optional(),

  // Profil Kebun
  gardenProfiles: z
    .array(GardenProfileSchema)
    .min(1, "Minimal harus ada 1 profil kebun"),

  // Lokasi
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),

  // Tipe Pengelolaan Kebun
  swadaya: z.boolean().default(false),
  kelompok: z.boolean().default(false),
  perusahaan: z.boolean().default(false),
  jenisBibit: z.string().optional(),
  certificationISPO: z.boolean().default(false),
  certificationRSPO: z.boolean().default(false),

  // Profil Izin Usaha
  aktePendirian: z.string().optional(),
  aktePerubahan: z.string().optional(),
  nib: z.string().optional(),
  siup: z.string().optional(),
  npwp: z.string().optional(),

  // Penjualan TBS
  salesChannel: SalesChannelEnum.optional(),
  salesChannelDetails: z.string().optional(),

  // Transportasi
  transportation: TransportationTypeEnum.optional(),
  transportationUnits: z.number().int().positive().optional(),

  // Informasi Rekening (Array of bank accounts)
  bankAccounts: z.array(BankAccountSchema).optional().nullable(),

  // Status Pajak
  taxStatus: TaxStatusEnum.optional(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial().extend({
  id: z.string().cuid(),
});

// Response types
export const SupplierSchema = CreateSupplierSchema.extend({
  id: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types
export type SupplierType = z.infer<typeof SupplierTypeEnum>;
export type CertificationType = z.infer<typeof CertificationTypeEnum>;
export type TaxStatus = z.infer<typeof TaxStatusEnum>;
export type SalesChannel = z.infer<typeof SalesChannelEnum>;
export type TransportationType = z.infer<typeof TransportationTypeEnum>;
export type GardenProfile = z.infer<typeof GardenProfileSchema>;
export type BankAccount = z.infer<typeof BankAccountSchema>;
export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
export type Supplier = z.infer<typeof SupplierSchema>;
