import { materialInventarisRepository } from "../../repositories/material-inventaris.repository";
import type { MaterialInventarisInput, UpdateMaterialInventarisInput } from "../../schema/material-inventaris";

export const materialInventarisService = {
  async getAll(companyId: string) {
    return materialInventarisRepository.findAll(companyId);
  },

  async getById(id: string, companyId: string) {
    const material = await materialInventarisRepository.findById(id, companyId);
    if (!material) {
      throw new Error("Material tidak ditemukan");
    }
    return material;
  },

  async create(companyId: string, data: MaterialInventarisInput) {
    // Check if part number already exists
    const existing = await materialInventarisRepository.findByPartNumber(data.partNumber, companyId);
    if (existing) {
      throw new Error("Part number sudah digunakan");
    }

    return materialInventarisRepository.create(companyId, data);
  },

  async update(id: string, companyId: string, data: UpdateMaterialInventarisInput) {
    // Check if material exists
    await this.getById(id, companyId);

    // If part number is being updated, check if it's not used by another material
    if (data.partNumber) {
      const existing = await materialInventarisRepository.findByPartNumber(data.partNumber, companyId);
      if (existing && existing.id !== id) {
        throw new Error("Part number sudah digunakan");
      }
    }

    return materialInventarisRepository.update(id, companyId, data);
  },

  async delete(id: string, companyId: string) {
    // Check if material exists
    await this.getById(id, companyId);

    return materialInventarisRepository.delete(id, companyId);
  },

  async getStockSummary(companyId: string) {
    return materialInventarisRepository.getStockSummary(companyId);
  },

  async getLowStockMaterials(companyId: string) {
    return materialInventarisRepository.getLowStockMaterials(companyId);
  },

  async updateStock(id: string, companyId: string, stockChange: number) {
    return materialInventarisRepository.updateStock(id, companyId, stockChange);
  },
};
