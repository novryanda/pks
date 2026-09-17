import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import type { CreateJabatanInput, UpdateJabatanInput, JabatanQueryInput } from "@/server/schema/master-jabatan";

export const masterJabatanRepository = {
    /**
     * Find all jabatan with pagination and filters
     */
    async findAll(query?: JabatanQueryInput) {
        const { search, isActive, divisiId, page = 1, limit = 50 } = query || {};
        const skip = (page - 1) * limit;

        const where: Prisma.MasterJabatanWhereInput = {};

        if (search) {
            where.OR = [
                { nama: { contains: search, mode: "insensitive" } },
            ];
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (divisiId) {
            where.divisiId = divisiId;
        }

        const [data, total] = await Promise.all([
            db.masterJabatan.findMany({
                where,
                include: { divisi: true },
                orderBy: [
                    { divisi: { id: "asc" } },
                    { id: "asc" }
                ],
                skip,
                take: limit,
            }),
            db.masterJabatan.count({ where }),
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    /**
     * Find jabatan by id
     */
    async findById(id: string) {
        return db.masterJabatan.findUnique({
            where: { id },
            include: { divisi: true },
        });
    },



    /**
     * Get all active jabatan for dropdown
     */
    async getActiveList() {
        return db.$queryRaw<any[]>`
            SELECT j.id, j.nama, j."divisiId"
            FROM "MasterJabatan" j
            LEFT JOIN "MasterDivisi" d ON j."divisiId" = d.id
            WHERE j."isActive" = true
            ORDER BY length(d."id") ASC, d."id" ASC, length(j."id") ASC, j."id" ASC
        `;
    },

    /**
     * Create new jabatan
     */
    async create(data: CreateJabatanInput) {
        return db.masterJabatan.create({
            data: {
                id: data.id,
                nama: data.nama,
                divisiId: data.divisiId,
                isActive: data.isActive ?? true,
            },
            include: { divisi: true },
        });
    },

    /**
     * Update jabatan
     */
    async update(id: string, data: UpdateJabatanInput) {
        return db.masterJabatan.update({
            where: { id },
            data,
            include: { divisi: true },
        });
    },

    /**
     * Delete jabatan
     */
    async delete(id: string) {
        return db.masterJabatan.delete({ where: { id } });
    },
};
