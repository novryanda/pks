import { z } from "zod";

// Schema untuk Penerimaan Barang Item
export const penerimaanBarangItemSchema = z.object({
  materialId: z.string().min(1, "Material wajib dipilih"),
  purchaseOrderItemId: z.string().optional(),
  jumlahDiterima: z.number().min(0.01, "Jumlah harus lebih dari 0"),
  hargaSatuan: z.number().min(0, "Harga satuan harus lebih dari 0"),
  lokasiPenyimpanan: z.string().optional(),
  keterangan: z.string().optional(),
});

// Schema untuk Penerimaan Barang
export const penerimaanBarangSchema = z.object({
  purchaseOrderId: z.string().optional(),
  purchaseRequestId: z.string().optional(), // Untuk PR pembelian langsung
  vendorId: z.string().min(1, "Vendor wajib dipilih"),
  vendorName: z.string().min(1, "Nama vendor wajib diisi"),
  nomorSuratJalan: z.string().optional(),
  tanggalSuratJalan: z.string().optional(),
  nomorInvoice: z.string().optional(),
  tanggalInvoice: z.string().optional(),
  receivedBy: z.string().min(1, "Received by wajib diisi"),
  checkedBy: z.string().optional(),
  keterangan: z.string().optional(),
  items: z.array(penerimaanBarangItemSchema).min(1, "Minimal 1 item"),
});

export const updatePenerimaanBarangSchema = z.object({
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  nomorSuratJalan: z.string().optional(),
  tanggalSuratJalan: z.string().optional(),
  nomorInvoice: z.string().optional(),
  tanggalInvoice: z.string().optional(),
  receivedBy: z.string().optional(),
  checkedBy: z.string().optional(),
  keterangan: z.string().optional(),
  items: z.array(penerimaanBarangItemSchema).optional(),
});

export const completePenerimaanBarangSchema = z.object({
  checkedBy: z.string().min(1, "Checker wajib diisi"),
});

export type PenerimaanBarangInput = z.infer<typeof penerimaanBarangSchema>;
export type UpdatePenerimaanBarangInput = z.infer<typeof updatePenerimaanBarangSchema>;
export type CompletePenerimaanBarangInput = z.infer<typeof completePenerimaanBarangSchema>;
