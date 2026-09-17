import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { stockProductRepository } from "@/server/repositories/stock-product.repository";
import { StockProductDocument } from "@/lib/pdf/pt-pks/stock-product-pdf";
import React from "react";

export async function GET(request: NextRequest) {
    const { error, session } = await requireAuthWithPermission("gudang.stockProduct", "view");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate") || new Date().toISOString().split("T")[0]!;
        const endDate = searchParams.get("endDate") || startDate;

        // Get stock summary data
        const summary = await stockProductRepository.getSummary(companyId, {
            startDate,
            endDate
        });

        // Map data for PDF
        const pdfData = summary.materials.map((m) => ({
            materialId: m.materialId,
            materialName: m.materialName,
            satuan: m.satuan,
            netBalance: m.netBalance,
            netPeriod: (m as any).netPeriod || 0,
            hargaPerUnit: m.hargaPerUnit,
            nilaiTotal: m.nilaiTotal,
        }));

        // Generate PDF
        const pdfBuffer = await renderToBuffer(
            StockProductDocument({
                data: pdfData,
                startDate,
                endDate,
                companyName: session.user.company?.name || "PT TARO RAKAYA TASYRA",
                companyAddress: session.user.company && typeof session.user.company === 'object' && 'address' in session.user.company ? (session.user.company as any).address : "JL LINTAS LANGGAM KM. 3 DESA LUBUK OGONG",
                createdByName: session.user.name || undefined,
                stats: {
                    production: { period: summary.stats.production.period || 0 },
                    shipping: { period: summary.stats.shipping.period || 0 },
                    net: { period: summary.stats.net.period || 0 },
                }
            })
        );

        const fileName = `Laporan_Stock_Product_${startDate}_to_${endDate}.pdf`;

        // NextResponse harus menerima Uint8Array untuk buffer
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error("Error generating stock product PDF:", error);
        return NextResponse.json(
            { error: "Gagal generate PDF stock product" },
            { status: 500 }
        );
    }
}
