import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanBarangService } from "@/server/services/pt-pks/penerimaan-barang.service";
import { updatePenerimaanBarangSchema } from "@/server/schema/penerimaan-barang";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("gudang.penerimaanBarang", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    const penerimaan = await penerimaanBarangService.getById(id, companyId);
    
    return NextResponse.json(penerimaan);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("gudang.penerimaanBarang", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePenerimaanBarangSchema.parse(body);

    const penerimaan = await penerimaanBarangService.update(id, companyId, validatedData);
    return NextResponse.json(penerimaan);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
