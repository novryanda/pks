import { VendorRepository } from "@/server/repositories/vendor.repository";
import { db } from "@/server/db";
import {
  createVendorSchema,
  updateVendorSchema,
  type CreateVendorInput,
  type UpdateVendorInput,
  type VendorQueryInput,
} from "@/server/schema/vendor";

const vendorRepository = new VendorRepository();

export class VendorService {
  /**
   * Get all vendors for a company with pagination and filters
   */
  async getVendors(companyId: string, query?: VendorQueryInput) {
    return vendorRepository.findByCompanyId(companyId, query);
  }

  /**
   * Get vendor by id
   */
  async getVendorById(id: string, companyId: string) {
    const vendor = await vendorRepository.findById(id, companyId);
    if (!vendor) {
      throw new Error("Vendor tidak ditemukan");
    }
    return vendor;
  }

  /**
   * Get active vendors for dropdown
   */
  async getActiveVendors(companyId: string) {
    return vendorRepository.findActiveVendors(companyId);
  }

  /**
   * Get vendor statistics
   */
  async getVendorStatistics(companyId: string) {
    return vendorRepository.getStatistics(companyId);
  }

  /**
   * Create new vendor
   */
  async createVendor(companyId: string, data: CreateVendorInput) {
    // Validate input
    const validatedData = createVendorSchema.parse(data);

    // Check if code already exists
    const codeExists = await vendorRepository.isCodeExists(
      validatedData.code,
      companyId
    );
    if (codeExists) {
      throw new Error("Kode vendor sudah digunakan");
    }

    // Create vendor
    return vendorRepository.create(companyId, validatedData);
  }

  /**
   * Update vendor
   */
  async updateVendor(id: string, companyId: string, data: UpdateVendorInput) {
    // Validate input
    const validatedData = updateVendorSchema.parse(data);

    // Check if vendor exists
    const existing = await vendorRepository.findById(id, companyId);
    if (!existing) {
      throw new Error("Vendor tidak ditemukan");
    }

    // Check if code already exists (if code is being updated)
    if (validatedData.code) {
      const codeExists = await vendorRepository.isCodeExists(
        validatedData.code,
        companyId,
        id
      );
      if (codeExists) {
        throw new Error("Kode vendor sudah digunakan");
      }
    }

    // Update vendor
    return vendorRepository.update(id, companyId, validatedData);
  }

  /**
   * Delete vendor
   */
  async deleteVendor(id: string, companyId: string) {
    // Check if vendor exists
    const existing = await vendorRepository.findById(id, companyId);
    if (!existing) {
      throw new Error("Vendor tidak ditemukan");
    }

    const usedInPengiriman = await db.pengirimanProduct.count({
      where: {
        vendorVehicle: {
          vendorId: id,
        },
      },
    });

    if (usedInPengiriman > 0) {
      throw new Error(
        "Vendor sudah digunakan di pengiriman product dan tidak bisa dihapus. Nonaktifkan vendor jika sudah tidak dipakai."
      );
    }

    // Delete vendor
    return vendorRepository.delete(id, companyId);
  }

  /**
   * Generate vendor code
   */
  async generateVendorCode(companyId: string): Promise<string> {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const prefix = `VND-${currentYear}`;

    // Get the last vendor code for the current year
    const lastVendor = await vendorRepository.findByCompanyId(companyId, {
      page: 1,
      limit: 1,
    });

    let nextNumber = 1;
    if (
      lastVendor.data.length > 0 &&
      lastVendor.data[0]?.code.startsWith(prefix)
    ) {
      const lastCode = lastVendor.data[0].code;
      const lastNumber = parseInt(lastCode.split("-")[2] || "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}-${nextNumber.toString().padStart(4, "0")}`;
  }
}

export const vendorService = new VendorService();
