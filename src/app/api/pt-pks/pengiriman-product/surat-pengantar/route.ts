import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";
import { generateSuratPengantarPDF } from "@/lib/pdf/pt-pks/generate-surat-pengantar";
import { db } from "@/server/db";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const pengiriman = await pengirimanProductService.getPengirimanProductById(id);

    if (!pengiriman) {
      return NextResponse.json({ error: "Pengiriman not found" }, { status: 404 });
    }

    // Verify that this pengiriman belongs to the user's company
    if (pengiriman.companyId !== session.user.company!.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [millManager, ktu] = await Promise.all([
      db.masterKaryawan.findFirst({
        where: {
          isActive: true,
          jabatan: {
            nama: {
              equals: "MILL MANAGER",
              mode: "insensitive",
            },
          },
        },
        select: {
          namaKaryawan: true,
          jabatan: {
            select: {
              nama: true,
            },
          },
        },
        orderBy: {
          namaKaryawan: "asc",
        },
      }),
      db.masterKaryawan.findFirst({
        where: {
          isActive: true,
          jabatan: {
            nama: {
              equals: "KTU",
              mode: "insensitive",
            },
          },
        },
        select: {
          namaKaryawan: true,
          jabatan: {
            select: {
              nama: true,
            },
          },
        },
        orderBy: {
          namaKaryawan: "asc",
        },
      }),
    ]);

    if (!millManager) {
      return NextResponse.json(
        { error: 'Data karyawan aktif dengan jabatan "MILL MANAGER" tidak ditemukan' },
        { status: 400 }
      );
    }

    if (!ktu) {
      return NextResponse.json(
        { error: 'Data karyawan aktif dengan jabatan "KTU" tidak ditemukan' },
        { status: 400 }
      );
    }

    // Prepare and sanitize data for PDF
    const pdfDataRaw = {
      ...pengiriman,
      tanggalPengiriman: typeof pengiriman.tanggalPengiriman === "string"
        ? pengiriman.tanggalPengiriman
        : pengiriman.tanggalPengiriman?.toISOString?.() || "",
      waktuTimbangTarra: typeof pengiriman.waktuTimbangTarra === "string"
        ? pengiriman.waktuTimbangTarra
        : pengiriman.waktuTimbangTarra?.toISOString?.() || "",
      waktuTimbangGross: typeof pengiriman.waktuTimbangGross === "string"
        ? pengiriman.waktuTimbangGross
        : pengiriman.waktuTimbangGross?.toISOString?.() || "",
      contract: {
        ...pengiriman.contract,
        deliveryDate: typeof pengiriman.contract?.deliveryDate === "string"
          ? pengiriman.contract.deliveryDate
          : (pengiriman.contract?.deliveryDate as any)?.toISOString?.() || "",
        quantity: pengiriman.contractItem?.quantity ?? 0,
      },
      contractCustomFields: pengiriman.contract?.customFields || [],
      disetujuiOleh: millManager.namaKaryawan,
      disetujuiJabatan: millManager.jabatan?.nama ?? "MILL MANAGER",
      diperiksaOleh: ktu.namaKaryawan,
      diperiksaJabatan: ktu.jabatan?.nama ?? "KTU",
      company: {
        name: session.user.company!.name || "PT. HAMPARAN TENANG GROUP",
        code: session.user.company!.code || "",
      },
    };
    // Sanitize: remove any non-JSON fields
    const pdfData = JSON.parse(JSON.stringify(pdfDataRaw));

    // Generate PDF using helper function
    const buffer = await generateSuratPengantarPDF(pdfData);

    // Return PDF
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Surat-Pengantar-${pengiriman.nomorPengiriman}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating surat pengantar PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
