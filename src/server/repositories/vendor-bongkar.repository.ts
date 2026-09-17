import { db } from "@/server/db";
import { Prisma, TipeVendorBongkar } from "@prisma/client";
import type {
    CreateVendorBongkarInput,
    UpdateVendorBongkarInput,
    VendorBongkarQueryInput,
} from "@/server/schema/vendor-bongkar";

export class VendorBongkarRepository {
    private db = db;

    // Get all vendor bongkar by company with pagination and filters
    async findByCompanyId(companyId: string, query?: VendorBongkarQueryInput) {
        const where: Prisma.VendorBongkarWhereInput = {
            companyId,
        };

        if (query?.search) {
            where.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { code: { contains: query.search, mode: "insensitive" } },
                { contactPerson: { contains: query.search, mode: "insensitive" } },
            ];
        }

        if (query?.status) {
            where.status = query.status;
        }

        if (query?.tipe) {
            where.tipe = query.tipe;
        }

        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.db.vendorBongkar.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            this.db.vendorBongkar.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // Get by ID
    async findById(id: string, companyId?: string) {
        const where: Prisma.VendorBongkarWhereInput = { id };
        if (companyId) {
            where.companyId = companyId;
        }

        return this.db.vendorBongkar.findFirst({
            where,
        });
    }

    // Get by code
    async findByCode(code: string) {
        return this.db.vendorBongkar.findUnique({
            where: { code },
        });
    }

    // Get active vendor bongkars
    async findActiveByCompanyId(companyId: string) {
        return this.db.vendorBongkar.findMany({
            where: {
                companyId,
                status: "ACTIVE",
            },
            orderBy: { name: "asc" },
        });
    }

    // Get active vendor bongkars by tipe
    async findActiveByTipe(companyId: string, tipe: TipeVendorBongkar) {
        return this.db.vendorBongkar.findMany({
            where: {
                companyId,
                status: "ACTIVE",
                tipe,
            },
            orderBy: { name: "asc" },
        });
    }

    // Create new vendor bongkar
    async create(companyId: string, data: CreateVendorBongkarInput) {
        return this.db.vendorBongkar.create({
            data: {
                companyId,
                code: data.code,
                name: data.name,
                contactPerson: data.contactPerson,
                email: data.email,
                phone: data.phone,
                address: data.address,
                tipe: data.tipe,
                bankAccounts: data.bankAccounts as Prisma.InputJsonValue,
                status: data.status,
            },
        });
    }

    // Update vendor bongkar
    async update(id: string, companyId: string, data: UpdateVendorBongkarInput) {
        return this.db.vendorBongkar.update({
            where: { id },
            data: {
                ...(data.code !== undefined && { code: data.code }),
                ...(data.name !== undefined && { name: data.name }),
                ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
                ...(data.email !== undefined && { email: data.email }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.address !== undefined && { address: data.address }),
                ...(data.tipe !== undefined && { tipe: data.tipe }),
                ...(data.bankAccounts !== undefined && { bankAccounts: data.bankAccounts as Prisma.InputJsonValue }),
                ...(data.status !== undefined && { status: data.status }),
            },
        });
    }

    // Delete vendor bongkar
    async delete(id: string) {
        return this.db.vendorBongkar.delete({
            where: { id },
        });
    }

    // Count vendor bongkars by company
    async countByCompanyId(companyId: string) {
        return this.db.vendorBongkar.count({
            where: { companyId },
        });
    }

    // Get latest code for auto-generate
    async getLatestCode(companyId: string) {
        const latest = await this.db.vendorBongkar.findFirst({
            where: { companyId },
            orderBy: { code: "desc" },
            select: { code: true },
        });
        return latest?.code;
    }
}

export const vendorBongkarRepository = new VendorBongkarRepository();
