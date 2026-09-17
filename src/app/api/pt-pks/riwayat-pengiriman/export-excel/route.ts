import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { requireAuthWithPermission } from "@/lib/api-auth";
import { getRiwayatPengirimanReport } from "@/server/services/pt-pks/riwayat-pengiriman-report.service";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuthWithPermission(
    "pemasaran.riwayatPengiriman",
    "view",
  );
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const report = await getRiwayatPengirimanReport(companyId, {
      date: searchParams.get("date"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      materialId: searchParams.get("materialId"),
      buyerId: searchParams.get("buyerId"),
      contractId: searchParams.get("contractId"),
    });

    if (report.summary.length === 0 && report.deliveries.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    const workbook = XLSX.utils.book_new();

    const filterRows = [
      ["Laporan", "Riwayat Pengiriman"],
      ["Perusahaan", report.company.name],
      ["Periode", report.filters.periodLabel],
      ["Buyer", report.filters.buyerLabel],
      ["Kontrak", report.filters.contractLabel],
      ["Produk", report.filters.materialLabel],
      ["Total Rekap Kontrak", report.summary.length],
      ["Total Detail Pengiriman", report.deliverySummary.totalRecords],
      ["Pengiriman Selesai", report.deliverySummary.totalCompleted],
      [
        "Netto Pengiriman Selesai (kg)",
        report.deliverySummary.totalNettoCompleted,
      ],
    ];

    const filterSheet = XLSX.utils.aoa_to_sheet(filterRows);
    filterSheet["!cols"] = [{ wch: 28 }, { wch: 42 }];
    XLSX.utils.book_append_sheet(workbook, filterSheet, "Filter");

    const summarySheetData = report.summary.map((item) => ({
      Buyer: item.buyerName,
      "No. Kontrak": item.contractNumber,
      "No. PO": item.nomorPo,
      "No. DO": item.nomorDo,
      Produk: item.materialName,
      "Kode Produk": item.materialCode,
      Satuan: item.satuan,
      "Jumlah Kontrak": item.contractQuantity,
      "Sudah Terkirim": item.deliveredQuantity,
      "HI (Hari Ini)": item.hi,
      "BI (Bulan Ini)": item.bi,
      "TI (Tahun Ini)": item.ti,
      Sisa: item.remaining,
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summarySheetData);
    summarySheet["!cols"] = [
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 10 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Rekap Kontrak");

    const detailSheetData = report.deliveries.map((item) => {
      const mutuFields = Array.isArray(item.mutuCustomFields)
        ? item.mutuCustomFields
            .filter(
              (
                field,
              ): field is {
                fieldName: string;
                fieldValue: string;
              } =>
                !!field &&
                typeof field === "object" &&
                "fieldName" in field &&
                "fieldValue" in field &&
                typeof field.fieldName === "string" &&
                typeof field.fieldValue === "string",
            )
            .map((field) => `${field.fieldName}: ${field.fieldValue}`)
            .join(" | ")
        : "-";

      return {
        "No. Pengiriman": item.nomorPengiriman,
        Tanggal: format(new Date(item.tanggalPengiriman), "dd MMM yyyy", {
          locale: idLocale,
        }),
        Buyer: item.buyer?.name || "-",
        "No. Kontrak": item.contract?.contractNumber || "-",
        Produk: item.contractItem?.material?.name || "-",
        Vendor: item.vendorVehicle?.vendor?.name || "-",
        Kendaraan: item.vendorVehicle?.nomorKendaraan || "-",
        Supir: item.vendorVehicle?.namaSupir || "-",
        "Berat Tarra (kg)": item.beratTarra || 0,
        "Berat Gross (kg)": item.beratGross || 0,
        "Berat Netto (kg)": item.beratNetto || 0,
        Mutu: mutuFields || "-",
        Operator: item.operatorPenimbang || "-",
        Status: item.status,
      };
    });

    const detailSheet =
      detailSheetData.length > 0
        ? XLSX.utils.json_to_sheet(detailSheetData)
        : XLSX.utils.aoa_to_sheet([
            ["Tidak ada detail pengiriman pada filter ini"],
          ]);

    detailSheet["!cols"] = [
      { wch: 22 },
      { wch: 14 },
      { wch: 24 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 34 },
      { wch: 18 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(workbook, detailSheet, "Detail Pengiriman");

    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const filename = `Riwayat-Pengiriman-${report.filters.exportFileLabel}.xlsx`;

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating riwayat pengiriman Excel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
