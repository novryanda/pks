import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { invoiceService } from "@/server/services/pt-pks/invoice.service";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const statistics = await invoiceService.getStatistics(companyId, filters);
    return NextResponse.json(statistics);
  } catch (error: any) {
    console.error("Error fetching invoice statistics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoice statistics" },
      { status: 500 }
    );
  }
}
