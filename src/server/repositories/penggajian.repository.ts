import { db } from "@/server/db";
import type {
  CreatePenggajianInput,
  UpdatePenggajianInput,
  PenggajianQueryInput,
} from "@/server/schema/penggajian";
import type { Prisma } from "@prisma/client";

export class PenggajianRepository {
  /**
   * Get all penggajian with pagination and filters
   */
  async findAll(query?: PenggajianQueryInput) {
    const { search, divisiId, periodeBulan, periodeTahun, page = 1, limit = 100 } = query || {};
    const skip = (page - 1) * limit;

    let whereClause = "";
    const queryParams: Array<string | number> = [];
    let paramCount = 1;

    if (search) {
      whereClause += ` WHERE k."namaKaryawan" ILIKE $${paramCount}`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (divisiId) {
      whereClause += whereClause ? " AND" : " WHERE";
      whereClause += ` k."divisiId" = $${paramCount++}`;
      queryParams.push(divisiId);
    }

    if (periodeBulan) {
      whereClause += whereClause ? " AND" : " WHERE";
      whereClause += ` p."periodeBulan" = $${paramCount++}`;
      queryParams.push(periodeBulan);
    }

    if (periodeTahun) {
      whereClause += whereClause ? " AND" : " WHERE";
      whereClause += ` p."periodeTahun" = $${paramCount++}`;
      queryParams.push(periodeTahun);
    }

    const dataQuery = `
      SELECT
        p.*,
        json_build_object(
          'id', k.id,
          'namaKaryawan', k."namaKaryawan",
          'tktk', k.tktk,
          'gol', k.gol,
          'nomorRekening', k."nomorRekening",
          'noBpjsTk', k."noBpjsTk",
          'noBpjsKesehatan', k."noBpjsKesehatan",
          'divisi', CASE
            WHEN d.id IS NULL THEN NULL
            ELSE json_build_object('id', d.id, 'nama', d.nama)
          END,
          'jabatan', CASE
            WHEN j.id IS NULL THEN NULL
            ELSE json_build_object('id', j.id, 'nama', j.nama)
          END
        ) AS "masterKaryawan"
      FROM "PenggajianKaryawan" p
      LEFT JOIN "MasterKaryawan" k ON p."masterKaryawanId" = k.id
      LEFT JOIN "MasterDivisi" d ON k."divisiId" = d.id
      LEFT JOIN "MasterJabatan" j ON k."jabatanId" = j.id
      ${whereClause}
      ORDER BY
        CASE WHEN d.id IS NULL THEN 1 ELSE 0 END ASC,
        length(COALESCE(d.id, '')) ASC,
        COALESCE(d.id, '') ASC,
        CASE WHEN j.id IS NULL THEN 1 ELSE 0 END ASC,
        length(COALESCE(j.id, '')) ASC,
        COALESCE(j.id, '') ASC,
        k."namaKaryawan" ASC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM "PenggajianKaryawan" p
      LEFT JOIN "MasterKaryawan" k ON p."masterKaryawanId" = k.id
      ${whereClause}
    `;

    const [data, counts] = await Promise.all([
      db.$queryRawUnsafe<any[]>(dataQuery, ...queryParams, limit, skip),
      db.$queryRawUnsafe<{ total: number }[]>(countQuery, ...queryParams),
    ]);
    const total = counts[0]?.total || 0;

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
   * Get penggajian by id
   */
  async findById(id: string) {
    return db.penggajianKaryawan.findUnique({
      where: { id },
      include: {
        masterKaryawan: {
          include: {
            divisi: { select: { id: true, nama: true } },
            jabatan: { select: { id: true, nama: true } },
          },
        },
      },
    });
  }

  /**
   * Get distinct divisi list from penggajian
   */
  async getDistinctDivisi() {
    return db.$queryRaw<{ id: string; nama: string }[]>`
      SELECT divisi.id, divisi.nama
      FROM (
        SELECT DISTINCT d.id, d.nama
        FROM "PenggajianKaryawan" p
        INNER JOIN "MasterKaryawan" k ON p."masterKaryawanId" = k.id
        INNER JOIN "MasterDivisi" d ON k."divisiId" = d.id
      ) AS divisi
      ORDER BY length(divisi.id) ASC, divisi.id ASC
    `;
  }

  /**
   * Get distinct periode (bulan + tahun)
   */
  async getDistinctPeriode() {
    const result = await db.penggajianKaryawan.findMany({
      select: { periodeBulan: true, periodeTahun: true },
      distinct: ["periodeBulan", "periodeTahun"],
      orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }],
    });
    return result;
  }

