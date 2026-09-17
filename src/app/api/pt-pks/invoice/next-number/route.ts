import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { invoiceService } from "@/server/services/pt-pks/invoice.service";

export async function GET() {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const nextNomorInvoice = await invoiceService.getNextNomorInvoice(companyId);
    return NextResponse.json({ nextNomorInvoice });
  } catch (error: unknown) {
    console.error("Error getting next invoice number:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get next invoice number";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
