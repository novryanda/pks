import { supplierRepository } from "@/server/repositories/supplier.repository";
import {
  CreateSupplierSchema,
  type CreateSupplierInput,
  type UpdateSupplierInput,
} from "@/server/schema/supplier";

export class SupplierService {
  /**
   * Get all suppliers for a company
   */
  async getSuppliers(companyId: string) {
    return supplierRepository.findByCompanyId(companyId);
  }

  /**
   * Get supplier by id
   */
  async getSupplierById(id: string) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new Error("Supplier tidak ditemukan");
    }
    return supplier;
  }

  /**
   * Get suppliers for map view
   */
  async getSuppliersForMap(companyId: string) {
    return supplierRepository.findSuppliersForMap(companyId);
  }

  /**
   * Create new supplier
   */
  async createSupplier(data: CreateSupplierInput) {
    // Validate input
    const validatedData = CreateSupplierSchema.parse(data);

    // Create supplier
    return supplierRepository.create(validatedData);
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, data: Partial<UpdateSupplierInput>) {
    // Check if supplier exists
    const existing = await supplierRepository.findById(id);
    if (!existing) {
      throw new Error("Supplier tidak ditemukan");
    }

    // Update supplier
    return supplierRepository.update(id, data);
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string) {
    // Check if supplier exists
    const existing = await supplierRepository.findById(id);
    if (!existing) {
      throw new Error("Supplier tidak ditemukan");
    }

    // Delete supplier
    return supplierRepository.delete(id);
  }

  /**
   * Search suppliers with filters
   */
  async searchSuppliers(
    companyId: string,
    searchTerm?: string,
    filters?: {
      pengelolaan?: "swadaya" | "kelompok" | "perusahaan";
      sertifikasi?: "ISPO" | "RSPO";
    }
  ) {
    return supplierRepository.search(companyId, searchTerm, filters);
  }

  /**
   * Get supplier data for PDF generation
   */
  async getSupplierForPDF(id: string) {
    const supplier = await supplierRepository.findByIdForPDF(id);
    if (!supplier) {
      throw new Error("Supplier tidak ditemukan");
    }
    return supplier;
  }
}

export const supplierService = new SupplierService();
