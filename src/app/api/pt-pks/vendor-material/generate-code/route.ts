import { requireAuthWithPermission } from "@/lib/api-auth";
import { vendorMaterialService } from "@/server/services/pt-pks/vendor-material.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/vendor-material/generate-code - Generate vendor material code
export async function GET(request: Request) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorMaterial", "create");
    if (error) return error;

    try {
        // Get companyId from session
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json(
                { error: "Company ID not found" },
                { status: 400 }
            );
        }

        const code = await vendorMaterialService.generateVendorMaterialCode(companyId);

        return NextResponse.json({ code });
    } catch (error: any) {
        console.error("Error generating vendor material code:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate vendor material code" },
            { status: 500 }
        );
    }
}
