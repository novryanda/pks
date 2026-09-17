import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { prosesProduksiService } from "@/server/services/pt-pks/proses-produksi.service";

/**
 * GET /api/pt-pks/proses-produksi/stock-tbs
 * Get stock TBS tersedia
 */
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("produksi.prosesProduksi", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const result = await prosesProduksiService.getStockTBSTersedia(companyId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching stock TBS:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
