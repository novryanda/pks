import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { storeRequestService } from "@/server/services/pt-pks/store-request.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuthWithPermission("gudang.storeRequest", "view");

    if (authResult.error || !authResult.session) {
      return authResult.error;
    }

    const companyId = authResult.session.user.company?.code;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID tidak ditemukan" }, { status: 400 });
    }
    const stockAvailability = await storeRequestService.checkStock(params.id, companyId);

    return NextResponse.json(stockAvailability);
  } catch (error) {
    console.error("Error checking stock:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to check stock" },
      { status: 500 }
    );
  }
}
