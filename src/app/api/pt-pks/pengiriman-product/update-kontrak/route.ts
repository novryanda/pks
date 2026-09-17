import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";
import { updatePengirimanKontrakSchema } from "@/server/schema/pengiriman-product";

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { id, ...kontrakData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const data = updatePengirimanKontrakSchema.parse(kontrakData);

    const pengiriman = await pengirimanProductService.updatePengirimanKontrak(
      id,
      companyId,
      data
    );
    return NextResponse.json(pengiriman);
  } catch (error: any) {
    console.error("Error updating pengiriman kontrak:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update pengiriman kontrak" },
      { status: 400 }
    );
  }
}
