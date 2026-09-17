import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";
import { createPenerimaanTBSSchema } from "@/server/schema/penerimaan-tbs";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");
    const materialId = searchParams.get("materialId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month");

    if (id) {
      const penerimaan = await penerimaanTBSService.getPenerimaanTBSById(id);
      return NextResponse.json(penerimaan);
    }

    const filters: any = {};
    if (status) filters.status = status;
    if (supplierId) filters.supplierId = supplierId;
    if (materialId) filters.materialId = materialId;

    if (month) {
      const [year, m] = month.split("-").map(Number);
      filters.startDate = new Date(year!, m! - 1, 1);

      const now = new Date();
      if (year === now.getFullYear() && (m! - 1) === now.getMonth()) {
        filters.endDate = now;
      } else {
        filters.endDate = new Date(year!, m!, 0, 23, 59, 59, 999);
      }
    } else {
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
    }

    const penerimaans = await penerimaanTBSService.getPenerimaanTBSByCompany(
      session.user.company!.id,
      filters
    );
    return NextResponse.json(penerimaans);
  } catch (error) {
    console.error("Error fetching penerimaan TBS:", error);
    return NextResponse.json(
      { error: "Failed to fetch penerimaan TBS" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    const userName = session.user.name;
    if (!companyId || !userName) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();

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

    // Parse dates from string to Date objects
    const parsedBody = {
      ...body,
      tanggalTerima: new Date(body.tanggalTerima),
      waktuTimbangBruto: new Date(body.waktuTimbangBruto),
      waktuTimbangTarra: new Date(body.waktuTimbangTarra),
      operatorPenimbang: body.operatorPenimbang || session.user.name,
    };

    const data = createPenerimaanTBSSchema.parse(parsedBody);

    const penerimaan = await penerimaanTBSService.createPenerimaanTBS(
      session.user.company!.id,
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
    console.error("Error creating penerimaan TBS:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create penerimaan TBS" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  const { error } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "edit");
  if (error) return error;

  try {

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Parse dates if they exist
    const parsedData: any = { ...data };
    if (data.tanggalTerima) parsedData.tanggalTerima = new Date(data.tanggalTerima);
    if (data.waktuTimbangBruto) parsedData.waktuTimbangBruto = new Date(data.waktuTimbangBruto);
    if (data.waktuTimbangTarra) parsedData.waktuTimbangTarra = new Date(data.waktuTimbangTarra);

    const penerimaan = await penerimaanTBSService.updatePenerimaanTBS(id, parsedData);
    return NextResponse.json(penerimaan);
  } catch (error: any) {
    console.error("Error updating penerimaan TBS:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update penerimaan TBS" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "delete");
  if (error) return error;

  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await penerimaanTBSService.deletePenerimaanTBS(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting penerimaan TBS:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete penerimaan TBS" },
      { status: 400 }
    );
  }
}
