import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { materialService } from "@/server/services/pt-pks/material.service";

/**
 * GET /api/pt-pks/penerimaan-tbs/materials
 * Get materials for penerimaan TBS dropdown
 * Only requires supplyChain.penerimaanTbs view permission
 */
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const materials = await materialService.getMaterialsByCompany(companyId);
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching materials for penerimaan:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}
