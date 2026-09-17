import { NextRequest, NextResponse } from "next/server";
import { pushWeight } from "@/server/lib/weighing-buffer";

/**
 * POST /api/weighing/receive
 * 
 * Endpoint receiver untuk vendor mengirim data penimbangan.
 * Vendor POST setiap kali ada penimbangan → data disimpan ke buffer.
 * 
 * Headers:
 *   X-API-Key: [API key dari env WEIGHING_API_KEY]
 * 
 * Body:
 *   { weight: number, timestamp: string (ISO 8601) }
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Validate API Key
        const apiKey = process.env.WEIGHING_API_KEY;
        if (apiKey) {
            const providedKey = request.headers.get("X-API-Key");
            if (providedKey !== apiKey) {
                return NextResponse.json(
                    {
                        status: "ERROR",
                        message: "API Key tidak valid",
                        code: "UNAUTHORIZED",
                    },
                    { status: 401 }
                );
            }
        }

        // 2. Parse body
        const body = await request.json();
        const { weight, timestamp } = body;

        // 3. Validate weight
        if (typeof weight !== "number" || isNaN(weight)) {
            return NextResponse.json(
                {
                    status: "ERROR",
                    message: "Field 'weight' wajib berupa angka",
                    code: "VALIDATION_ERROR",
                },
                { status: 400 }
            );
        }

        if (weight <= 0) {
            return NextResponse.json(
                {
                    status: "ERROR",
                    message: "Field 'weight' harus lebih dari 0",
                    code: "VALIDATION_ERROR",
                },
                { status: 400 }
            );
        }

        if (weight > 100000) {
            return NextResponse.json(
                {
                    status: "ERROR",
                    message: "Field 'weight' melebihi batas maksimum (100.000 kg)",
                    code: "VALIDATION_ERROR",
                },
                { status: 400 }
            );
        }

        // 4. Validate timestamp
        if (!timestamp) {
            return NextResponse.json(
                {
                    status: "ERROR",
                    message: "Field 'timestamp' wajib diisi (format ISO 8601)",
                    code: "VALIDATION_ERROR",
                },
                { status: 400 }
            );
        }

        const parsedTimestamp = new Date(timestamp);
        if (isNaN(parsedTimestamp.getTime())) {
            return NextResponse.json(
                {
                    status: "ERROR",
                    message: "Field 'timestamp' format tidak valid (gunakan ISO 8601)",
                    code: "VALIDATION_ERROR",
                },
                { status: 400 }
            );
        }

        // 5. Store to buffer
        pushWeight(weight, "kg", parsedTimestamp);

        const receivedAt = new Date().toISOString();
        console.log(`[Weighing] Received: ${weight} kg at ${timestamp} (received: ${receivedAt})`);

        // 6. Return success
        return NextResponse.json({
            status: "OK",
            message: "Data diterima",
            received_at: receivedAt,
        });
    } catch (error) {
        console.error("[Weighing] Error processing weight:", error);
        return NextResponse.json(
            {
                status: "ERROR",
                message: "Internal server error",
                code: "SERVER_ERROR",
            },
            { status: 500 }
        );
    }
}
