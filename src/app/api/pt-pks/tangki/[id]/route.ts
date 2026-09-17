import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { tangkiService } from "@/server/services/pt-pks/tangki.service";
import { updateTangkiSchema } from "@/server/schema/tangki";

/**
 * GET /api/pt-pks/tangki/[id]
 * Get tangki by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error, session } = await requireAuthWithPermission("gudang.stockProduct", "view");
  if (error) return error;

  try {
    if (!session.user.company?.id) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 403 },
      );
    }

    const tangki = await tangkiService.getTangkiById(
      params.id,
      session.user.company.id,
    );

    return NextResponse.json(tangki);
  } catch (error) {
    console.error("Error fetching tangki:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to fetch tangki" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/pt-pks/tangki/[id]
 * Update tangki
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error, session } = await requireAuthWithPermission("gudang.stockProduct", "edit");
  if (error) return error;

  try {
    if (!session.user.company?.id) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = updateTangkiSchema.parse(body);

    const tangki = await tangkiService.updateTangki(
      params.id,
      session.user.company.id,
      validatedData,
    );

    return NextResponse.json(tangki);
  } catch (error) {
    console.error("Error updating tangki:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update tangki" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/pt-pks/tangki/[id]
 * Delete tangki
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error, session } = await requireAuthWithPermission("gudang.stockProduct", "delete");
  if (error) return error;

  try {
    if (!session.user.company?.id) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 403 },
      );
    }

    await tangkiService.deleteTangki(params.id, session.user.company.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tangki:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to delete tangki" },
      { status: 500 },
    );
  }
}

