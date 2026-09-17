import { requireAuthWithPermission } from "@/lib/api-auth";
import { contractService } from "@/server/services/pt-pks/contract.service";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/pt-pks/contract/[id] - Get contract by id
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("pemasaran.contract", "view");
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

    const contract = await contractService.getContractById(id, companyId);

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch contract" },
      { status: 404 }
    );
  }
}

// PUT /api/pt-pks/contract/[id] - Update contract
export async function PUT(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("pemasaran.contract", "edit");
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

    const contract = await contractService.updateContract(id, companyId, body);

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error("Error updating contract:", error);

    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update contract" },
      { status: 400 }
    );
  }
}

// DELETE /api/pt-pks/contract/[id] - Delete contract
export async function DELETE(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("pemasaran.contract", "delete");
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

    await contractService.deleteContract(id, companyId);

    return NextResponse.json(
      { message: "Kontrak berhasil dihapus" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete contract" },
      { status: 400 }
    );
  }
}
