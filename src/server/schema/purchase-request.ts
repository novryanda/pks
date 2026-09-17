import { z } from "zod";

// Schema untuk Purchase Request Item
export const purchaseRequestItemSchema = z.object({
  materialId: z.string().min(1, "Material wajib dipilih"),
  jumlahRequest: z.number().min(0.01, "Jumlah harus lebih dari 0"),
  estimasiHarga: z.number().min(0).optional(),
  keterangan: z.string().optional(),
});

// Schema untuk Purchase Request
export const purchaseRequestSchema = z.object({
  tipePembelian: z.enum(["PEMBELIAN_LANGSUNG", "PENGAJUAN_PO"], {
    required_error: "Tipe pembelian wajib dipilih",
  }),
  storeRequestId: z.string().optional(),
  divisi: z.string().optional(),
  requestedBy: z.string().min(1, "Nama pemohon wajib diisi"),
  
  // Field khusus untuk pembelian langsung
  vendorNameDirect: z.string().optional(),
  vendorAddressDirect: z.string().optional(),
  vendorPhoneDirect: z.string().optional(),
  
  keterangan: z.string().optional(),
  items: z.array(purchaseRequestItemSchema).min(1, "Minimal 1 item"),
}).refine(
  (data) => {
    // Jika pembelian langsung, vendor name wajib diisi
    if (data.tipePembelian === "PEMBELIAN_LANGSUNG") {
      return !!data.vendorNameDirect;
    }
    return true;
  },
  {
    message: "Nama vendor wajib diisi untuk pembelian langsung",
    path: ["vendorNameDirect"],
  }
);

export const updatePurchaseRequestSchema = z.object({
  tipePembelian: z.enum(["PEMBELIAN_LANGSUNG", "PENGAJUAN_PO"]).optional(),
  divisi: z.string().optional(),
  requestedBy: z.string().optional(),
  vendorNameDirect: z.string().optional(),
  vendorAddressDirect: z.string().optional(),
  vendorPhoneDirect: z.string().optional(),
  keterangan: z.string().optional(),
  items: z.array(purchaseRequestItemSchema).optional(),
});

export const approvePurchaseRequestSchema = z.object({
  approvedBy: z.string().min(1, "Nama approver wajib diisi"),
});

export type PurchaseRequestInput = z.infer<typeof purchaseRequestSchema>;
export type UpdatePurchaseRequestInput = z.infer<typeof updatePurchaseRequestSchema>;
export type ApprovePurchaseRequestInput = z.infer<typeof approvePurchaseRequestSchema>;

