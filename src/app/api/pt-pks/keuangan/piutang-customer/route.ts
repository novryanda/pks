import { NextResponse } from "next/server";

import { requireAuthWithPermission } from "@/lib/api-auth";
import { keuanganDashboardService } from "@/server/services/pt-pks/keuangan-dashboard.service";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("keuangan.piutangCustomer", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    const result = await keuanganDashboardService.getCustomerReceivables(companyId, {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as "UNPAID" | "PARTIAL" | "PAID" | null) || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching piutang customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch piutang customer" },
      { status: 500 }
    );
  }
}
