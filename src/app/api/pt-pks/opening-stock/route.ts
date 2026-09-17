import { NextResponse } from "next/server";
import { requireAuth, requireAuthWithPermission } from "@/lib/api-auth";
import { checkDbPermission } from "@/lib/rbac";
import { openingStockService } from "@/server/services/pt-pks/opening-stock.service";
import { saveOpeningStockSchema } from "@/server/schema/opening-stock";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.stockAwal", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    const rows = await openingStockService.getRows(companyId, date!);
    return NextResponse.json({
      date,
      rows,
    });
  } catch (error) {
    console.error("Error fetching opening stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch opening stock" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error: authError, session } = await requireAuth();
  if (authError) return authError;

  try {
    const roleId = (session.user as { role?: { id?: string } }).role?.id;
    if (!roleId) {
      return NextResponse.json({ error: "Role ID not found" }, { status: 403 });
    }

    const [canCreate, canEdit] = await Promise.all([
      checkDbPermission(roleId, "gudang.stockAwal", "create"),
      checkDbPermission(roleId, "gudang.stockAwal", "edit"),
    ]);

    if (!canCreate && !canEdit) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body: unknown = await request.json();
    const validatedData = saveOpeningStockSchema.parse(body);

    const rows = await openingStockService.save(
      companyId,
      validatedData.date,
      validatedData.entries,
      session.user.name ?? "system"
    );

    return NextResponse.json({
      success: true,
      message: "Stock awal berhasil disimpan",
      rows,
    });
  } catch (error: unknown) {
    console.error("Error saving opening stock:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save opening stock" },
      { status: 400 }
    );
  }
}
