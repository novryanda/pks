import { masterDivisiRepository } from "@/server/repositories/master-divisi.repository";
import { createDivisiSchema, updateDivisiSchema } from "@/server/schema/master-divisi";
import type { CreateDivisiInput, UpdateDivisiInput, DivisiQueryInput } from "@/server/schema/master-divisi";

export class MasterDivisiService {
    /**
     * Get all divisi with pagination and filters
     */
    async getDivisi(query?: DivisiQueryInput) {
        return masterDivisiRepository.findAll(query);
    }

    /**
     * Get divisi by id
     */
    async getDivisiById(id: string) {
        const divisi = await masterDivisiRepository.findById(id);
        if (!divisi) {
            throw new Error("Data divisi tidak ditemukan");
        }
        return divisi;
    }

    /**
     * Get all active divisi for dropdown
     */
    async getActiveList() {
        return masterDivisiRepository.getActiveList();
    }

    /**
     * Create new divisi
     */
    async createDivisi(data: CreateDivisiInput) {
        const validatedData = createDivisiSchema.parse(data);



        return masterDivisiRepository.create(validatedData);
    }

    /**
     * Update divisi
     */
    async updateDivisi(id: string, data: UpdateDivisiInput) {
        const validatedData = updateDivisiSchema.parse(data);

        const existing = await masterDivisiRepository.findById(id);
        if (!existing) {
            throw new Error("Data divisi tidak ditemukan");
        }



        return masterDivisiRepository.update(id, validatedData);
    }

    /**
     * Delete divisi
     */
    async deleteDivisi(id: string) {
        const existing = await masterDivisiRepository.findById(id);
        if (!existing) {
            throw new Error("Data divisi tidak ditemukan");
        }
        return masterDivisiRepository.delete(id);
    }
}

export const masterDivisiService = new MasterDivisiService();
