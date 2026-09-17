import { requireAuthWithPermission } from "@/lib/api-auth";
import { pengeluaranBarangService } from "@/server/services/pt-pks/pengeluaran-barang.service";
import { NextResponse } from "next/server";

// POST /api/pt-pks/pengeluaran-barang/create-from-sr
// Create pengeluaran barang from approved Store Request
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.pengeluaranBarang", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { storeRequestId, tanggalPengeluaran } = body;

    if (!storeRequestId) {
      return NextResponse.json({ error: "Store Request ID is required" }, { status: 400 });
    }
    if (tanggalPengeluaran) {
      const parsedTanggalPengeluaran = new Date(tanggalPengeluaran);
      if (Number.isNaN(parsedTanggalPengeluaran.getTime())) {
        return NextResponse.json({ error: "Tanggal pengeluaran tidak valid" }, { status: 400 });
      }
    }

    const issuedBy = session.user.name || session.user.email || "Unknown";
    const operator = session.user.name || session.user.email || "Unknown";

    const pengeluaran = await pengeluaranBarangService.createFromStoreRequest(
      companyId,
      storeRequestId,
      issuedBy,
      operator,
      tanggalPengeluaran
    );

    return NextResponse.json(pengeluaran, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
