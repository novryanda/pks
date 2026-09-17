import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { tangkiService } from "@/server/services/pt-pks/tangki.service";

/**
 * GET /api/pt-pks/tangki/stock/summary
 * Get stock summary grouped by material
 */
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.stockProduct", "view");
  if (error) return error;

  try {
    if (!session.user.company?.id) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 403 },
      );
    }

    const summary = await tangkiService.getStockSummary(
      session.user.company.id,
    );

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching stock summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock summary" },
      { status: 500 },
    );
  }
}
