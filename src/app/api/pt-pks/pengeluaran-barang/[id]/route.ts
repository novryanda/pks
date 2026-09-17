import { requireAuthWithPermission } from "@/lib/api-auth";
import { pengeluaranBarangService } from "@/server/services/pt-pks/pengeluaran-barang.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/pengeluaran-barang/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("gudang.pengeluaranBarang", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const pengeluaran = await pengeluaranBarangService.getById(params.id, companyId);
    return NextResponse.json({
      ...pengeluaran,
      issuedBy: pengeluaran.requestedBy,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
