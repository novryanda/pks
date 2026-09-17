import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { piutangService } from "@/server/services/pt-pks/piutang.service";

export async function POST() {
  const { error, session } = await requireAuthWithPermission("keuangan.piutangCustomer", "create");
  if (error) return error;

  try {
    const result = await piutangService.syncAll(session.user.company!.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing piutang:", error);
    return NextResponse.json(
      { error: "Failed to sync piutang" },
      { status: 500 }
    );
  }
}
