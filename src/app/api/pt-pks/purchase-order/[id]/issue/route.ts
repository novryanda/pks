import { requireAuthWithPermission } from "@/lib/api-auth";
import { purchaseOrderService } from "@/server/services/pt-pks/purchase-order.service";
import { NextResponse } from "next/server";

// POST /api/pt-pks/purchase-order/[id]/issue
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Hanya user dengan permission approve yang bisa issue PO
  const { error, session } = await requireAuthWithPermission("gudang.purchaseOrder", "approve");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    const po = await purchaseOrderService.issue(id, companyId);
    return NextResponse.json(po);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
