import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { storeRequestService } from "@/server/services/pt-pks/store-request.service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Hanya user dengan permission approve yang bisa reject SR
    const authResult = await requireAuthWithPermission("gudang.storeRequest", "approve");

    if (authResult.error || !authResult.session) {
      return authResult.error;
    }

    const companyId = authResult.session.user.company?.code;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID tidak ditemukan" }, { status: 400 });
    }
    const storeRequest = await storeRequestService.reject(params.id, companyId);

    return NextResponse.json(storeRequest);
  } catch (error) {
    console.error("Error rejecting store request:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to reject store request" },
      { status: 500 }
    );
  }
}
