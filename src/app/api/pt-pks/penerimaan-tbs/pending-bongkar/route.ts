import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";

// GET /api/pt-pks/penerimaan-tbs/pending-bongkar - Get list pending bongkar
export async function GET() {
    const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "view");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        // Get penerimaan yang sudah tarra tapi belum ada vendor bongkar
        const data = await db.penerimaanTBS.findMany({
            where: {
                companyId,
                status: "TIMBANG_TARRA",
                vendorBongkarId: null, // Belum ada vendor bongkar
            },
            include: {
                supplier: true,
                transporter: true,
                material: {
                    include: {
                        kategori: true,
                        satuan: true,
                    },
                },
            },
            orderBy: { tanggalTerima: "desc" },
        });

        return NextResponse.json(data);
    } catch (err) {
        console.error("Error fetching pending bongkar:", err);
        return NextResponse.json(
            { error: "Failed to fetch pending bongkar data" },
            { status: 500 }
        );
    }
}
