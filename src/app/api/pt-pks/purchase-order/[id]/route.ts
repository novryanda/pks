import { requireAuthWithPermission } from "@/lib/api-auth";
import { purchaseOrderService } from "@/server/services/pt-pks/purchase-order.service";
import { updatePurchaseOrderSchema } from "@/server/schema/purchase-order";
import { NextResponse } from "next/server";

// GET /api/pt-pks/purchase-order/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("gudang.purchaseOrder", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    const po = await purchaseOrderService.getById(id, companyId);
    return NextResponse.json(po);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

// PATCH /api/pt-pks/purchase-order/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("gudang.purchaseOrder", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updatePurchaseOrderSchema.parse(body);

    const po = await purchaseOrderService.update(id, companyId, validatedData);
    return NextResponse.json(po);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/pt-pks/purchase-order/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("gudang.purchaseOrder", "delete");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    await purchaseOrderService.delete(id, companyId);
    return NextResponse.json({ message: "Purchase Order deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
