import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { storeRequestService } from "@/server/services/pt-pks/store-request.service";
import { storeRequestSchema } from "@/server/schema/store-request";
import type { StatusStoreRequest } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

type StoreRequestFilters = {
  status?: StatusStoreRequest;
  divisi?: string;
  startDate?: Date;
  endDate?: Date;
};

// GET /api/pt-pks/store-request
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission(
    "gudang.storeRequest",
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
    const status = searchParams.get("status") as StatusStoreRequest | null;
    const divisi = searchParams.get("divisi");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters: StoreRequestFilters = {};
    if (status) filters.status = status;
    if (divisi) filters.divisi = divisi;
    const parsedStartDate = parseJakartaDateBoundary(startDate);
    const parsedEndDate = parseJakartaDateBoundary(endDate, { endOfDay: true });
    if (parsedStartDate) filters.startDate = parsedStartDate;
    if (parsedEndDate) filters.endDate = parsedEndDate;

    const storeRequests = await storeRequestService.getAll(companyId, filters);
    return NextResponse.json(storeRequests);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/pt-pks/store-request
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission(
    "gudang.storeRequest",
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

    const validatedData = storeRequestSchema.parse(await request.json());

    const sr = await storeRequestService.create(companyId, validatedData);
    return NextResponse.json(sr, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
