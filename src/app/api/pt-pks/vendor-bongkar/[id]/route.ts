import { NextResponse } from "next/server";
import { vendorBongkarService } from "@/server/services/pt-pks/vendor-bongkar.service";
import { requireAuthWithPermission } from "@/lib/api-auth";

type RouteContext = {
    params: Promise<{ id: string }>;
};

// GET /api/pt-pks/vendor-bongkar/[id] - Get vendor bongkar by id
export async function GET(request: Request, context: RouteContext) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorBongkar", "view");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const { id } = await context.params;
        const vendor = await vendorBongkarService.getVendorBongkarById(id, companyId);
        return NextResponse.json(vendor);
    } catch (err: unknown) {
        console.error("Error fetching vendor bongkar:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch vendor bongkar";
        return NextResponse.json({ error: errorMessage }, { status: 404 });
    }
}

// PUT /api/pt-pks/vendor-bongkar/[id] - Update vendor bongkar
export async function PUT(request: Request, context: RouteContext) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorBongkar", "edit");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const { id } = await context.params;
        const body = await request.json();
        const vendor = await vendorBongkarService.updateVendorBongkar(id, companyId, body);
        return NextResponse.json(vendor);
    } catch (err: unknown) {
        console.error("Error updating vendor bongkar:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to update vendor bongkar";
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
}

// DELETE /api/pt-pks/vendor-bongkar/[id] - Delete vendor bongkar
export async function DELETE(request: Request, context: RouteContext) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorBongkar", "delete");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const { id } = await context.params;
        await vendorBongkarService.deleteVendorBongkar(id, companyId);
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error("Error deleting vendor bongkar:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to delete vendor bongkar";
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
}
