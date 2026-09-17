import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { stockProductRepository } from "@/server/repositories/stock-product.repository";

export async function GET(req: NextRequest) {
    const { error, session } = await requireAuthWithPermission(
        "produksi.prosesProduksi",
        "view"
    );
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company not found" }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const materialId = searchParams.get("materialId");

        if (!startDate || !endDate || !materialId) {
            return NextResponse.json(
                { error: "startDate, endDate, and materialId are required" },
                { status: 400 }
            );
        }

        const trend = await stockProductRepository.getDailyTrend(
            companyId,
            materialId,
            parseJakartaDateBoundary(startDate)!,
            parseJakartaDateBoundary(endDate, { endOfDay: true })!
        );

        return NextResponse.json(trend);
    } catch (error) {
        console.error("Error fetching stock product daily trend:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
