import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();

    const { id, metodeTarra, beratTarra, waktuTimbangTarra, potonganPersen, jenisBuah } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (!metodeTarra || beratTarra === undefined || !waktuTimbangTarra) {
      return NextResponse.json(
        { error: "metodeTarra, beratTarra, and waktuTimbangTarra are required" },
        { status: 400 }
      );
    }

    const penerimaan = await penerimaanTBSService.updateTimbangTarra(id, {
      metodeTarra,
      beratTarra,
      waktuTimbangTarra: new Date(waktuTimbangTarra),
      potonganPersen: potonganPersen ?? 0,
      jenisBuah,
    });

    return NextResponse.json(penerimaan);
  } catch (error: any) {
    console.error("Error update tarra:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update tarra" },
      { status: 400 }
    );
  }
}
