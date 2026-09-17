import { requireAuthWithPermission } from "@/lib/api-auth";
import { vendorService } from "@/server/services/pt-pks/vendor.service";
import { vendorQuerySchema } from "@/server/schema/vendor";
import { NextResponse } from "next/server";

// GET /api/pt-pks/vendor - Get all vendors
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.vendor", "view");
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
      const vendors = await vendorService.getActiveVendors(companyId);
      return NextResponse.json({ vendors });
    }

    // Check if requesting for statistics
    const stats = searchParams.get("stats");
    if (stats === "true") {
      const statistics = await vendorService.getVendorStatistics(companyId);
      return NextResponse.json({ statistics });
    }

    // Parse query parameters
    const query = vendorQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
    });

    const result = await vendorService.getVendors(companyId, query);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching vendors:", error);
    
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

// POST /api/pt-pks/vendor - Create new vendor
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.vendor", "create");
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

    // Create vendor
    const vendor = await vendorService.createVendor(companyId, body);

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vendor:", error);

    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create vendor" },
      { status: 400 }
    );
  }
}
