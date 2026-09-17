import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanTBSRepository } from "@/server/repositories/penerimaan-tbs.repository";
import { generateSlipTiketTBS } from "@/lib/pdf/pt-pks/generate-slip-tiket-tbs";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuthWithPermission(
        "supplyChain.penerimaanTbs",
        "view"
    );
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    try {
        const penerimaan = await penerimaanTBSRepository.getPenerimaanTBSById(id);

        if (!penerimaan) {
            return NextResponse.json(
                { error: "Data penerimaan tidak ditemukan" },
                { status: 404 }
            );
        }

        // Prepare data for PDF
        const pdfData = {
            nomorPenerimaan: penerimaan.nomorPenerimaan,
            tanggalTerima: penerimaan.tanggalTerima.toISOString(),
            operatorPenimbang: penerimaan.operatorPenimbang,
            supplier: {
                ownerName: penerimaan.supplier.ownerName,
                companyName: penerimaan.supplier.companyName,
                nik: penerimaan.supplier.npwp || "-", // Use NPWP as identifier
                phone: penerimaan.supplier.personalPhone,
            },
            transporter: {
                nomorKendaraan: penerimaan.transporter.nomorKendaraan,
                namaSupir: penerimaan.transporter.namaSupir,
            },
            material: {
                nama: penerimaan.material.name,
                kategori: { nama: penerimaan.material.kategori?.name || "-" },
                satuan: { nama: penerimaan.material.satuan?.name || "kg" },
            },
            lokasiKebun: penerimaan.lokasiKebun,
            jenisBuah: penerimaan.jenisBuah,
            beratBruto: penerimaan.beratBruto,
            waktuTimbangBruto: penerimaan.waktuTimbangBruto?.toISOString() || penerimaan.tanggalTerima.toISOString(),
            beratTarra: penerimaan.beratTarra,
            waktuTimbangTarra: penerimaan.waktuTimbangTarra?.toISOString(),
            beratNetto1: penerimaan.beratNetto1,
            potonganPersen: penerimaan.potonganPersen,
            potonganKg: penerimaan.potonganKg,
            beratNetto2: penerimaan.beratNetto2,
            company: {
                name: penerimaan.company?.name || "PT. TARO RAKAYA TASYRA",
                code: penerimaan.company?.code || "PT-PKS",
            },
        };

        const pdfBuffer = await generateSlipTiketTBS(pdfData);

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="slip-tiket-${penerimaan.nomorPenerimaan}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Error generating slip tiket:", error);
        return NextResponse.json(
            { error: "Gagal generate slip tiket" },
            { status: 500 }
        );
    }
}
