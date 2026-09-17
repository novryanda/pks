"use client";

import { InvoicePageContent } from "@/components/dashboard/pt-pks/invoice/invoice-page-content";

export default function InvoicePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoice Penjualan</h1>
        <p className="text-muted-foreground">
          Cetak dan kelola invoice berdasarkan kontrak buyer
        </p>
      </div>

      <InvoicePageContent />
    </div>
  );
}
