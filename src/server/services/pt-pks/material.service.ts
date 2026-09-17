import { materialRepository } from "@/server/repositories/material.repository";
import type {
  CreateKategoriMaterialInput,
  UpdateKategoriMaterialInput,
  CreateSatuanMaterialInput,
  UpdateSatuanMaterialInput,
  CreateMaterialInput,
  UpdateMaterialInput,
} from "@/server/schema/material";

export class MaterialService {
  // Kategori Material
  async createKategoriMaterial(companyId: string, data: CreateKategoriMaterialInput) {
    return materialRepository.createKategoriMaterial(companyId, data);
  }

  async getKategoriMaterialsByCompany(companyId: string) {
    return materialRepository.getKategoriMaterialsByCompany(companyId);
  }

  async getKategoriMaterialById(id: string) {
    const kategori = await materialRepository.getKategoriMaterialById(id);
    if (!kategori) {
      throw new Error("Kategori material tidak ditemukan");
    }
    return kategori;
  }

  async updateKategoriMaterial(id: string, data: UpdateKategoriMaterialInput) {
    return materialRepository.updateKategoriMaterial(id, data);
  }

  async deleteKategoriMaterial(id: string) {
    return materialRepository.deleteKategoriMaterial(id);
  }

  // Satuan Material
  async createSatuanMaterial(companyId: string, data: CreateSatuanMaterialInput) {
    return materialRepository.createSatuanMaterial(companyId, data);
  }

  async getSatuanMaterialsByCompany(companyId: string) {
    return materialRepository.getSatuanMaterialsByCompany(companyId);
  }

  async getSatuanMaterialById(id: string) {
    const satuan = await materialRepository.getSatuanMaterialById(id);
    if (!satuan) {
      throw new Error("Satuan material tidak ditemukan");
    }
    return satuan;
  }

  async updateSatuanMaterial(id: string, data: UpdateSatuanMaterialInput) {
    return materialRepository.updateSatuanMaterial(id, data);
  }

  async deleteSatuanMaterial(id: string) {
    return materialRepository.deleteSatuanMaterial(id);
  }

  // Material
  async createMaterial(companyId: string, data: CreateMaterialInput) {
    // Check if code already exists
    const existing = await materialRepository.getMaterialByCode(data.code);
    if (existing) {
      throw new Error("Kode material sudah digunakan");
    }

    return materialRepository.createMaterial(companyId, data);
  }

  async getMaterialsByCompany(companyId: string) {
    return materialRepository.getMaterialsByCompany(companyId);
  }

  async getMaterialsForDropdown(companyId: string, kategori?: string) {
    return materialRepository.getMaterialsForDropdown(companyId, kategori);
  }

  async getMaterialById(id: string) {
    const material = await materialRepository.getMaterialById(id);
    if (!material) {
      throw new Error("Material tidak ditemukan");
    }
    return material;
  }

  async updateMaterial(
    id: string,
    data: UpdateMaterialInput,
    options?: { operator?: string; keterangan?: string }
  ) {
    if (data.code) {
      const existing = await materialRepository.getMaterialByCode(data.code);
      if (existing && existing.id !== id) {
        throw new Error("Kode material sudah digunakan");
      }
    }

    return materialRepository.updateMaterial(id, data, options);
  }

  async getMaterialHargaHistory(materialId: string) {
    return materialRepository.getMaterialHargaHistory(materialId);
  }

  async deleteMaterial(id: string) {
    return materialRepository.deleteMaterial(id);
  }

  // Stock Material
  async getStockMaterial(companyId: string, materialId: string) {
    return materialRepository.getStockMaterial(companyId, materialId);
  }

  async getStockByMaterialId(companyId: string, materialId: string) {
    return materialRepository.getStockMaterial(companyId, materialId);
  }

  async getStockMaterialsByCompany(companyId: string) {
    return materialRepository.getStockMaterialsByCompany(companyId);
  }

  async updateStockMaterial(
    companyId: string,
    materialId: string,
    jumlah: number,
    options?: {
      referensi?: string;
      keterangan?: string;
      operator?: string;
    }
  ) {
    return materialRepository.updateStockMaterial(companyId, materialId, jumlah, options);
  }
}

export const materialService = new MaterialService();
