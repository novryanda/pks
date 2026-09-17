import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { hutangService } from "@/server/services/pt-pks/hutang.service";

export async function POST() {
  const { error, session } = await requireAuthWithPermission("keuangan.hutangSupplier", "create");
  if (error) return error;

  try {
    const result = await hutangService.syncAll(session.user.company!.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing hutang:", error);
    return NextResponse.json(
      { error: "Failed to sync hutang" },
      { status: 500 }
    );
  }
}
