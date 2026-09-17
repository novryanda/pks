import { requireAuthWithPermission } from "@/lib/api-auth";
import { penggajianService } from "@/server/services/pt-pks/penggajian.service";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/pt-pks/penggajian/[id] - Get penggajian by id
export async function GET(request: Request, { params }: RouteParams) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "view");
  if (error) return error;

  try {
    const { id } = await params;
    const penggajian = await penggajianService.getPenggajianById(id);

    return NextResponse.json({ penggajian });
  } catch (error: unknown) {
    console.error("Error fetching penggajian:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to fetch penggajian" },
      { status: 500 }
    );
  }
}

// PUT /api/pt-pks/penggajian/[id] - Update penggajian
export async function PUT(request: Request, { params }: RouteParams) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "edit");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const penggajian = await penggajianService.updatePenggajian(id, body);

    return NextResponse.json({
      message: "Penggajian updated successfully",
      penggajian,
    });
  } catch (error: unknown) {
    console.error("Error updating penggajian:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update penggajian" },
      { status: 500 }
    );
  }
}

// DELETE /api/pt-pks/penggajian/[id] - Delete penggajian
export async function DELETE(request: Request, { params }: RouteParams) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "delete");
  if (error) return error;

  try {
    const { id } = await params;
    await penggajianService.deletePenggajian(id);

    return NextResponse.json({ message: "Penggajian deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting penggajian:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete penggajian" },
      { status: 500 }
    );
  }
}
