import { db } from "@/server/db";
import type { CreateChangeLogInput } from "@/server/schema/karyawan-change-log";

class KaryawanChangeLogRepository {
    /**
     * Create a new change log entry
     */
    async create(data: CreateChangeLogInput) {
        return db.karyawanChangeLog.create({
            data: {
                masterKaryawanId: data.masterKaryawanId,
                fieldName: data.fieldName,
                oldValue: data.oldValue,
                newValue: data.newValue,
                oldDisplayValue: data.oldDisplayValue,
                newDisplayValue: data.newDisplayValue,
                changedBy: data.changedBy,
            },
        });
    }

    /**
     * Create multiple change log entries at once
     */
    async createMany(entries: CreateChangeLogInput[]) {
        return db.karyawanChangeLog.createMany({
            data: entries.map((e) => ({
                masterKaryawanId: e.masterKaryawanId,
                fieldName: e.fieldName,
                oldValue: e.oldValue,
                newValue: e.newValue,
                oldDisplayValue: e.oldDisplayValue,
                newDisplayValue: e.newDisplayValue,
                changedBy: e.changedBy,
            })),
        });
    }

    /**
     * Get all change logs for a karyawan, ordered by changedAt desc
     */
    async findByKaryawanId(karyawanId: string, limit?: number) {
        return db.karyawanChangeLog.findMany({
            where: { masterKaryawanId: karyawanId },
            orderBy: { changedAt: "desc" },
            take: limit,
        });
    }

    /**
     * Get recent change logs across all karyawan
     */
    async findRecent(limit = 50) {
        return db.karyawanChangeLog.findMany({
            orderBy: { changedAt: "desc" },
            take: limit,
            include: {
                masterKaryawan: {
                    select: { id: true, namaKaryawan: true },
                },
            },
        });
    }
}

export const karyawanChangeLogRepository = new KaryawanChangeLogRepository();
