import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { piutangService } from "@/server/services/pt-pks/piutang.service";

export async function GET() {
  const { error, session } = await requireAuthWithPermission("keuangan.piutangCustomer", "view");
  if (error) return error;

  try {
    const summary = await piutangService.getSummary(session.user.company!.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching piutang summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch piutang summary" },
      { status: 500 }
    );
  }
}
