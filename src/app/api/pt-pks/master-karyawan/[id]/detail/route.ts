import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

// GET /api/pt-pks/master-karyawan/[id]/detail - Get karyawan detail with statistics and history
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAuthWithPermission("masterData.karyawan", "view");
    if (error) return error;

    try {
        const { id } = await params;

        // Get karyawan with relations
        const karyawan = await db.masterKaryawan.findUnique({
            where: { id },
            include: {
                divisi: true,
                jabatan: true,
            },
        });

        if (!karyawan) {
            return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
        }

        // Get all penggajian records for this karyawan (for stats and history)
        const penggajianHistory = await db.penggajianKaryawan.findMany({
            where: { masterKaryawanId: id },
            orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }],
            take: 12, // Last 12 months
        });

        // Calculate statistics
        const totalPeriods = penggajianHistory.length;
        const totalUpah = penggajianHistory.reduce((sum, p) => sum + Number(p.upahDiterima), 0);
        const avgUpah = totalPeriods > 0 ? totalUpah / totalPeriods : 0;
        const avgKehadiran = totalPeriods > 0
            ? penggajianHistory.reduce((sum, p) => sum + p.hkDibayar, 0) / totalPeriods
            : 0;
        const totalLembur = penggajianHistory.reduce((sum, p) => sum + p.totalMenitDibayar, 0);

        // Prepare chart data (reversed for chronological order)
        const chartData = penggajianHistory.slice().reverse().map((p) => {
            // Calculate attendance breakdown from tanggalKerja
            const attendanceBreakdown: Record<string, number> = {};
            if (p.tanggalKerja && typeof p.tanggalKerja === 'object') {
                const tanggalKerja = p.tanggalKerja as Record<string, string>;
                Object.values(tanggalKerja).forEach((status) => {
                    if (status) {
                        attendanceBreakdown[status] = (attendanceBreakdown[status] || 0) + 1;
                    }
                });
            }

            return {
                periode: `${p.periodeBulan}/${p.periodeTahun}`,
                bulan: p.periodeBulan,
                tahun: p.periodeTahun,
                upahDiterima: Number(p.upahDiterima),
                gajiPokok: Number(p.gajiPokok),
                overtime: Number(p.overtime),
                hk: p.hk,
                hkDibayar: p.hkDibayar,
                hkTidakDibayar: p.hkTidakDibayar,
                lemburJam: Number((p.totalMenitDibayar / 60).toFixed(1)),
                totalPotongan: Number(p.totalPotongan),
                attendanceBreakdown,
            };
        });

        // Get change logs
        const changeLogs = await db.karyawanChangeLog.findMany({
            where: { masterKaryawanId: id },
            orderBy: { changedAt: "desc" },
            take: 50,
        });

        return NextResponse.json({
            karyawan,
            statistics: {
                totalPeriods,
                totalUpah,
                avgUpah: Math.round(avgUpah),
                avgKehadiran: Math.round(avgKehadiran * 10) / 10,
                totalLemburJam: Math.round(totalLembur / 60 * 10) / 10,
            },
            chartData,
            history: penggajianHistory.map((p) => ({
                id: p.id,
                periode: `${p.periodeBulan}/${p.periodeTahun}`,
                periodeBulan: p.periodeBulan,
                periodeTahun: p.periodeTahun,
                gajiPokok: Number(p.gajiPokok),
                tunjanganJabatan: Number(p.tunjanganJabatan),
                tunjanganPerumahan: Number(p.tunjanganPerumahan),
                overtime: Number(p.overtime),
                totalSebelumPotongan: Number(p.totalSebelumPotongan),
                totalPotongan: Number(p.totalPotongan),
                upahDiterima: Number(p.upahDiterima),
                hk: p.hk,
                hkDibayar: p.hkDibayar,
                hkTidakDibayar: p.hkTidakDibayar,
                lemburJam: Number((p.totalMenitDibayar / 60).toFixed(1)),
            })),
            changeLogs: changeLogs.map((log) => ({
                id: log.id,
                fieldName: log.fieldName,
                oldDisplayValue: log.oldDisplayValue,
                newDisplayValue: log.newDisplayValue,
                changedBy: log.changedBy,
                changedAt: log.changedAt.toISOString(),
            })),
        });
    } catch (error: unknown) {
        console.error("Error fetching karyawan detail:", error);
        return NextResponse.json(
            { error: "Failed to fetch karyawan detail" },
            { status: 500 }
        );
    }
}
