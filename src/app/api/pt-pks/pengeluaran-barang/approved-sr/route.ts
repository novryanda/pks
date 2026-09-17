import { requireAuthWithPermission } from "@/lib/api-auth";
import { pengeluaranBarangService } from "@/server/services/pt-pks/pengeluaran-barang.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/pengeluaran-barang/approved-sr
// Get list of approved Store Requests that don't have pengeluaran barang yet
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.pengeluaranBarang", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const approvedSRs = await pengeluaranBarangService.getApprovedStoreRequests(companyId);
    return NextResponse.json(approvedSRs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
