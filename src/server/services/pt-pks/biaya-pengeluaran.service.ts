import { db } from "@/server/db";
import { biayaPengeluaranRepository } from "@/server/repositories/biaya-pengeluaran.repository";
import {
    createBiayaPengeluaranSchema,
    updateBiayaPengeluaranSchema,
    biayaPengeluaranQuerySchema,
    type CreateBiayaPengeluaranInput,
    type UpdateBiayaPengeluaranInput,
    type BiayaPengeluaranQueryInput,
} from "@/server/schema/keuangan";

// Kategori labels for display
const KATEGORI_LABELS: Record<string, string> = {
    PLN: "Biaya PLN",
    OPERASIONAL_KEUANGAN: "Biaya Operasional Keuangan",
    PPN: "PPN",
    PPH_21: "PPH 21 (Karyawan)",
    PPH_22: "PPH 22 (Barang)",
    PPH_23: "PPH 23 (Jasa)",
    BPJS: "BPJS",
};

export const biayaPengeluaranService = {
    /**
     * Get all biaya with filters - with validation
     */
    async getAll(companyId: string, filters?: BiayaPengeluaranQueryInput) {
        // Validate filters if provided
        const validatedFilters = filters
            ? biayaPengeluaranQuerySchema.parse(filters)
            : undefined;

        return biayaPengeluaranRepository.getAll(companyId, validatedFilters);
    },

    /**
     * Get biaya by ID
     */
    async getById(id: string) {
        return biayaPengeluaranRepository.getById(id);
    },

    /**
     * Create new biaya - with validation
     */
    async create(input: CreateBiayaPengeluaranInput & { companyId: string; dibuatOleh: string }) {
        // Validate input
        const validated = createBiayaPengeluaranSchema.parse(input);

        // Generate nomor biaya
        const nomorBiaya = await biayaPengeluaranRepository.generateNomorBiaya(input.companyId);

        return biayaPengeluaranRepository.create({
            companyId: input.companyId,
            nomorBiaya,
            tanggalBiaya: validated.tanggalBiaya,
            kategoriBiaya: validated.kategoriBiaya,
            deskripsi: validated.deskripsi,
            jumlahBiaya: validated.jumlahBiaya,
            periodeBulan: validated.periodeBulan ?? undefined,
            periodeTahun: validated.periodeTahun ?? undefined,
            keterangan: validated.keterangan ?? undefined,
            dibuatOleh: input.dibuatOleh,
        });
    },

    /**
     * Update biaya - with validation
     */
    async update(id: string, input: UpdateBiayaPengeluaranInput) {
        // Validate input
        const validated = updateBiayaPengeluaranSchema.parse(input);

        return biayaPengeluaranRepository.update(id, validated);
    },

    /**
     * Mark biaya as paid
     */
    async markAsPaid(id: string) {
        const updated = await biayaPengeluaranRepository.update(id, { status: "PAID" });
        if (updated?.pengajuanBiayaOperasionalId) {
            await db.pengajuanBiayaOperasional.update({
                where: { id: updated.pengajuanBiayaOperasionalId },
                data: { status: "PAID" },
            }).catch(() => null);
        }
        return updated;
    },

    /**
     * Reactivate biaya (back to ACTIVE)
     */
    async reactivate(id: string) {
        const updated = await biayaPengeluaranRepository.update(id, { status: "ACTIVE" });
        if (updated?.pengajuanBiayaOperasionalId) {
            await db.pengajuanBiayaOperasional.update({
                where: { id: updated.pengajuanBiayaOperasionalId },
                data: { status: "APPROVED" },
            }).catch(() => null);
        }
        return updated;
    },

    /**
     * Soft delete (set status to CANCELLED)
     */
    async delete(id: string) {
        return biayaPengeluaranRepository.delete(id);
    },

    /**
     * Get summary by kategori for neraca
     */
    async getSummary(companyId: string, filters?: { startDate?: string; endDate?: string }) {
        return biayaPengeluaranRepository.getSummaryByKategori(companyId, filters);
    },

    /**
     * Get total biaya for neraca integration (only ACTIVE and PAID)
     */
    async getTotalForNeraca(companyId: string, filters?: { startDate?: string; endDate?: string }) {
        const summary = await biayaPengeluaranRepository.getSummaryByKategori(companyId, filters);
        return {
            total: summary.total,
            unpaid: summary.byKategori
                .filter((k: { kategori: string }) => k.kategori !== "PAID")
                .reduce((sum: number, k: { total: number }) => sum + k.total, 0),
            byKategori: summary.byKategori.map((item: { kategori: string; total: number; count: number }) => ({
                ...item,
                label: KATEGORI_LABELS[item.kategori] || item.kategori,
            })),
        };
    },

    /**
     * Get kategori label
     */
    getKategoriLabel(kategori: string): string {
        return KATEGORI_LABELS[kategori] || kategori;
    },
};
