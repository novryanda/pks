import { db } from "@/server/db";
import type { StatusPengajuanBiaya } from "@/server/schema/biaya-operasional";

export interface PengajuanBiayaFilters {
  search?: string;
  kategoriBiaya?: string;
  status?: StatusPengajuanBiaya | string;
  divisi?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}

export const biayaOperasionalRepository = {
  /**
   * Generate next nomor pengajuan (BO-YYYYMM-XXXX)
   */
  async generateNomorPengajuan(companyId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `BO-${year}${month}`;

    const lastPengajuan = await db.pengajuanBiayaOperasional.findFirst({
      where: {
        companyId,
        nomorPengajuan: { startsWith: prefix },
      },
      orderBy: { nomorPengajuan: "desc" },
    });

    let nextNumber = 1;
    if (lastPengajuan) {
      const parts = lastPengajuan.nomorPengajuan.split("-");
      if (parts.length >= 3) {
        const lastNumber = parseInt(parts[2] || "0", 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
  },

  /**
   * Get all pengajuan biaya with filters and pagination
   */
  async getAll(companyId: string, filters?: PengajuanBiayaFilters) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      companyId,
      status: { not: "CANCELLED" },
    };

    if (filters?.kategoriBiaya && filters.kategoriBiaya !== "all") {
      whereClause.kategoriBiaya = filters.kategoriBiaya;
    }

    if (filters?.status && filters.status !== "all") {
      whereClause.status = filters.status;
    }

    if (filters?.divisi && filters.divisi !== "all") {
      whereClause.divisi = filters.divisi;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.tanggalPengajuan = {};
      if (filters.startDate) {
        const start = typeof filters.startDate === "string" ? new Date(filters.startDate) : filters.startDate;
        whereClause.tanggalPengajuan.gte = start;
      }
      if (filters.endDate) {
        const end = typeof filters.endDate === "string" ? new Date(filters.endDate) : filters.endDate;
        end.setHours(23, 59, 59, 999);
        whereClause.tanggalPengajuan.lte = end;
      }
    }

    if (filters?.search) {
      const search = filters.search.trim();
      whereClause.OR = [
        { nomorPengajuan: { contains: search, mode: "insensitive" } },
        { divisi: { contains: search, mode: "insensitive" } },
        { keperluan: { contains: search, mode: "insensitive" } },
        { requestedBy: { contains: search, mode: "insensitive" } },
      ];
    }

    return db.pengajuanBiayaOperasional.findMany({
      where: whereClause,
      include: {
        items: true,
        biayaPengeluaran: {
          select: {
            id: true,
            nomorBiaya: true,
            status: true,
            jumlahBiaya: true,
            tanggalBiaya: true,
          },
        },
      },
      orderBy: { tanggalPengajuan: "desc" },
    });
  },

  /**
   * Get detail pengajuan by ID
   */
  async getById(id: string) {
    return db.pengajuanBiayaOperasional.findUnique({
      where: { id },
      include: {
        items: true,
        biayaPengeluaran: true,
      },
    });
  },

  /**
   * Create new pengajuan with items
   */
  async create(data: {
    companyId: string;
    nomorPengajuan: string;
    tanggalPengajuan: Date;
    divisi: string;
    kategoriBiaya: string;
    keperluan: string;
    totalBiaya: number;
    requestedBy: string;
    catatan?: string | null;
    items: Array<{
      deskripsi: string;
      jumlah: number;
      satuan: string;
      estimasiHarga: number;
      subtotal: number;
      keterangan?: string | null;
    }>;
  }) {
    return db.pengajuanBiayaOperasional.create({
      data: {
        companyId: data.companyId,
        nomorPengajuan: data.nomorPengajuan,
        tanggalPengajuan: data.tanggalPengajuan,
        divisi: data.divisi,
        kategoriBiaya: data.kategoriBiaya,
        keperluan: data.keperluan,
        totalBiaya: data.totalBiaya,
        requestedBy: data.requestedBy,
        catatan: data.catatan,
        status: "DRAFT",
        items: {
          create: data.items.map((item) => ({
            deskripsi: item.deskripsi,
            jumlah: item.jumlah,
            satuan: item.satuan,
            estimasiHarga: item.estimasiHarga,
            subtotal: item.subtotal,
            keterangan: item.keterangan,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  },

  /**
   * Update pengajuan and replace items (optional sync to BiayaPengeluaran)
   */
  async update(
    id: string,
    data: {
      tanggalPengajuan?: Date;
      divisi?: string;
      kategoriBiaya?: string;
      keperluan?: string;
      totalBiaya?: number;
      catatan?: string | null;
      items?: Array<{
        deskripsi: string;
        jumlah: number;
        satuan: string;
        estimasiHarga: number;
        subtotal: number;
        keterangan?: string | null;
      }>;
    },
    syncBiayaPengeluaranId?: string
  ) {
    return db.$transaction(async (tx) => {
      if (data.items) {
        // Delete old items
        await tx.pengajuanBiayaOperasionalItem.deleteMany({
          where: { pengajuanId: id },
        });

        // Insert new items
        await tx.pengajuanBiayaOperasionalItem.createMany({
          data: data.items.map((item) => ({
            pengajuanId: id,
            deskripsi: item.deskripsi,
            jumlah: item.jumlah,
            satuan: item.satuan,
            estimasiHarga: item.estimasiHarga,
            subtotal: item.subtotal,
            keterangan: item.keterangan,
          })),
        });
      }

      const updated = await tx.pengajuanBiayaOperasional.update({
        where: { id },
        data: {
          tanggalPengajuan: data.tanggalPengajuan,
          divisi: data.divisi,
          kategoriBiaya: data.kategoriBiaya,
          keperluan: data.keperluan,
          totalBiaya: data.totalBiaya,
          catatan: data.catatan,
        },
        include: {
          items: true,
        },
      });

      if (syncBiayaPengeluaranId) {
        const tgl = data.tanggalPengajuan ?? updated.tanggalPengajuan;
        await tx.biayaPengeluaran.update({
          where: { id: syncBiayaPengeluaranId },
          data: {
            jumlahBiaya: data.totalBiaya ?? updated.totalBiaya,
            deskripsi: `[Pengajuan ${updated.nomorPengajuan}] ${data.keperluan ?? updated.keperluan}`,
            kategoriBiaya: data.kategoriBiaya ?? updated.kategoriBiaya,
            tanggalBiaya: tgl,
            periodeBulan: tgl.getMonth() + 1,
            periodeTahun: tgl.getFullYear(),
            keterangan: `Diajukan oleh: ${updated.requestedBy} (${data.divisi ?? updated.divisi}) | Ref Pengajuan: ${updated.nomorPengajuan}`,
          },
        });
      }

      return updated;
    });
  },

  /**
   * Update status pengajuan
   */
  async updateStatus(
    id: string,
    data: {
      status: StatusPengajuanBiaya;
      approvedBy?: string | null;
      tanggalApproval?: Date | null;
      alasanReject?: string | null;
    }
  ) {
    return db.pengajuanBiayaOperasional.update({
      where: { id },
      data: {
        status: data.status,
        approvedBy: data.approvedBy,
        tanggalApproval: data.tanggalApproval,
        alasanReject: data.alasanReject,
      },
      include: {
        items: true,
      },
    });
  },

  /**
   * Delete pengajuan (and associated BiayaPengeluaran if provided)
   */
  async delete(id: string, deleteBiayaPengeluaranId?: string) {
    return db.$transaction(async (tx) => {
      if (deleteBiayaPengeluaranId) {
        await tx.biayaPengeluaran.delete({
          where: { id: deleteBiayaPengeluaranId },
        });
      }

      return tx.pengajuanBiayaOperasional.delete({
        where: { id },
      });
    });
  },

  /**
   * Get summary counts and total nominals
   */
  async getSummary(companyId: string) {
    const all = await db.pengajuanBiayaOperasional.findMany({
      where: {
        companyId,
        status: { not: "CANCELLED" },
      },
      select: {
        status: true,
        totalBiaya: true,
      },
    });

    const summary = {
      totalCount: all.length,
      totalNominal: 0,
      draftCount: 0,
      pendingCount: 0,
      pendingNominal: 0,
      approvedCount: 0,
      approvedNominal: 0,
      paidCount: 0,
      paidNominal: 0,
      rejectedCount: 0,
    };

    all.forEach((item) => {
      summary.totalNominal += item.totalBiaya;
      if (item.status === "DRAFT") summary.draftCount++;
      if (item.status === "PENDING") {
        summary.pendingCount++;
        summary.pendingNominal += item.totalBiaya;
      }
      if (item.status === "APPROVED") {
        summary.approvedCount++;
        summary.approvedNominal += item.totalBiaya;
      }
      if (item.status === "PAID") {
        summary.paidCount++;
        summary.paidNominal += item.totalBiaya;
      }
      if (item.status === "REJECTED") summary.rejectedCount++;
    });

    return summary;
  },
};
