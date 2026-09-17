import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { PembayaranSupplierDocument, type PembayaranSupplierData } from "@/lib/pdf/pt-pks/pembayaran-supplier-pdf";
import React from "react";

export async function GET(request: Request) {
    const { error, session } = await requireAuthWithPermission("supplyChain.pembayaranSupplier", "view");
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
        const supplierId = searchParams.get("supplierId");
        const id = searchParams.get("id"); // For single item export
        const startDateBoundary = parseJakartaDateBoundary(startDate);
        const endDateBoundary = parseJakartaDateBoundary(endDate, { endOfDay: true });

        // Build where clause
        const where: Prisma.PenerimaanTBSWhereInput = {
            companyId,
            status: "COMPLETED",
        };

        if (id) {
            where.id = id;
        } else {
            if (supplierId && supplierId !== "all") {
                where.supplierId = supplierId;
            }

            if (startDate || endDate) {
                where.tanggalTerima = {};
                if (startDateBoundary) {
                    where.tanggalTerima.gte = startDateBoundary;
                }
                if (endDateBoundary) {
                    where.tanggalTerima.lte = endDateBoundary;
                }
            }
        }

        const data = await db.penerimaanTBS.findMany({
            where,
            include: {
                supplier: {
                    select: {
                        ownerName: true,
                        type: true,
                    },
                },
                material: {
                    select: {
                        name: true,
                    },
                },
                transporter: {
                    select: {
                        nomorKendaraan: true,
                    },
                },
                company: {
                    select: {
                        name: true,
                    },
                },
                vendorBongkar: true,
            },
            orderBy: { tanggalTerima: "desc" },
        });

        if (data.length === 0) {
            return NextResponse.json({ error: "No data found to export" }, { status: 404 });
        }

        const pdfData: PembayaranSupplierData[] = data.map((item) => ({
            id: item.id,
            nomorPenerimaan: item.nomorPenerimaan,
            tanggalTerima: item.tanggalTerima.toISOString(),
            waktuTimbangBruto: item.waktuTimbangBruto?.toISOString() ?? null,
            waktuTimbangTarra: item.waktuTimbangTarra?.toISOString() ?? null,
            lokasiKebun: item.lokasiKebun,
            jenisBuah: item.jenisBuah,
            supplier: item.supplier,
            transporter: item.transporter,
            material: item.material,
            beratBruto: item.beratBruto,
            beratTarra: item.beratTarra,
            beratNetto2: item.beratNetto2,
            hargaPerKg: item.hargaPerKg,
            totalBayar: item.totalBayar,
            nilaiPpn: item.nilaiPpn,
            nilaiPph: item.nilaiPph,
            jumlahBayarFinal: item.jumlahBayarFinal,
            upahBongkar: item.upahBongkar,
            totalUpahBongkar: item.totalUpahBongkar,
            company: item.company,
        }));

        // Generate PDF
        const pdfBuffer = await renderToBuffer(
            <PembayaranSupplierDocument
                data={pdfData}
                startDate={startDate ?? undefined}
                endDate={endDate ?? undefined}
                createdByName={session.user.name ?? undefined}
                diperiksaOleh="Marjefri Fajriyan"
                diperiksaJabatan="KTU Mill"
                diketahuiOleh="BOSLEN TAMBAH"
                diketahuiJabatan="MILL MANAGER"
            />
        );

        // Return PDF response
        const filename = id
            ? `Pembayaran_${data[0]!.nomorPenerimaan}.pdf`
            : `Laporan_Pembayaran_Supplier_${startDate ?? 'all'}_to_${endDate ?? 'all'}.pdf`;

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
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

