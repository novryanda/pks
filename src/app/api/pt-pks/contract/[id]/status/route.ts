import { requireAuthWithPermission } from "@/lib/api-auth";
import { contractService } from "@/server/services/pt-pks/contract.service";
import { NextResponse } from "next/server";
import type { StatusContract } from "@prisma/client";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// PATCH /api/pt-pks/contract/[id]/status - Update contract status
export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("pemasaran.contract", "edit");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const contract = await contractService.updateContractStatus(
      id,
      companyId,
      status as StatusContract
    );

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error("Error updating contract status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update contract status" },
      { status: 400 }
    );
  }
}
