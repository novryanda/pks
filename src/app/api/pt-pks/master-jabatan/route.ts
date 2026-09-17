import { requireAuthWithPermission } from "@/lib/api-auth";
import { masterJabatanService } from "@/server/services/pt-pks/master-jabatan.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/master-jabatan - Get all jabatan
export async function GET(request: Request) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "view");
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);

        // Get active list for dropdown
        if (searchParams.get("activeList") === "true") {
            const activeList = await masterJabatanService.getActiveList();
            return NextResponse.json({ data: activeList });
        }

        const search = searchParams.get("search") || undefined;
        const isActive = searchParams.get("isActive");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const result = await masterJabatanService.getJabatan({
            search,
            isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
            page,
            limit,
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("Error fetching jabatan:", error);
        return NextResponse.json(
            { error: "Failed to fetch jabatan" },
            { status: 500 }
        );
    }
}

import { Prisma } from "@prisma/client";

// ... existing imports ...

// POST /api/pt-pks/master-jabatan - Create new jabatan
export async function POST(request: Request) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "create");
    if (error) return error;

    try {
        const body = await request.json();
        const jabatan = await masterJabatanService.createJabatan(body);

        return NextResponse.json({
            message: "Jabatan created successfully",
            jabatan,
        });
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "ID sudah digunakan" },
                { status: 400 }
            );
        }

        console.error("Error creating jabatan:", error);

        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { error: "Failed to create jabatan" },
            { status: 500 }
        );
    }
}
