import { requireAuthWithPermission } from "@/lib/api-auth";
import { biayaOperasionalService } from "@/server/services/pt-pks/biaya-operasional.service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission(
    "gudang.biayaOperasional",
    "view"
  );
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const summary = await biayaOperasionalService.getSummary(companyId);
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error("Error fetching pengajuan biaya summary:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
