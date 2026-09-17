import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";
import {
    parseLaporanHasilTimbanganSort,
    sortLaporanHasilTimbangan,
} from "@/lib/laporan-hasil-timbangan-sort";

const matchesSearch = (item: any, keyword: string) => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return true;

    const searchableText = [
        item.nomorPenerimaan,
        item.supplier?.companyName?.trim() || item.supplier?.ownerName || "",
        item.operatorPenimbang || "",
        item.transporter?.nomorKendaraan || "",
        item.transporter?.namaSupir || "",
        item.lokasiKebun || "",
        item.jenisBuah || "",
        item.vendorBongkar?.name || "",
        item.selectedVendorBongkarBank?.bankName || "",
        item.selectedVendorBongkarBank?.accountNumber || "",
    ]
        .join(" ")
        .toLowerCase();

    return searchableText.includes(normalizedKeyword);
};

export async function GET(request: Request) {
    const { error, session } = await requireAuthWithPermission("supplyChain.penerimaanTbs", "view");
    if (error) return error;

    try {
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        // Parse query parameters for date filter
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const search = searchParams.get("search") || "";
        const { sortBy, sortDirection } = parseLaporanHasilTimbanganSort(
            searchParams.get("sortBy"),
            searchParams.get("sortDirection")
        );

        // Build where clause
        const where: {
            companyId: string;
            beratTarra: { gt: number };
            tanggalTerima?: { gte?: Date; lte?: Date };
        } = {
            companyId,
            beratTarra: { gt: 0 }, // Only completed weighing (has tarra)
        };

        if (startDate || endDate) {
            where.tanggalTerima = {};
            if (startDate) {
                where.tanggalTerima.gte = new Date(startDate);
            }
            if (endDate) {
                // Set end date to end of day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.tanggalTerima.lte = end;
            }
        }

        const data = await db.penerimaanTBS.findMany({
            where,
            include: {
                supplier: {
                    select: {
                        ownerName: true,
                        companyName: true,
                        npwp: true,
                    },
                },
                transporter: {
                    select: {
                        nomorKendaraan: true,
                        namaSupir: true,
                    },
                },
                material: {
                    select: {
                        name: true,
                        kategori: { select: { name: true } },
                        satuan: { select: { name: true } },
                    },
                },
                company: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
                vendorBongkar: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        tipe: true,
                    },
                },
            },
            orderBy: { tanggalTerima: "desc" },
        });

        const filteredData = data.filter((item) => matchesSearch(item, search));
        return NextResponse.json(
            sortLaporanHasilTimbangan(filteredData, sortBy, sortDirection)
        );
    } catch (error) {
        console.error("Error fetching export data:", error);
        return NextResponse.json(
            { error: "Failed to fetch export data" },
            { status: 500 }
        );
    }
}
