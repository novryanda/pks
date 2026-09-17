import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";
import { createPengirimanProductSchema } from "@/server/schema/pengiriman-product";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const buyerId = searchParams.get("buyerId");
    const contractId = searchParams.get("contractId");
    const materialId = searchParams.get("materialId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const date = searchParams.get("date");

    if (id) {
      const pengiriman = await pengirimanProductService.getPengirimanProductById(id);
      return NextResponse.json(pengiriman);
    }

    const filters: any = {};
    if (status) filters.status = status;
    if (buyerId) filters.buyerId = buyerId;
    if (contractId) filters.contractId = contractId;
    if (materialId) filters.materialId = materialId;

    if (date) {
      const start = parseJakartaDateBoundary(date);
      const end = parseJakartaDateBoundary(date, { endOfDay: true });
      if (start && end) {
        filters.startDate = start;
        filters.endDate = end;
      }
    } else {
      if (startDate) {
        const parsedStart = parseJakartaDateBoundary(startDate);
        if (parsedStart) {
          filters.startDate = parsedStart;
        }
      }
      if (endDate) {
        const parsedEnd = parseJakartaDateBoundary(endDate, { endOfDay: true });
        if (parsedEnd) {
          filters.endDate = parsedEnd;
        }
      }
    }

    const pengirimans = await pengirimanProductService.getPengirimanProductByCompany(
      session.user.company!.id,
      filters
    );
    return NextResponse.json(pengirimans);
  } catch (error) {
    console.error("Error fetching pengiriman product:", error);
    return NextResponse.json(
      { error: "Failed to fetch pengiriman product" },
      { status: 500 }
    );
  }
}

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
      tanggalPengiriman: new Date(body.tanggalPengiriman),
      waktuTimbangTarra: new Date(body.waktuTimbangTarra),
      waktuTimbangGross: new Date(body.waktuTimbangGross),
      operatorPenimbang: body.operatorPenimbang || session.user.name,
    };

    const data = createPengirimanProductSchema.parse(parsedBody);

    const pengiriman = await pengirimanProductService.createPengirimanProduct(
      session.user.company!.id,
      data
    );
    return NextResponse.json(pengiriman, { status: 201 });
  } catch (error: any) {
    console.error("Error creating pengiriman product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create pengiriman product" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  const { error } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "edit");
  if (error) return error;

  try {

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Parse dates if they exist
    const parsedData: any = { ...data };
    if (data.tanggalPengiriman) parsedData.tanggalPengiriman = new Date(data.tanggalPengiriman);
    if (data.waktuTimbangTarra) parsedData.waktuTimbangTarra = new Date(data.waktuTimbangTarra);
    if (data.waktuTimbangGross) parsedData.waktuTimbangGross = new Date(data.waktuTimbangGross);

    const pengiriman = await pengirimanProductService.updatePengirimanProduct(id, parsedData);
    return NextResponse.json(pengiriman);
  } catch (error: any) {
    console.error("Error updating pengiriman product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update pengiriman product" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "delete");
  if (error) return error;

  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await pengirimanProductService.deletePengirimanProduct(id);
    return NextResponse.json({ message: "Pengiriman product deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting pengiriman product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete pengiriman product" },
      { status: 400 }
    );
  }
}