  /**
   * Create new penggajian
   */
  async create(data: CreatePenggajianInput) {
    return db.penggajianKaryawan.create({
      data: {
        masterKaryawanId: data.masterKaryawanId,
        periodeBulan: data.periodeBulan,
        periodeTahun: data.periodeTahun,
        gajiPokok: data.gajiPokok,
        tunjanganJabatan: data.tunjanganJabatan,
        tunjanganPerumahan: data.tunjanganPerumahan,
        tunjanganLainLain: data.tunjanganLainLain,
        hk: data.hk,
        hkDibayar: data.hkDibayar,
        hkTidakDibayar: data.hkTidakDibayar,
        liburDibayar: data.liburDibayar,
        tanggalKerja: data.tanggalKerja as Prisma.InputJsonValue ?? undefined,
        overtime: data.overtime,
        lemburHari: data.lemburHari,
        totalMenit: data.totalMenit,
        totalMenitDibayar: data.totalMenitDibayar,
        lemburDetail: data.lemburDetail as Prisma.InputJsonValue ?? undefined,
        potKehadiran: data.potKehadiran,
        potPinjaman: data.potPinjaman,
        potLainLain: data.potLainLain,
        potBpjsTkJht: data.potBpjsTkJht,
        potBpjsTkJn: data.potBpjsTkJn,
        potBpjsKesehatan: data.potBpjsKesehatan,
        potPph21: data.potPph21,
        totalPotongan: data.totalPotongan,
        totalSebelumPotongan: data.totalSebelumPotongan,
        upahDiterima: data.upahDiterima,
        thr: data.thr,
        sppd: data.sppd,
        keteranganDetail: data.keteranganDetail as Prisma.InputJsonValue ?? undefined,
      },
      include: {
        masterKaryawan: {
          include: {
            divisi: { select: { id: true, nama: true } },
            jabatan: { select: { id: true, nama: true } },
          },
        },
      },
    });
  }

  /**
   * Create many penggajian (bulk insert)
   */
  async createMany(dataList: CreatePenggajianInput[]) {
    return db.penggajianKaryawan.createMany({
      data: dataList.map((data) => ({
        masterKaryawanId: data.masterKaryawanId,
        periodeBulan: data.periodeBulan,
        periodeTahun: data.periodeTahun,
        gajiPokok: data.gajiPokok,
        tunjanganJabatan: data.tunjanganJabatan,
        tunjanganPerumahan: data.tunjanganPerumahan,
        tunjanganLainLain: data.tunjanganLainLain,
        hk: data.hk,
        hkDibayar: data.hkDibayar,
        hkTidakDibayar: data.hkTidakDibayar,
        liburDibayar: data.liburDibayar,
        tanggalKerja: data.tanggalKerja as Prisma.InputJsonValue ?? undefined,
        overtime: data.overtime,
        lemburHari: data.lemburHari,
        totalMenit: data.totalMenit,
        totalMenitDibayar: data.totalMenitDibayar,
        lemburDetail: data.lemburDetail as Prisma.InputJsonValue ?? undefined,
        potKehadiran: data.potKehadiran,
        potPinjaman: data.potPinjaman,
        potLainLain: data.potLainLain,
        potBpjsTkJht: data.potBpjsTkJht,
        potBpjsTkJn: data.potBpjsTkJn,
        potBpjsKesehatan: data.potBpjsKesehatan,
        potPph21: data.potPph21,
        totalPotongan: data.totalPotongan,
        totalSebelumPotongan: data.totalSebelumPotongan,
        upahDiterima: data.upahDiterima,
        thr: data.thr,
        sppd: data.sppd,
        keteranganDetail: data.keteranganDetail as Prisma.InputJsonValue ?? undefined,
      })),
    });
  }

