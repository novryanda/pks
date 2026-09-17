import { db } from "@/server/db";
import { getJakartaDateKey, getJakartaDateParts, parseJakartaDateBoundary } from "@/lib/date-time";
import { materialRepository } from "@/server/repositories/material.repository";

export interface StockProductFilters {
    materialId?: string;
    startDate?: Date | string;
    endDate?: Date | string;
}

export const stockProductRepository = {
    /**
     * Get production and shipping summary directly from source tables
     * Now supports date range (startDate and endDate) for period-based accumulation
     */
    getSummary: async (companyId: string, filters?: StockProductFilters) => {
        const periodEndDate = filters?.endDate || filters?.startDate || new Date();
        const periodStartDate = filters?.startDate || periodEndDate;
        const periodStartKey = getJakartaDateKey(periodStartDate);
        const periodEndKey = getJakartaDateKey(periodEndDate);
        const endParts = getJakartaDateParts(periodEndDate);

        if (!periodStartKey || !periodEndKey || !endParts) {
            return {
                materials: [],
                stats: {
                    production: { period: 0, month: 0, year: 0 },
                    shipping: { period: 0, month: 0, year: 0 },
                    net: { period: 0, month: 0, year: 0 },
                },
            };
        }

        const startOfPeriod = parseJakartaDateBoundary(periodStartKey)!;
        const endOfPeriod = parseJakartaDateBoundary(periodEndKey, { endOfDay: true })!;

        // Check if this is a period (range) or single date
        const isPeriodMode = startOfPeriod.getTime() !== endOfPeriod.getTime() - 86399999; // Different dates

        // When in period mode, use the full period for month/year calculations
        // This means all 3 cards (Periode, Bulan, Tahun) show the same accumulated total
        const startOfMonth = isPeriodMode
            ? startOfPeriod
            : parseJakartaDateBoundary(`${endParts.year}-${String(endParts.month).padStart(2, "0")}-01`)!;
        const endOfMonth = endOfPeriod;

        const startOfYear = isPeriodMode
            ? startOfPeriod
            : parseJakartaDateBoundary(`${endParts.year}-01-01`)!;
        const endOfYear = endOfPeriod;

        // Get all materials for this company
        const materials = await db.material.findMany({
            where: {
                companyId,
                ...(filters?.materialId && { id: filters.materialId })
            },
            select: {
                id: true,
                code: true,
                name: true,
                hargaPerUnit: true,
                satuan: { select: { symbol: true } },
            },
            orderBy: { code: "asc" },
        });

        const buildProdWhere = (start: Date | null, end: Date) => ({
            prosesProduksi: {
                companyId,
                status: { in: ["IN_PROGRESS", "COMPLETED"] as any },
                tanggalProduksi: { ...(start && { gte: start }), lte: end },
            },
            ...(filters?.materialId && { materialOutputId: filters.materialId })
        });

        const buildShipWhere = (start: Date | null, end: Date) => ({
            companyId,
            status: "COMPLETED" as any,
            tanggalPengiriman: { ...(start && { gte: start }), lte: end },
            ...(filters?.materialId && { materialId: filters.materialId })
        });

        // Aggregate Source Tables (renamed from "today" to "period" for clarity)
        const [
            prodPeriod, prodMonth, prodYear,
            shipPeriod, shipMonth, shipYear
        ] = await Promise.all([
            db.hasilProduksi.groupBy({ by: ["materialOutputId"], where: buildProdWhere(startOfPeriod, endOfPeriod), _sum: { jumlahOutput: true } }),
            db.hasilProduksi.groupBy({ by: ["materialOutputId"], where: buildProdWhere(startOfMonth, endOfMonth), _sum: { jumlahOutput: true } }),
            db.hasilProduksi.groupBy({ by: ["materialOutputId"], where: buildProdWhere(startOfYear, endOfYear), _sum: { jumlahOutput: true } }),
            db.pengirimanProduct.groupBy({ by: ["materialId"], where: buildShipWhere(startOfPeriod, endOfPeriod), _sum: { beratNetto: true } }),
            db.pengirimanProduct.groupBy({ by: ["materialId"], where: buildShipWhere(startOfMonth, endOfMonth), _sum: { beratNetto: true } }),
            db.pengirimanProduct.groupBy({ by: ["materialId"], where: buildShipWhere(startOfYear, endOfYear), _sum: { beratNetto: true } }),
        ]);

        // Helper to sum up nested totals
        const calculateTotal = (data: any[], key: "_sum.jumlahOutput" | "_sum.beratNetto") => {
            return data.reduce((sum, item) => {
                const value = key === "_sum.jumlahOutput" ? item._sum.jumlahOutput : item._sum.beratNetto;
                return sum + (value || 0);
            }, 0);
        };

        const statsPeriodProd = calculateTotal(prodPeriod, "_sum.jumlahOutput");
        const statsPeriodShip = calculateTotal(shipPeriod, "_sum.beratNetto");
        const statsMonthProd = calculateTotal(prodMonth, "_sum.jumlahOutput");
        const statsMonthShip = calculateTotal(shipMonth, "_sum.beratNetto");
        const statsYearProd = calculateTotal(prodYear, "_sum.jumlahOutput");
        const statsYearShip = calculateTotal(shipYear, "_sum.beratNetto");

        // Get exact daily transactions for all tanks for this company (use period range)
        const tanks = await db.tangki.findMany({
            where: { companyId },
            include: {
                riwayatStockTangki: {
                    where: {
                        tanggalTransaksi: { gte: startOfPeriod, lte: endOfPeriod },
                    },
                    orderBy: [{ tanggalTransaksi: "asc" }, { id: "asc" }],
                }
            }
        });

        // Material card balances
        const materialSummary = await Promise.all(materials.map(async (material: typeof materials[number]) => {
            const dayProd = prodPeriod.find((p: any) => p.materialOutputId === material.id)?._sum.jumlahOutput || 0;
            const dayShip = shipPeriod.find((s: any) => s.materialId === material.id)?._sum.beratNetto || 0;
            const endingStockBalance = await materialRepository.getStockBalanceAtDate(
                companyId,
                material.id,
                endOfPeriod
            );

            // 1. Tanks Daily Movement
            const materialTanksDaily = tanks
                .filter(t => t.materialId === material.id)
                .map(t => ({
                    id: t.id,
                    namaTangki: t.namaTangki,
                    kapasitas: t.kapasitas,
                    isiPadaTanggal: t.riwayatStockTangki.reduce((sum, entry) => {
                        if (entry.tipeTransaksi === "KELUAR") return sum - entry.jumlah;
                        if (entry.tipeTransaksi === "TRANSFER") {
                            // In a transfer, if stockSesudah < stockSebelum, this tank lost stock
                            return (entry.stockSesudah < entry.stockSebelum) ? (sum - entry.jumlah) : (sum + entry.jumlah);
                        }
                        return sum + entry.jumlah;
                    }, 0),
                    materialId: material.id,
                    materialName: material.name,
                    satuan: material.satuan.symbol,
                }));

            const totalInTanksDaily = materialTanksDaily.reduce((sum, t) => sum + t.isiPadaTanggal, 0);

            // Harga per unit dan kalkulasi nilai
            const hargaPerUnit = material.hargaPerUnit || 0;
            // Use the material stock ledger as the single source of truth so
            // all materials, including TBS, match the KPI/dashboard balances.
            const netBalanceValue = Math.max(0, endingStockBalance);
            const nilaiTotal = netBalanceValue * hargaPerUnit;

            return {
                materialId: material.id,
                materialName: material.name,
                satuan: material.satuan.symbol,
                totalStock: netBalanceValue,
                dayProduction: dayProd,
                dayShipping: dayShip,
                // netPeriod represents the net movement (Prod - Ship) within the selected filter
                netPeriod: dayProd - dayShip,
                // netBalance follows stock ledger so opening balance/manual stock is included.
                netBalance: netBalanceValue,
                totalInTanks: totalInTanksDaily,
                tanks: materialTanksDaily,
                // Harga dan nilai
                hargaPerUnit,
                nilaiTotal,
            };
        }));

        return {
            materials: materialSummary,
            stats: {
                production: {
                    period: statsPeriodProd,  // Renamed from 'today' to 'period' for clarity
                    month: statsMonthProd,
                    year: statsYearProd,
                },
                shipping: {
                    period: statsPeriodShip,  // Renamed from 'today' to 'period' for clarity
                    month: statsMonthShip,
                    year: statsYearShip,
                },
                // Net results (Current range only)
                net: {
                    period: statsPeriodProd - statsPeriodShip,
                    month: statsMonthProd - statsMonthShip,
                    year: statsYearProd - statsYearShip,
                }
            }
        };
    },

    /**
     * Get combined history directly from HasilProduksi and PengirimanProduct
     */
    getHistory: async (companyId: string, filters?: StockProductFilters) => {
        const whereProd: any = {
            prosesProduksi: {
                companyId,
                status: { in: ["IN_PROGRESS", "COMPLETED"] as any },
            }
        };

        const whereShip: any = {
            companyId,
            status: "COMPLETED" as any,
        };

        if (filters?.startDate || filters?.endDate) {
            const startKey = getJakartaDateKey(filters.startDate);
            const endKey = getJakartaDateKey(filters.endDate || filters.startDate);

            const start = startKey ? parseJakartaDateBoundary(startKey) : null;
            const end = endKey ? parseJakartaDateBoundary(endKey, { endOfDay: true }) : null;

            if (start && end) {
                whereProd.prosesProduksi.tanggalProduksi = { gte: start, lte: end };
                whereShip.tanggalPengiriman = { gte: start, lte: end };
            }
        }

        if (filters?.materialId) {
            whereProd.materialOutputId = filters.materialId;
            whereShip.materialId = filters.materialId;
        }

        const [productions, shippings] = await Promise.all([
            db.hasilProduksi.findMany({
                where: whereProd,
                include: {
                    prosesProduksi: true,
                    materialOutput: { include: { satuan: true } }
                },
                orderBy: { prosesProduksi: { tanggalProduksi: "desc" } }
            }),
            db.pengirimanProduct.findMany({
                where: whereShip,
                include: {
                    material: { include: { satuan: true } },
                    contract: true
                },
                orderBy: { tanggalPengiriman: "desc" }
            })
        ]);

        const history = [
            ...productions.map(p => ({
                id: `prod-${p.id}`,
                tanggalTransaksi: p.prosesProduksi.tanggalProduksi,
                tipe: "IN",
                jumlah: p.jumlahOutput,
                material: p.materialOutput.name,
                satuan: p.materialOutput.satuan.symbol,
                referensi: p.prosesProduksi.nomorProduksi,
                keterangan: `Hasil Produksi (${p.prosesProduksi.status})`
            })),
            ...shippings.map(s => ({
                id: `ship-${s.id}`,
                tanggalTransaksi: s.tanggalPengiriman,
                tipe: "OUT",
                jumlah: s.beratNetto,
                material: s.material?.name || "Unknown",
                satuan: s.material?.satuan?.symbol || "-",
                referensi: s.contract?.contractNumber || s.contractId || "-",
                keterangan: "Pengiriman Product"
            }))
        ];

        return history.sort((a, b) =>
            new Date(b.tanggalTransaksi).getTime() - new Date(a.tanggalTransaksi).getTime()
        );
    },

    /**
     * Get daily trend data for Stock Product visualization
     * Returns data per date: produksi, pengiriman, sisa stock
     */
    getDailyTrend: async (
        companyId: string,
        materialId: string,
        startDate: Date,
        endDate: Date
    ): Promise<Array<{
        date: string;
        produksi: number;
        pengiriman: number;
        sisaStock: number;
    }>> => {
        // Get all dates in range
        const dates: Date[] = [];
        const currentDate = new Date(startDate);
        const end = new Date(endDate);

        while (currentDate <= end) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Get production output grouped by date
        const produksiData = await db.hasilProduksi.groupBy({
            by: ["prosesProduksiId"],
            where: {
                materialOutputId: materialId,
                prosesProduksi: {
                    companyId,
                    status: { in: ["IN_PROGRESS", "COMPLETED"] },
                    tanggalProduksi: {
                        gte: startDate,
                        lte: end,
                    },
                },
            },
            _sum: {
                jumlahOutput: true,
            },
        });

        // Get production with dates
        const produksiWithDates = await db.hasilProduksi.findMany({
            where: {
                materialOutputId: materialId,
                prosesProduksi: {
                    companyId,
                    status: { in: ["IN_PROGRESS", "COMPLETED"] },
                    tanggalProduksi: {
                        gte: startDate,
                        lte: end,
                    },
                },
            },
            include: {
                prosesProduksi: {
                    select: { tanggalProduksi: true },
                },
            },
        });

        // Get shipping grouped by date
        const pengirimanData = await db.pengirimanProduct.findMany({
            where: {
                companyId,
                materialId,
                status: "COMPLETED",
                tanggalPengiriman: {
                    gte: startDate,
                    lte: end,
                },
            },
            select: {
                tanggalPengiriman: true,
                beratNetto: true,
            },
        });

        // Get initial cumulative values before startDate
        const initialProduksi = await db.hasilProduksi.aggregate({
            where: {
                materialOutputId: materialId,
                prosesProduksi: {
                    companyId,
                    status: { in: ["IN_PROGRESS", "COMPLETED"] },
                    tanggalProduksi: {
                        lt: startDate,
                    },
                },
            },
            _sum: {
                jumlahOutput: true,
            },
        });

        const initialPengiriman = await db.pengirimanProduct.aggregate({
            where: {
                companyId,
                materialId,
                status: "COMPLETED",
                tanggalPengiriman: {
                    lt: startDate,
                },
            },
            _sum: {
                beratNetto: true,
            },
        });

        let cumulativeStock = (initialProduksi._sum.jumlahOutput || 0) - (initialPengiriman._sum.beratNetto || 0);

        return dates.map((date) => {
            const dateStr = getJakartaDateKey(date)!;

            // Sum produksi for this date
            const produksi = produksiWithDates
                .filter((p) => {
                    const entryDate = getJakartaDateKey(p.prosesProduksi.tanggalProduksi);
                    return entryDate === dateStr;
                })
                .reduce((sum, p) => sum + p.jumlahOutput, 0);

            // Sum pengiriman for this date
            const pengiriman = pengirimanData
                .filter((p) => {
                    const entryDate = getJakartaDateKey(p.tanggalPengiriman);
                    return entryDate === dateStr;
                })
                .reduce((sum, p) => sum + (p.beratNetto || 0), 0);

            // Update cumulative stock
            cumulativeStock = cumulativeStock + produksi - pengiriman;

            return {
                date: dateStr,
                produksi,
                pengiriman,
                sisaStock: Math.max(0, cumulativeStock),
            };
        });
    }
};
