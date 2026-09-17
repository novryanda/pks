import { NextResponse } from "next/server";

import { requireAuthWithPermission } from "@/lib/api-auth";
import { inputHargaVendorTransportirSchema } from "@/server/schema/keuangan";
import { keuanganDashboardService } from "@/server/services/pt-pks/keuangan-dashboard.service";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.hargaTransportir", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    const result = await keuanganDashboardService.getTransporterPayments(companyId, {
      search: searchParams.get("search") || undefined,
      status:
        (searchParams.get("status") as "PENDING_PRICE" | "UNPAID" | "PARTIAL" | "PAID" | null) ||
        undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching harga transportir:", error);
    return NextResponse.json(
      { error: "Failed to fetch harga transportir" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.hargaTransportir", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const data = inputHargaVendorTransportirSchema.parse(body);

    const result = await keuanganDashboardService.setTransporterPrice(companyId, data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error saving transporter price:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save transporter price" },
      { status: 400 }
    );
  }
}
