import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { prosesProduksiService } from "@/server/services/pt-pks/proses-produksi.service";
import {
  createProsesProduksiSchema,
  getProsesProduksiQuerySchema,
} from "@/server/schema/proses-produksi";

/**
 * GET /api/pt-pks/proses-produksi
 * Get all proses produksi with filters
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const query = {
      tanggalMulai: searchParams.get("tanggalMulai") || undefined,
      tanggalAkhir: searchParams.get("tanggalAkhir") || undefined,
      status: searchParams.get("status") || undefined,
      materialInputId: searchParams.get("materialInputId") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const validatedQuery = getProsesProduksiQuerySchema.parse(query);
    const result = await prosesProduksiService.getAllProsesProduksi(
      companyId,
      validatedQuery
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching proses produksi:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pt-pks/proses-produksi
 * Create new proses produksi
 */
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("produksi.prosesProduksi", "create");
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
    const validatedData = createProsesProduksiSchema.parse(body);

    const result = await prosesProduksiService.createProsesProduksi(
      companyId,
      validatedData
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating proses produksi:", error);
    
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
