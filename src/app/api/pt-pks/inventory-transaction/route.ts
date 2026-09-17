import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { inventoryTransactionService } from "@/server/services/pt-pks/inventory-transaction.service";
import { TipeMovement } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.inventaris", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const materialId = searchParams.get("materialId");
    const tipeTransaksi = searchParams.get("tipeTransaksi") as TipeMovement | null;
    const vendorId = searchParams.get("vendorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (type === "summary") {
      const summary = await inventoryTransactionService.getStockSummary(companyId);
      return NextResponse.json(summary);
    }

    const filters: any = {};
    if (materialId) filters.materialId = materialId;
    if (tipeTransaksi) filters.tipeTransaksi = tipeTransaksi;
    if (vendorId) filters.vendorId = vendorId;
    if (startDate) filters.startDate = parseJakartaDateBoundary(startDate) ?? undefined;
    if (endDate) filters.endDate = parseJakartaDateBoundary(endDate, { endOfDay: true }) ?? undefined;

    const transactions = await inventoryTransactionService.getAll(companyId, filters);
    return NextResponse.json(transactions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
