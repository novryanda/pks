import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";
import { materialService } from "@/server/services/pt-pks/material.service";
import { updateMaterialHargaSchema } from "@/server/schema/material";

// PATCH /api/pt-pks/material/[id]/harga - Update harga material
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuthWithPermission("gudang.stockProduct", "edit");
    if (error) return error;

    try {
        const { id } = await params;
        const companyId = session.user.company?.id;

        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        // Verify material belongs to this company
        const existingMaterial = await db.material.findFirst({
            where: { id, companyId },
        });

        if (!existingMaterial) {
            return NextResponse.json({ error: "Material tidak ditemukan" }, { status: 404 });
        }

        const body = await request.json();
        const data = updateMaterialHargaSchema.parse(body);

        const updated = await materialService.updateMaterial(
            id,
            { hargaPerUnit: data.hargaPerUnit },
            { operator: session.user.name || session.user.email || "unknown" }
        );

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating material price:", error);
        return NextResponse.json(
            { error: error.message || "Gagal update harga material" },
            { status: 400 }
        );
    }
}
