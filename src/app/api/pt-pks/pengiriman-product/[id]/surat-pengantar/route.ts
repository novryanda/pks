import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";
import { generateSuratPengantarPDF } from "@/lib/pdf/pt-pks/generate-surat-pengantar";

type CustomField = {
  fieldName: string;
  fieldValue: string;
};

interface Params {
  params: {
    id: string;
  };
}

function isCustomFieldArray(value: unknown): value is CustomField[] {
  return Array.isArray(value) && value.every((item) => {
    if (typeof item !== "object" || item === null) {
      return false;
    }

    const field = item as Record<string, unknown>;
    return typeof field.fieldName === "string" && typeof field.fieldValue === "string";
  });
}

// GET /api/pt-pks/pengiriman-product/[id]/surat-pengantar - Generate Surat Pengantar PDF
export async function GET(request: Request, { params }: Params) {
  const { error } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const { id } = params;

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

    // Get pengiriman with full details
    const pengiriman = await db.pengirimanProduct.findUnique({
      where: { id },
      include: {
        buyer: true,
        company: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!pengiriman) {
      return NextResponse.json(
        { error: "Pengiriman tidak ditemukan" },
        { status: 404 }
      );
    }

    // Surat pengantar hanya bisa di-generate untuk pengiriman COMPLETED
    if (pengiriman.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Surat pengantar hanya dapat digenerate untuk pengiriman yang sudah selesai (COMPLETED)" },
        { status: 400 }
      );
    }

    // Validasi semua data yang diperlukan sudah ada
    if (!pengiriman.buyer || !pengiriman.contract || !pengiriman.contractItem) {
      return NextResponse.json(
        { error: "Data buyer, kontrak, atau item kontrak belum lengkap" },
        { status: 400 }
      );
    }

    if (!pengiriman.company || !pengiriman.vendorVehicle) {
      return NextResponse.json(
        { error: "Data perusahaan atau kendaraan vendor belum lengkap" },
        { status: 400 }
      );
    }

    if (pengiriman.beratGross == null || pengiriman.beratNetto == null || !pengiriman.waktuTimbangGross) {
      return NextResponse.json(
        { error: "Data timbang gross/netto belum lengkap" },
        { status: 400 }
      );
    }

    const buyer = pengiriman.buyer;
    const contract = pengiriman.contract;
    const contractItem = pengiriman.contractItem;
    const vendorVehicle = pengiriman.vendorVehicle;
    const company = pengiriman.company;
    const mutuCustomFields = isCustomFieldArray(pengiriman.mutuCustomFields)
      ? pengiriman.mutuCustomFields
      : null;
    const contractCustomFields = isCustomFieldArray(contract.customFields)
      ? contract.customFields
      : [];

    // Prepare data for PDF
    const pdfData = {
      nomorPengiriman: pengiriman.nomorPengiriman,
      tanggalPengiriman: pengiriman.tanggalPengiriman.toISOString(),
      operatorPenimbang: pengiriman.operatorPenimbang,
      buyer: {
        name: buyer.name,
        code: buyer.code,
        address: buyer.address,
        contactPerson: buyer.contactPerson,
        phone: buyer.phone,
      },
      contract: {
        contractNumber: contract.contractNumber,
        deliveryDate: contract.deliveryDate?.toISOString() ?? null,
        quantity: contractItem.quantity ?? 0,
      },
      contractItem: {
        material: {
          name: contractItem.material.name,
          code: contractItem.material.code,
          satuan: {
            name: contractItem.material.satuan.name,
            symbol: contractItem.material.satuan.symbol,
          },
        },
      },
      vendorVehicle: {
        nomorKendaraan: vendorVehicle.nomorKendaraan,
        namaSupir: vendorVehicle.namaSupir,
        noHpSupir: vendorVehicle.noHpSupir,
        noSim: vendorVehicle.noSim,
        vendor: {
          name: vendorVehicle.vendor.name,
          code: vendorVehicle.vendor.code,
        },
      },
      beratTarra: pengiriman.beratTarra,
      beratGross: pengiriman.beratGross,
      beratNetto: pengiriman.beratNetto,
      mutuCustomFields,
      contractCustomFields,
      waktuTimbangTarra: pengiriman.waktuTimbangTarra.toISOString(),
      waktuTimbangGross: pengiriman.waktuTimbangGross.toISOString(),
      disetujuiOleh: millManager.namaKaryawan,
      disetujuiJabatan: millManager.jabatan?.nama ?? "MILL MANAGER",
      diperiksaOleh: ktu.namaKaryawan,
      diperiksaJabatan: ktu.jabatan?.nama ?? "KTU",
      company: {
        name: company.name,
        code: company.code,
      },
    };

    // Generate PDF using helper function
    const buffer = await generateSuratPengantarPDF(pdfData);

    // Return PDF response
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="SuratPengantar-${pengiriman.nomorPengiriman}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error generating surat pengantar PDF:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate surat pengantar PDF" },
      { status: 500 }
    );
  }
}
