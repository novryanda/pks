import { inventoryTransactionRepository } from "../../repositories/inventory-transaction.repository";
import { TipeMovement } from "@prisma/client";

export const inventoryTransactionService = {
  async getAll(companyId: string, filters?: {
    materialId?: string;
    tipeTransaksi?: TipeMovement;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return inventoryTransactionRepository.findAll(companyId, filters);
  },

  async getByMaterial(materialId: string, companyId: string, limit?: number) {
    return inventoryTransactionRepository.findByMaterial(materialId, companyId, limit);
  },

  async getStockSummary(companyId: string) {
    return inventoryTransactionRepository.getStockSummary(companyId);
  },
};
