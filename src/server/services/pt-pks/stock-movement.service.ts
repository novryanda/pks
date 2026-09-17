import { stockMovementRepository, type StockMovementFilters } from "@/server/repositories/stock-movement.repository";

export const stockMovementService = {
  async getStockMovements(companyId: string, filters?: StockMovementFilters) {
    return stockMovementRepository.findByCompany(companyId, filters);
  },

  async getStockMovementById(id: string) {
    return stockMovementRepository.findById(id);
  },

  async getStockSummary(companyId: string, filters?: StockMovementFilters) {
    return stockMovementRepository.getStockSummary(companyId, filters);
  },
};
