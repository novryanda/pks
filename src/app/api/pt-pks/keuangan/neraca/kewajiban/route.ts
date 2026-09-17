import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { neracaService } from "@/server/services/pt-pks/neraca.service";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("keuangan.neraca", "view");
  if (error) return error;

  try {
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

    const detail = await neracaService.getKewajibanDetail(session.user.company!.id, filter);
    return NextResponse.json(detail);
  } catch (error) {
    console.error("Error fetching kewajiban detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch kewajiban detail" },
      { status: 500 }
    );
  }
}
