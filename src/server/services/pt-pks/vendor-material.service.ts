import { VendorMaterialRepository } from "@/server/repositories/vendor-material.repository";
import {
    createVendorMaterialSchema,
    updateVendorMaterialSchema,
    type CreateVendorMaterialInput,
    type UpdateVendorMaterialInput,
    type VendorMaterialQueryInput,
} from "@/server/schema/vendor-material";

const vendorMaterialRepository = new VendorMaterialRepository();

export class VendorMaterialService {
    /**
     * Get all vendor materials for a company with pagination and filters
     */
    async getVendorMaterials(companyId: string, query?: VendorMaterialQueryInput) {
        return vendorMaterialRepository.findByCompanyId(companyId, query);
    }

    /**
     * Get vendor material by id
     */
    async getVendorMaterialById(id: string, companyId: string) {
        const vendor = await vendorMaterialRepository.findById(id, companyId);
        if (!vendor) {
            throw new Error("Vendor Material tidak ditemukan");
        }
        return vendor;
    }

    /**
     * Get active vendor materials for dropdown
     */
    async getActiveVendorMaterials(companyId: string) {
        return vendorMaterialRepository.findActiveVendors(companyId);
    }

    /**
     * Get vendor material statistics
     */
    async getVendorMaterialStatistics(companyId: string) {
        return vendorMaterialRepository.getStatistics(companyId);
    }

    /**
     * Get unique categories
     */
    async getCategories(companyId: string) {
        return vendorMaterialRepository.getCategories(companyId);
    }

    /**
     * Create new vendor material
     */
    async createVendorMaterial(companyId: string, data: CreateVendorMaterialInput) {
        // Validate input
        const validatedData = createVendorMaterialSchema.parse(data);

        // Check if code already exists
        const codeExists = await vendorMaterialRepository.isCodeExists(
            validatedData.code,
            companyId
        );
        if (codeExists) {
            throw new Error("Kode vendor sudah digunakan");
        }

        // Create vendor material
        return vendorMaterialRepository.create(companyId, validatedData);
    }

    /**
     * Update vendor material
     */
    async updateVendorMaterial(id: string, companyId: string, data: UpdateVendorMaterialInput) {
        // Validate input
        const validatedData = updateVendorMaterialSchema.parse(data);

        // Check if vendor exists
        const existing = await vendorMaterialRepository.findById(id, companyId);
        if (!existing) {
            throw new Error("Vendor Material tidak ditemukan");
        }

        // Check if code already exists (if code is being updated)
        if (validatedData.code) {
            const codeExists = await vendorMaterialRepository.isCodeExists(
                validatedData.code,
                companyId,
                id
            );
            if (codeExists) {
                throw new Error("Kode vendor sudah digunakan");
            }
        }

        // Update vendor material
        return vendorMaterialRepository.update(id, companyId, validatedData);
    }

    /**
     * Delete vendor material
     */
    async deleteVendorMaterial(id: string, companyId: string) {
        // Check if vendor exists
        const existing = await vendorMaterialRepository.findById(id, companyId);
        if (!existing) {
            throw new Error("Vendor Material tidak ditemukan");
        }

        // Delete vendor material
        return vendorMaterialRepository.delete(id, companyId);
    }

    /**
     * Generate vendor material code
     */
    async generateVendorMaterialCode(companyId: string): Promise<string> {
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const prefix = `VDM-${currentYear}`;

        // Get the last vendor code for the current year
        const lastVendor = await vendorMaterialRepository.getLastCode(companyId, prefix);

        let nextNumber = 1;
        if (lastVendor?.code) {
            const parts = lastVendor.code.split("-");
            const lastNumber = parseInt(parts[2] || "0");
            nextNumber = lastNumber + 1;
        }

        return `${prefix}-${nextNumber.toString().padStart(4, "0")}`;
    }
}

export const vendorMaterialService = new VendorMaterialService();
