import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { hutangService } from "@/server/services/pt-pks/hutang.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("keuangan.hutangSupplier", "view");
  if (error) return error;

  try {
    const { id } = await params;
    const hutang = await hutangService.getById(id, session.user.company!.id);

    return NextResponse.json(hutang);
  } catch (error) {
    console.error("Error fetching hutang:", error);
    return NextResponse.json(
      { error: "Failed to fetch hutang" },
      { status: 500 }
    );
  }
}
