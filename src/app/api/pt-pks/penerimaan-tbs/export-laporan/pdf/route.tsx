import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { LaporanHasilTimbanganDocument } from "@/lib/pdf/pt-pks/laporan-hasil-timbangan-pdf";
import {
    parseLaporanHasilTimbanganSort,
    sortLaporanHasilTimbangan,
} from "@/lib/laporan-hasil-timbangan-sort";
import React from "react";

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

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const showBongkar = searchParams.get("showBongkar") === "true";
        const search = searchParams.get("search") || "";
        const { sortBy, sortDirection } = parseLaporanHasilTimbanganSort(
            searchParams.get("sortBy"),
            searchParams.get("sortDirection")
        );

        // Build where clause
        const where: any = {
            companyId,
            beratTarra: { gt: 0 },
        };

        if (startDate || endDate) {
            where.tanggalTerima = {};
            if (startDate) {
                where.tanggalTerima.gte = new Date(startDate);
            }
            if (endDate) {
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
        const filteredData = sortLaporanHasilTimbangan(
            data.filter((item) => matchesSearch(item, search)),
            sortBy,
            sortDirection
        );

        // Generate PDF
        const pdfBuffer = await renderToBuffer(
            <LaporanHasilTimbanganDocument
                data={filteredData as any}
                startDate={startDate || undefined}
                endDate={endDate || undefined}
                createdByName={session.user.name || undefined}
                diperiksaOleh="Marjefri Fajriyan"
                diperiksaJabatan="KTU Mill"
                diketahuiOleh="BOSLEN TAMBAH"
                diketahuiJabatan="MILL MANAGER"
                showBongkar={showBongkar}
            />
        );

        // Return PDF response
        return new NextResponse(pdfBuffer as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Laporan_Hasil_Timbangan_${startDate || 'all'}_${endDate || 'all'}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Error generating PDF:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
