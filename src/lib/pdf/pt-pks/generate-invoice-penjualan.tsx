import React from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { InvoicePenjualanPDF, type InvoicePenjualanPDFData } from "./invoice-penjualan-pdf";

export async function generateInvoicePenjualanPDF(
  data: InvoicePenjualanPDFData
): Promise<Buffer> {
  const pdfElement = (
    <Document>
      <InvoicePenjualanPDF data={data} />
    </Document>
  );
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}

// Re-export types
export type { InvoicePenjualanPDFData, InvoicePenjualanItem, PembayaranItem } from "./invoice-penjualan-pdf";
