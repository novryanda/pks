import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { parseJakartaDateBoundary, getJakartaDateKey } from "@/lib/date-time";
import type {
  CreateKategoriMaterialInput,
  UpdateKategoriMaterialInput,
  CreateSatuanMaterialInput,
  UpdateSatuanMaterialInput,
  CreateMaterialInput,
  UpdateMaterialInput,
} from "@/server/schema/material";

export class MaterialRepository {
  private getJakartaTimestampLiteral(date: Date, options?: { endOfDay?: boolean }) {
    const dateKey = getJakartaDateKey(date);
    if (!dateKey) {
      return null;
    }

    return `${dateKey} ${options?.endOfDay ? "23:59:59.999" : "00:00:00.000"}`;
  }

  // Kategori Material
  async createKategoriMaterial(companyId: string, data: CreateKategoriMaterialInput) {
    return db.kategoriMaterial.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async getKategoriMaterialsByCompany(companyId: string) {
    return db.kategoriMaterial.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });
  }

  async getKategoriMaterialById(id: string) {
    return db.kategoriMaterial.findUnique({
      where: { id },
    });
  }

  async updateKategoriMaterial(id: string, data: UpdateKategoriMaterialInput) {
    return db.kategoriMaterial.update({
      where: { id },
      data,
    });
  }

  async deleteKategoriMaterial(id: string) {
    return db.kategoriMaterial.delete({
      where: { id },
    });
  }

  // Satuan Material
  async createSatuanMaterial(companyId: string, data: CreateSatuanMaterialInput) {
    return db.satuanMaterial.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async getSatuanMaterialsByCompany(companyId: string) {
    return db.satuanMaterial.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });
  }

  async getSatuanMaterialById(id: string) {
    return db.satuanMaterial.findUnique({
      where: { id },
    });
  }

  async updateSatuanMaterial(id: string, data: UpdateSatuanMaterialInput) {
    return db.satuanMaterial.update({
      where: { id },
      data,
    });
  }

  async deleteSatuanMaterial(id: string) {
    return db.satuanMaterial.delete({
      where: { id },
    });
  }

  // Material
  async createMaterial(companyId: string, data: CreateMaterialInput) {
    return db.material.create({
      data: {
        ...data,
        companyId,
      },
      include: {
        kategori: true,
        satuan: true,
      },
    });
  }

  async getMaterialsByCompany(companyId: string) {
    return db.material.findMany({
      where: { companyId },
      include: {
        kategori: true,
        satuan: true,
      },
      orderBy: { code: "asc" },
    });
  }

  async getMaterialsForDropdown(companyId: string, kategori?: string) {
    const where: any = { companyId };

    // Filter by kategori if provided
    if (kategori) {
      where.kategori = {
        name: {
          equals: kategori,
          mode: 'insensitive'
        }
      };
    }

    return db.material.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        kategori: {
          select: {
            name: true,
          },
        },
        satuan: {
          select: {
            name: true,
            symbol: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  async getMaterialById(id: string) {
    return db.material.findUnique({
      where: { id },
      include: {
        kategori: true,
        satuan: true,
      },
    });
  }

  async getMaterialByCode(code: string) {
    return db.material.findUnique({
      where: { code },
      include: {
        kategori: true,
        satuan: true,
      },
    });
  }

  async updateMaterial(
    id: string,
    data: UpdateMaterialInput,
    options?: { operator?: string; keterangan?: string }
  ) {
    // Jika ada perubahan harga, kita catat di riwayat
    if (data.hargaPerUnit !== undefined) {
      const existing = await this.getMaterialById(id);

      if (existing && existing.hargaPerUnit !== data.hargaPerUnit) {
        return db.$transaction(async (tx) => {
          const updated = await tx.material.update({
            where: { id },
            data,
            include: {
              kategori: true,
              satuan: true,
            },
          });

          await tx.materialHargaHistory.create({
            data: {
              materialId: id,
              hargaLama: existing.hargaPerUnit || 0,
              hargaBaru: data.hargaPerUnit as number,
              operator: options?.operator || "system",
              keterangan: options?.keterangan || "Update harga material",
            },
          });

          return updated;
        });
      }
    }

    return db.material.update({
      where: { id },
      data,
      include: {
        kategori: true,
        satuan: true,
      },
    });
  }

  async getMaterialHargaHistory(materialId: string) {
    return db.materialHargaHistory.findMany({
      where: { materialId },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteMaterial(id: string) {
    return db.material.delete({
      where: { id },
    });
  }

  // Stock Material
  async getStockMaterial(companyId: string, materialId: string) {
    return db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
    });
  }

  async getStockMaterialsByCompany(companyId: string) {
    return db.stockMaterial.findMany({
      where: { companyId },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
      orderBy: { material: { code: "asc" } },
    });
  }

  async updateStockMaterial(
    companyId: string,
    materialId: string,
    jumlah: number,
    options?: {
      referensi?: string;
      keterangan?: string;
      operator?: string;
      tanggalTransaksi?: Date;
    }
  ) {
    // Get current stock
    const currentStock = await db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
    });

    const stockSebelum = currentStock?.jumlah || 0;
    const stockSesudah = stockSebelum + jumlah;

    // Update stock
    const updated = await db.stockMaterial.upsert({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
      create: {
        companyId,
        materialId,
        jumlah,
      },
      update: {
        jumlah: {
          increment: jumlah,
        },
      },
    });

    // Record stock movement
    const tipeMovement = jumlah > 0 ? "IN" : jumlah < 0 ? "OUT" : "ADJUSTMENT";
    await db.stockMovement.create({
      data: {
        companyId,
        materialId,
        tipeMovement,
        jumlah: Math.abs(jumlah),
        stockSebelum,
        stockSesudah,
        referensi: options?.referensi || null,
        keterangan: options?.keterangan || null,
        operator: options?.operator || "system",
        tanggalTransaksi: options?.tanggalTransaksi || new Date(),
      },
    });

    return updated;
  }

  /**
   * Get cumulative stock balance at a specific date
   */
  async getStockBalanceAtDate(companyId: string, materialId: string, date: Date) {
    const endOfDayLiteral = this.getJakartaTimestampLiteral(date, { endOfDay: true });
    if (!endOfDayLiteral) {
      return 0;
    }

    const latestMovement = await db.$queryRaw<Array<{ stockSesudah: number }>>(Prisma.sql`
      SELECT "stockSesudah"
      FROM "StockMovement"
      WHERE "companyId" = ${companyId}
        AND "materialId" = ${materialId}
        AND "tanggalTransaksi" <= CAST(${endOfDayLiteral} AS timestamp)
      ORDER BY "tanggalTransaksi" DESC, "createdAt" DESC, "id" DESC
      LIMIT 1
    `);

    return latestMovement[0]?.stockSesudah || 0;
  }

  async getOpeningStockTotalInPeriod(
    companyId: string,
    materialId: string,
    startDate: Date,
    endDate: Date
  ) {
    const periodStartLiteral = this.getJakartaTimestampLiteral(startDate);
    const periodEndLiteral = this.getJakartaTimestampLiteral(endDate, { endOfDay: true });

    if (!periodStartLiteral || !periodEndLiteral) {
      return 0;
    }

    const result = await db.$queryRaw<Array<{ total: number | null }>>(Prisma.sql`
      SELECT SUM("jumlah") AS total
      FROM "StockMovement"
      WHERE "companyId" = ${companyId}
        AND "materialId" = ${materialId}
        AND "referensi" LIKE 'OPENING-STOCK-%'
        AND "tanggalTransaksi" >= CAST(${periodStartLiteral} AS timestamp)
        AND "tanggalTransaksi" <= CAST(${periodEndLiteral} AS timestamp)
    `);

    return result[0]?.total ?? 0;
  }
}

export const materialRepository = new MaterialRepository();
