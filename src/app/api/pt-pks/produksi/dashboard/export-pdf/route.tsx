import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { ProductionDashboardDocument } from "@/lib/pdf/pt-pks/production-dashboard-pdf";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";
import { stockProductRepository } from "@/server/repositories/stock-product.repository";
import { prosesProduksiService } from "@/server/services/pt-pks/proses-produksi.service";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";
import React from "react";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.company?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const singleDateStr = searchParams.get("date");
        const startDateStr = searchParams.get("startDate") ?? singleDateStr;
        const endDateStr = searchParams.get("endDate") ?? startDateStr;

        if (!startDateStr) {
            return NextResponse.json({ error: "Date atau startDate is required" }, { status: 400 });
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr!);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
        }

        const companyId = session.user.company.id;

        // 1. Fetch TBS Statistics
        const tbsMaterial = await db.material.findFirst({
            where: {
                companyId,
                OR: [
                    { name: { contains: "TBS", mode: "insensitive" } },
                    { code: { contains: "TBS", mode: "insensitive" } }
                ]
            }
        });

        let stockTbs = {
            tbsHariIni: 0,
            tbsBulanIni: 0,
            tbsPeriode: 0,
            tbsMasukTahunIni: 0,
            stockTBS: 0,
        };

        if (tbsMaterial) {
            // Updated to handle range if provided (internal service handles mode)
            const stats = await penerimaanTBSService.getTBSStatistics(companyId, tbsMaterial.id, {
                startDate,
                endDate
            });
            stockTbs = stats as any;
        }

        const materialId = searchParams.get("materialId");

        // 2. Fetch Stock Product Summary (Direct call)
        const stockProduct = await stockProductRepository.getSummary(companyId, {
            materialId: materialId && materialId !== "all" ? materialId : undefined,
            startDate: new Date(startDateStr),
            endDate: new Date(endDateStr!),
        });

        // Filter out TBS from Stock Product in PDF
        if (stockProduct.materials) {
            stockProduct.materials = stockProduct.materials.filter((m: any) =>
                !m.materialName.toLowerCase().includes("tbs")
            );
        }

        // 3. Fetch Production Summary
        const materialOutputId = materialId && materialId !== "all" ? materialId : "all";
        const production = await prosesProduksiService.getProductionSummaryReport(
            companyId,
            new Date(startDateStr),
            new Date(endDateStr!),
            materialOutputId
        );

        // 4. Fetch Delivery Summary
        const delivery = await pengirimanProductService.getConsolidatedSummary(
            companyId,
            {
                startDate: new Date(startDateStr),
                endDate: new Date(endDateStr!),
                materialId: materialId && materialId !== "all" ? materialId : undefined,
            }
        );

        // Fetch company info
        const company = await db.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });

        // Generate PDF
        const pdfBuffer = await renderToBuffer(
            <ProductionDashboardDocument
                data={{ stockTbs, stockProduct, production, delivery }}
                startDate={startDateStr}
                endDate={endDateStr}
                companyName={company?.name}
                createdByName={session.user.name || undefined}
            />
        );

        const filename = `Laporan_Dashboard_Produksi_${startDateStr}_to_${endDateStr}.pdf`;
        return new NextResponse(pdfBuffer as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Error generating Production Dashboard PDF:", error);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}
