import { masterJabatanRepository } from "@/server/repositories/master-jabatan.repository";
import { createJabatanSchema, updateJabatanSchema } from "@/server/schema/master-jabatan";
import type { CreateJabatanInput, UpdateJabatanInput, JabatanQueryInput } from "@/server/schema/master-jabatan";

export class MasterJabatanService {
    /**
     * Get all jabatan with pagination and filters
     */
    async getJabatan(query?: JabatanQueryInput) {
        return masterJabatanRepository.findAll(query);
    }

    /**
     * Get jabatan by id
     */
    async getJabatanById(id: string) {
        const jabatan = await masterJabatanRepository.findById(id);
        if (!jabatan) {
            throw new Error("Data jabatan tidak ditemukan");
        }
        return jabatan;
    }

    /**
     * Get all active jabatan for dropdown
     */
    async getActiveList() {
        return masterJabatanRepository.getActiveList();
    }

    /**
     * Create new jabatan
     */
    async createJabatan(data: CreateJabatanInput) {
        const validatedData = createJabatanSchema.parse(data);



        return masterJabatanRepository.create(validatedData);
    }

    /**
     * Update jabatan
     */
    async updateJabatan(id: string, data: UpdateJabatanInput) {
        const validatedData = updateJabatanSchema.parse(data);

        const existing = await masterJabatanRepository.findById(id);
        if (!existing) {
            throw new Error("Data jabatan tidak ditemukan");
        }



        return masterJabatanRepository.update(id, validatedData);
    }

    /**
     * Delete jabatan
     */
    async deleteJabatan(id: string) {
        const existing = await masterJabatanRepository.findById(id);
        if (!existing) {
            throw new Error("Data jabatan tidak ditemukan");
        }
        return masterJabatanRepository.delete(id);
    }
}

export const masterJabatanService = new MasterJabatanService();
