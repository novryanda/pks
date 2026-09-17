import { requireAuthWithPermission } from "@/lib/api-auth";
import { pengeluaranBarangService } from "@/server/services/pt-pks/pengeluaran-barang.service";
import { StatusPengeluaranBarang } from "@prisma/client";
import { NextResponse } from "next/server";

// GET /api/pt-pks/pengeluaran-barang
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.pengeluaranBarang", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as StatusPengeluaranBarang | null;
    const divisi = searchParams.get("divisi");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters: any = {};
    if (status) filters.status = status;
    if (divisi) filters.divisi = divisi;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const pengeluaranBarang = await pengeluaranBarangService.getAll(companyId, filters);
    const normalizedPengeluaranBarang = pengeluaranBarang.map((item) => ({
      ...item,
      issuedBy: item.requestedBy,
    }));

    return NextResponse.json(normalizedPengeluaranBarang);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
