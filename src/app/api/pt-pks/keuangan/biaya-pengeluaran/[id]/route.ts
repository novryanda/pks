import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { biayaPengeluaranService } from "@/server/services/pt-pks/biaya-pengeluaran.service";
import { updateBiayaPengeluaranSchema } from "@/server/schema/keuangan";
import { ZodError } from "zod";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuthWithPermission("keuangan.biayaPengeluaran", "view");
    if (error) return error;

    try {
        const { id } = await params;
        const data = await biayaPengeluaranService.getById(id);

        if (!data) {
            return NextResponse.json({ error: "Biaya not found" }, { status: 404 });
        }

        // Verify same company
        if (data.companyId !== session.user.company?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Error fetching biaya:", err);
        return NextResponse.json({ error: "Failed to fetch biaya" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("keuangan.biayaPengeluaran", "edit");
    if (error) return error;

    try {
        const { id } = await params;
        const body = await req.json();

        // Validate input
        const validated = updateBiayaPengeluaranSchema.parse(body);

        const result = await biayaPengeluaranService.update(id, validated);
        return NextResponse.json(result);
    } catch (err) {
        if (err instanceof ZodError) {
            return NextResponse.json({ error: err.errors[0]?.message || "Validation error" }, { status: 400 });
        }
        console.error("Error updating biaya:", err);
        return NextResponse.json({ error: "Failed to update biaya" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("keuangan.biayaPengeluaran", "delete");
    if (error) return error;

    try {
        const { id } = await params;
        await biayaPengeluaranService.delete(id);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Error deleting biaya:", err);
        return NextResponse.json({ error: "Failed to delete biaya" }, { status: 500 });
    }
}

// PATCH for status changes (mark as paid, reactivate)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("keuangan.biayaPengeluaran", "edit");
    if (error) return error;

    try {
        const { id } = await params;
        const body = await req.json();
        const { action } = body;

        let result;
        switch (action) {
            case "markAsPaid":
                result = await biayaPengeluaranService.markAsPaid(id);
                break;
            case "reactivate":
                result = await biayaPengeluaranService.reactivate(id);
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error("Error updating biaya status:", err);
        return NextResponse.json({ error: "Failed to update biaya status" }, { status: 500 });
    }
}
