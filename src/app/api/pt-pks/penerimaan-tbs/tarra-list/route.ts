import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanTBSRepository } from "@/server/repositories/penerimaan-tbs.repository";

export async function GET(request: Request) {
    const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "view");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        // Parse query parameters for date filter
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const filters: { startDate?: Date; endDate?: Date } = {};
        if (startDate) {
            filters.startDate = new Date(startDate);
        }
        if (endDate) {
            filters.endDate = new Date(endDate);
        }

        const data = await penerimaanTBSRepository.getTarraList(companyId, filters);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching tarra list:", error);
        return NextResponse.json(
            { error: "Failed to fetch tarra list data" },
            { status: 500 }
        );
    }
}
