import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { StockTBSDocument } from "@/lib/pdf/pt-pks/stock-tbs-pdf";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import React from "react";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId");
    const startDateStr =
      searchParams.get("startDate") || searchParams.get("date");
    const endDateStr = searchParams.get("endDate") || startDateStr;

    if (!materialId || !startDateStr) {
      return NextResponse.json(
        { error: "materialId and startDate/date are required" },
        { status: 400 },
      );
    }

    const startDate =
      parseJakartaDateBoundary(startDateStr) ?? new Date(startDateStr);
    const endDate =
      parseJakartaDateBoundary(endDateStr!, { endOfDay: true }) ??
      new Date(endDateStr!);

    // Fetch material info
    const material = await db.material.findUnique({
      where: { id: materialId },
      select: { name: true },
    });

    // Fetch company info
    const companyId = session.user.company.id;
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    // Get statistics (same logic as dashboard)
    const statistics = await penerimaanTBSService.getTBSStatistics(
      companyId,
      materialId,
      { startDate, endDate },
    );

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <StockTBSDocument
        data={statistics as any}
        materialName={material?.name || "TBS"}
        startDate={startDateStr!}
        endDate={endDateStr!}
        companyName={company?.name}
        createdByName={session.user.name || undefined}
      />,
    );

    // Return PDF response
    const filename =
      startDateStr === endDateStr
        ? `Laporan_Stock_TBS_${startDateStr}.pdf`
        : `Laporan_Stock_TBS_${startDateStr}_sd_${endDateStr}.pdf`;
    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating Stock TBS PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
