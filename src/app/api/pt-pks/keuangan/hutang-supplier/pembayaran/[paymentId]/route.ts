import { NextResponse } from "next/server";

import { requireAuthWithPermission } from "@/lib/api-auth";
import { keuanganDashboardService } from "@/server/services/pt-pks/keuangan-dashboard.service";

type RouteContext = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { error, session } = await requireAuthWithPermission("keuangan.hutangSupplier", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { paymentId } = await context.params;
    await keuanganDashboardService.cancelSupplierPayment(companyId, paymentId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error cancelling hutang supplier payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel payment" },
      { status: 400 },
    );
  }
}
