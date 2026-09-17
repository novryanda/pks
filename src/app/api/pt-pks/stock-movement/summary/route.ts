import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { stockMovementService } from "@/server/services/pt-pks/stock-movement.service";

export async function GET(req: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.stockMovement", "view");
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const summary = await stockMovementService.getStockSummary(
      session.user.company!.id,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }
    );

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching stock summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock summary" },
      { status: 500 }
    );
  }
}
