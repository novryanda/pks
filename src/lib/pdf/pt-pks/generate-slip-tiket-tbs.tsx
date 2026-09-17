import React from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { SlipTiketTBSPDF, type SlipTiketTBSData } from "./slip-tiket-tbs-pdf";

export async function generateSlipTiketTBS(
    data: SlipTiketTBSData
): Promise<Buffer> {
    const pdfElement = (
        <Document>
            <SlipTiketTBSPDF data={data} />
        </Document>
    );
    const buffer = await renderToBuffer(pdfElement);
    return buffer;
}

// Re-export types
export type { SlipTiketTBSData };
