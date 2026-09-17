import { requireAuthWithPermission } from "@/lib/api-auth";
import { purchaseRequestService } from "@/server/services/pt-pks/purchase-request.service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Hanya user dengan permission approve yang bisa reject PR
  const { error, session } = await requireAuthWithPermission("gudang.purchaseRequest", "approve");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const pr = await purchaseRequestService.reject(params.id, companyId);
    return NextResponse.json(pr);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
