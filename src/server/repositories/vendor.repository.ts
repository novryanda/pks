import { db } from "@/server/db";
import type {
  CreateVendorInput,
  UpdateVendorInput,
  VendorQueryInput,
} from "@/server/schema/vendor";
import type { Prisma, StatusVendor } from "@prisma/client";

export class VendorRepository {
  /**
   * Get all vendors by companyId with pagination
   */
  async findByCompanyId(companyId: string, query?: VendorQueryInput) {
    const where: Prisma.VendorWhereInput = {
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
      where.status = query.status as StatusVendor;
    }

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { vehicles: true },
          },
        },
      }),
      db.vendor.count({ where }),
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
   * Get vendor by id
   */
  async findById(id: string, companyId: string) {
    return db.vendor.findUnique({
      where: { id, companyId },
      include: {
        vehicles: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { vehicles: true },
        },
      },
    });
  }

  /**
   * Get vendor by code
   */
  async findByCode(code: string, companyId: string) {
    return db.vendor.findFirst({
      where: { code, companyId },
    });
  }

  /**
   * Check if vendor code exists
   */
  async isCodeExists(code: string, companyId: string, excludeId?: string) {
    const where: Prisma.VendorWhereInput = {
      code,
      companyId,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const vendor = await db.vendor.findFirst({ where });
    return !!vendor;
  }

  /**
   * Create new vendor
   */
  async create(companyId: string, data: CreateVendorInput) {
    return db.vendor.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  /**
   * Update vendor
   */
  async update(id: string, companyId: string, data: UpdateVendorInput) {
    return db.vendor.update({
      where: { id, companyId },
      data,
    });
  }

  /**
   * Delete vendor
   */
  async delete(id: string, companyId: string) {
    return db.vendor.delete({
      where: { id, companyId },
    });
  }

  /**
   * Get all active vendors for dropdown
   */
  async findActiveVendors(companyId: string) {
    return db.vendor.findMany({
      where: {
        companyId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        code: true,
        name: true,
        contactPerson: true,
        phone: true,
        taxStatus: true,
        _count: {
          select: { vehicles: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get vendor statistics
   */
  async getStatistics(companyId: string) {
    const [totalVendors, activeVendors, inactiveVendors, totalVehicles] = await Promise.all([
      db.vendor.count({ where: { companyId } }),
      db.vendor.count({ where: { companyId, status: "ACTIVE" } }),
      db.vendor.count({ where: { companyId, status: "INACTIVE" } }),
      db.vendorVehicle.count({ 
        where: { 
          vendor: { companyId } 
        } 
      }),
    ]);

    return {
      totalVendors,
      activeVendors,
      inactiveVendors,
      totalVehicles,
    };
  }
}
