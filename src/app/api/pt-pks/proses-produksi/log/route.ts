import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { prosesProduksiService } from "@/server/services/pt-pks/proses-produksi.service";
import { getLogProsesProduksiQuerySchema } from "@/server/schema/proses-produksi";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Internal server error";
};

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission(
    "produksi.prosesProduksi",
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
    const query = {
      tanggalMulai: searchParams.get("tanggalMulai") ?? undefined,
      tanggalAkhir: searchParams.get("tanggalAkhir") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1"),
      limit: parseInt(searchParams.get("limit") ?? "10"),
    };

    const validatedQuery = getLogProsesProduksiQuerySchema.parse(query);
    const result = await prosesProduksiService.getLogProsesProduksi(
      companyId,
      validatedQuery
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error fetching log produksi:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
