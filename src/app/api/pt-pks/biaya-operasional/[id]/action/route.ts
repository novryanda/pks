import { requireAuthWithPermission, requirePermission } from "@/lib/api-auth";
import { biayaOperasionalService } from "@/server/services/pt-pks/biaya-operasional.service";
import { statusPengajuanBiayaActionSchema } from "@/server/schema/biaya-operasional";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = statusPengajuanBiayaActionSchema.parse(body);

    // Permission check based on action type
    const requiredAction =
      validated.action === "approve" || validated.action === "reject"
        ? "approve"
        : validated.action === "submit"
        ? "create"
        : "delete";

    const { error, session } = await requirePermission(
      "gudang.biayaOperasional",
      requiredAction
    );
    if (error) return error;

    const user = {
      username: session?.user?.name || session?.user?.email || "user",
      name: session?.user?.name || session?.user?.email || undefined,
    };

    const result = await biayaOperasionalService.handleAction(
      params.id,
      validated,
      user
    );

    return NextResponse.json(result);
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
