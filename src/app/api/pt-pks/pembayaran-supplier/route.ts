import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("supplyChain.pembayaranSupplier", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const supplierId = searchParams.get("supplierId");

    const pembayaran = await penerimaanTBSService.getPembayaranSupplier(companyId, {
      startDate: parseJakartaDateBoundary(startDate) ?? undefined,
      endDate: parseJakartaDateBoundary(endDate, { endOfDay: true }) ?? undefined,
      supplierId: supplierId && supplierId !== "all" ? supplierId : undefined,
    });
    return NextResponse.json(pembayaran);
  } catch (error) {
    console.error("Error fetching pembayaran supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch pembayaran supplier" },
      { status: 500 }
    );
  }
}
