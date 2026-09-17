import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { invoiceService } from "@/server/services/pt-pks/invoice.service";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const contracts = await invoiceService.getContractsWithPendingInvoice(companyId);
    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error("Error fetching pending invoice contracts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending invoice contracts" },
      { status: 500 }
    );
  }
}
