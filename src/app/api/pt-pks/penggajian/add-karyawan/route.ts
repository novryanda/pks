import { requireAuthWithPermission } from "@/lib/api-auth";
import { masterKaryawanService } from "@/server/services/pt-pks/master-karyawan.service";
import { NextResponse } from "next/server";

// POST /api/pt-pks/penggajian/add-karyawan - Add employees to penggajian from master data
// Supports both single and bulk addition
export async function POST(request: Request) {
    const { error } = await requireAuthWithPermission("payroll.penggajian", "create");
    if (error) return error;

    try {
        const body = await request.json();
        const { karyawanId, karyawanIds, periodeBulan, periodeTahun } = body;

        if (!periodeBulan || !periodeTahun) {
            return NextResponse.json(
                { error: "Periode bulan dan tahun wajib diisi" },
                { status: 400 }
            );
        }

        // Bulk add (array of IDs)
        if (karyawanIds && Array.isArray(karyawanIds)) {
            const result = await masterKaryawanService.addMultipleKaryawanToPenggajian(
                karyawanIds,
                parseInt(periodeBulan),
                parseInt(periodeTahun)
            );

            return NextResponse.json({
                message: `Berhasil menambahkan ${result.added} karyawan ke periode ${result.period}${result.skipped > 0 ? ` (${result.skipped} dilewati karena sudah ada)` : ""}`,
                ...result,
            });
        }

        // Single add (backward compatible)
        if (karyawanId) {
            const result = await masterKaryawanService.addKaryawanToPenggajian(
                karyawanId,
                parseInt(periodeBulan),
                parseInt(periodeTahun)
            );

            return NextResponse.json({
                message: `Berhasil menambahkan karyawan ke daftar penggajian`,
                data: result,
            });
        }

        return NextResponse.json(
            { error: "karyawanId atau karyawanIds wajib diisi" },
            { status: 400 }
        );
    } catch (error: unknown) {
        console.error("Error adding karyawan to penggajian:", error);

        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { error: "Gagal menambahkan karyawan ke penggajian" },
            { status: 500 }
        );
    }
}
