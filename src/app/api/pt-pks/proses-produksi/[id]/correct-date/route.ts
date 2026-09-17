import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { prosesProduksiService } from "@/server/services/pt-pks/proses-produksi.service";
import { koreksiTanggalProduksiSchema } from "@/server/schema/proses-produksi";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Internal server error";
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithPermission(
    "produksi.prosesProduksi",
    "edit"
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

    const body: unknown = await request.json();
    const validatedData = koreksiTanggalProduksiSchema.parse(body);

    const result = await prosesProduksiService.correctTanggalProduksi(
      params.id,
      companyId,
      validatedData
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error correcting production date:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
