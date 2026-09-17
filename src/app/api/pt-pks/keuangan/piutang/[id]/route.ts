import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { piutangService } from "@/server/services/pt-pks/piutang.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("keuangan.piutangCustomer", "view");
  if (error) return error;

  try {
    const { id } = await params;
    const piutang = await piutangService.getById(id, session.user.company!.id);

    return NextResponse.json(piutang);
  } catch (error) {
    console.error("Error fetching piutang:", error);
    return NextResponse.json(
      { error: "Failed to fetch piutang" },
      { status: 500 }
    );
  }
}
