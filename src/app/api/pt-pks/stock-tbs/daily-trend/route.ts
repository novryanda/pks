import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { penerimaanTBSRepository } from "@/server/repositories/penerimaan-tbs.repository";

export async function GET(req: NextRequest) {
    const { error, session } = await requireAuthWithPermission(
        "gudang.stockTbs",
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

        const trend = await penerimaanTBSRepository.getTBSDailyTrend(
            companyId,
            materialId,
            parseJakartaDateBoundary(startDate) ?? new Date(startDate),
            parseJakartaDateBoundary(endDate, { endOfDay: true }) ?? new Date(endDate)
        );

        return NextResponse.json(trend);
    } catch (error) {
        console.error("Error fetching TBS daily trend:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
