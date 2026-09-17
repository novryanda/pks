import { db } from "../db";
import type { MaterialInventarisInput, UpdateMaterialInventarisInput } from "../schema/material-inventaris";

export const materialInventarisRepository = {
  async findAll(companyId: string) {
    return db.materialInventaris.findMany({
      where: { companyId },
      include: {
        kategoriMaterial: true,
        satuanMaterial: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string, companyId: string) {
    return db.materialInventaris.findFirst({
      where: { id, companyId },
      include: {
        kategoriMaterial: true,
        satuanMaterial: true,
      },
    });
  },

  async findByPartNumber(partNumber: string, companyId: string) {
    return db.materialInventaris.findFirst({
      where: { partNumber, companyId },
    });
  },

  async create(companyId: string, data: MaterialInventarisInput) {
    return db.materialInventaris.create({
      data: {
        ...data,
        companyId,
      },
      include: {
        kategoriMaterial: true,
        satuanMaterial: true,
      },
    });
  },

  async update(id: string, companyId: string, data: UpdateMaterialInventarisInput) {
    return db.materialInventaris.update({
      where: { id, companyId },
      data,
      include: {
        kategoriMaterial: true,
        satuanMaterial: true,
      },
    });
  },

  async delete(id: string, companyId: string) {
    return db.materialInventaris.delete({
      where: { id, companyId },
    });
  },

  async updateStock(id: string, companyId: string, stockChange: number) {
    const material = await db.materialInventaris.findFirst({
      where: { id, companyId },
    });

    if (!material) {
      throw new Error("Material tidak ditemukan");
    }

    return db.materialInventaris.update({
      where: { id, companyId },
      data: {
        stockOnHand: material.stockOnHand + stockChange,
      },
    });
  },

  async getStockSummary(companyId: string) {
    return db.materialInventaris.findMany({
      where: { companyId },
      select: {
        id: true,
        partNumber: true,
        namaMaterial: true,
        stockOnHand: true,
        minStock: true,
        maxStock: true,
        kategoriMaterial: {
          select: {
            name: true,
          },
        },
        satuanMaterial: {
          select: {
            name: true,
            symbol: true,
          },
        },
      },
      orderBy: { namaMaterial: "asc" },
    });
  },

  async getLowStockMaterials(companyId: string) {
    return db.materialInventaris.findMany({
      where: {
        companyId,
        stockOnHand: {
          lte: db.materialInventaris.fields.minStock,
        },
      },
      include: {
        kategoriMaterial: true,
        satuanMaterial: true,
      },
      orderBy: { stockOnHand: "asc" },
    });
  },
};
