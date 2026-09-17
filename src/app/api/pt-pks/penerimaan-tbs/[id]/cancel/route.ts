import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "delete");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    const penerimaan = await penerimaanTBSService.cancelPenerimaanTBS(id, companyId);

    return NextResponse.json(penerimaan);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to cancel penerimaan TBS";
    console.error("Error cancelling penerimaan TBS:", error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
