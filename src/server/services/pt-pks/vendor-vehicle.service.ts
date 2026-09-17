import { VendorVehicleRepository } from "@/server/repositories/vendor-vehicle.repository";
import { VendorRepository } from "@/server/repositories/vendor.repository";
import { db } from "@/server/db";
import {
  createVendorVehicleSchema,
  updateVendorVehicleSchema,
  type CreateVendorVehicleInput,
  type UpdateVendorVehicleInput,
} from "@/server/schema/vendor";

const vendorVehicleRepository = new VendorVehicleRepository();
const vendorRepository = new VendorRepository();

export class VendorVehicleService {
  /**
   * Get all vehicles for a vendor
   */
  async getVehiclesByVendorId(vendorId: string, companyId: string) {
    // Verify vendor exists and belongs to company
    const vendor = await vendorRepository.findById(vendorId, companyId);
    if (!vendor) {
      throw new Error("Vendor tidak ditemukan");
    }

    return vendorVehicleRepository.findByVendorId(vendorId);
  }

  /**
   * Get vehicle by id
   */
  async getVehicleById(id: string, vendorId: string, companyId: string) {
    // Verify vendor exists and belongs to company
    const vendor = await vendorRepository.findById(vendorId, companyId);
    if (!vendor) {
      throw new Error("Vendor tidak ditemukan");
    }

    const vehicle = await vendorVehicleRepository.findById(id, vendorId);
    if (!vehicle) {
      throw new Error("Kendaraan tidak ditemukan");
    }
    return vehicle;
  }

  /**
   * Get active vehicles for dropdown
   */
  async getActiveVehicles(vendorId: string, companyId: string) {
    // Verify vendor exists and belongs to company
    const vendor = await vendorRepository.findById(vendorId, companyId);
    if (!vendor) {
      throw new Error("Vendor tidak ditemukan");
    }

    return vendorVehicleRepository.findActiveVehicles(vendorId);
  }

  /**
   * Get vehicle statistics
   */
  async getVehicleStatistics(vendorId: string, companyId: string) {
    // Verify vendor exists and belongs to company
    const vendor = await vendorRepository.findById(vendorId, companyId);
    if (!vendor) {
      throw new Error("Vendor tidak ditemukan");
    }

    return vendorVehicleRepository.getStatistics(vendorId);
  }

  /**
   * Create new vehicle
   */
  async createVehicle(
    vendorId: string,
    companyId: string,
    data: CreateVendorVehicleInput
  ) {
    // Validate input
    const validatedData = createVendorVehicleSchema.parse(data);

    // Verify vendor exists and belongs to company
    const vendor = await vendorRepository.findById(vendorId, companyId);
    if (!vendor) {
      throw new Error("Vendor tidak ditemukan");
    }

    const vehicleAssignmentExists =
      await vendorVehicleRepository.isVehicleAssignmentExists(
        validatedData.nomorKendaraan,
        validatedData.namaSupir,
        vendorId
      );
    if (vehicleAssignmentExists) {
      throw new Error("Kombinasi nomor kendaraan dan nama supir sudah terdaftar untuk vendor ini");
    }

    // Create vehicle
    return vendorVehicleRepository.create(vendorId, validatedData);
  }

  /**
   * Update vehicle
   */
  async updateVehicle(
    id: string,
    vendorId: string,
    companyId: string,
    data: UpdateVendorVehicleInput
  ) {
    // Validate input
    const validatedData = updateVendorVehicleSchema.parse(data);

    // Verify vendor exists and belongs to company
    const vendor = await vendorRepository.findById(vendorId, companyId);
    if (!vendor) {
      throw new Error("Vendor tidak ditemukan");
    }

    // Check if vehicle exists
    const existing = await vendorVehicleRepository.findById(id, vendorId);
    if (!existing) {
      throw new Error("Kendaraan tidak ditemukan");
    }

    const nomorKendaraan = validatedData.nomorKendaraan ?? existing.nomorKendaraan;
    const namaSupir = validatedData.namaSupir ?? existing.namaSupir;

    const vehicleAssignmentExists =
      await vendorVehicleRepository.isVehicleAssignmentExists(
        nomorKendaraan,
        namaSupir,
        vendorId,
        id
      );
    if (vehicleAssignmentExists) {
      throw new Error("Kombinasi nomor kendaraan dan nama supir sudah terdaftar untuk vendor ini");
    }

    // Update vehicle
    return vendorVehicleRepository.update(id, vendorId, validatedData);
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(id: string, vendorId: string, companyId: string) {
    // Verify vendor exists and belongs to company
    const vendor = await vendorRepository.findById(vendorId, companyId);
    if (!vendor) {
      throw new Error("Vendor tidak ditemukan");
    }

    // Check if vehicle exists
    const existing = await vendorVehicleRepository.findById(id, vendorId);
    if (!existing) {
      throw new Error("Kendaraan tidak ditemukan");
    }

    const usedInPengiriman = await db.pengirimanProduct.count({
      where: {
        vendorVehicleId: id,
      },
    });

    if (usedInPengiriman > 0) {
      throw new Error(
        "Kendaraan/supir ini sudah digunakan di pengiriman product dan tidak bisa dihapus. Nonaktifkan data ini jika sudah tidak dipakai."
      );
    }

    // Delete vehicle
    return vendorVehicleRepository.delete(id, vendorId);
  }
}

export const vendorVehicleService = new VendorVehicleService();
