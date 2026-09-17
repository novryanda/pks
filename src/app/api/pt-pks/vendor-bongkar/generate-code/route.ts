import { NextResponse } from "next/server";
import { vendorBongkarService } from "@/server/services/pt-pks/vendor-bongkar.service";
import { requireAuthWithPermission } from "@/lib/api-auth";

// GET /api/pt-pks/vendor-bongkar/generate-code - Generate vendor bongkar code
export async function GET() {
    const { error, session } = await requireAuthWithPermission("masterData.vendorBongkar", "create");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const code = await vendorBongkarService.generateVendorBongkarCode(companyId);
        return NextResponse.json({ code });
    } catch (err: unknown) {
        console.error("Error generating vendor bongkar code:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to generate code";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
