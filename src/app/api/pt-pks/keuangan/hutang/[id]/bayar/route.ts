import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { hutangService } from "@/server/services/pt-pks/hutang.service";
import { pembayaranHutangSchema } from "@/server/schema/keuangan";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("keuangan.hutangSupplier", "edit");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const validatedData = pembayaranHutangSchema.parse({
      ...body,
      hutangId: id,
      tanggalBayar: body.tanggalBayar ? new Date(body.tanggalBayar) : undefined,
    });

    const result = await hutangService.bayar(
      id,
      session.user.company!.id,
      validatedData,
      session.user.name!
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process payment" },
      { status: 500 }
    );
  }
}
