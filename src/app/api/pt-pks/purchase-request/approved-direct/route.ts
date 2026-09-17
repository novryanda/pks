import { requireAuthWithPermission } from "@/lib/api-auth";
import { purchaseRequestService } from "@/server/services/pt-pks/purchase-request.service";
import { NextResponse } from "next/server";

// GET approved PRs for direct purchase (type PEMBELIAN_LANGSUNG)
export async function GET(request: Request) {
  // User dengan permission view penerimaanBarang dapat melihat approved direct PRs
  const { error, session } = await requireAuthWithPermission("gudang.penerimaanBarang", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const prs = await purchaseRequestService.getApprovedDirectPurchase(companyId);
    return NextResponse.json(prs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
