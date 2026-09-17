import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthWithPermission } from "@/lib/api-auth";
import { keuanganDashboardService } from "@/server/services/pt-pks/keuangan-dashboard.service";

const batchLunasSchema = z.object({
  penerimaanIds: z.array(z.string().min(1)).min(1, "Pilih minimal satu data"),
});

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("keuangan.hutangSupplier", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    const userName = session.user.name;
    if (!companyId || !userName) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const data = batchLunasSchema.parse(body);

    const result = await keuanganDashboardService.markSupplierPayablesPaid(
      companyId,
      data.penerimaanIds,
      userName,
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error batch settling hutang supplier:", error);
    return NextResponse.json(
      { error: error.message || "Failed to settle hutang supplier" },
      { status: 400 },
    );
  }
}
