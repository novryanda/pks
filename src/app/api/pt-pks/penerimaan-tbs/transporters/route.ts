import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { transporterService } from "@/server/services/pt-pks/transporter.service";

/**
 * GET /api/pt-pks/penerimaan-tbs/transporters
 * Get transporters for penerimaan TBS dropdown
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const id = searchParams.get("id");

    if (id) {
      const transporter = await transporterService.getTransporterById(id);
      return NextResponse.json(transporter);
    }

    if (search) {
      const transporters = await transporterService.searchTransporters(
        companyId,
        search
      );
      return NextResponse.json(transporters);
    }

    const transporters = await transporterService.getTransportersByCompany(companyId);
    return NextResponse.json(transporters);
  } catch (error) {
    console.error("Error fetching transporters for penerimaan:", error);
    return NextResponse.json(
      { error: "Failed to fetch transporters" },
      { status: 500 }
    );
  }
}
