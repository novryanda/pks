import { buyerRepository } from "@/server/repositories/buyer.repository";
import {
  createBuyerSchema,
  updateBuyerSchema,
  type CreateBuyerInput,
  type UpdateBuyerInput,
  type BuyerQueryInput,
} from "@/server/schema/buyer";

export class BuyerService {
  /**
   * Get all buyers for a company with pagination and filters
   */
  async getBuyers(companyId: string, query?: BuyerQueryInput) {
    return buyerRepository.findByCompanyId(companyId, query);
  }

  /**
   * Get buyer by id
   */
  async getBuyerById(id: string, companyId: string) {
    const buyer = await buyerRepository.findById(id, companyId);
    if (!buyer) {
      throw new Error("Buyer tidak ditemukan");
    }
    return buyer;
  }

  /**
   * Get active buyers for dropdown
   */
  async getActiveBuyers(companyId: string) {
    return buyerRepository.findActiveBuyers(companyId);
  }

  /**
   * Create new buyer
   */
  async createBuyer(companyId: string, data: CreateBuyerInput) {
    // Validate input
    const validatedData = createBuyerSchema.parse(data);

    // Check if code already exists
    const codeExists = await buyerRepository.isCodeExists(
      validatedData.code,
      companyId
    );
    if (codeExists) {
      throw new Error("Kode buyer sudah digunakan");
    }

    // Create buyer
    return buyerRepository.create(companyId, validatedData);
  }

  /**
   * Update buyer
   */
  async updateBuyer(id: string, companyId: string, data: UpdateBuyerInput) {
    // Validate input
    const validatedData = updateBuyerSchema.parse(data);

    // Check if buyer exists
    const existing = await buyerRepository.findById(id, companyId);
    if (!existing) {
      throw new Error("Buyer tidak ditemukan");
    }

    // Check if code already exists (if code is being updated)
    if (validatedData.code) {
      const codeExists = await buyerRepository.isCodeExists(
        validatedData.code,
        companyId,
        id
      );
      if (codeExists) {
        throw new Error("Kode buyer sudah digunakan");
      }
    }

    // Update buyer
    return buyerRepository.update(id, companyId, validatedData);
  }

  /**
   * Delete buyer
   */
  async deleteBuyer(id: string, companyId: string) {
    // Check if buyer exists
    const existing = await buyerRepository.findById(id, companyId);
    if (!existing) {
      throw new Error("Buyer tidak ditemukan");
    }

    // Check if buyer has contracts
    if (existing._count.contracts > 0) {
      throw new Error(
        "Buyer tidak dapat dihapus karena masih memiliki kontrak"
      );
    }

    // Delete buyer
    return buyerRepository.delete(id, companyId);
  }

  /**
   * Generate buyer code
   */
  async generateBuyerCode(companyId: string) {
    return buyerRepository.generateBuyerCode(companyId);
  }
}

export const buyerService = new BuyerService();