  /**
   * Update penggajian
   */
  async update(id: string, data: UpdatePenggajianInput) {
    return db.penggajianKaryawan.update({
      where: { id },
      data: {
        ...data,
        tanggalKerja: data.tanggalKerja as Prisma.InputJsonValue ?? undefined,
        lemburDetail: data.lemburDetail as Prisma.InputJsonValue ?? undefined,
        keteranganDetail: data.keteranganDetail as Prisma.InputJsonValue ?? undefined,
      },
      include: {
        masterKaryawan: {
          include: {
            divisi: { select: { id: true, nama: true } },
            jabatan: { select: { id: true, nama: true } },
          },
        },
      },
    });
  }

  /**
   * Delete penggajian
   */
  async delete(id: string) {
    return db.penggajianKaryawan.delete({
      where: { id },
    });
  }

  /**
   * Delete all penggajian by periode
   */
  async deleteByPeriode(periodeBulan: number, periodeTahun: number) {
    return db.penggajianKaryawan.deleteMany({
      where: {
        periodeBulan,
        periodeTahun,
      },
    });
  }

  /**
   * Delete multiple penggajian by IDs
   */
  async deleteMany(ids: string[]) {
    return db.penggajianKaryawan.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  /**
   * Check if periode exists
   */
  async isPeriodeExists(periodeBulan: number, periodeTahun: number) {
    const count = await db.penggajianKaryawan.count({
      where: {
        periodeBulan,
        periodeTahun,
      },
    });
    return count > 0;
  }

  /**
   * Get summary statistics
   */
  async getSummary(periodeBulan?: number, periodeTahun?: number) {
    const where: Prisma.PenggajianKaryawanWhereInput = {};
    if (periodeBulan) where.periodeBulan = periodeBulan;
    if (periodeTahun) where.periodeTahun = periodeTahun;

    const [count, aggregate] = await Promise.all([
      db.penggajianKaryawan.count({ where }),
      db.penggajianKaryawan.aggregate({
        where,
        _sum: {
          gajiPokok: true,
          tunjanganJabatan: true,
          tunjanganPerumahan: true,
          tunjanganLainLain: true,
          sppd: true,
          thr: true,
          overtime: true,
          totalSebelumPotongan: true,
          potKehadiran: true,
          potBpjsTkJht: true,
          potBpjsTkJn: true,
          potBpjsKesehatan: true,
          potPph21: true,
          potPinjaman: true,
          potLainLain: true,
          totalPotongan: true,
          upahDiterima: true,
        },
      }),
    ]);

    return {
      totalKaryawan: count,
      totalGajiPokok: aggregate._sum.gajiPokok || 0,
      totalTunjanganJabatan: aggregate._sum.tunjanganJabatan || 0,
      totalTunjanganPerumahan: aggregate._sum.tunjanganPerumahan || 0,
      totalTunjanganLainLain: aggregate._sum.tunjanganLainLain || 0,
      totalSppd: aggregate._sum.sppd || 0,
      totalThr: aggregate._sum.thr || 0,
      totalOvertime: aggregate._sum.overtime || 0,
      totalSebelumPotongan: aggregate._sum.totalSebelumPotongan || 0,
      totalPotKehadiran: aggregate._sum.potKehadiran || 0,
      totalPotBpjsTkJht: aggregate._sum.potBpjsTkJht || 0,
      totalPotBpjsTkJn: aggregate._sum.potBpjsTkJn || 0,
      totalPotBpjsKesehatan: aggregate._sum.potBpjsKesehatan || 0,
      totalPotPph21: aggregate._sum.potPph21 || 0,
      totalPotPinjaman: aggregate._sum.potPinjaman || 0,
      totalPotLainLain: aggregate._sum.potLainLain || 0,
      totalPotongan: aggregate._sum.totalPotongan || 0,
      totalUpahDiterima: aggregate._sum.upahDiterima || 0,
    };
  }
}

export const penggajianRepository = new PenggajianRepository();
