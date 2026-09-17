import { requireAuthWithPermission } from "@/lib/api-auth";
import { masterDivisiService } from "@/server/services/pt-pks/master-divisi.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/master-divisi - Get all divisi
export async function GET(request: Request) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "view");
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);

        // Get active list for dropdown
        if (searchParams.get("activeList") === "true") {
            const activeList = await masterDivisiService.getActiveList();
            return NextResponse.json({ data: activeList });
        }

        const search = searchParams.get("search") || undefined;
        const isActive = searchParams.get("isActive");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const result = await masterDivisiService.getDivisi({
            search,
            isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
            page,
            limit,
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("Error fetching divisi:", error);
        return NextResponse.json(
            { error: "Failed to fetch divisi" },
            { status: 500 }
        );
    }
}

import { Prisma } from "@prisma/client";

// ... existing imports ...

// POST /api/pt-pks/master-divisi - Create new divisi
export async function POST(request: Request) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "create");
    if (error) return error;

    try {
        const body = await request.json();
        const divisi = await masterDivisiService.createDivisi(body);

        return NextResponse.json({
            message: "Divisi created successfully",
            divisi,
        });
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "ID sudah digunakan" },
                { status: 400 }
            );
        }

        console.error("Error creating divisi:", error);

        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { error: "Failed to create divisi" },
            { status: 500 }
        );
    }
}
