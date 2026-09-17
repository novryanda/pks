import { requireAuthWithPermission } from "@/lib/api-auth";
import { purchaseOrderService } from "@/server/services/pt-pks/purchase-order.service";
import { NextResponse } from "next/server";

// GET pending PRs that are ready to be converted to PO
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.purchaseOrder", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const prs = await purchaseOrderService.getPendingPRsForPO(companyId);
    return NextResponse.json(prs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
