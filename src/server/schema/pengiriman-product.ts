import { z } from "zod";

// Enum untuk status pengiriman (sesuai alur baru)
export const statusPengirimanEnum = z.enum(["DRAFT", "TIMBANG_TARRA", "TIMBANG_GROSS", "COMPLETED", "CANCELLED"]);

const selectedVendorBongkarBankSchema = z.object({
  bankName: z.string().min(1, "Nama bank harus diisi"),
  accountNumber: z.string().min(1, "Nomor rekening harus diisi"),
  accountName: z.string().min(1, "Nama pemilik rekening harus diisi"),
});

// ALUR BARU: Vendor → Tarra → Gross → Pilih Kontrak → Mutu Kernel

// Schema untuk Step 1 - Informasi Umum & Vendor
export const pengirimanStep1Schema = z.object({
  tanggalPengiriman: z.date(),
  operatorPenimbang: z.string().min(1, "Operator harus diisi"),
  vendorVehicleId: z.string().min(1, "Kendaraan vendor harus dipilih"),
});

// Schema untuk Step 2 - Timbangan Tarra (truck kosong)
export const pengirimanStep2Schema = z.object({
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratTarra: z.number().min(0, "Berat tarra harus lebih dari 0"),
  waktuTimbangTarra: z.date(),
});

// Schema untuk Step 3 - Timbangan Gross (truck dengan muatan)
export const pengirimanStep3Schema = z.object({
  metodeGross: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratGross: z.number().min(0, "Berat gross harus lebih dari 0"),
  waktuTimbangGross: z.date(),
});

// Schema untuk Step 4 - Pilih Kontrak
export const pengirimanStep4Schema = z.object({
  buyerId: z.string().min(1, "Buyer harus dipilih"),
  contractId: z.string().min(1, "Kontrak harus dipilih"),
  contractItemId: z.string().min(1, "Item kontrak harus dipilih"),
});

// Schema untuk Step 5 - Mutu Kernel
export const pengirimanStep5Schema = z.object({
  ffa: z.number().min(0, "FFA harus >= 0").max(100, "FFA maksimal 100%"),
  air: z.number().min(0, "Kadar air harus >= 0").max(100, "Kadar air maksimal 100%"),
  kotoran: z.number().min(0, "Kadar kotoran harus >= 0").max(100, "Kadar kotoran maksimal 100%"),
});

// Schema lengkap untuk create (jika semua step dilakukan sekaligus)
export const createPengirimanProductSchema = z.object({
  // Step 1
  tanggalPengiriman: z.date(),
  operatorPenimbang: z.string().min(1, "Operator harus diisi"),
  vendorVehicleId: z.string().min(1, "Kendaraan vendor harus dipilih"),

  // Step 2
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratTarra: z.number().min(0, "Berat tarra harus lebih dari 0"),
  waktuTimbangTarra: z.date(),

  // Step 3
  metodeGross: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratGross: z.number().min(0, "Berat gross harus lebih dari 0"),
  waktuTimbangGross: z.date(),

  // Step 4
  buyerId: z.string().min(1, "Buyer harus dipilih"),
  contractId: z.string().min(1, "Kontrak harus dipilih"),
  contractItemId: z.string().min(1, "Item kontrak harus dipilih"),

  // Step 5
  ffa: z.number().min(0).max(100),
  air: z.number().min(0).max(100),
  kotoran: z.number().min(0).max(100),

  status: z.enum(["DRAFT", "TIMBANG_TARRA", "TIMBANG_GROSS", "COMPLETED", "CANCELLED"]).optional(),
}).refine((data) => data.beratGross > data.beratTarra, {
  message: "Berat gross harus lebih besar dari berat tarra",
  path: ["beratGross"],
});

// Schema untuk create pengiriman tahap 1 & 2 (vendor + tarra)
export const createPengirimanTarraSchema = z.object({
  tanggalPengiriman: z.date(),
  operatorPenimbang: z.string().min(1, "Operator harus diisi"),
  vendorVehicleId: z.string().min(1, "Kendaraan vendor harus dipilih"),
  materialId: z.string().min(1, "Produk harus dipilih"),
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratTarra: z.number().min(0, "Berat tarra harus lebih dari 0"),
  waktuTimbangTarra: z.date(),
});

