import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";
import { generateLaporanProsesProduksiPDF } from "@/lib/pdf/pt-pks/laporan-proses-produksi-pdf";

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

    // Get company info
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    // Generate PDF
    const pdfBuffer = await generateLaporanProsesProduksiPDF({
      data: prosesProduksiList,
      company: company || undefined,
      periode: {
        tanggalMulai: tanggalMulai || undefined,
        tanggalAkhir: tanggalAkhir || undefined,
      },
      materialOutputId: materialOutputId || undefined,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Laporan-Proses-Produksi-${new Date().getTime()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
