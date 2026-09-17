import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { invoiceService } from "@/server/services/pt-pks/invoice.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    const userName = session.user.name;
    if (!companyId || !userName) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    const invoice = await invoiceService.issueInvoice(id, companyId, userName);
    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error issuing invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to issue invoice" },
      { status: 400 }
    );
  }
}
