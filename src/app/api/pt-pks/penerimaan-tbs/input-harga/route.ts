import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";
import { inputHargaTBSSchema } from "@/server/schema/penerimaan-tbs";

export async function POST(request: Request) {
  // Menggunakan permission inputHargaTbs untuk fitur input harga
  const { error, session } = await requireAuthWithPermission("supplyChain.inputHargaTbs", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = inputHargaTBSSchema.parse(body);

    const penerimaan = await penerimaanTBSService.inputHarga(companyId, validatedData);
    return NextResponse.json(penerimaan);
  } catch (error: any) {
    console.error("Error input harga:", error);
    return NextResponse.json(
      { error: error.message || "Failed to input harga" },
      { status: 400 }
    );
  }
}
