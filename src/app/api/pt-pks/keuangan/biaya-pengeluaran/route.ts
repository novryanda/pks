import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { biayaPengeluaranService } from "@/server/services/pt-pks/biaya-pengeluaran.service";
import { createBiayaPengeluaranSchema, biayaPengeluaranQuerySchema } from "@/server/schema/keuangan";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
    const { error, session } = await requireAuthWithPermission("keuangan.biayaPengeluaran", "view");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company not found" }, { status: 400 });
        }

        const searchParams = req.nextUrl.searchParams;
        const summary = searchParams.get("summary");

        // Parse filter params
        const filters = {
            startDate: searchParams.get("startDate") || undefined,
            endDate: searchParams.get("endDate") || undefined,
            kategoriBiaya: searchParams.get("kategoriBiaya") || undefined,
            status: searchParams.get("status") || undefined,
            periodeBulan: searchParams.get("periodeBulan") ? parseInt(searchParams.get("periodeBulan")!, 10) : undefined,
            periodeTahun: searchParams.get("periodeTahun") ? parseInt(searchParams.get("periodeTahun")!, 10) : undefined,
        };

        // Validate filters
        const validatedFilters = biayaPengeluaranQuerySchema.parse(filters);

        // If summary=true, return summary by kategori
        if (summary === "true") {
            const summaryData = await biayaPengeluaranService.getSummary(companyId, {
                startDate: validatedFilters.startDate as string | undefined,
                endDate: validatedFilters.endDate as string | undefined,
            });
            return NextResponse.json(summaryData);
        }

        const data = await biayaPengeluaranService.getAll(companyId, validatedFilters);
        return NextResponse.json(data);
    } catch (err) {
        if (err instanceof ZodError) {
            return NextResponse.json({ error: err.errors }, { status: 400 });
        }
        console.error("Error fetching biaya pengeluaran:", err);
        return NextResponse.json({ error: "Failed to fetch biaya pengeluaran" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error, session } = await requireAuthWithPermission("keuangan.biayaPengeluaran", "create");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company not found" }, { status: 400 });
        }

        const body = await req.json();

        // Validate input using schema
        const validated = createBiayaPengeluaranSchema.parse(body);

        const result = await biayaPengeluaranService.create({
            ...validated,
            companyId,
            dibuatOleh: session.user.name || session.user.email || "Unknown",
        });

        return NextResponse.json(result, { status: 201 });
    } catch (err) {
        if (err instanceof ZodError) {
            return NextResponse.json({ error: err.errors[0]?.message || "Validation error" }, { status: 400 });
        }
        console.error("Error creating biaya pengeluaran:", err);
        return NextResponse.json({ error: "Failed to create biaya pengeluaran" }, { status: 500 });
    }
}
