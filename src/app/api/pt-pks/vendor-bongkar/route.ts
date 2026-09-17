import { NextResponse } from "next/server";
import { vendorBongkarService } from "@/server/services/pt-pks/vendor-bongkar.service";
import { vendorBongkarQuerySchema } from "@/server/schema/vendor-bongkar";
import { requireAuthWithPermission } from "@/lib/api-auth";

// GET /api/pt-pks/vendor-bongkar - Get all vendor bongkars
export async function GET(request: Request) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorBongkar", "view");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);

        const query = vendorBongkarQuerySchema.parse({
            search: searchParams.get("search") || undefined,
            status: searchParams.get("status") || undefined,
            tipe: searchParams.get("tipe") || undefined,
            page: searchParams.get("page") || 1,
            limit: searchParams.get("limit") || 10,
        });

        const result = await vendorBongkarService.getVendorBongkars(companyId, query);
        return NextResponse.json(result);
    } catch (err: unknown) {
        console.error("Error fetching vendor bongkars:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch vendor bongkars";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// POST /api/pt-pks/vendor-bongkar - Create new vendor bongkar
export async function POST(request: Request) {
    const { error, session } = await requireAuthWithPermission("masterData.vendorBongkar", "create");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const body = await request.json();
        const vendor = await vendorBongkarService.createVendorBongkar(companyId, body);
        return NextResponse.json(vendor, { status: 201 });
    } catch (err: unknown) {
        console.error("Error creating vendor bongkar:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to create vendor bongkar";
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
}
