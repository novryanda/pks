import { requireAuthWithPermission } from "@/lib/api-auth";
import { masterJabatanService } from "@/server/services/pt-pks/master-jabatan.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/master-jabatan/[id] - Get jabatan by id
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "view");
    if (error) return error;

    try {
        const { id } = await params;
        const jabatan = await masterJabatanService.getJabatanById(id);
        return NextResponse.json({ jabatan });
    } catch (error: unknown) {
        console.error("Error fetching jabatan:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        return NextResponse.json(
            { error: "Failed to fetch jabatan" },
            { status: 500 }
        );
    }
}

import { Prisma } from "@prisma/client";

// ... existing imports ...

// PUT /api/pt-pks/master-jabatan/[id] - Update jabatan
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "edit");
    if (error) return error;

    try {
        const { id } = await params;
        const body = await request.json();
        const jabatan = await masterJabatanService.updateJabatan(id, body);

        return NextResponse.json({
            message: "Jabatan updated successfully",
            jabatan,
        });
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "ID sudah digunakan" },
                { status: 400 }
            );
        }

        console.error("Error updating jabatan:", error);

        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Failed to update jabatan" },
            { status: 500 }
        );
    }
}

// DELETE /api/pt-pks/master-jabatan/[id] - Delete jabatan
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "delete");
    if (error) return error;

    try {
        const { id } = await params;
        await masterJabatanService.deleteJabatan(id);
        return NextResponse.json({ message: "Jabatan deleted successfully" });
    } catch (error: unknown) {
        console.error("Error deleting jabatan:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Failed to delete jabatan" },
            { status: 500 }
        );
    }
}
