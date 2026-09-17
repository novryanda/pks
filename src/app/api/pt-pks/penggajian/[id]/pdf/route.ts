import { requireAuthWithPermission } from "@/lib/api-auth";
import { penggajianService } from "@/server/services/pt-pks/penggajian.service";
import { NextResponse } from "next/server";
import { generateSlipGajiPDF, type SlipGajiPDFData } from "@/lib/pdf/pt-pks/generate-slip-gaji";
import type { LemburDetailItem } from "@/lib/pdf/pt-pks/slip-gaji-pdf";
import { calculateTotalMenitDibayar } from "@/server/schema/penggajian";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/pt-pks/penggajian/[id]/pdf - Generate PDF slip gaji
export async function GET(request: Request, { params }: RouteParams) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "view");
  if (error) return error;

  try {
    const { id } = await params;
    const penggajian = await penggajianService.getPenggajianById(id);

    // Parse lembur detail
    const lemburDetail = (penggajian.lemburDetail as Record<string, LemburDetailItem>) || {};

    // Calculate total menit dibayar
    let totalMenitDibayar = 0;
    Object.values(lemburDetail).forEach(item => {
      if (item) {
        totalMenitDibayar += calculateTotalMenitDibayar(item);
      }
    });

    // Prepare data for PDF
    const pdfData: SlipGajiPDFData = {
      periodeBulan: penggajian.periodeBulan,
      periodeTahun: penggajian.periodeTahun,
      namaKaryawan: penggajian.masterKaryawan?.namaKaryawan || "Unknown",
      jabatan: penggajian.masterKaryawan?.jabatan?.nama || null,
      devisi: penggajian.masterKaryawan?.divisi?.nama || null,
      gol: penggajian.masterKaryawan?.gol || null,
      nomorRekening: penggajian.masterKaryawan?.nomorRekening || null,
      tktk: penggajian.masterKaryawan?.tktk || null,
      noBpjsTk: penggajian.masterKaryawan?.noBpjsTk || null,
      noBpjsKesehatan: penggajian.masterKaryawan?.noBpjsKesehatan || null,
      // Attendance
      hk: penggajian.hk,
      liburDibayar: penggajian.liburDibayar,
      hkTidakDibayar: penggajian.hkTidakDibayar,
      hkDibayar: penggajian.hkDibayar,
      totalMenitDibayar,
      lemburDetail,
      // Salary
      gajiPokok: Number(penggajian.gajiPokok),
      tunjanganJabatan: Number(penggajian.tunjanganJabatan),
      tunjanganPerumahan: Number(penggajian.tunjanganPerumahan),
      sppd: Number(penggajian.sppd),
      thr: Number(penggajian.thr),
      tunjanganLainLain: Number(penggajian.tunjanganLainLain),
      overtime: Number(penggajian.overtime),
      totalSebelumPotongan: Number(penggajian.totalSebelumPotongan),
      // Deductions
      potKehadiran: Number(penggajian.potKehadiran),
      potBpjsTkJht: Number(penggajian.potBpjsTkJht),
      potBpjsTkJn: Number(penggajian.potBpjsTkJn),
      potBpjsKesehatan: Number(penggajian.potBpjsKesehatan),
      potPph21: Number(penggajian.potPph21),
      potPinjaman: Number(penggajian.potPinjaman),
      potLainLain: Number(penggajian.potLainLain),
      totalPotongan: Number(penggajian.totalPotongan),
      upahDiterima: Number(penggajian.upahDiterima),
      keteranganDetail: penggajian.keteranganDetail as SlipGajiPDFData["keteranganDetail"],
    };

    console.log("Generating PDF for:", pdfData.namaKaryawan);
    console.log("Keterangan Detail in PDF route:", pdfData.keteranganDetail);

    // Generate PDF buffer
    const pdfBuffer = await generateSlipGajiPDF(pdfData);

    // Return PDF
    const filename = `slip-gaji-${(penggajian.masterKaryawan?.namaKaryawan || "Unknown").replace(/\s+/g, "-")}-${penggajian.periodeBulan}-${penggajian.periodeTahun}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error generating PDF:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
