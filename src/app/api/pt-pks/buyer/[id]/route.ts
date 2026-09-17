import { requireAuthWithPermission } from "@/lib/api-auth";
import { buyerService } from "@/server/services/pt-pks/buyer.service";
import { NextResponse } from "next/server";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/pt-pks/buyer/[id] - Get buyer by id
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("masterData.buyer", "view");
  if (error) return error;

  try {
    const { id } = params;

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const buyer = await buyerService.getBuyerById(id, companyId);

    return NextResponse.json({ buyer });
  } catch (error: any) {
    console.error("Error fetching buyer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch buyer" },
      { status: 404 }
    );
  }
}

// PUT /api/pt-pks/buyer/[id] - Update buyer
export async function PUT(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("masterData.buyer", "edit");
  if (error) return error;

  try {
    const { id } = params;
    const body = await request.json();

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const buyer = await buyerService.updateBuyer(id, companyId, body);

    return NextResponse.json({ buyer });
  } catch (error: any) {
    console.error("Error updating buyer:", error);

    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update buyer" },
      { status: 400 }
    );
  }
}

// DELETE /api/pt-pks/buyer/[id] - Delete buyer
export async function DELETE(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("masterData.buyer", "delete");
  if (error) return error;

  try {
    const { id } = params;

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    await buyerService.deleteBuyer(id, companyId);

    return NextResponse.json(
      { message: "Buyer berhasil dihapus" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting buyer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete buyer" },
      { status: 400 }
    );
  }
}
