import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { dashboardSummaryService } from "@/server/services/pt-pks/dashboard-summary.service";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is global admin
    if (
      session.user.role?.name !== "Admin" &&
      session.user.role?.name !== "Super Admin"
    ) {
      return NextResponse.json(
        { error: "Only Admin can access dashboard summary" },
        { status: 403 }
      );
    }

    // Get month/year from query params
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan");
    const tahun = searchParams.get("tahun");

    const now = new Date();
    const filterMonth = bulan ? parseInt(bulan, 10) : now.getMonth() + 1;
    const filterYear = tahun ? parseInt(tahun, 10) : now.getFullYear();

    const summary = await dashboardSummaryService.getSummary(
      session.user.company.id,
      filterMonth,
      filterYear
    );

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
