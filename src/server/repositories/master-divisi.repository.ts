import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import type { CreateDivisiInput, UpdateDivisiInput, DivisiQueryInput } from "@/server/schema/master-divisi";

export const masterDivisiRepository = {
    /**
     * Find all divisi with pagination and filters
     */
    async findAll(query?: DivisiQueryInput) {
        const { search, isActive, page = 1, limit = 50 } = query || {};
        const skip = (page - 1) * limit;

        let whereClause = "";
        const queryParams: any[] = [];
        let paramCount = 1;

        if (search) {
            whereClause += ` WHERE "nama" ILIKE $${paramCount++}`;
            queryParams.push(`%${search}%`);
        }

        if (isActive !== undefined) {
            whereClause += whereClause ? " AND" : " WHERE";
            whereClause += ` "isActive" = $${paramCount++}`;
            queryParams.push(isActive);
        }

        // Natural sort: order by length then string value
        const dataQuery = `
            SELECT * FROM "MasterDivisi"
            ${whereClause}
            ORDER BY length("id") ASC, "id" ASC
            LIMIT $${paramCount++} OFFSET $${paramCount++}
        `;

        const countQuery = `
            SELECT COUNT(*)::int as total FROM "MasterDivisi"
            ${whereClause}
        `;

        const [data, counts] = await Promise.all([
            db.$queryRawUnsafe<any[]>(dataQuery, ...queryParams, limit, skip),
            db.$queryRawUnsafe<{ total: number }[]>(countQuery, ...queryParams),
        ]);

        const total = counts[0]?.total || 0;

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
     * Find divisi by id
     */
    async findById(id: string) {
        return db.masterDivisi.findUnique({ where: { id } });
    },



    /**
     * Get all active divisi for dropdown
     */
    async getActiveList() {
        return db.$queryRaw<any[]>`
            SELECT id, nama FROM "MasterDivisi"
            WHERE "isActive" = true
            ORDER BY length("id") ASC, "id" ASC
        `;
    },

    /**
     * Create new divisi
     */
    async create(data: CreateDivisiInput) {
        return db.masterDivisi.create({
            data: {
                id: data.id,
                nama: data.nama,
                isActive: data.isActive ?? true,
            },
        });
    },

    /**
     * Update divisi
     */
    async update(id: string, data: UpdateDivisiInput) {
        return db.masterDivisi.update({
            where: { id },
            data,
        });
    },

    /**
     * Delete divisi
     */
    async delete(id: string) {
        return db.masterDivisi.delete({ where: { id } });
    },
};
