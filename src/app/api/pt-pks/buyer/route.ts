import { requireAuthWithPermission } from "@/lib/api-auth";
import { buyerService } from "@/server/services/pt-pks/buyer.service";
import { buyerQuerySchema } from "@/server/schema/buyer";
import { NextResponse } from "next/server";

// GET /api/pt-pks/buyer - Get all buyers
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.buyer", "view");
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
      const buyers = await buyerService.getActiveBuyers(companyId);
      return NextResponse.json({ buyers });
    }

    // Parse query parameters
    const query = buyerQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
    });

    const result = await buyerService.getBuyers(companyId, query);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching buyers:", error);
    
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch buyers" },
      { status: 500 }
    );
  }
}

// POST /api/pt-pks/buyer - Create new buyer
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.buyer", "create");
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

    // Create buyer
    const buyer = await buyerService.createBuyer(companyId, body);

    return NextResponse.json({ buyer }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating buyer:", error);

    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create buyer" },
      { status: 400 }
    );
  }
}
