import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";

export async function GET(request: Request) {
  // Menggunakan permission inputHargaTbs untuk melihat data pending harga
  const { error, session } = await requireAuthWithPermission("supplyChain.inputHargaTbs", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const data = await penerimaanTBSService.getPendingHarga(companyId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching pending harga:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending harga data" },
      { status: 500 }
    );
  }
}
