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

        const history = await stockProductRepository.getHistory(companyId, {
            materialId: materialId || undefined,
            startDate: parseJakartaDateBoundary(startDate) ?? undefined,
            endDate: parseJakartaDateBoundary(endDate ?? startDate, { endOfDay: true }) ?? undefined,
        });

        return NextResponse.json(history);
    } catch (error) {
        console.error("Error fetching stock product history:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
