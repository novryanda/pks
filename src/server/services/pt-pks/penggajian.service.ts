import { penggajianRepository } from "@/server/repositories/penggajian.repository";
import {
  createPenggajianSchema,
  updatePenggajianSchema,
  type CreatePenggajianInput,
  type UpdatePenggajianInput,
  type PenggajianQueryInput,
} from "@/server/schema/penggajian";

export class PenggajianService {
  /**
   * Get all penggajian with pagination and filters
   */
  async getPenggajian(query?: PenggajianQueryInput) {
    return penggajianRepository.findAll(query);
  }

  /**
   * Get penggajian by id
   */
  async getPenggajianById(id: string) {
    const penggajian = await penggajianRepository.findById(id);
    if (!penggajian) {
      throw new Error("Data penggajian tidak ditemukan");
    }
    return penggajian;
  }

  /**
   * Get distinct divisi list
   */
  async getDevisiList() {
    return penggajianRepository.getDistinctDivisi();
  }

  /**
   * Get distinct periode list
   */
  async getPeriodeList() {
    return penggajianRepository.getDistinctPeriode();
  }

  /**
   * Create new penggajian
   */
  async createPenggajian(data: CreatePenggajianInput) {
    const validatedData = createPenggajianSchema.parse(data);
    return penggajianRepository.create(validatedData);
  }

  /**
   * Update penggajian
   */
  async updatePenggajian(id: string, data: UpdatePenggajianInput) {
    const validatedData = updatePenggajianSchema.parse(data);

    const existing = await penggajianRepository.findById(id);
    if (!existing) {
      throw new Error("Data penggajian tidak ditemukan");
    }

    return penggajianRepository.update(id, validatedData);
  }

  /**
   * Delete penggajian
   */
  async deletePenggajian(id: string) {
    const existing = await penggajianRepository.findById(id);
    if (!existing) {
      throw new Error("Data penggajian tidak ditemukan");
    }

    return penggajianRepository.delete(id);
  }

  /**
   * Delete all penggajian by periode
   */
  async deletePenggajianByPeriode(periodeBulan: number, periodeTahun: number) {
    return penggajianRepository.deleteByPeriode(periodeBulan, periodeTahun);
  }

  /**
   * Delete multiple penggajian by IDs
   */
  async deletePenggajianBulk(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new Error("IDs tidak boleh kosong");
    }
    return penggajianRepository.deleteMany(ids);
  }

  /**
   * Get summary statistics
   */
  async getSummary(periodeBulan?: number, periodeTahun?: number) {
    return penggajianRepository.getSummary(periodeBulan, periodeTahun);
  }
}

export const penggajianService = new PenggajianService();
