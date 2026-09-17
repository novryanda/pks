import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { requireAuthWithPermission } from "@/lib/api-auth";
import { RiwayatPengirimanDocument } from "@/lib/pdf/pt-pks/riwayat-pengiriman-pdf";
import { getRiwayatPengirimanReport } from "@/server/services/pt-pks/riwayat-pengiriman-report.service";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission(
    "pemasaran.riwayatPengiriman",
    "view",
  );
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const report = await getRiwayatPengirimanReport(companyId, {
      date: searchParams.get("date"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      materialId: searchParams.get("materialId"),
      buyerId: searchParams.get("buyerId"),
      contractId: searchParams.get("contractId"),
    });

    if (report.summary.length === 0 && report.deliveries.length === 0) {
      return NextResponse.json(
        { error: "No data found to export" },
        { status: 404 },
      );
    }

    const pdfBuffer = await renderToBuffer(
      <RiwayatPengirimanDocument
        company={report.company}
        filters={report.filters}
        summary={report.summary}
        deliveries={report.deliveries}
        deliverySummary={report.deliverySummary}
        createdByName={session.user.name || undefined}
      />,
    );

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Riwayat-Pengiriman-${report.filters.exportFileLabel}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating riwayat pengiriman PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
