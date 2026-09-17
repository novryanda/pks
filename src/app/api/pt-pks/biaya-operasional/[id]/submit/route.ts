import { requirePermission } from "@/lib/api-auth";
import { biayaOperasionalService } from "@/server/services/pt-pks/biaya-operasional.service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requirePermission(
    "gudang.biayaOperasional",
    "create"
  );
  if (error) return error;

  try {
    const user = {
      username: session?.user?.name || session?.user?.email || "user",
      name: session?.user?.name || session?.user?.email || undefined,
    };

    const result = await biayaOperasionalService.handleAction(
      params.id,
      { action: "submit" },
      user
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
