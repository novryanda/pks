import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { neracaService } from "@/server/services/pt-pks/neraca.service";

export async function GET() {
  const { error, session } = await requireAuthWithPermission("keuangan.neraca", "view");
  if (error) return error;

  try {
    const aging = await neracaService.getPiutangAging(session.user.company!.id);
    return NextResponse.json(aging);
  } catch (error) {
    console.error("Error fetching piutang aging:", error);
    return NextResponse.json(
      { error: "Failed to fetch piutang aging" },
      { status: 500 }
    );
  }
}
