import { db } from "@/server/db";
import {
  biayaOperasionalRepository,
  type PengajuanBiayaFilters,
} from "@/server/repositories/biaya-operasional.repository";
import { biayaPengeluaranRepository } from "@/server/repositories/biaya-pengeluaran.repository";
import {
  createPengajuanBiayaSchema,
  updatePengajuanBiayaSchema,
  statusPengajuanBiayaActionSchema,
  pengajuanBiayaQuerySchema,
  type CreatePengajuanBiayaInput,
  type UpdatePengajuanBiayaInput,
  type StatusPengajuanBiayaActionInput,
  type PengajuanBiayaQueryInput,
} from "@/server/schema/biaya-operasional";

export const biayaOperasionalService = {
  /**
   * Get all pengajuan biaya with query filters
   */
  async getAll(companyId: string, filters?: PengajuanBiayaQueryInput) {
    const validatedFilters = filters ? pengajuanBiayaQuerySchema.parse(filters) : undefined;
    return biayaOperasionalRepository.getAll(companyId, validatedFilters as PengajuanBiayaFilters);
  },

  /**
   * Get summary statistics
   */
  async getSummary(companyId: string) {
    return biayaOperasionalRepository.getSummary(companyId);
  },

  /**
   * Get detail pengajuan by ID
   */
  async getById(id: string) {
    const pengajuan = await biayaOperasionalRepository.getById(id);
    if (!pengajuan) {
      throw new Error("Pengajuan biaya operasional tidak ditemukan");
    }
    return pengajuan;
  },

  /**
   * Create new pengajuan biaya operasional
   */
  async create(input: CreatePengajuanBiayaInput & { companyId: string; requestedBy: string }) {
    const validated = createPengajuanBiayaSchema.parse(input);

    // Calculate item subtotals and totalBiaya
    const items = validated.items.map((item) => {
      const subtotal = Math.round(item.jumlah * item.estimasiHarga);
      return {
        ...item,
        subtotal,
      };
    });

    const totalBiaya = items.reduce((acc, item) => acc + item.subtotal, 0);

    const nomorPengajuan = await biayaOperasionalRepository.generateNomorPengajuan(input.companyId);

    return biayaOperasionalRepository.create({
      companyId: input.companyId,
      nomorPengajuan,
      tanggalPengajuan: validated.tanggalPengajuan,
      divisi: validated.divisi,
      kategoriBiaya: validated.kategoriBiaya,
      keperluan: validated.keperluan,
      totalBiaya,
      requestedBy: input.requestedBy,
      catatan: validated.catatan,
      items,
    });
  },

   /**
   * Update existing pengajuan (allowed in DRAFT, PENDING, and APPROVED status as long as not PAID/CANCELLED)
   */
  async update(id: string, input: UpdatePengajuanBiayaInput) {
    const existing = await biayaOperasionalRepository.getById(id);
    if (!existing) {
      throw new Error("Pengajuan biaya operasional tidak ditemukan");
    }

    if (existing.status === "PAID") {
      throw new Error("Pengajuan yang sudah berstatus Lunas (PAID) tidak dapat diubah");
    }

    if (existing.status === "CANCELLED") {
      throw new Error("Pengajuan yang sudah dibatalkan tidak dapat diubah");
    }

    const validated = updatePengajuanBiayaSchema.parse(input);

    let items;
    let totalBiaya = existing.totalBiaya;

    if (validated.items) {
      items = validated.items.map((item) => {
        const subtotal = Math.round(item.jumlah * item.estimasiHarga);
        return {
          ...item,
          subtotal,
        };
      });
      totalBiaya = items.reduce((acc, item) => acc + item.subtotal, 0);
    }

    const syncBiayaPengeluaranId =
      existing.status === "APPROVED" && existing.biayaPengeluaran
        ? existing.biayaPengeluaran.id
        : undefined;

    return biayaOperasionalRepository.update(
      id,
      {
        tanggalPengajuan: validated.tanggalPengajuan,
        divisi: validated.divisi,
        kategoriBiaya: validated.kategoriBiaya,
        keperluan: validated.keperluan,
        totalBiaya,
        catatan: validated.catatan,
        items,
      },
      syncBiayaPengeluaranId
    );
  },

  /**
   * Delete pengajuan (allowed as long as not PAID)
   */
  async delete(id: string) {
    const existing = await biayaOperasionalRepository.getById(id);
    if (!existing) {
      throw new Error("Pengajuan biaya operasional tidak ditemukan");
    }

    if (existing.status === "PAID") {
      throw new Error("Pengajuan yang sudah berstatus Lunas (PAID) tidak dapat dihapus");
    }

    return biayaOperasionalRepository.delete(id, existing.biayaPengeluaran?.id);
  },

  /**
   * Process status actions: submit, approve, reject, cancel
   */
  async handleAction(
    id: string,
    actionInput: StatusPengajuanBiayaActionInput,
    user: { username: string; name?: string }
  ) {
    const validated = statusPengajuanBiayaActionSchema.parse(actionInput);
    const pengajuan = await biayaOperasionalRepository.getById(id);
    if (!pengajuan) {
      throw new Error("Pengajuan biaya operasional tidak ditemukan");
    }

    const userName = user.name || user.username;

    switch (validated.action) {
      case "submit": {
        if (pengajuan.status !== "DRAFT") {
          throw new Error("Hanya pengajuan berstatus Draft yang dapat diajukan (Submit)");
        }
        return biayaOperasionalRepository.updateStatus(id, {
          status: "PENDING",
        });
      }

      case "approve": {
        if (pengajuan.status !== "PENDING") {
          throw new Error("Hanya pengajuan berstatus Menunggu Persetujuan (Pending) yang dapat disetujui");
        }

        // Transaction: Approve pengajuan and create record in BiayaPengeluaran
        return db.$transaction(async (tx) => {
          // 1. Update pengajuan to APPROVED
          const approvedPengajuan = await tx.pengajuanBiayaOperasional.update({
            where: { id },
            data: {
              status: "APPROVED",
              approvedBy: userName,
              tanggalApproval: new Date(),
              alasanReject: null,
            },
            include: {
              items: true,
            },
          });

          // 2. Generate nomor biaya
          const nomorBiaya = await biayaPengeluaranRepository.generateNomorBiaya(pengajuan.companyId);

          // 3. Create BiayaPengeluaran record in Keuangan module
          await tx.biayaPengeluaran.create({
            data: {
              companyId: pengajuan.companyId,
              nomorBiaya,
              tanggalBiaya: pengajuan.tanggalPengajuan,
              kategoriBiaya: pengajuan.kategoriBiaya,
              deskripsi: `[Pengajuan ${pengajuan.nomorPengajuan}] ${pengajuan.keperluan}`,
              jumlahBiaya: pengajuan.totalBiaya,
              periodeBulan: pengajuan.tanggalPengajuan.getMonth() + 1,
              periodeTahun: pengajuan.tanggalPengajuan.getFullYear(),
              keterangan: `Diajukan oleh: ${pengajuan.requestedBy} (${pengajuan.divisi}) | Ref Pengajuan: ${pengajuan.nomorPengajuan}`,
              status: "ACTIVE", // Ready to be paid in Keuangan
              dibuatOleh: userName,
              pengajuanBiayaOperasionalId: pengajuan.id,
            },
          });

          return approvedPengajuan;
        });
      }

      case "reject": {
        if (pengajuan.status !== "PENDING") {
          throw new Error("Hanya pengajuan berstatus Menunggu Persetujuan (Pending) yang dapat ditolak");
        }
        if (!validated.alasanReject?.trim()) {
          throw new Error("Alasan penolakan wajib diisi");
        }

        return biayaOperasionalRepository.updateStatus(id, {
          status: "REJECTED",
          approvedBy: userName,
          tanggalApproval: new Date(),
          alasanReject: validated.alasanReject.trim(),
        });
      }

      case "cancel": {
        if (pengajuan.status === "PAID") {
          throw new Error("Pengajuan yang sudah lunas dibayar tidak dapat dibatalkan");
        }

        return db.$transaction(async (tx) => {
          // If associated with BiayaPengeluaran, cancel or delete it
          const linkedBiaya = await tx.biayaPengeluaran.findUnique({
            where: { pengajuanBiayaOperasionalId: id },
          });

          if (linkedBiaya) {
            await tx.biayaPengeluaran.update({
              where: { id: linkedBiaya.id },
              data: { status: "CANCELLED" },
            });
          }

          return tx.pengajuanBiayaOperasional.update({
            where: { id },
            data: {
              status: "CANCELLED",
            },
            include: {
              items: true,
            },
          });
        });
      }

      default:
        throw new Error("Aksi tidak valid");
    }
  },
};
