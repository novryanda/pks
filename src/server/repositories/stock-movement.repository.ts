import { db } from "@/server/db";
import type { TipeMovement } from "@prisma/client";

export interface StockMovementFilters {
  materialId?: string;
  tipeMovement?: TipeMovement;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export const stockMovementRepository = {
  async findByCompany(companyId: string, filters?: StockMovementFilters) {
    const where: any = {
      companyId,
    };

    if (filters?.materialId) {
      where.materialId = filters.materialId;
    }

    if (filters?.tipeMovement) {
      where.tipeMovement = filters.tipeMovement;
    }

    if (filters?.startDate || filters?.endDate) {
      where.tanggalTransaksi = {};
      if (filters.startDate) {
        where.tanggalTransaksi.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalTransaksi.lte = filters.endDate;
      }
    }

    if (filters?.search) {
      where.OR = [
        {
          referensi: {
            contains: filters.search,
            mode: "insensitive" as any,
          },
        },
        {
          keterangan: {
            contains: filters.search,
            mode: "insensitive" as any,
          },
        },
        {
          operator: {
            contains: filters.search,
            mode: "insensitive" as any,
          },
        },
        {
          material: {
            name: {
              contains: filters.search,
              mode: "insensitive" as any,
            },
          },
        },
        {
          material: {
            code: {
              contains: filters.search,
              mode: "insensitive" as any,
            },
          },
        },
      ];
    }

    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.stockMovement.findMany({
        where,
        include: {
          material: {
            select: {
              id: true,
              code: true,
              name: true,
              satuan: {
                select: {
                  symbol: true,
                },
              },
            },
          },
        },
        orderBy: {
          tanggalTransaksi: "desc",
        },
        skip,
        take: limit,
      }),
      db.stockMovement.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async findById(id: string) {
    return db.stockMovement.findUnique({
      where: { id },
      include: {
        material: {
          select: {
            id: true,
            code: true,
            name: true,
            satuan: {
              select: {
                symbol: true,
              },
            },
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async getStockSummary(companyId: string, filters?: StockMovementFilters) {
    // Get latest stock for each material
    const materials = await db.material.findMany({
      where: { companyId },
      select: {
        id: true,
        code: true,
        name: true,
        satuan: {
          select: {
            symbol: true,
          },
        },
        stockMaterial: {
          select: {
            jumlah: true,
          },
          take: 1,
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const where: any = { companyId };
    if (filters?.startDate || filters?.endDate) {
      where.tanggalTransaksi = {};
      if (filters.startDate) where.tanggalTransaksi.gte = filters.startDate;
      if (filters.endDate) where.tanggalTransaksi.lte = filters.endDate;
    }

    // Get total movements per material
    const movements = await db.stockMovement.groupBy({
      by: ["materialId", "tipeMovement"],
      where,
      _sum: {
        jumlah: true,
      },
    });

    // Aggregate data
    const summary = materials.map((material) => {
      const inMovements = movements
        .filter((m) => m.materialId === material.id && m.tipeMovement === "IN")
        .reduce((sum, m) => sum + (m._sum.jumlah || 0), 0);

      const outMovements = movements
        .filter((m) => m.materialId === material.id && m.tipeMovement === "OUT")
        .reduce((sum, m) => sum + (m._sum.jumlah || 0), 0);

      const adjustments = movements
        .filter((m) => m.materialId === material.id && m.tipeMovement === "ADJUSTMENT")
        .reduce((sum, m) => sum + (m._sum.jumlah || 0), 0);

      const currentStock = material.stockMaterial[0]?.jumlah || 0;

      return {
        materialId: material.id,
        code: material.code,
        name: material.name,
        satuan: material.satuan.symbol,
        currentStock: currentStock,
        totalIn: inMovements,
        totalOut: outMovements,
        totalAdjustment: adjustments,
        netBalance: inMovements - outMovements,
      };
    });

    return summary;
  },
};
