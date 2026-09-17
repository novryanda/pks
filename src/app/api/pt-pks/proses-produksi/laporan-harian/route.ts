import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { prosesProduksiService } from "@/server/services/pt-pks/proses-produksi.service";

/**
 * GET /api/pt-pks/proses-produksi/laporan-harian
 * Get laporan harian produksi
 */
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("produksi.laporanHarian", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tanggalMulai = searchParams.get("tanggalMulai");
    const tanggalAkhir = searchParams.get("tanggalAkhir");

    if (!tanggalMulai || !tanggalAkhir) {
      return NextResponse.json(
        { error: "tanggalMulai and tanggalAkhir are required" },
        { status: 400 }
      );
    }

    const result = await prosesProduksiService.getLaporanHarian(
      companyId,
      tanggalMulai,
      tanggalAkhir
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching laporan harian:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
