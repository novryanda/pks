import { NextResponse } from "next/server";
import { vendorBongkarService } from "@/server/services/pt-pks/vendor-bongkar.service";
import { requireAuthWithPermission } from "@/lib/api-auth";

// GET /api/pt-pks/vendor-bongkar/by-tipe?tipe=SPSI|SPLO - Get vendor bongkars by tipe
export async function GET(request: Request) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorBongkar", "view");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const tipe = searchParams.get("tipe") as "SPSI" | "SPLO" | null;

        if (!tipe || !["SPSI", "SPLO"].includes(tipe)) {
            return NextResponse.json(
                { error: "Tipe harus 'SPSI' atau 'SPLO'" },
                { status: 400 }
            );
        }

        const vendors = await vendorBongkarService.getActiveVendorBongkarsByTipe(companyId, tipe);
        return NextResponse.json(vendors);
    } catch (err: unknown) {
        console.error("Error fetching vendor bongkars by tipe:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch vendor bongkars";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
