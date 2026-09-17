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
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    await invoiceService.cancelInvoice(id, companyId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error cancelling invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel invoice" },
      { status: 400 }
    );
  }
}
