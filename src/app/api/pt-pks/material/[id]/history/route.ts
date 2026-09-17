import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { materialService } from "@/server/services/pt-pks/material.service";

// GET /api/pt-pks/material/[id]/history - Get material price history
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("gudang.stockProduct", "view");
    if (error) return error;

    try {
        const { id } = await params;
        const history = await materialService.getMaterialHargaHistory(id);
        return NextResponse.json(history);
    } catch (error: any) {
        console.error("Error fetching price history:", error);
        return NextResponse.json(
            { error: error.message || "Gagal mengambil riwayat harga" },
            { status: 400 }
        );
    }
}
