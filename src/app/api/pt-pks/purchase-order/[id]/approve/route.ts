import { requireAuthWithPermission } from "@/lib/api-auth";
import { purchaseOrderService } from "@/server/services/pt-pks/purchase-order.service";
import { approvePurchaseOrderSchema } from "@/server/schema/purchase-order";
import { NextResponse } from "next/server";

// POST /api/pt-pks/purchase-order/[id]/approve
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Hanya user dengan permission approve yang bisa approve PO
  const { error, session } = await requireAuthWithPermission("gudang.purchaseOrder", "approve");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = approvePurchaseOrderSchema.parse(body);

    const po = await purchaseOrderService.approve(id, companyId, validatedData.approvedBy);
    return NextResponse.json(po);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
