import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";
import { generateTiketTimbanganPDF } from "@/lib/pdf/pt-pks/generate-tiket-timbangan";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/pt-pks/pengiriman-product/[id]/tiket-timbangan - Generate Tiket Timbangan PDF
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const { id } = params;

    // Get pengiriman with basic details
    const pengiriman = await db.pengirimanProduct.findUnique({
      where: { id },
      include: {
        company: true,
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
        contractItem: {
          include: {
            material: true,
            contract: {
              include: {
                buyer: true,
              },
            },
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

    // Tiket timbangan harus sudah selesai timbang gross (minimal status TIMBANG_GROSS)
    const validStatuses = ["TIMBANG_GROSS", "COMPLETED"];
    if (!validStatuses.includes(pengiriman.status)) {
      return NextResponse.json(
        { error: "Tiket timbangan hanya dapat digenerate untuk pengiriman yang sudah selesai timbang gross" },
        { status: 400 }
      );
    }

    // Validasi data timbangan
    if (!pengiriman.beratGross || !pengiriman.waktuTimbangGross) {
      return NextResponse.json(
        { error: "Data timbangan gross belum lengkap" },
        { status: 400 }
      );
    }

    // Prepare data for PDF
    const pdfData = {
      nomorPengiriman: pengiriman.nomorPengiriman,
      tanggalPengiriman: pengiriman.tanggalPengiriman.toISOString(),
      operatorPenimbang: pengiriman.operatorPenimbang,
      vendorVehicle: {
        nomorKendaraan: pengiriman.vendorVehicle.nomorKendaraan,
        namaSupir: pengiriman.vendorVehicle.namaSupir,
        noHpSupir: pengiriman.vendorVehicle.noHpSupir,
        vendor: {
          name: pengiriman.vendorVehicle.vendor.name,
          code: pengiriman.vendorVehicle.vendor.code,
        },
      },
      beratTarra: pengiriman.beratTarra,
      beratGross: pengiriman.beratGross!,
      beratNetto: pengiriman.beratNetto || 0,
      metodeTarra: pengiriman.metodeTarra,
      metodeGross: pengiriman.metodeGross || "MANUAL",
      waktuTimbangTarra: pengiriman.waktuTimbangTarra.toISOString(),
      waktuTimbangGross: pengiriman.waktuTimbangGross!.toISOString(),
      company: pengiriman.company ? {
        name: pengiriman.company.name,
        code: pengiriman.company.code,
      } : undefined,
      // Add contractItem and buyer for product name and customer name
      contractItem: pengiriman.contractItem ? {
        material: {
          name: pengiriman.contractItem.material.name,
          code: pengiriman.contractItem.material.code,
        },
      } : undefined,
      buyer: pengiriman.contractItem?.contract?.buyer ? {
        name: pengiriman.contractItem.contract.buyer.name,
        code: pengiriman.contractItem.contract.buyer.code,
      } : undefined,
    };

    // Generate PDF
    const pdfBuffer = await generateTiketTimbanganPDF(pdfData);

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="tiket-timbangan-${pengiriman.nomorPengiriman}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating tiket timbangan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate tiket timbangan" },
      { status: 500 }
    );
  }
}
