import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { prosesProduksiService } from "@/server/services/pt-pks/proses-produksi.service";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuthWithPermission(
    "produksi.prosesProduksi",
    "view"
  );
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    // Support both date range and legacy single date
    const tanggalMulai = searchParams.get("tanggalMulai");
    const tanggalAkhir = searchParams.get("tanggalAkhir");
    const legacyTanggal = searchParams.get("tanggal"); // Legacy single date support
    const materialOutputId = searchParams.get("materialOutputId") === "all" ? null : searchParams.get("materialOutputId");

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (tanggalMulai && tanggalAkhir) {
      startDate = new Date(tanggalMulai);
      endDate = new Date(tanggalAkhir);
      endDate.setHours(23, 59, 59, 999);
    } else if (legacyTanggal) {
      startDate = new Date(legacyTanggal);
      endDate = new Date(legacyTanggal);
      endDate.setHours(23, 59, 59, 999);
    }

    const summary = await prosesProduksiService.getProductionSummaryReport(
      companyId,
      startDate,
      endDate,
      materialOutputId
    );

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error fetching summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
