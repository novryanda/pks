import { NextResponse } from "next/server";
import { readWeight } from "@/server/lib/weighing-buffer";

/**
 * GET /api/weighing/read
 * 
 * Endpoint untuk frontend mengambil data berat terakhir dari buffer.
 * Data diisi oleh vendor melalui POST /api/weighing/receive.
 */
export async function GET() {
    try {
        const weightData = readWeight();

        if (!weightData) {
            return NextResponse.json({
                success: true,
                data: null,
                message: "Belum ada data dari timbangan. Pastikan vendor sudah mengirim data.",
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                weight: weightData.weight,
                unit: weightData.unit,
                timestamp: weightData.vendorTimestamp.toISOString(),
                receivedAt: weightData.receivedAt.toISOString(),
                isStale: weightData.isStale,
            },
        });
    } catch (error) {
        console.error("[Weighing] Error reading weight:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Gagal mengambil data timbangan",
                data: null,
            },
            { status: 500 }
        );
    }
}
