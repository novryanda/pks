import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { purchaseRequestService } from "@/server/services/pt-pks/purchase-request.service";
import { purchaseRequestSchema } from "@/server/schema/purchase-request";
import { StatusPurchaseRequest, TipePembelianPR } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission(
    "gudang.purchaseRequest",
    "view",
  );
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as StatusPurchaseRequest | null;
    const tipePembelian = searchParams.get(
      "tipePembelian",
    ) as TipePembelianPR | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters: any = {};
    if (status) filters.status = status;
    if (tipePembelian) filters.tipePembelian = tipePembelian;
    const parsedStartDate = parseJakartaDateBoundary(startDate);
    const parsedEndDate = parseJakartaDateBoundary(endDate, { endOfDay: true });
    if (parsedStartDate) filters.startDate = parsedStartDate;
    if (parsedEndDate) filters.endDate = parsedEndDate;

    const prs = await purchaseRequestService.getAll(companyId, filters);
    return NextResponse.json(prs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission(
    "gudang.purchaseRequest",
    "create",
  );
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validatedData = purchaseRequestSchema.parse(body);

    const pr = await purchaseRequestService.create(companyId, validatedData);
    return NextResponse.json(pr, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
