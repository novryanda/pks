import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuthWithPermission(
    "pemasaran.pengirimanProduct",
    "view",
  );
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const materialId = searchParams.get("materialId");
    const buyerId = searchParams.get("buyerId");
    const contractId = searchParams.get("contractId");

    const summary = await pengirimanProductService.getConsolidatedSummary(
      companyId,
      {
        ...(date
          ? {
              date: parseJakartaDateBoundary(date) ?? undefined,
            }
          : {
              startDate: parseJakartaDateBoundary(startDate) ?? undefined,
              endDate:
                parseJakartaDateBoundary(endDate, { endOfDay: true }) ??
                undefined,
            }),
        materialId: materialId !== "all" ? materialId || undefined : undefined,
        buyerId: buyerId || undefined,
        contractId: contractId || undefined,
      },
    );

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error fetching consolidated shipping summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
