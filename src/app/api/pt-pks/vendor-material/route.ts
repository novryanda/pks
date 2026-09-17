import { requireAuthWithPermission } from "@/lib/api-auth";
import { vendorMaterialService } from "@/server/services/pt-pks/vendor-material.service";
import { vendorMaterialQuerySchema } from "@/server/schema/vendor-material";
import { NextResponse } from "next/server";

// GET /api/pt-pks/vendor-material - Get all vendor materials
export async function GET(request: Request) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorMaterial", "view");
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);

        // Get companyId from session
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json(
                { error: "Company ID not found" },
                { status: 400 }
            );
        }

        // Check if requesting for dropdown
        const dropdown = searchParams.get("dropdown");
        if (dropdown === "true") {
            const vendors = await vendorMaterialService.getActiveVendorMaterials(companyId);
            return NextResponse.json({ vendors });
        }

        // Check if requesting for statistics
        const stats = searchParams.get("stats");
        if (stats === "true") {
            const statistics = await vendorMaterialService.getVendorMaterialStatistics(companyId);
            return NextResponse.json({ statistics });
        }

        // Check if requesting for categories
        const categories = searchParams.get("categories");
        if (categories === "true") {
            const categoryList = await vendorMaterialService.getCategories(companyId);
            return NextResponse.json({ categories: categoryList });
        }

        // Parse query parameters
        const query = vendorMaterialQuerySchema.parse({
            search: searchParams.get("search") || undefined,
            status: searchParams.get("status") || undefined,
            kategori: searchParams.get("kategori") || undefined,
            page: searchParams.get("page") || 1,
            limit: searchParams.get("limit") || 10,
        });

        const result = await vendorMaterialService.getVendorMaterials(companyId, query);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error fetching vendor materials:", error);

        if (error.errors) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to fetch vendor materials" },
            { status: 500 }
        );
    }
}

// POST /api/pt-pks/vendor-material - Create new vendor material
export async function POST(request: Request) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorMaterial", "create");
    if (error) return error;

    try {
        const body = await request.json();

        // Get companyId from session
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json(
                { error: "Company ID not found" },
                { status: 400 }
            );
        }

        // Create vendor material
        const vendor = await vendorMaterialService.createVendorMaterial(companyId, body);

        return NextResponse.json({ vendor }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating vendor material:", error);

        // Handle validation errors
        if (error.errors) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to create vendor material" },
            { status: 400 }
        );
    }
}
