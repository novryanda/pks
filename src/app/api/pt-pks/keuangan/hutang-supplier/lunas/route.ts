import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthWithPermission } from "@/lib/api-auth";
import { keuanganDashboardService } from "@/server/services/pt-pks/keuangan-dashboard.service";

const lunasSchema = z.object({
  penerimaanId: z.string().min(1, "Penerimaan wajib dipilih"),
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
    const data = lunasSchema.parse(body);

    const result = await keuanganDashboardService.markSupplierPayablePaid(
      companyId,
      data.penerimaanId,
      userName
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error settling hutang supplier:", error);
    return NextResponse.json(
      { error: error.message || "Failed to settle hutang supplier" },
      { status: 400 }
    );
  }
}
