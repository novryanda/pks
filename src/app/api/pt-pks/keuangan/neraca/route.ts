import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { keuanganDashboardService } from "@/server/services/pt-pks/keuangan-dashboard.service";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("keuangan.neraca", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    // Parse query parameters for date filter
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const filter = startDateParam || endDateParam
      ? {
          startDate: startDateParam ? new Date(startDateParam) : undefined,
          endDate: endDateParam ? new Date(endDateParam) : undefined,
        }
      : undefined;

    const neraca = await keuanganDashboardService.getNeracaOverview(
      session.user.company!.id,
      filter
    );
    return NextResponse.json(neraca);
  } catch (error) {
    console.error("Error fetching neraca:", error);
    return NextResponse.json(
      { error: "Failed to fetch neraca" },
      { status: 500 }
    );
  }
}
