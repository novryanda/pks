import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanBarangService } from "@/server/services/pt-pks/penerimaan-barang.service";
import { penerimaanBarangSchema } from "@/server/schema/penerimaan-barang";
import { NextResponse } from "next/server";

// POST /api/pt-pks/penerimaan-barang/from-po
// Creates penerimaan barang from PO and automatically completes it (updates stock)
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.penerimaanBarang", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = penerimaanBarangSchema.parse(body);

    if (!validatedData.purchaseOrderId) {
      return NextResponse.json({ error: "Purchase Order ID wajib diisi" }, { status: 400 });
    }

    // Use the user's name as operator
    const operator = session.user.name ?? session.user.email ?? "System";

    const gr = await penerimaanBarangService.createAndCompleteFromPO(
      companyId,
      validatedData,
      operator
    );

    return NextResponse.json(gr, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
