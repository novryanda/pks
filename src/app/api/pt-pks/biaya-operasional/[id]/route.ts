import { requireAuthWithPermission } from "@/lib/api-auth";
import { biayaOperasionalService } from "@/server/services/pt-pks/biaya-operasional.service";
import { updatePengajuanBiayaSchema } from "@/server/schema/biaya-operasional";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuthWithPermission(
    "gudang.biayaOperasional",
    "view"
  );
  if (error) return error;

  try {
    const pengajuan = await biayaOperasionalService.getById(params.id);
    return NextResponse.json(pengajuan);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuthWithPermission(
    "gudang.biayaOperasional",
    "edit"
  );
  if (error) return error;

  try {
    const body = await request.json();
    const validated = updatePengajuanBiayaSchema.parse(body);

    const updated = await biayaOperasionalService.update(params.id, validated);
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuthWithPermission(
    "gudang.biayaOperasional",
    "delete"
  );
  if (error) return error;

  try {
    await biayaOperasionalService.delete(params.id);
    return NextResponse.json({
      message: "Pengajuan biaya operasional berhasil dihapus",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
