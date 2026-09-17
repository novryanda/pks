import { requireAuthWithPermission } from "@/lib/api-auth";
import { contractService } from "@/server/services/pt-pks/contract.service";
import { contractQuerySchema } from "@/server/schema/contract";
import { NextResponse } from "next/server";

// GET /api/pt-pks/contract - Get all contracts
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.contract", "view");
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

    // Parse query parameters
    const query = contractQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      buyerId: searchParams.get("buyerId") || undefined,
      materialId: searchParams.get("materialId") || undefined,
      status: searchParams.get("status") || undefined,
      statuses: searchParams.get("statuses") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      excludeInvoiced: searchParams.get("excludeInvoiced") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
    });

    const result = await contractService.getContracts(companyId, query);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching contracts:", error);
    
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

// POST /api/pt-pks/contract - Create new contract
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.contract", "create");
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

    // Create contract
    const contract = await contractService.createContract(companyId, body);

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating contract:", error);

    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create contract" },
      { status: 400 }
    );
  }
}
