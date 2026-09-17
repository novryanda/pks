import React from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { SlipGajiPDF, type SlipGajiPDFData } from "./slip-gaji-pdf";

export async function generateSlipGajiPDF(
  data: SlipGajiPDFData
): Promise<Buffer> {
  const pdfElement = (
    <Document>
      <SlipGajiPDF data={data} />
    </Document>
  );
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}

// Re-export types
export type { SlipGajiPDFData };
