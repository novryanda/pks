import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanBarangService } from "@/server/services/pt-pks/penerimaan-barang.service";
import { penerimaanBarangSchema } from "@/server/schema/penerimaan-barang";
import { StatusPenerimaanBarang } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.penerimaanBarang", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as StatusPenerimaanBarang | null;
    const vendorId = searchParams.get("vendorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters: any = {};
    if (status) filters.status = status;
    if (vendorId) filters.vendorId = vendorId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const grs = await penerimaanBarangService.getAll(companyId, filters);
    return NextResponse.json(grs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.penerimaanBarang", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = penerimaanBarangSchema.parse(body);

    const gr = await penerimaanBarangService.create(companyId, validatedData);
    return NextResponse.json(gr, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
