import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { supplierRepository } from "@/server/repositories/supplier.repository";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let suppliers;

    if (search && search.trim() !== "") {
      // Search suppliers by name, company name, or address
      suppliers = await supplierRepository.search(
        companyId,
        search.trim()
      );
    } else {
      // Get all suppliers
      suppliers = await supplierRepository.findByCompanyId(companyId);
    }

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers for penerimaan:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

