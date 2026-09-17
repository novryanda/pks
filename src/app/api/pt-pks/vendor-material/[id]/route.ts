import { requireAuthWithPermission } from "@/lib/api-auth";
import { vendorMaterialService } from "@/server/services/pt-pks/vendor-material.service";
import { NextResponse } from "next/server";

interface Params {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/pt-pks/vendor-material/[id] - Get vendor material by id
export async function GET(request: Request, { params }: Params) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorMaterial", "view");
    if (error) return error;

    try {
        const { id } = await params;

        // Get companyId from session
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json(
                { error: "Company ID not found" },
                { status: 400 }
            );
        }

        const vendor = await vendorMaterialService.getVendorMaterialById(id, companyId);

        return NextResponse.json({ vendor });
    } catch (error: any) {
        console.error("Error fetching vendor material:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch vendor material" },
            { status: 404 }
        );
    }
}

// PUT /api/pt-pks/vendor-material/[id] - Update vendor material
export async function PUT(request: Request, { params }: Params) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorMaterial", "edit");
    if (error) return error;

    try {
        const { id } = await params;
        const body = await request.json();

        // Get companyId from session
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json(
                { error: "Company ID not found" },
                { status: 400 }
            );
        }

        const vendor = await vendorMaterialService.updateVendorMaterial(id, companyId, body);

        return NextResponse.json({ vendor });
    } catch (error: any) {
        console.error("Error updating vendor material:", error);

        // Handle validation errors
        if (error.errors) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to update vendor material" },
            { status: 400 }
        );
    }
}

// DELETE /api/pt-pks/vendor-material/[id] - Delete vendor material
export async function DELETE(request: Request, { params }: Params) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorMaterial", "delete");
    if (error) return error;

    try {
        const { id } = await params;

        // Get companyId from session
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json(
                { error: "Company ID not found" },
                { status: 400 }
            );
        }

        await vendorMaterialService.deleteVendorMaterial(id, companyId);

        return NextResponse.json(
            { message: "Vendor Material deleted successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error deleting vendor material:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete vendor material" },
            { status: 400 }
        );
    }
}
