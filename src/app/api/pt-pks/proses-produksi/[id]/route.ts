import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { prosesProduksiService } from "@/server/services/pt-pks/proses-produksi.service";
import {
  updateProsesProduksiSchema,
  updateStatusProsesProduksiSchema,
} from "@/server/schema/proses-produksi";

/**
 * GET /api/pt-pks/proses-produksi/[id]
 * Get proses produksi by id
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("produksi.prosesProduksi", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const result = await prosesProduksiService.getProsesProduksiById(
      params.id,
      companyId
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching proses produksi:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message === "Proses produksi tidak ditemukan" ? 404 : 500 }
    );
  }
}

/**
 * PUT /api/pt-pks/proses-produksi/[id]
 * Update proses produksi
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("produksi.prosesProduksi", "edit");
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
    const validatedData = updateProsesProduksiSchema.parse(body);

    const result = await prosesProduksiService.updateProsesProduksi(
      params.id,
      companyId,
      validatedData
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating proses produksi:", error);
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pt-pks/proses-produksi/[id]
 * Update status proses produksi
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("produksi.prosesProduksi", "edit");
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
    const validatedData = updateStatusProsesProduksiSchema.parse(body);

    const result = await prosesProduksiService.updateStatusProsesProduksi(
      params.id,
      companyId,
      validatedData.status
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating status proses produksi:", error);
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pt-pks/proses-produksi/[id]
 * Delete proses produksi
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission("produksi.prosesProduksi", "delete");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    await prosesProduksiService.deleteProsesProduksi(params.id, companyId);

    return NextResponse.json({ message: "Proses produksi berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting proses produksi:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
