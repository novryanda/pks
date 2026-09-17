import { requireAuthWithPermission } from "@/lib/api-auth";
import { masterDivisiService } from "@/server/services/pt-pks/master-divisi.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/master-divisi/[id] - Get divisi by id
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "view");
    if (error) return error;

    try {
        const { id } = await params;
        const divisi = await masterDivisiService.getDivisiById(id);
        return NextResponse.json({ divisi });
    } catch (error: unknown) {
        console.error("Error fetching divisi:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        return NextResponse.json(
            { error: "Failed to fetch divisi" },
            { status: 500 }
        );
    }
}

import { Prisma } from "@prisma/client";

// ... existing imports ...

// PUT /api/pt-pks/master-divisi/[id] - Update divisi
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "edit");
    if (error) return error;

    try {
        const { id } = await params;
        const body = await request.json();
        const divisi = await masterDivisiService.updateDivisi(id, body);

        return NextResponse.json({
            message: "Divisi updated successfully",
            divisi,
        });
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "ID sudah digunakan" },
                { status: 400 }
            );
        }

        console.error("Error updating divisi:", error);

        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Failed to update divisi" },
            { status: 500 }
        );
    }
}

// DELETE /api/pt-pks/master-divisi/[id] - Delete divisi
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "delete");
    if (error) return error;

    try {
        const { id } = await params;
        await masterDivisiService.deleteDivisi(id);
        return NextResponse.json({ message: "Divisi deleted successfully" });
    } catch (error: unknown) {
        console.error("Error deleting divisi:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Failed to delete divisi" },
            { status: 500 }
        );
    }
}
