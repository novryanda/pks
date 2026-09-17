import React from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { TiketTimbanganPDF, type TiketTimbanganData } from "./tiket-timbangan-pdf";

export async function generateTiketTimbanganPDF(
  data: TiketTimbanganData,
): Promise<Buffer> {
  const pdfElement = (
    <Document>
      <TiketTimbanganPDF data={data} />
    </Document>
  );
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}
