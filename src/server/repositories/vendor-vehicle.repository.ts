import { db } from "@/server/db";
import type {
  CreateVendorVehicleInput,
  UpdateVendorVehicleInput,
} from "@/server/schema/vendor";
import type { Prisma, StatusVendor } from "@prisma/client";

export class VendorVehicleRepository {
  /**
   * Get all vehicles for a vendor
   */
  async findByVendorId(vendorId: string) {
    return db.vendorVehicle.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get vehicle by id
   */
  async findById(id: string, vendorId: string) {
    return db.vendorVehicle.findUnique({
      where: { id, vendorId },
      include: {
        vendor: {
          select: {
            id: true,
            code: true,
            name: true,
            companyId: true,
          },
        },
      },
    });
  }

  /**
   * Check if nomor kendaraan exists for a vendor
   */
  async isVehicleAssignmentExists(
    nomorKendaraan: string,
    namaSupir: string,
    vendorId: string,
    excludeId?: string
  ) {
    const where: Prisma.VendorVehicleWhereInput = {
      nomorKendaraan,
      namaSupir,
      vendorId,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const vehicle = await db.vendorVehicle.findFirst({ where });
    return !!vehicle;
  }

  /**
   * Create new vehicle
   */
  async create(vendorId: string, data: CreateVendorVehicleInput) {
    return db.vendorVehicle.create({
      data: {
        ...data,
        vendorId,
      },
    });
  }

  /**
   * Update vehicle
   */
  async update(id: string, vendorId: string, data: UpdateVendorVehicleInput) {
    return db.vendorVehicle.update({
      where: { id, vendorId },
      data,
    });
  }

  /**
   * Delete vehicle
   */
  async delete(id: string, vendorId: string) {
    return db.vendorVehicle.delete({
      where: { id, vendorId },
    });
  }

  /**
   * Get active vehicles for a vendor (for dropdown)
   */
  async findActiveVehicles(vendorId: string) {
    return db.vendorVehicle.findMany({
      where: {
        vendorId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        nomorKendaraan: true,
        namaSupir: true,
        noHpSupir: true,
        noSim: true,
      },
      orderBy: [{ nomorKendaraan: "asc" }, { namaSupir: "asc" }],
    });
  }

  /**
   * Get vehicle statistics for a vendor
   */
  async getStatistics(vendorId: string) {
    const [totalVehicles, activeVehicles, inactiveVehicles] = await Promise.all([
      db.vendorVehicle.count({ where: { vendorId } }),
      db.vendorVehicle.count({ where: { vendorId, status: "ACTIVE" } }),
      db.vendorVehicle.count({ where: { vendorId, status: "INACTIVE" } }),
    ]);

    return {
      totalVehicles,
      activeVehicles,
      inactiveVehicles,
    };
  }
}
