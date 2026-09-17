import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";

// GET /api/pt-pks/pengiriman-product/completed-mutu
// Menampilkan pengiriman yang sudah selesai input mutu (untuk cetak surat pengantar)
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    // Ambil pengiriman yang sudah COMPLETED hari ini (sudah ada kontrak dan mutu)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pengirimans = await db.pengirimanProduct.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        updatedAt: {
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
        buyer: true,
        contract: true,
        contractItem: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(pengirimans);
  } catch (error: any) {
    console.error("Error fetching completed mutu:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch completed mutu" },
      { status: 500 }
    );
  }
}
