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

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    if (!contractId) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 });
    }

    const pengiriman = await invoiceService.getPengirimanBelumInvoice(contractId, companyId);
    return NextResponse.json(pengiriman);
  } catch (error: any) {
    console.error("Error fetching pending pengiriman:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending pengiriman" },
      { status: 500 }
    );
  }
}
