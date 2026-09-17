import { requireAuthWithPermission } from "@/lib/api-auth";
import { masterKaryawanService } from "@/server/services/pt-pks/master-karyawan.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/master-karyawan/[id] - Get karyawan by id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuthWithPermission("masterData.karyawan", "view");
  if (error) return error;

  try {
    const { id } = await params;
    const karyawan = await masterKaryawanService.getMasterKaryawanById(id);
    return NextResponse.json({ karyawan });
  } catch (error: unknown) {
    console.error("Error fetching karyawan:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to fetch karyawan" },
      { status: 500 }
    );
  }
}

// PUT /api/pt-pks/master-karyawan/[id] - Update karyawan
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("masterData.karyawan", "edit");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const changedBy = session?.user?.name || session?.user?.email || "system";
    const karyawan = await masterKaryawanService.updateMasterKaryawan(id, body, changedBy);

    return NextResponse.json({
      message: "Karyawan updated successfully",
      karyawan,
    });
  } catch (error: unknown) {
    console.error("Error updating karyawan:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update karyawan" },
      { status: 500 }
    );
  }
}

// DELETE /api/pt-pks/master-karyawan/[id] - Delete karyawan
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuthWithPermission("masterData.karyawan", "delete");
  if (error) return error;

  try {
    const { id } = await params;
    await masterKaryawanService.deleteMasterKaryawan(id);
    return NextResponse.json({ message: "Karyawan deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting karyawan:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to delete karyawan" },
      { status: 500 }
    );
  }
}
