import { requireAuthWithPermission } from "@/lib/api-auth";
import { penggajianService } from "@/server/services/pt-pks/penggajian.service";
import { penggajianQuerySchema } from "@/server/schema/penggajian";
import { NextResponse } from "next/server";

// GET /api/pt-pks/penggajian - Get all penggajian
export async function GET(request: Request) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "view");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);

    // Check if requesting devisi list
    const divisiList = searchParams.get("divisiList") ?? searchParams.get("devisiList");
    if (divisiList === "true") {
      const devisiData = await penggajianService.getDevisiList();
      return NextResponse.json({ devisi: devisiData });
    }

    // Check if requesting periode list
    const periodeList = searchParams.get("periodeList");
    if (periodeList === "true") {
      const periodeData = await penggajianService.getPeriodeList();
      return NextResponse.json({ periode: periodeData });
    }

    // Check if requesting summary
    const summary = searchParams.get("summary");
    if (summary === "true") {
      const periodeBulan = searchParams.get("periodeBulan");
      const periodeTahun = searchParams.get("periodeTahun");
      const summaryData = await penggajianService.getSummary(
        periodeBulan ? parseInt(periodeBulan) : undefined,
        periodeTahun ? parseInt(periodeTahun) : undefined
      );
      return NextResponse.json({ summary: summaryData });
    }

    // Parse query parameters
    const query = penggajianQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      divisiId: searchParams.get("divisiId") || undefined,
      periodeBulan: searchParams.get("periodeBulan") || undefined,
      periodeTahun: searchParams.get("periodeTahun") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 100,
    });

    const result = await penggajianService.getPenggajian(query);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error fetching penggajian:", error);

    if (error && typeof error === 'object' && 'errors' in error) {
      return NextResponse.json(
        { error: "Validation error", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch penggajian" },
      { status: 500 }
    );
  }
}

// POST /api/pt-pks/penggajian - Create new penggajian
export async function POST(request: Request) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "create");
  if (error) return error;

  try {
    const body = await request.json();
    const penggajian = await penggajianService.createPenggajian(body);

    return NextResponse.json(
      { message: "Penggajian created successfully", penggajian },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating penggajian:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create penggajian" },
      { status: 500 }
    );
  }
}

// DELETE /api/pt-pks/penggajian - Delete penggajian (by periode, by id, or bulk by ids)
export async function DELETE(request: Request) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "delete");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const periodeBulan = searchParams.get("periodeBulan");
    const periodeTahun = searchParams.get("periodeTahun");
    const id = searchParams.get("id");
    const idsParam = searchParams.get("ids");

    // Delete by single ID
    if (id) {
      await penggajianService.deletePenggajian(id);
      return NextResponse.json({ message: "Penggajian deleted successfully" });
    }

    // Delete by multiple IDs (bulk)
    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json(
          { error: "IDs tidak boleh kosong" },
          { status: 400 }
        );
      }
      const result = await penggajianService.deletePenggajianBulk(ids);
      return NextResponse.json({
        message: `${result.count} data penggajian deleted successfully`,
        count: result.count
      });
    }

    // Delete by periode
    if (periodeBulan && periodeTahun) {
      await penggajianService.deletePenggajianByPeriode(
        parseInt(periodeBulan),
        parseInt(periodeTahun)
      );
      return NextResponse.json({ message: "Penggajian deleted successfully" });
    }

    return NextResponse.json(
      { error: "Parameter id, ids, atau periode bulan/tahun wajib diisi" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Error deleting penggajian:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete penggajian" },
      { status: 500 }
    );
  }
}
