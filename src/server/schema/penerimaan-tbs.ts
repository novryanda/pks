import { z } from "zod";

// Status untuk proses penerimaan TBS
export const statusPenerimaanEnum = z.enum([
  "DRAFT",
  "TIMBANG_BRUTO",   // Sudah input data & timbang bruto
  "TIMBANG_TARRA",   // Sudah timbang tarra, menunggu input harga
  "PENDING_HARGA",   // Menunggu input harga (untuk flow terpisah)
  "COMPLETED",
  "CANCELLED",
]);

// Schema untuk Step 1 - Informasi Pengirim
export const penerimaanStep1Schema = z.object({
  tanggalTerima: z.date(),
  materialId: z.string().min(1, "Produk harus dipilih"),
  operatorPenimbang: z.string().min(1, "Operator harus diisi"),
  supplierId: z.string().min(1, "Supplier harus dipilih"),
  lokasiKebun: z.string().optional(),
  jenisBuah: z.enum(["TBS-BB", "TBS-BS", "TBS-BK"]).optional(),
  // Untuk kendaraan & supir
  transporterType: z.enum(["existing", "new"]),
  transporterId: z.string().optional(), // jika pilih existing
  // jika pilih new
  nomorKendaraan: z.string().optional(),
  namaSupir: z.string().optional(),
});

// Schema untuk Step 2 - Timbangan Bruto
export const penerimaanStep2Schema = z.object({
  metodeBruto: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratBruto: z.number().min(0, "Berat bruto harus lebih dari 0"),
  waktuTimbangBruto: z.date(),
});

// Schema untuk Step 3 - Timbangan Tarra
export const penerimaanStep3Schema = z.object({
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratTarra: z.number().min(0, "Berat tarra harus lebih dari 0"),
  waktuTimbangTarra: z.date(),
  potonganPersen: z.number().min(0).max(100, "Potongan maksimal 100%"),
});

// Schema untuk Step 4 - Harga (Input terpisah)
export const penerimaanStep4Schema = z.object({
  hargaPerKg: z.number().min(0, "Harga per kg harus lebih dari 0"),
  ppnPersen: z.number().min(0).max(100, "PPN maksimal 100%").default(0),
  pphPersen: z.number().min(0).max(100, "PPH maksimal 100%").default(0),
  upahBongkar: z.number().min(0, "Upah bongkar harus lebih dari 0").default(16),
});

// Schema untuk Bank Account yang dipilih saat pembayaran
export const selectedBankAccountSchema = z.object({
  bankName: z.string().min(1, "Nama bank harus diisi"),
  accountNumber: z.string().min(1, "Nomor rekening harus diisi"),
  accountName: z.string().min(1, "Nama pemilik rekening harus diisi"),
});

// Schema untuk Input Harga (halaman terpisah)
export const inputHargaTBSSchema = z.object({
  id: z.string().min(1, "ID penerimaan harus ada"),
  hargaPerKg: z.number().min(0, "Harga per kg harus lebih dari 0"),
  ppnPersen: z.number().min(0).max(100, "PPN maksimal 100%").default(0),
  pphPersen: z.number().min(0).max(100, "PPH maksimal 100%").default(0),
  upahBongkar: z.number().min(0, "Upah bongkar harus lebih dari 0").default(16),
  selectedBankAccount: selectedBankAccountSchema.optional().nullable(),
});

// Schema untuk simpan timbangan saja (Step 1-3)
export const createPenerimaanTimbangSchema = z.object({
  // Step 1
  tanggalTerima: z.date(),
  materialId: z.string().min(1, "Produk harus dipilih"),
  operatorPenimbang: z.string().min(1, "Operator harus diisi"),
  supplierId: z.string().min(1, "Supplier harus dipilih"),
  lokasiKebun: z.string().optional(),
  jenisBuah: z.enum(["TBS-BB", "TBS-BS", "TBS-BK"]).optional(),
  transporterId: z.string().optional(),

  // Step 2 - Bruto (optional untuk simpan draft)
  metodeBruto: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]).optional(),
  beratBruto: z.number().min(0).optional(),
  waktuTimbangBruto: z.date().optional(),

  // Step 3 - Tarra (optional untuk simpan setelah bruto)
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]).optional(),
  beratTarra: z.number().min(0).optional(),
  waktuTimbangTarra: z.date().optional(),
  potonganPersen: z.number().min(0).max(100).optional(),
});

// Schema lengkap untuk create (backward compatibility)
export const createPenerimaanTBSSchema = z.object({
  // Step 1
  tanggalTerima: z.date(),
  materialId: z.string().min(1, "Produk harus dipilih"),
  operatorPenimbang: z.string().min(1, "Operator harus diisi"),
  supplierId: z.string().min(1, "Supplier harus dipilih"),
  lokasiKebun: z.string().optional(),
  jenisBuah: z.enum(["TBS-BB", "TBS-BS", "TBS-BK"]).optional(),
  transporterId: z.string().optional(), // Optional karena bisa dibuat baru (transporterType = "new")

  // Step 2
  metodeBruto: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratBruto: z.number().min(0, "Berat bruto harus lebih dari 0"),
  waktuTimbangBruto: z.date(),

  // Step 3
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratTarra: z.number().min(0, "Berat tarra harus lebih dari 0"),
  waktuTimbangTarra: z.date(),
  potonganPersen: z.number().min(0).max(100),

  // Step 4 - Optional karena bisa input terpisah
  hargaPerKg: z.number().min(0).optional(),
  ppnPersen: z.number().min(0).max(100).optional().default(0),
  pphPersen: z.number().min(0).max(100).optional().default(0),
  upahBongkar: z.number().min(0).optional().default(16),

  // Vendor Bongkar
  vendorBongkarId: z.string().optional().nullable(),
  selectedVendorBongkarBank: selectedBankAccountSchema.optional().nullable(),
  selectedBankAccount: selectedBankAccountSchema.optional().nullable(),

  status: statusPenerimaanEnum.optional(),
});

export const updatePenerimaanTBSSchema = createPenerimaanTBSSchema.partial();

export type PenerimaanStep1Input = z.infer<typeof penerimaanStep1Schema>;
export type PenerimaanStep2Input = z.infer<typeof penerimaanStep2Schema>;
export type PenerimaanStep3Input = z.infer<typeof penerimaanStep3Schema>;
export type PenerimaanStep4Input = z.infer<typeof penerimaanStep4Schema>;
export type InputHargaTBSInput = z.infer<typeof inputHargaTBSSchema>;
export type CreatePenerimaanTimbangInput = z.infer<typeof createPenerimaanTimbangSchema>;
export type CreatePenerimaanTBSInput = z.infer<typeof createPenerimaanTBSSchema>;
export type UpdatePenerimaanTBSInput = z.infer<typeof updatePenerimaanTBSSchema>;
