import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const pengirimans = await pengirimanProductService.getPendingGross(companyId);
    return NextResponse.json(pengirimans);
  } catch (error: any) {
    console.error("Error fetching pending gross:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending gross" },
      { status: 500 }
    );
  }
}
