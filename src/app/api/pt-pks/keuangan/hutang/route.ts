import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { hutangService } from "@/server/services/pt-pks/hutang.service";
import { hutangQuerySchema } from "@/server/schema/keuangan";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("keuangan.hutangSupplier", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get("status") || undefined,
      tipeTransaksi: searchParams.get("tipeTransaksi") || undefined,
      pihakKetigaId: searchParams.get("pihakKetigaId") || undefined,
      startDate: searchParams.get("startDate") 
        ? new Date(searchParams.get("startDate")!) 
        : undefined,
      endDate: searchParams.get("endDate") 
        ? new Date(searchParams.get("endDate")!) 
        : undefined,
    };

    const validatedFilters = hutangQuerySchema.parse(filters);
    const hutangs = await hutangService.getAll(
      session.user.company!.id,
      validatedFilters
    );

    return NextResponse.json(hutangs);
  } catch (error) {
    console.error("Error fetching hutang:", error);
    return NextResponse.json(
      { error: "Failed to fetch hutang" },
      { status: 500 }
    );
  }
}
