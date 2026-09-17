import { requireAuthWithPermission } from "@/lib/api-auth";
import { purchaseRequestService } from "@/server/services/pt-pks/purchase-request.service";
import { approvePurchaseRequestSchema } from "@/server/schema/purchase-request";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Hanya user dengan permission approve yang bisa approve PR
  const { error, session } = await requireAuthWithPermission("gudang.purchaseRequest", "approve");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = approvePurchaseRequestSchema.parse(body);

    const pr = await purchaseRequestService.approve(params.id, companyId, validatedData.approvedBy);
    return NextResponse.json(pr);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
