import { requireAuthWithPermission } from "@/lib/api-auth";
import { masterKaryawanService } from "@/server/services/pt-pks/master-karyawan.service";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PUT /api/pt-pks/penggajian/[id]/hk - Update HK data and recalculate salary
export async function PUT(request: Request, { params }: RouteParams) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "edit");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      hk,
      liburDibayar,
      hkTidakDibayar,
      hkDibayar,
      hariBelumMasuk,
      lemburHari,
      tanggalKerja,
      lemburDetail,
      totalMenit,
      totalMenitDibayar,
      keteranganDetail,
      // New fields
      sppd,
      thr,
      tunjanganLainLain,
      potPinjaman,
      potLainLain,
      potPph21,
      potBpjsTkJht,
      potBpjsTkJn,
      potBpjsKesehatan,
    } = body;

    // Validate required fields
    if (
      hk === undefined ||
      liburDibayar === undefined ||
      hkTidakDibayar === undefined ||
      hkDibayar === undefined ||
      lemburHari === undefined
    ) {
      return NextResponse.json(
        { error: "Semua field HK wajib diisi" },
        { status: 400 }
      );
    }

    const penggajian = await masterKaryawanService.updatePenggajianWithHK(id, {
      hk: parseInt(hk),
      liburDibayar: parseInt(liburDibayar),
      hkTidakDibayar: parseInt(hkTidakDibayar),
      hkDibayar: parseInt(hkDibayar),
      hariBelumMasuk: hariBelumMasuk !== undefined ? parseInt(hariBelumMasuk) : 0,
      lemburHari: parseFloat(lemburHari),
      tanggalKerja,
      lemburDetail,
      totalMenit: totalMenit ? parseInt(totalMenit) : 0,
      totalMenitDibayar: totalMenitDibayar ? parseInt(totalMenitDibayar) : 0,
      keteranganDetail,
      // New fields
      sppd: sppd !== undefined ? parseFloat(sppd) : undefined,
      thr: thr !== undefined ? parseFloat(thr) : undefined,
      tunjanganLainLain: tunjanganLainLain !== undefined ? parseFloat(tunjanganLainLain) : undefined,
      potPinjaman: potPinjaman !== undefined ? parseFloat(potPinjaman) : undefined,
      potLainLain: potLainLain !== undefined ? parseFloat(potLainLain) : undefined,
      potPph21: potPph21 !== undefined ? parseFloat(potPph21) : undefined,
      potBpjsTkJht: potBpjsTkJht !== undefined ? parseFloat(potBpjsTkJht) : undefined,
      potBpjsTkJn: potBpjsTkJn !== undefined ? parseFloat(potBpjsTkJn) : undefined,
      potBpjsKesehatan: potBpjsKesehatan !== undefined ? parseFloat(potBpjsKesehatan) : undefined,
    });

    console.log("Update result keteranganDetail:", (penggajian as any).keteranganDetail);

    console.log("Update result keteranganDetail:", (penggajian as any).keteranganDetail);

    return NextResponse.json({
      message: "Data HK dan gaji berhasil diupdate",
      penggajian,
    });
  } catch (error: unknown) {
    console.error("Error updating penggajian HK:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update penggajian HK" },
      { status: 500 }
    );
  }
}
