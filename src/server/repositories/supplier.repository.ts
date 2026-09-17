import { db } from "@/server/db";
import type { CreateSupplierInput, UpdateSupplierInput } from "@/server/schema/supplier";
import { Prisma } from "@prisma/client";

export class SupplierRepository {
  /**
   * Get all suppliers by companyId
   */
  async findByCompanyId(companyId: string) {
    return db.supplier.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get supplier by id
   */
  async findById(id: string) {
    return db.supplier.findUnique({
      where: { id },
    });
  }

  /**
   * Get supplier by id with all data for PDF generation
   */
  async findByIdForPDF(id: string) {
    return db.supplier.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        ownerName: true,
        companyName: true,
        address: true,
        personalPhone: true,
        companyPhone: true,
        rampPeronAddress: true,
        longitude: true,
        latitude: true,
        swadaya: true,
        kelompok: true,
        perusahaan: true,
        jenisBibit: true,
        certificationISPO: true,
        certificationRSPO: true,
        aktePendirian: true,
        aktePerubahan: true,
        nib: true,
        siup: true,
        npwp: true,
        salesChannel: true,
        salesChannelDetails: true,
        transportation: true,
        transportationUnits: true,
        gardenProfiles: true,
        bankAccounts: true,
      },
    });
  }

  /**
   * Create new supplier
   */
  async create(data: CreateSupplierInput) {
    return db.supplier.create({
      data: {
        ...data,
        gardenProfiles: data.gardenProfiles as Prisma.InputJsonValue,
        bankAccounts: data.bankAccounts ? (data.bankAccounts as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
  }

  /**
   * Update supplier
   */
  async update(id: string, data: Partial<UpdateSupplierInput>) {
    const updateData: any = {
      ...data,
    };

    if (data.gardenProfiles) {
      updateData.gardenProfiles = data.gardenProfiles as Prisma.InputJsonValue;
    }

    if (data.bankAccounts !== undefined) {
      updateData.bankAccounts = data.bankAccounts ? (data.bankAccounts as Prisma.InputJsonValue) : Prisma.DbNull;
    }

    return db.supplier.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete supplier
   */
  async delete(id: string) {
    return db.supplier.delete({
      where: { id },
    });
  }

  /**
   * Get suppliers with location data for map
   */
  async findSuppliersForMap(companyId: string) {
    return db.supplier.findMany({
      where: { companyId },
      select: {
        id: true,
        ownerName: true,
        companyName: true,
        type: true,
        longitude: true,
        latitude: true,
        address: true,
        personalPhone: true,
      },
    });
  }

  /**
   * Search suppliers with filters
   */
  async search(
    companyId: string,
    searchTerm?: string,
    filters?: {
      pengelolaan?: "swadaya" | "kelompok" | "perusahaan";
      sertifikasi?: "ISPO" | "RSPO";
    }
  ) {
    const where: Prisma.SupplierWhereInput = {
      companyId,
    };

    // Search term filter (name, company, address, phone)
    if (searchTerm) {
      where.OR = [
        { ownerName: { contains: searchTerm, mode: "insensitive" } },
        { companyName: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
        { personalPhone: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    // Jenis pengelolaan filter
    if (filters?.pengelolaan) {
      if (filters.pengelolaan === "swadaya") {
        where.swadaya = true;
      } else if (filters.pengelolaan === "kelompok") {
        where.kelompok = true;
      } else if (filters.pengelolaan === "perusahaan") {
        where.perusahaan = true;
      }
    }

    // Sertifikasi filter
    if (filters?.sertifikasi) {
      if (filters.sertifikasi === "ISPO") {
        where.certificationISPO = true;
      } else if (filters.sertifikasi === "RSPO") {
        where.certificationRSPO = true;
      }
    }

    return db.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }
}

export const supplierRepository = new SupplierRepository();
