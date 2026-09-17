import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { supplierService } from "@/server/services/pt-pks/supplier.service";
import { SupplierStatementPDF } from "@/lib/pdf/pt-pks/supplier-statement-pdf";
import React from "react";

export const dynamic = "force-dynamic";

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
};

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

    // Get all bank accounts
    const bankAccounts = (supplier.bankAccounts as BankAccount[] | null) ?? [];

    // Generate PDF
    const pdfDocument = React.createElement(SupplierStatementPDF, {
      supplier: {
        ownerName: supplier.ownerName,
        address: supplier.address,
        npwp: supplier.npwp,
        bankAccounts,
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
        "Content-Disposition": `inline; filename="Surat-Pernyataan-${supplier.ownerName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating supplier statement PDF:", error);
    return NextResponse.json(
      { error: "Gagal generate PDF surat pernyataan" },
      { status: 500 }
    );
  }
}
