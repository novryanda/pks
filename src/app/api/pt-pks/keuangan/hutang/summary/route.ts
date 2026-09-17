import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { hutangService } from "@/server/services/pt-pks/hutang.service";

export async function GET() {
  const { error, session } = await requireAuthWithPermission("keuangan.hutangSupplier", "view");
  if (error) return error;

  try {
    const summary = await hutangService.getSummary(session.user.company!.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching hutang summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch hutang summary" },
      { status: 500 }
    );
  }
}
