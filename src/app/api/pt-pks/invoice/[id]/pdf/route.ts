import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { invoiceService } from "@/server/services/pt-pks/invoice.service";
import { generateInvoicePenjualanPDF } from "@/lib/pdf/pt-pks/generate-invoice-penjualan";
import type { InvoicePenjualanPDFData, InvoicePenjualanItem, PembayaranItem } from "@/lib/pdf/pt-pks/invoice-penjualan-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
    if (error) {
      // error bisa berupa NextResponse atau object error custom
      if (error instanceof NextResponse) {
        return error;
      }
      // fallback: error custom object
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }
    const invoice = await invoiceService.getInvoiceById(id, companyId);

    // Get material name from contract items
    let materialName = "-";
    if (invoice.contract?.contractItems && invoice.contract.contractItems.length > 0) {
      const firstItem = invoice.contract.contractItems[0]!;
      materialName = firstItem.material?.name || "-";
    }

    // Transform data for PDF
    const pdfData: InvoicePenjualanPDFData = {
      nomorInvoice: invoice.nomorInvoice,
      tanggalInvoice: invoice.tanggalInvoice.toISOString(),
      tanggalJatuhTempo: invoice.tanggalJatuhTempo?.toISOString() || null,
      status: invoice.status,
      buyer: {
        name: invoice.buyer?.name || "-",
        code: invoice.buyer?.code || "-",
        alamat: invoice.buyer?.address || null,
        telepon: invoice.buyer?.phone || null,
        npwp: invoice.buyer?.npwp || null,
      },
      contract: {
        contractNumber: invoice.contract?.contractNumber || "-",
        materialName,
        hargaPerKg: invoice.hargaPerKg,
      },
      items: invoice.invoiceItems.map((item): InvoicePenjualanItem => ({
        id: item.id,
        nomorPengiriman: item.pengirimanProduct?.nomorPengiriman || "-",
        tanggalPengiriman: item.pengirimanProduct?.tanggalPengiriman?.toISOString() || null,
        beratNetto: item.beratNetto,
        nomorKendaraan: item.pengirimanProduct?.vendorVehicle?.nomorKendaraan || null,
        namaDriver: item.pengirimanProduct?.vendorVehicle?.namaSupir || null,
        vendorName: item.pengirimanProduct?.vendorVehicle?.vendor?.name || null,
      })),
      totalBerat: invoice.totalBerat,
      hargaPerKg: invoice.hargaPerKg,
      subtotalBruto: invoice.subtotalBruto,
      klaimMutuPersen: invoice.klaimMutuPersen,
      klaimMutuNilai: invoice.klaimMutuNilai,
      klaimSusutPersen: invoice.klaimSusutPersen,
      klaimSusutNilai: invoice.klaimSusutNilai,
      totalPotongan: invoice.totalPotongan,
      subtotalNetto: invoice.subtotalNetto,
      ppnPersen: invoice.ppnPersen,
      ppnNilai: invoice.ppnNilai,
      pphPersen: invoice.pphPersen,
      pphNilai: invoice.pphNilai,
      totalNilai: invoice.totalNilai,
      totalDibayar: invoice.totalDibayar,
      sisaPembayaran: invoice.sisaPembayaran,
      pembayaran: invoice.pembayaranInvoice.map((p): PembayaranItem => ({
        id: p.id,
        tanggalBayar: p.tanggalBayar.toISOString(),
        jumlahBayar: p.jumlahBayar,
        metodePembayaran: p.metodePembayaran,
        nomorReferensi: p.nomorReferensi,
      })),
      catatan: invoice.catatan,
      showPpnDisclaimer: invoice.showPpnDisclaimer ?? false,
      namaPenandatangan: invoice.namaPenandatangan,
      jabatanPenandatangan: invoice.jabatanPenandatangan,
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePenjualanPDF(pdfData);

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Invoice-${invoice.nomorInvoice}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      { error: error.message || "Gagal generate PDF invoice" },
      { status: error.message === "Invoice tidak ditemukan" ? 404 : 500 }
    );
  }
}
