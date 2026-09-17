import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuthWithPermission("produksi.prosesProduksi", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const tanggalMulai = searchParams.get("tanggalMulai");
    const tanggalAkhir = searchParams.get("tanggalAkhir");
    const materialOutputId = searchParams.get("materialOutputId");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {
      materialInput: {
        companyId: companyId,
      },
    };

    if (status) {
      where.status = status;
    }

    if (tanggalMulai && tanggalAkhir) {
      where.tanggalProduksi = {
        gte: new Date(tanggalMulai),
        lte: new Date(tanggalAkhir),
      };
    }

    // Get all proses produksi
    const prosesProduksiList = await db.prosesProduksi.findMany({
      where,
      include: {
        hasilProduksi: {
          include: {
            materialOutput: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
          where: materialOutputId
            ? {
                materialOutputId: materialOutputId,
              }
            : undefined,
        },
        materialInput: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
      orderBy: {
        tanggalProduksi: "desc",
      },
    });

    // Prepare data for Excel
    const excelData: any[] = [];

    prosesProduksiList.forEach((proses) => {
      proses.hasilProduksi.forEach((hasil, index) => {
        excelData.push({
          "No. Produksi": index === 0 ? proses.nomorProduksi : "",
          "Tanggal Produksi":
            index === 0
              ? format(new Date(proses.tanggalProduksi), "dd MMM yyyy", {
                  locale: idLocale,
                })
              : "",
          "Material Input": index === 0 ? proses.materialInput.name : "",
          "Kategori Input": index === 0 ? proses.materialInput.kategori.name : "",
          "Jumlah Input": index === 0 ? proses.jumlahInput : "",
          "Satuan Input": index === 0 ? proses.materialInput.satuan.name : "",
          "Material Output": hasil.materialOutput.name,
          "Kode Output": hasil.materialOutput.code,
          "Kategori Output": hasil.materialOutput.kategori.name,
          "Jumlah Output": hasil.jumlahOutput,
          "Satuan Output": hasil.materialOutput.satuan.name,
          "Rendemen (%)": hasil.rendemen,
          "Operator": index === 0 ? proses.operatorProduksi : "",
          Status: index === 0 ? proses.status : "",
        });
      });
    });

    // Calculate summary
    let totalProduksi = 0;
    let totalInput = 0;
    let totalRendemen = 0;
    let countProses = 0;
    let countHasil = 0;

    prosesProduksiList.forEach((proses) => {
      totalInput += proses.jumlahInput;
      countProses++;
      proses.hasilProduksi.forEach((hasil) => {
        totalProduksi += hasil.jumlahOutput;
        totalRendemen += hasil.rendemen;
        countHasil++;
      });
    });

    const rataRataProduksi = countProses > 0 ? totalProduksi / countProses : 0;
    const rataRataRendemen = countHasil > 0 ? totalRendemen / countHasil : 0;

    // Add summary rows
    excelData.push({});
    excelData.push({
      "No. Produksi": "RINGKASAN",
    });
    excelData.push({
      "No. Produksi": "Total Input (kg)",
      "Tanggal Produksi": totalInput.toFixed(2),
    });
    excelData.push({
      "No. Produksi": "Total Produksi (kg)",
      "Tanggal Produksi": totalProduksi.toFixed(2),
    });
    excelData.push({
      "No. Produksi": "Rata-rata Produksi per Proses (kg)",
      "Tanggal Produksi": rataRataProduksi.toFixed(2),
    });
    excelData.push({
      "No. Produksi": "Total Rendemen (%)",
      "Tanggal Produksi": totalRendemen.toFixed(2),
    });
    excelData.push({
      "No. Produksi": "Rata-rata Rendemen (%)",
      "Tanggal Produksi": rataRataRendemen.toFixed(2),
    });
    excelData.push({
      "No. Produksi": "Total Proses",
      "Tanggal Produksi": countProses,
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // No. Produksi
      { wch: 15 }, // Tanggal
      { wch: 25 }, // Material Input
      { wch: 20 }, // Kategori Input
      { wch: 15 }, // Jumlah Input
      { wch: 12 }, // Satuan Input
      { wch: 25 }, // Material Output
      { wch: 15 }, // Kode Output
      { wch: 20 }, // Kategori Output
      { wch: 15 }, // Jumlah Output
      { wch: 12 }, // Satuan Output
      { wch: 15 }, // Rendemen
      { wch: 20 }, // Operator
      { wch: 12 }, // Status
    ];
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Produksi");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Laporan-Proses-Produksi-${new Date().getTime()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
