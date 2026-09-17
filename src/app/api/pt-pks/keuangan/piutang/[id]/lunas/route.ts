import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { piutangService } from "@/server/services/pt-pks/piutang.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("keuangan.piutangCustomer", "edit");
  if (error) return error;

  try {
    const { id } = await params;

    const result = await piutangService.markAsPaid(
      id,
      session.user.company!.id,
      session.user.name!
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error marking as paid:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark as paid" },
      { status: 500 }
    );
  }
}