// Schema untuk update tahap 3 (timbang gross saja)
export const updatePengirimanGrossSchema = z.object({
  metodeGross: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratGross: z.number().min(0, "Berat gross harus lebih dari 0"),
  waktuTimbangGross: z.date(),
});

// Schema untuk update tahap 4 & 5 (pilih kontrak + mutu kernel)
export const updatePengirimanKontrakMutuSchema = z.object({
  // Step 4
  buyerId: z.string().min(1, "Buyer harus dipilih"),
  contractId: z.string().min(1, "Kontrak harus dipilih"),
  contractItemId: z.string().min(1, "Item kontrak harus dipilih"),

  // Step 5 (Mutu)
  mutuCustomFields: z.array(z.object({
    fieldName: z.string(),
    fieldValue: z.string(),
  })).optional().nullable(),
});

// Schema untuk custom field mutu
const mutuCustomFieldSchema = z.object({
  fieldName: z.string().min(1, "Nama field harus diisi"),
  fieldValue: z.string().min(1, "Nilai field harus diisi"),
});

// Schema untuk update mutu kernel saja (alur baru dengan custom fields)
export const updatePengirimanMutuSchema = z.object({
  mutuCustomFields: z.array(mutuCustomFieldSchema).min(1, "Minimal 1 field mutu"),
});

// Schema untuk update kontrak saja (alur baru terpisah)
export const updatePengirimanKontrakSchema = z.object({
  buyerId: z.string().min(1, "Buyer harus dipilih"),
  contractId: z.string().min(1, "Kontrak harus dipilih"),
  contractItemId: z.string().min(1, "Item kontrak harus dipilih"),
  // Split Contract support
  isSplit: z.boolean().optional(),
  splitContractId: z.string().optional(),
  splitContractItemId: z.string().optional(),
});

export const updatePengirimanProductSchema = z.object({
  tanggalPengiriman: z.date().optional(),
  operatorPenimbang: z.string().optional(),
  buyerId: z.string().optional(),
  contractId: z.string().optional(),
  contractItemId: z.string().optional(),
  vendorVehicleId: z.string().optional(),
  vendorBongkarId: z.string().optional().nullable(),
  upahBongkar: z.number().optional(),
  totalUpahBongkar: z.number().optional(),
  selectedVendorBongkarBank: selectedVendorBongkarBankSchema.optional().nullable(),
  hargaVendorTransportir: z.number().min(0).optional(),
  totalHargaVendorTransportir: z.number().min(0).optional(),
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]).optional(),
  beratTarra: z.number().optional(),
  waktuTimbangTarra: z.date().optional(),
  metodeGross: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]).optional(),
  beratGross: z.number().optional(),
  waktuTimbangGross: z.date().optional(),
  mutuCustomFields: z.array(z.object({
    fieldName: z.string(),
    fieldValue: z.string(),
  })).optional().nullable(),
  status: z.enum(["DRAFT", "TIMBANG_TARRA", "TIMBANG_GROSS", "COMPLETED", "CANCELLED"]).optional(),
});

export type PengirimanStep1Input = z.infer<typeof pengirimanStep1Schema>;
export type PengirimanStep2Input = z.infer<typeof pengirimanStep2Schema>;
export type PengirimanStep3Input = z.infer<typeof pengirimanStep3Schema>;
export type PengirimanStep4Input = z.infer<typeof pengirimanStep4Schema>;
export type PengirimanStep5Input = z.infer<typeof pengirimanStep5Schema>;
export type CreatePengirimanProductInput = z.infer<typeof createPengirimanProductSchema>;
export type CreatePengirimanTarraInput = z.infer<typeof createPengirimanTarraSchema>;
export type UpdatePengirimanGrossInput = z.infer<typeof updatePengirimanGrossSchema>;
export type UpdatePengirimanMutuInput = z.infer<typeof updatePengirimanMutuSchema>;
export type UpdatePengirimanKontrakInput = z.infer<typeof updatePengirimanKontrakSchema>;
export type UpdatePengirimanKontrakMutuInput = z.infer<typeof updatePengirimanKontrakMutuSchema>;
export type UpdatePengirimanProductInput = z.infer<typeof updatePengirimanProductSchema>;
