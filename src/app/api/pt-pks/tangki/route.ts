import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { tangkiService } from "@/server/services/pt-pks/tangki.service";
import { createTangkiSchema } from "@/server/schema/tangki";

/**
 * GET /api/pt-pks/tangki
 * Get all tangki or filter by materialId
 */
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.stockProduct", "view");
  if (error) return error;

  try {
    if (!session.user.company?.id) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId") ?? undefined;

    const tangkis = await tangkiService.getAllTangki(
      session.user.company.id,
      materialId,
    );

    return NextResponse.json(tangkis);
  } catch (error) {
    console.error("Error fetching tangki:", error);
    return NextResponse.json(
      { error: "Failed to fetch tangki" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/pt-pks/tangki
 * Create new tangki
 */
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.stockProduct", "create");
  if (error) return error;

  try {
    if (!session.user.company?.id) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = createTangkiSchema.parse(body);

    const tangki = await tangkiService.createTangki(
      session.user.company.id,
      validatedData,
    );

    return NextResponse.json(tangki, { status: 201 });
  } catch (error) {
    console.error("Error creating tangki:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create tangki" },
      { status: 500 },
    );
  }
}
