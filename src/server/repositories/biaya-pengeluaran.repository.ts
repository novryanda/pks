import { db } from "@/server/db";

// Use local types that match Prisma schema
type StatusBiaya = "DRAFT" | "ACTIVE" | "PAID" | "CANCELLED";

export interface BiayaPengeluaranFilters {
    startDate?: Date | string;
    endDate?: Date | string;
    kategoriBiaya?: string;
    status?: StatusBiaya | string;
    periodeBulan?: number;
    periodeTahun?: number;
}

export const biayaPengeluaranRepository = {
    /**
     * Get all biaya pengeluaran with filters
     */
    async getAll(companyId: string, filters?: BiayaPengeluaranFilters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {
            companyId,
            status: { not: "CANCELLED" },
        };

        if (filters?.kategoriBiaya) {
            whereClause.kategoriBiaya = filters.kategoriBiaya;
        }

        if (filters?.status) {
            whereClause.status = filters.status;
        }

        if (filters?.periodeBulan) {
            whereClause.periodeBulan = filters.periodeBulan;
        }

        if (filters?.periodeTahun) {
            whereClause.periodeTahun = filters.periodeTahun;
        }

        if (filters?.startDate || filters?.endDate) {
            whereClause.tanggalBiaya = {};
            if (filters.startDate) {
                const startDate = typeof filters.startDate === "string"
                    ? new Date(filters.startDate)
                    : filters.startDate;
                whereClause.tanggalBiaya.gte = startDate;
            }
            if (filters.endDate) {
                const endDate = typeof filters.endDate === "string"
                    ? new Date(filters.endDate)
                    : filters.endDate;
                // Set end of day
                endDate.setHours(23, 59, 59, 999);
                whereClause.tanggalBiaya.lte = endDate;
            }
        }

        return db.biayaPengeluaran.findMany({
            where: whereClause,
            include: {
                pengajuanBiayaOperasional: {
                    select: {
                        nomorPengajuan: true,
                        divisi: true,
                    },
                },
            },
            orderBy: { tanggalBiaya: "desc" },
        });
    },

    /**
     * Get biaya by ID
     */
    async getById(id: string) {
        return db.biayaPengeluaran.findUnique({
            where: { id },
        });
    },

    /**
     * Create new biaya pengeluaran
     */
    async create(data: {
        companyId: string;
        nomorBiaya: string;
        tanggalBiaya: Date;
        kategoriBiaya: string;
        deskripsi: string;
        jumlahBiaya: number;
        periodeBulan?: number;
        periodeTahun?: number;
        keterangan?: string;
        status?: StatusBiaya;
        dibuatOleh: string;
    }) {
        return db.biayaPengeluaran.create({
            data: {
                companyId: data.companyId,
                nomorBiaya: data.nomorBiaya,
                tanggalBiaya: data.tanggalBiaya,
                kategoriBiaya: data.kategoriBiaya,
                deskripsi: data.deskripsi,
                jumlahBiaya: data.jumlahBiaya,
                periodeBulan: data.periodeBulan,
                periodeTahun: data.periodeTahun,
                keterangan: data.keterangan,
                status: data.status ?? "ACTIVE",
                dibuatOleh: data.dibuatOleh,
            },
        });
    },

    /**
     * Update biaya pengeluaran
     */
    async update(
        id: string,
        data: Partial<{
            tanggalBiaya: Date;
            kategoriBiaya: string;
            deskripsi: string;
            jumlahBiaya: number;
            periodeBulan: number | null;
            periodeTahun: number | null;
            keterangan: string | null;
            status: StatusBiaya;
        }>
    ) {
        return db.biayaPengeluaran.update({
            where: { id },
            data,
        });
    },

    /**
     * Soft delete (set status to CANCELLED)
     */
    async delete(id: string) {
        return db.biayaPengeluaran.update({
            where: { id },
            data: { status: "CANCELLED" },
        });
    },

    /**
     * Get summary by kategori for neraca
     */
    async getSummaryByKategori(companyId: string, filters?: BiayaPengeluaranFilters) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {
            companyId,
            status: { in: ["ACTIVE", "PAID"] },
        };

        if (filters?.startDate || filters?.endDate) {
            whereClause.tanggalBiaya = {};
            if (filters.startDate) {
                const startDate = typeof filters.startDate === "string"
                    ? new Date(filters.startDate)
                    : filters.startDate;
                whereClause.tanggalBiaya.gte = startDate;
            }
            if (filters.endDate) {
                const endDate = typeof filters.endDate === "string"
                    ? new Date(filters.endDate)
                    : filters.endDate;
                endDate.setHours(23, 59, 59, 999);
                whereClause.tanggalBiaya.lte = endDate;
            }
        }

        const grouped = await db.biayaPengeluaran.groupBy({
            by: ["kategoriBiaya"],
            where: whereClause,
            _sum: { jumlahBiaya: true },
            _count: { id: true },
        });

        const total = grouped.reduce(
            (sum: number, item: { _sum: { jumlahBiaya: number | null } }) => sum + (item._sum.jumlahBiaya || 0),
            0
        );

        return {
            byKategori: grouped.map((item: { kategoriBiaya: string; _sum: { jumlahBiaya: number | null }; _count: { id: number } }) => ({
                kategori: item.kategoriBiaya,
                total: item._sum.jumlahBiaya || 0,
                count: item._count.id,
            })),
            total,
        };
    },

    /**
     * Get total unpaid biaya (status ACTIVE) for neraca liabilities
     */
    async getTotalUnpaid(companyId: string, filters?: { startDate?: string; endDate?: string }) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {
            companyId,
            status: "ACTIVE", // Only unpaid (ACTIVE status)
        };

        if (filters?.startDate || filters?.endDate) {
            whereClause.tanggalBiaya = {};
            if (filters.startDate) {
                whereClause.tanggalBiaya.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                whereClause.tanggalBiaya.lte = endDate;
            }
        }

        const result = await db.biayaPengeluaran.aggregate({
            where: whereClause,
            _sum: { jumlahBiaya: true },
            _count: { id: true },
        });

        return {
            total: result._sum.jumlahBiaya || 0,
            count: result._count.id,
        };
    },

    /**
     * Generate next nomor biaya
     */
    async generateNomorBiaya(companyId: string): Promise<string> {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const prefix = `BP-${year}${month}`;

        // Get last nomor for this month
        const lastBiaya = await db.biayaPengeluaran.findFirst({
            where: {
                companyId,
                nomorBiaya: { startsWith: prefix },
            },
            orderBy: { nomorBiaya: "desc" },
        });

        let nextNumber = 1;
        if (lastBiaya) {
            const lastNumber = parseInt(lastBiaya.nomorBiaya.split("-")[2] || "0", 10);
            nextNumber = lastNumber + 1;
        }

        return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
    },
};
