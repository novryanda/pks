import { requireAuthWithPermission } from "@/lib/api-auth";
import { materialInventarisService } from "@/server/services/pt-pks/material-inventaris.service";
import { updateMaterialInventarisSchema } from "@/server/schema/material-inventaris";
import { NextResponse } from "next/server";

// GET /api/pt-pks/material-inventaris/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("gudang.inventaris", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const material = await materialInventarisService.getById(params.id, companyId);
    return NextResponse.json(material);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

// PATCH /api/pt-pks/material-inventaris/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("gudang.inventaris", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateMaterialInventarisSchema.parse(body);

    const material = await materialInventarisService.update(params.id, companyId, validatedData);
    return NextResponse.json(material);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/pt-pks/material-inventaris/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("gudang.inventaris", "delete");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    await materialInventarisService.delete(params.id, companyId);
    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
