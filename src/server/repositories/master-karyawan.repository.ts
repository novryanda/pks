import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import type { CreateKaryawanInput, UpdateKaryawanInput, KaryawanQueryInput } from "@/server/schema/master-karyawan";

export const masterKaryawanRepository = {
  /**
   * Find all master karyawan with pagination and filters
   */
  async findAll(query?: KaryawanQueryInput) {
    const { search, divisiId, jabatanId, isActive, page = 1, limit = 100 } = query || {};
    const skip = (page - 1) * limit;

    let whereClause = "";
    const queryParams: any[] = [];
    let paramCount = 1;

    if (search) {
      whereClause += ` WHERE (k."namaKaryawan" ILIKE $${paramCount} OR k."nomorRekening" ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (divisiId) {
      whereClause += whereClause ? " AND" : " WHERE";
      whereClause += ` k."divisiId" = $${paramCount++}`;
      queryParams.push(divisiId);
    }

    if (jabatanId) {
      whereClause += whereClause ? " AND" : " WHERE";
      whereClause += ` k."jabatanId" = $${paramCount++}`;
      queryParams.push(jabatanId);
    }

    if (isActive !== undefined) {
      whereClause += whereClause ? " AND" : " WHERE";
      whereClause += ` k."isActive" = $${paramCount++}`;
      queryParams.push(isActive);
    }

    // Natural sort: order by divisi, then jabatan, then name
    const dataQuery = `
      SELECT k.*, 
             json_build_object('id', d.id, 'nama', d.nama) as divisi,
             json_build_object('id', j.id, 'nama', j.nama) as jabatan
      FROM "MasterKaryawan" k
      LEFT JOIN "MasterDivisi" d ON k."divisiId" = d.id
      LEFT JOIN "MasterJabatan" j ON k."jabatanId" = j.id
      ${whereClause}
      ORDER BY length(d."id") ASC, d."id" ASC, length(j."id") ASC, j."id" ASC, k."namaKaryawan" ASC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    const countQuery = `
      SELECT COUNT(*)::int as total FROM "MasterKaryawan" k
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
  },

  /**
   * Find master karyawan by id
   */
  async findById(id: string) {
    return db.masterKaryawan.findUnique({
      where: { id },
      include: {
        divisi: { select: { id: true, nama: true } },
        jabatan: { select: { id: true, nama: true } },
      },
    });
  },

  /**
   * Find master karyawan by name (exact match)
   */
  async findByName(namaKaryawan: string) {
    return db.masterKaryawan.findFirst({
      where: { namaKaryawan: { equals: namaKaryawan, mode: "insensitive" } },
    });
  },

  /**
   * Get distinct divisi list from karyawan (for backward compatibility)
   */
  async getDistinctDivisi() {
    const result = await db.masterKaryawan.findMany({
      where: { divisiId: { not: null } },
      select: {
        divisi: { select: { id: true, nama: true } },
      },
      distinct: ["divisiId"],
    });
    return result.map((r) => r.divisi).filter(Boolean);
  },

  /**
   * Create new master karyawan
   */
  async create(data: CreateKaryawanInput) {
    return db.masterKaryawan.create({
      data: {
        namaKaryawan: data.namaKaryawan,
        divisiId: data.divisiId,
        jabatanId: data.jabatanId,
        gol: data.gol,
        tktk: data.tktk,
        nomorRekening: data.nomorRekening,
        noBpjsTk: data.noBpjsTk,
        noBpjsKesehatan: data.noBpjsKesehatan,
        gajiPokok: data.gajiPokok || 0,
        tunjanganJabatan: data.tunjanganJabatan || 0,
        tunjanganPerumahan: data.tunjanganPerumahan || 0,
        potBpjsTkJht: data.potBpjsTkJht ?? 0,
        potBpjsTkJn: data.potBpjsTkJn ?? 0,
        potBpjsKesehatan: data.potBpjsKesehatan ?? 0,
        tanggalMulaiKerja: data.tanggalMulaiKerja,
        tanggalKeluar: data.tanggalKeluar,
        isActive: data.isActive ?? true,
      },
      include: {
        divisi: { select: { id: true, nama: true } },
        jabatan: { select: { id: true, nama: true } },
      },
    });
  },

  /**
   * Update master karyawan
   */
  async update(id: string, data: UpdateKaryawanInput) {
    return db.masterKaryawan.update({
      where: { id },
      data,
      include: {
        divisi: { select: { id: true, nama: true } },
        jabatan: { select: { id: true, nama: true } },
      },
    });
  },

  /**
   * Delete master karyawan (Soft delete if has payroll, Hard delete otherwise)
   */
  async delete(id: string) {
    // Check if has payroll records
    const hasPayroll = await db.penggajianKaryawan.findFirst({
      where: { masterKaryawanId: id },
    });

    if (hasPayroll) {
      // Soft delete
      return db.masterKaryawan.update({
        where: { id },
        data: { isActive: false },
      });
    }

    // Hard delete
    return db.masterKaryawan.delete({ where: { id } });
  },

  /**
   * Get all active karyawan for generating penggajian
   */
  async getActiveKaryawan() {
    return db.$queryRaw<any[]>`
      SELECT k.*, 
             json_build_object('id', d.id, 'nama', d.nama) as divisi,
             json_build_object('id', j.id, 'nama', j.nama) as jabatan
      FROM "MasterKaryawan" k
      LEFT JOIN "MasterDivisi" d ON k."divisiId" = d.id
      LEFT JOIN "MasterJabatan" j ON k."jabatanId" = j.id
      WHERE k."isActive" = true
      ORDER BY length(d."id") ASC, d."id" ASC, length(j."id") ASC, j."id" ASC, k."namaKaryawan" ASC
    `;
  },
};
