import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";
import { createPenerimaanTimbangSchema } from "@/server/schema/penerimaan-tbs";

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    console.log("Received body:", JSON.stringify(body, null, 2));
    
    // Validasi transporterType
    if (body.transporterType === "existing" && !body.transporterId) {
      return NextResponse.json(
        { error: "Transporter harus dipilih" },
        { status: 400 }
      );
    }

    if (body.transporterType === "new") {
      if (!body.nomorKendaraan || !body.namaSupir) {
        return NextResponse.json(
          { error: "Nomor kendaraan dan nama supir harus diisi" },
          { status: 400 }
        );
      }
    }
    
    // Parse dates from string to Date objects - ensure waktuTimbangBruto is always set
    const parsedBody = {
      ...body,
      tanggalTerima: new Date(body.tanggalTerima),
      waktuTimbangBruto: body.waktuTimbangBruto ? new Date(body.waktuTimbangBruto) : new Date(),
      waktuTimbangTarra: body.waktuTimbangTarra ? new Date(body.waktuTimbangTarra) : undefined,
      operatorPenimbang: body.operatorPenimbang || session.user.name || "Operator",
    };

    console.log("Parsed body:", JSON.stringify(parsedBody, null, 2));

    const data = createPenerimaanTimbangSchema.parse(parsedBody);
    console.log("Validated data:", JSON.stringify(data, null, 2));

    const penerimaan = await penerimaanTBSService.createPenerimaanTimbang(
      companyId,
      {
        ...data,
        lokasiKebun: body.lokasiKebun,
        jenisBuah: body.jenisBuah,
        transporterType: body.transporterType,
        nomorKendaraan: body.nomorKendaraan,
        namaSupir: body.namaSupir,
      }
    );
    return NextResponse.json(penerimaan, { status: 201 });
  } catch (error: any) {
    console.error("Error creating penerimaan timbang:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create penerimaan timbang" },
      { status: 400 }
    );
  }
}
