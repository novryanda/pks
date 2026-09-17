import { z } from "zod";

// Enum untuk status invoice
export const statusInvoiceSchema = z.enum([
  "DRAFT",
  "ISSUED",
  "PARTIAL_PAID",
  "PAID",
  "CANCELLED",
]);

// Schema untuk item invoice
export const invoiceItemSchema = z.object({
  pengirimanProductId: z.string().min(1, "Pengiriman harus dipilih"),
  nomorPengiriman: z.string(),
  tanggalPengiriman: z.coerce.date(),
  beratNetto: z.number().min(0, "Berat netto harus >= 0"),
  ffa: z.number().nullable().optional(),
  air: z.number().nullable().optional(),
  kotoran: z.number().nullable().optional(),
  hargaSatuan: z.number().min(0, "Harga satuan harus >= 0"),
  subtotal: z.number().min(0),
  klaimMutuPersen: z.number().min(0).max(100).default(0),
  klaimMutuNilai: z.number().min(0).default(0),
  klaimSusutPersen: z.number().min(0).max(100).default(0),
  klaimSusutNilai: z.number().min(0).default(0),
  totalPotongan: z.number().min(0).default(0),
  totalBersih: z.number().default(0),
  keterangan: z.string().nullable().optional(),
});

// Schema untuk create invoice
export const createInvoiceSchema = z.object({
  nomorInvoice: z.string().optional(),
  tanggalInvoice: z.coerce.date(),
  tanggalJatuhTempo: z.coerce.date().nullable().optional(),
  contractId: z.string().min(1, "Kontrak harus dipilih"),
  buyerId: z.string().min(1, "Buyer harus dipilih"),

  // Nilai dasar (auto-calculated)
  totalBerat: z.number().min(0).default(0),
  hargaPerKg: z.number().min(0).default(0),
  subtotalBruto: z.number().min(0).default(0),

  // Klaim mutu
  klaimMutuPersen: z.number().min(0).max(100).default(0),
  klaimMutuNilai: z.number().min(0).default(0),
  klaimMutuKeterangan: z.string().nullable().optional(),

  // Klaim susut
  klaimSusutPersen: z.number().min(0).max(100).default(0),
  klaimSusutNilai: z.number().min(0).default(0),
  klaimSusutKeterangan: z.string().nullable().optional(),

  // Total potongan
  totalPotongan: z.number().min(0).default(0),
  subtotalNetto: z.number().min(0).default(0),

  // Pajak
  ppnPersen: z.number().min(0).max(100).default(0),
  ppnNilai: z.number().min(0).default(0),
  pphPersen: z.number().min(0).max(100).default(0),
  pphNilai: z.number().min(0).default(0),

  // Total akhir
  totalNilai: z.number().min(0).default(0),

  // Catatan
  catatan: z.string().nullable().optional(),

  // PPN Disclaimer
  showPpnDisclaimer: z.boolean().default(false),

  // Penandatangan
  namaPenandatangan: z.string().nullable().optional(),
  jabatanPenandatangan: z.string().nullable().optional(),

  // Items (pengiriman yang diinvoice) - opsional untuk invoice tanpa pengiriman
  items: z.array(invoiceItemSchema).default([]),
});

// Schema untuk update invoice
export const updateInvoiceSchema = z.object({
  nomorInvoice: z.string().optional(),
  tanggalInvoice: z.coerce.date().optional(),
  tanggalJatuhTempo: z.coerce.date().nullable().optional(),

  // Nilai dasar
  totalBerat: z.number().min(0).optional(),
  hargaPerKg: z.number().min(0).optional(),
  subtotalBruto: z.number().min(0).optional(),

  // Klaim mutu
  klaimMutuPersen: z.number().min(0).max(100).optional(),
  klaimMutuNilai: z.number().min(0).optional(),
  klaimMutuKeterangan: z.string().nullable().optional(),

  // Klaim susut
  klaimSusutPersen: z.number().min(0).max(100).optional(),
  klaimSusutNilai: z.number().min(0).optional(),
  klaimSusutKeterangan: z.string().nullable().optional(),

  // Total potongan
  totalPotongan: z.number().min(0).optional(),
  subtotalNetto: z.number().min(0).optional(),

  // Pajak
  ppnPersen: z.number().min(0).max(100).optional(),
  ppnNilai: z.number().min(0).optional(),
  pphPersen: z.number().min(0).max(100).optional(),
  pphNilai: z.number().min(0).optional(),

  // Total akhir
  totalNilai: z.number().min(0).optional(),

  // Catatan
  catatan: z.string().nullable().optional(),

  // PPN Disclaimer
  showPpnDisclaimer: z.boolean().optional(),

  // Penandatangan
  namaPenandatangan: z.string().nullable().optional(),
  jabatanPenandatangan: z.string().nullable().optional(),

  // Status
  status: statusInvoiceSchema.optional(),
});

// Schema untuk issue invoice (terbitkan)
export const issueInvoiceSchema = z.object({
  id: z.string().min(1, "ID Invoice harus diisi"),
});

// Schema untuk pembayaran invoice
export const pembayaranInvoiceSchema = z.object({
  invoiceId: z.string().min(1, "Invoice harus dipilih"),
  tanggalBayar: z.coerce.date(),
  jumlahBayar: z.number().min(0.01, "Jumlah bayar harus > 0"),
  metodePembayaran: z.string().nullable().optional(),
  nomorReferensi: z.string().nullable().optional(),
  keterangan: z.string().nullable().optional(),
});

// Schema untuk query invoice
export const invoiceQuerySchema = z.object({
  search: z.string().optional(),
  contractId: z.string().optional(),
  buyerId: z.string().optional(),
  status: statusInvoiceSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Schema untuk ID
export const invoiceIdSchema = z.object({
  id: z.string().min(1, "ID Invoice tidak valid"),
});

// Type exports
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;
export type PembayaranInvoiceInput = z.infer<typeof pembayaranInvoiceSchema>;
export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;
export type InvoiceIdInput = z.infer<typeof invoiceIdSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
