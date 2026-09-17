import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { supplierService } from "@/server/services/pt-pks/supplier.service";
import { SupplierFormPDF } from "@/lib/pdf/pt-pks/supplier-form-pdf";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get supplier data
    const supplier = await supplierService.getSupplierForPDF(id);

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier tidak ditemukan" },
        { status: 404 }
      );
    }

    // Parse gardenProfiles if it's a string
    let gardenProfiles = [];
    if (typeof supplier.gardenProfiles === "string") {
      try {
        gardenProfiles = JSON.parse(supplier.gardenProfiles);
      } catch (e) {
        gardenProfiles = [];
      }
    } else if (Array.isArray(supplier.gardenProfiles)) {
      gardenProfiles = supplier.gardenProfiles;
    }

    // Generate PDF
    const pdfDocument = React.createElement(SupplierFormPDF, {
      supplier: {
        ...supplier,
        gardenProfiles,
      },
    });
    const stream = await renderToStream(pdfDocument as any);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Form-Supplier-${supplier.ownerName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating supplier form PDF:", error);
    return NextResponse.json(
      { error: "Gagal generate PDF form supplier" },
      { status: 500 }
    );
  }
}
