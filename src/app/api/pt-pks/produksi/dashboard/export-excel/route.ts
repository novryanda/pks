import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import * as XLSX from "xlsx";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";
import { stockProductRepository } from "@/server/repositories/stock-product.repository";
import { prosesProduksiService } from "@/server/services/pt-pks/proses-produksi.service";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.company?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get("date");
        if (!dateStr) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        const date = new Date(dateStr);
        const companyId = session.user.company.id;
        const materialId = searchParams.get("materialId");

        // 1. Fetch TBS Statistics
        const tbsMaterial = await db.material.findFirst({
            where: {
                companyId,
                OR: [
                    { name: { contains: "TBS", mode: "insensitive" } },
                    { code: { contains: "TBS", mode: "insensitive" } }
                ]
            }
        });

        let stockTbs: any = {
            tbsHariIni: 0,
            tbsBulanIni: 0,
            tbsPeriode: 0,
            tbsMasukTahunIni: 0,
            stockTBS: 0,
        };
        if (tbsMaterial) {
            const stats = await penerimaanTBSService.getTBSStatistics(companyId, tbsMaterial.id, { startDate: date, endDate: date });
            stockTbs = stats as any;
        }

        // 2. Fetch Stock Product Summary
        const stockProduct = await stockProductRepository.getSummary(companyId, {
            materialId: materialId && materialId !== "all" ? materialId : undefined,
            startDate: date,
            endDate: date,
        });

        if (stockProduct.materials) {
            stockProduct.materials = stockProduct.materials.filter((m: any) =>
                !m.materialName.toLowerCase().includes("tbs")
            );
        }

        // 3. Fetch Production Summary
        const materialOutputId = materialId && materialId !== "all" ? materialId : "all";
        const production = await prosesProduksiService.getProductionSummaryReport(
            companyId,
            date,
            date,
            materialOutputId
        );

        // 4. Fetch Delivery Summary
        const delivery = await pengirimanProductService.getConsolidatedSummary(
            companyId,
            {
                date: date,
                materialId: materialId && materialId !== "all" ? materialId : undefined,
            }
        );

        // --- PREPARE EXCEL DATA ---
        const workbook = XLSX.utils.book_new();
        const dataRows: any[] = [];

        // Header Section
        dataRows.push(["LAPORAN HARIAN PRODUKSI"]);
        dataRows.push([`Per Tanggal: ${dateStr}`]);
        dataRows.push([`Perusahaan: ${session.user.company.name}`]);
        dataRows.push([]);

        // I. RINGKASAN STOK TBS
        dataRows.push(["I. RINGKASAN STOK TBS"]);
        dataRows.push(["Sisa Stok Kemarin", "Masuk Hari Ini", "Total Stok Saat Ini", "Masuk Bulan Ini", "Masuk Tahun Ini"]);
        dataRows.push([
            stockTbs.tbsHariIni,
            stockTbs.tbsBulanIni,
            stockTbs.stockTBS,
            stockTbs.tbsPeriode,
            stockTbs.tbsMasukTahunIni
        ]);
        dataRows.push([]);

        // II. RINGKASAN PROSES PRODUKSI
        dataRows.push(["II. RINGKASAN PROSES PRODUKSI"]);
        dataRows.push(["Parameter", "HI", "BI", "TI"]);

                let globalProd, products;
                if ('global' in production && 'products' in production) {
                    globalProd = production.global;
                    products = production.products;
                } else {
                    globalProd = production;
                    products = undefined;
                }
                dataRows.push(["TBS Diolah (kg)", globalProd.day.totalInput, globalProd.month.totalInput, globalProd.year.totalInput]);

                if (products) {
                        products.forEach((product: any) => {
                                dataRows.push([product.materialName, product.day.totalProduksi, product.month.totalProduksi, product.year.totalProduksi]);
                                dataRows.push(["Rendemen (%)", product.day.totalRendemen, product.month.totalRendemen, product.year.totalRendemen]);
                        });
                }
        dataRows.push([]);

        // III. RINGKASAN STOK PRODUK & TANGKI
        dataRows.push(["III. RINGKASAN STOK PRODUK & TANGKI"]);
        dataRows.push(["Material", "Total Sisa Stok (kg)", "Rincian Tangki"]);

        if (stockProduct.materials) {
            stockProduct.materials.forEach((mat: any) => {
                const tankDetail = mat.tanks?.map((t: any) => `${t.namaTangki}: ${t.isiPadaTanggal.toLocaleString("id-ID")} kg`).join(", ") || "-";
                dataRows.push([`${mat.materialName} (${mat.satuan})`, mat.netBalance, tankDetail]);
            });
        }
        dataRows.push([]);

        // IV. REKAPITULASI PENGIRIMAN
        dataRows.push(["IV. REKAPITULASI PENGIRIMAN"]);

        if (delivery) {
            const groupedDelivery: Record<string, any[]> = {};
            delivery.forEach((item: any) => {
                if (!groupedDelivery[item.materialName]) {
                    groupedDelivery[item.materialName] = [];
                }
                (groupedDelivery[item.materialName] ?? []).push(item);
            });

            Object.entries(groupedDelivery).forEach(([materialName, items]) => {
                dataRows.push([`Produk: ${materialName}`]);
                dataRows.push(["Buyer", "No. Kontrak", "No. PO", "No. DO", "Jml Kontrak", "HI", "BI", "TI", "Sisa"]);

                items.forEach((item: any) => {
                    const noPO = item.contractCustomFields && Array.isArray(item.contractCustomFields)
                        ? (item.contractCustomFields.find((f: any) => f.fieldName === "Nomor PO")?.fieldValue || "-")
                        : "-";
                    const noDO = item.contractCustomFields && Array.isArray(item.contractCustomFields)
                        ? (item.contractCustomFields.find((f: any) => f.fieldName === "Nomor DO")?.fieldValue || "-")
                        : "-";

                    dataRows.push([
                        item.buyerName,
                        item.contractNumber,
                        noPO,
                        noDO,
                        item.contractQuantity,
                        item.hi,
                        item.bi,
                        item.ti,
                        item.remaining
                    ]);
                });

                // Total Row for this Product
                const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.contractQuantity || 0), 0);
                const totalHI = items.reduce((sum: number, item: any) => sum + (item.hi || 0), 0);
                const totalBI = items.reduce((sum: number, item: any) => sum + (item.bi || 0), 0);
                const totalTI = items.reduce((sum: number, item: any) => sum + (item.ti || 0), 0);
                const totalRemaining = items.reduce((sum: number, item: any) => sum + (item.remaining || 0), 0);

                dataRows.push([
                    `TOTAL ${materialName.toUpperCase()}`,
                    "",
                    "",
                    "",
                    totalQuantity,
                    totalHI,
                    totalBI,
                    totalTI,
                    totalRemaining
                ]);
                dataRows.push([]); // Gap between products
            });
        }

        const worksheet = XLSX.utils.aoa_to_sheet(dataRows);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Summary");

        // Format column widths
        const colWidths = [
            { wch: 25 }, // Buyer / Param
            { wch: 20 }, // HI / Produk
            { wch: 20 }, // BI / No Kontrak
            { wch: 20 }, // TI / No PO
            { wch: 20 }, // No DO
            { wch: 15 }, // Jml Kontrak
            { wch: 12 }, // HI
            { wch: 12 }, // BI
            { wch: 12 }, // TI
            { wch: 15 }, // Sisa
        ];
        worksheet["!cols"] = colWidths;

        // Write to buffer
        const excelBuffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
        });

        const filename = `Laporan_Dashboard_Produksi_${dateStr}.xlsx`;

        return new NextResponse(excelBuffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Error generating Production Dashboard Excel:", error);
        return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
    }
}
