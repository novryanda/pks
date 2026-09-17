import { requireAuthWithPermission } from "@/lib/api-auth";
import { materialInventarisService } from "@/server/services/pt-pks/material-inventaris.service";
import { materialInventarisSchema } from "@/server/schema/material-inventaris";
import { NextResponse } from "next/server";

// GET /api/pt-pks/material-inventaris
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.inventaris", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "summary") {
      const summary = await materialInventarisService.getStockSummary(companyId);
      return NextResponse.json(summary);
    }

    if (type === "low-stock") {
      const lowStock = await materialInventarisService.getLowStockMaterials(companyId);
      return NextResponse.json(lowStock);
    }

    const materials = await materialInventarisService.getAll(companyId);
    return NextResponse.json(materials);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/pt-pks/material-inventaris
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.inventaris", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = materialInventarisSchema.parse(body);

    const material = await materialInventarisService.create(companyId, validatedData);
    return NextResponse.json(material, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
