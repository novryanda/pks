import { vendorBongkarRepository, VendorBongkarRepository } from "@/server/repositories/vendor-bongkar.repository";
import {
    createVendorBongkarSchema,
    updateVendorBongkarSchema,
    type CreateVendorBongkarInput,
    type UpdateVendorBongkarInput,
    type VendorBongkarQueryInput,
} from "@/server/schema/vendor-bongkar";
import { TipeVendorBongkar } from "@prisma/client";

export class VendorBongkarService {
    private repository: VendorBongkarRepository;

    constructor() {
        this.repository = vendorBongkarRepository;
    }

    async getVendorBongkars(companyId: string, query?: VendorBongkarQueryInput) {
        return this.repository.findByCompanyId(companyId, query);
    }

    async getVendorBongkarById(id: string, companyId: string) {
        const vendor = await this.repository.findById(id, companyId);
        if (!vendor) {
            throw new Error("Vendor Bongkar tidak ditemukan");
        }
        return vendor;
    }

    async getActiveVendorBongkars(companyId: string) {
        return this.repository.findActiveByCompanyId(companyId);
    }

    async getActiveVendorBongkarsByTipe(companyId: string, tipe: TipeVendorBongkar) {
        return this.repository.findActiveByTipe(companyId, tipe);
    }

    async getVendorBongkarStatistics(companyId: string) {
        const total = await this.repository.countByCompanyId(companyId);
        return {
            total,
        };
    }

    async createVendorBongkar(companyId: string, data: CreateVendorBongkarInput) {
        // Validate input
        const validatedData = createVendorBongkarSchema.parse(data);

        // Check if code already exists
        const existingCode = await this.repository.findByCode(validatedData.code);
        if (existingCode) {
            throw new Error(`Kode vendor "${validatedData.code}" sudah digunakan`);
        }

        return this.repository.create(companyId, validatedData);
    }

    async updateVendorBongkar(id: string, companyId: string, data: UpdateVendorBongkarInput) {
        // Validate input
        const validatedData = updateVendorBongkarSchema.parse(data);

        // Check if vendor exists
        const existing = await this.repository.findById(id, companyId);
        if (!existing) {
            throw new Error("Vendor Bongkar tidak ditemukan");
        }

        // Check if code already exists (if changing code)
        if (validatedData.code && validatedData.code !== existing.code) {
            const existingCode = await this.repository.findByCode(validatedData.code);
            if (existingCode) {
                throw new Error(`Kode vendor "${validatedData.code}" sudah digunakan`);
            }
        }

        return this.repository.update(id, companyId, validatedData);
    }

    async deleteVendorBongkar(id: string, companyId: string) {
        // Check if vendor exists
        const existing = await this.repository.findById(id, companyId);
        if (!existing) {
            throw new Error("Vendor Bongkar tidak ditemukan");
        }

        return this.repository.delete(id);
    }

    async generateVendorBongkarCode(companyId: string): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const prefix = `VDB-${year}-`;

        const latestCode = await this.repository.getLatestCode(companyId);

        if (latestCode && latestCode.startsWith(prefix)) {
            const lastNumber = parseInt(latestCode.replace(prefix, ""), 10) || 0;
            return `${prefix}${String(lastNumber + 1).padStart(4, "0")}`;
        }

        return `${prefix}0001`;
    }
}

export const vendorBongkarService = new VendorBongkarService();
