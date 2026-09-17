import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";

// GET /api/pt-pks/pengiriman-product/completed-gross
// Menampilkan pengiriman yang sudah selesai timbang gross (untuk cetak tiket timbangan)
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    // Ambil pengiriman yang sudah timbang gross hari ini (status TIMBANG_GROSS atau lebih)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pengirimans = await db.pengirimanProduct.findMany({
      where: {
        companyId,
        status: {
          in: ["TIMBANG_GROSS", "COMPLETED"],
        },
        waktuTimbangGross: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: { waktuTimbangGross: "desc" },
    });

    return NextResponse.json(pengirimans);
  } catch (error: any) {
    console.error("Error fetching completed gross:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch completed gross" },
      { status: 500 }
    );
  }
}
