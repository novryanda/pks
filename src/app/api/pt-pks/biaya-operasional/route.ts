import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { biayaOperasionalService } from "@/server/services/pt-pks/biaya-operasional.service";
import { createPengajuanBiayaSchema } from "@/server/schema/biaya-operasional";
import { StatusPengajuanBiaya } from "@prisma/client";
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as StatusPengajuanBiaya | null;
    const kategoriBiaya = searchParams.get("kategoriBiaya") || undefined;
    const search = searchParams.get("search") || undefined;
    const divisi = searchParams.get("divisi") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const filters: any = {};
    if (status) filters.status = status;
    if (kategoriBiaya) filters.kategoriBiaya = kategoriBiaya;
    if (search) filters.search = search;
    if (divisi) filters.divisi = divisi;
    if (page) filters.page = page;
    if (limit) filters.limit = limit;

    const parsedStartDate = parseJakartaDateBoundary(startDate);
    const parsedEndDate = parseJakartaDateBoundary(endDate, { endOfDay: true });
    if (parsedStartDate) filters.startDate = parsedStartDate;
    if (parsedEndDate) filters.endDate = parsedEndDate;

    const result = await biayaOperasionalService.getAll(companyId, filters);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error fetching pengajuan biaya operasional:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission(
    "gudang.biayaOperasional",
    "create"
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

    const body = await request.json();
    const validated = createPengajuanBiayaSchema.parse(body);

    const userName = session.user.name || session.user.email || "Staff";

    const result = await biayaOperasionalService.create({
      ...validated,
      companyId,
      requestedBy: userName,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 }
      );
    }
    console.error("Error creating pengajuan biaya operasional:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
