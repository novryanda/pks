import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";
import { z } from "zod";

// Schema untuk input bongkar
const inputBongkarSchema = z.object({
    penerimaanIds: z.array(z.string()).min(1, "Minimal 1 penerimaan harus dipilih"),
    vendorBongkarId: z.string().min(1, "Vendor bongkar harus dipilih"),
    upahBongkar: z.number().min(0, "Upah bongkar harus lebih dari 0"),
    selectedVendorBongkarBank: z.object({
        bankName: z.string(),
        accountNumber: z.string(),
        accountName: z.string(),
    }).optional().nullable(),
});

// POST /api/pt-pks/penerimaan-tbs/input-bongkar - Input bongkar batch
export async function POST(request: Request) {
    const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "edit");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const body = await request.json();
        const validatedData = inputBongkarSchema.parse(body);

        // Verify vendor bongkar exists and belongs to company
        const vendorBongkar = await db.vendorBongkar.findFirst({
            where: {
                id: validatedData.vendorBongkarId,
                companyId,
                status: "ACTIVE",
            },
        });

        if (!vendorBongkar) {
            return NextResponse.json(
                { error: "Vendor bongkar tidak ditemukan atau tidak aktif" },
                { status: 400 }
            );
        }

        // Update all selected penerimaan
        const updatePromises = validatedData.penerimaanIds.map(async (id) => {
            // Get current penerimaan
            const penerimaan = await db.penerimaanTBS.findFirst({
                where: {
                    id,
                    companyId,
                    status: "TIMBANG_TARRA",
                },
            });

            if (!penerimaan) {
                throw new Error(`Penerimaan ${id} tidak ditemukan atau status tidak valid`);
            }

            // Calculate total upah bongkar
            const totalUpahBongkar = penerimaan.beratNetto2 * validatedData.upahBongkar;

            // Update penerimaan
            return db.penerimaanTBS.update({
                where: { id },
                data: {
                    vendorBongkarId: validatedData.vendorBongkarId,
                    upahBongkar: validatedData.upahBongkar,
                    totalUpahBongkar,
                    selectedVendorBongkarBank: validatedData.selectedVendorBongkarBank ?? undefined,
                    status: "PENDING_HARGA",
                },
            });
        });

        const results = await Promise.all(updatePromises);

        return NextResponse.json({
            success: true,
            updated: results.length,
            message: `${results.length} penerimaan berhasil diupdate`,
        });
    } catch (err: unknown) {
        console.error("Error input bongkar:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to input bongkar";
        return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
        );
    }
}
