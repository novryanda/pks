import { db } from "@/server/db";
import type {
    CreateVendorMaterialInput,
    UpdateVendorMaterialInput,
    VendorMaterialQueryInput,
} from "@/server/schema/vendor-material";
import type { Prisma, StatusVendor } from "@prisma/client";

export class VendorMaterialRepository {
    /**
     * Get all vendor materials by companyId with pagination
     */
    async findByCompanyId(companyId: string, query?: VendorMaterialQueryInput) {
        const where: Prisma.VendorMaterialWhereInput = {
            companyId,
        };

        // Search filter
        if (query?.search) {
            where.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { code: { contains: query.search, mode: "insensitive" } },
                { contactPerson: { contains: query.search, mode: "insensitive" } },
                { email: { contains: query.search, mode: "insensitive" } },
                { phone: { contains: query.search, mode: "insensitive" } },
            ];
        }

        // Status filter
        if (query?.status) {
            where.status = query.status as StatusVendor;
        }

        // Kategori filter
        if (query?.kategori) {
            where.kategori = query.kategori;
        }

        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            db.vendorMaterial.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            db.vendorMaterial.count({ where }),
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
    }

    /**
     * Get vendor material by id
     */
    async findById(id: string, companyId: string) {
        return db.vendorMaterial.findUnique({
            where: { id, companyId },
        });
    }

    /**
     * Get vendor material by code
     */
    async findByCode(code: string, companyId: string) {
        return db.vendorMaterial.findFirst({
            where: { code, companyId },
        });
    }

    /**
     * Check if vendor material code exists
     */
    async isCodeExists(code: string, companyId: string, excludeId?: string) {
        const where: Prisma.VendorMaterialWhereInput = {
            code,
            companyId,
        };

        if (excludeId) {
            where.id = { not: excludeId };
        }

        const vendor = await db.vendorMaterial.findFirst({ where });
        return !!vendor;
    }

    /**
     * Create new vendor material
     */
    async create(companyId: string, data: CreateVendorMaterialInput) {
        return db.vendorMaterial.create({
            data: {
                ...data,
                companyId,
            },
        });
    }

    /**
     * Update vendor material
     */
    async update(id: string, companyId: string, data: UpdateVendorMaterialInput) {
        return db.vendorMaterial.update({
            where: { id, companyId },
            data,
        });
    }

    /**
     * Delete vendor material
     */
    async delete(id: string, companyId: string) {
        return db.vendorMaterial.delete({
            where: { id, companyId },
        });
    }

    /**
     * Get all active vendor materials for dropdown
     */
    async findActiveVendors(companyId: string) {
        return db.vendorMaterial.findMany({
            where: {
                companyId,
                status: "ACTIVE",
            },
            select: {
                id: true,
                code: true,
                name: true,
                contactPerson: true,
                phone: true,
                address: true,
                taxStatus: true,
                kategori: true,
            },
            orderBy: { name: "asc" },
        });
    }

    /**
     * Get vendor material statistics
     */
    async getStatistics(companyId: string) {
        const [totalVendors, activeVendors, inactiveVendors] = await Promise.all([
            db.vendorMaterial.count({ where: { companyId } }),
            db.vendorMaterial.count({ where: { companyId, status: "ACTIVE" } }),
            db.vendorMaterial.count({ where: { companyId, status: "INACTIVE" } }),
        ]);

        return {
            totalVendors,
            activeVendors,
            inactiveVendors,
        };
    }

    /**
     * Get unique categories for filter
     */
    async getCategories(companyId: string) {
        const vendors = await db.vendorMaterial.findMany({
            where: { companyId, kategori: { not: null } },
            select: { kategori: true },
            distinct: ["kategori"],
        });
        return vendors.map((v) => v.kategori).filter(Boolean) as string[];
    }

    /**
     * Get last vendor code for generating new code
     */
    async getLastCode(companyId: string, prefix: string) {
        return db.vendorMaterial.findFirst({
            where: {
                companyId,
                code: { startsWith: prefix },
            },
            orderBy: { code: "desc" },
            select: { code: true },
        });
    }
}
