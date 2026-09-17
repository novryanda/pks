import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";
import { createPengirimanTarraSchema } from "@/server/schema/pengiriman-product";

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    const userName = session.user.name;
    if (!companyId || !userName) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    
    // Parse dates from string to Date objects
    const parsedBody = {
      ...body,
      tanggalPengiriman: body.tanggalPengiriman ? new Date(body.tanggalPengiriman) : new Date(),
      waktuTimbangTarra: body.waktuTimbangTarra ? new Date(body.waktuTimbangTarra) : new Date(),
      operatorPenimbang: body.operatorPenimbang || session.user.name,
    };

    const data = createPengirimanTarraSchema.parse(parsedBody);

    const pengiriman = await pengirimanProductService.createPengirimanTarra(
      companyId,
      data
    );
    return NextResponse.json(pengiriman, { status: 201 });
  } catch (error: any) {
    console.error("Error creating pengiriman tarra:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create pengiriman tarra" },
      { status: 400 }
    );
  }
}
