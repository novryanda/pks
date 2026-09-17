import { db } from "@/server/db";
import type {
  CreateBuyerInput,
  UpdateBuyerInput,
  BuyerQueryInput,
} from "@/server/schema/buyer";
import type { Prisma, StatusBuyer } from "@prisma/client";

export class BuyerRepository {
  /**
   * Get all buyers by companyId with pagination
   */
  async findByCompanyId(companyId: string, query?: BuyerQueryInput) {
    const where: Prisma.BuyerWhereInput = {
      companyId,
    };

    // Search filter
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
        { contactPerson: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (query?.status) {
      where.status = query.status as StatusBuyer;
    }

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.buyer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { contracts: true },
          },
        },
      }),
      db.buyer.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get buyer by id
   */
  async findById(id: string, companyId: string) {
    return db.buyer.findUnique({
      where: { id, companyId },
      include: {
        contracts: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: { contracts: true },
        },
      },
    });
  }

  /**
   * Get buyer by code
   */
  async findByCode(code: string, companyId: string) {
    return db.buyer.findFirst({
      where: { code, companyId },
    });
  }

  /**
   * Check if buyer code exists
   */
  async isCodeExists(code: string, companyId: string, excludeId?: string) {
    const where: Prisma.BuyerWhereInput = {
      code,
      companyId,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const buyer = await db.buyer.findFirst({ where });
    return !!buyer;
  }

  /**
   * Create new buyer
   */
  async create(companyId: string, data: CreateBuyerInput) {
    return db.buyer.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  /**
   * Update buyer
   */
  async update(id: string, companyId: string, data: UpdateBuyerInput) {
    return db.buyer.update({
      where: { id, companyId },
      data,
    });
  }

  /**
   * Delete buyer
   */
  async delete(id: string, companyId: string) {
    return db.buyer.delete({
      where: { id, companyId },
    });
  }

  /**
   * Get all active buyers for dropdown
   */
  async findActiveBuyers(companyId: string) {
    return db.buyer.findMany({
      where: {
        companyId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        code: true,
        name: true,
        contactPerson: true,
        email: true,
        phone: true,
        address: true,
        taxStatus: true,
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Generate buyer code
   */
  async generateBuyerCode(companyId: string): Promise<string> {
    const lastBuyer = await db.buyer.findFirst({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });

    if (!lastBuyer) {
      return "BYR-0001";
    }

    // Extract number from code (e.g., "BYR-0001" -> 1)
    const match = lastBuyer.code.match(/BYR-(\d+)/);
    if (match) {
      const lastNumber = parseInt(match[1]!, 10);
      const nextNumber = lastNumber + 1;
      return `BYR-${nextNumber.toString().padStart(4, "0")}`;
    }

    return "BYR-0001";
  }
}

export const buyerRepository = new BuyerRepository();
