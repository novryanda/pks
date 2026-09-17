import { requireAuthWithPermission } from "@/lib/api-auth";
import { invoiceService } from "@/server/services/pt-pks/invoice.service";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/pt-pks/contract/[id]/invoice-summary - Get contract invoice summary
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("pemasaran.invoice", "view");
  if (error) return error;

  try {
    const { id } = await params;

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const summary = await invoiceService.getContractInvoiceSummary(id, companyId);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("Error fetching contract invoice summary:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch contract invoice summary" },
      { status: 404 }
    );
  }
}
