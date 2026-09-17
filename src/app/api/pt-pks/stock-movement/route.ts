import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { stockMovementService } from "@/server/services/pt-pks/stock-movement.service";
import type { StockMovementFilters } from "@/server/repositories/stock-movement.repository";
import type { TipeMovement } from "@prisma/client";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.stockMovement", "view");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const materialId = searchParams.get("materialId");
    const tipeMovementParam = searchParams.get("tipeMovement");
    const tipeMovement =
      tipeMovementParam && tipeMovementParam !== "all"
        ? (tipeMovementParam as TipeMovement)
        : null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");

    if (id) {
      const movement = await stockMovementService.getStockMovementById(id);
      return NextResponse.json(movement);
    }

    const filters: StockMovementFilters = {};
    if (materialId) filters.materialId = materialId;
    if (tipeMovement) filters.tipeMovement = tipeMovement;

    if (startDate) {
      filters.startDate = parseJakartaDateBoundary(startDate) ?? undefined;
    }

    if (endDate || startDate) {
      filters.endDate = parseJakartaDateBoundary(endDate ?? startDate!, { endOfDay: true }) ?? undefined;
    }

    if (search) filters.search = search;
    filters.page = Number.isNaN(page) ? 1 : page;
    filters.limit = Number.isNaN(limit) ? 20 : limit;

    const movements = await stockMovementService.getStockMovements(
      session.user.company!.id,
      filters
    );

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock movements" },
      { status: 500 }
    );
  }
}
