import { requireAuthWithPermission } from "@/lib/api-auth";
import { storeRequestService } from "@/server/services/pt-pks/store-request.service";
import { updateStoreRequestSchema, approveStoreRequestSchema } from "@/server/schema/store-request";
import { NextResponse } from "next/server";

// GET /api/pt-pks/store-request/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("gudang.storeRequest", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const sr = await storeRequestService.getById(params.id, companyId);
    return NextResponse.json(sr);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

// PATCH /api/pt-pks/store-request/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("gudang.storeRequest", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateStoreRequestSchema.parse(body);

    const sr = await storeRequestService.update(params.id, companyId, validatedData);
    return NextResponse.json(sr);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/pt-pks/store-request/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("gudang.storeRequest", "delete");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    await storeRequestService.delete(params.id, companyId);
    return NextResponse.json({ message: "Store Request deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
