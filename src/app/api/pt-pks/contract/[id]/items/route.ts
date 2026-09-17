import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("pemasaran.contract", "view");
  if (error) return error;

  try {
    const { id: contractId } = await params;
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId") || undefined;

    const contractItems = await db.contractItem.findMany({
      where: {
        contractId,
        ...(materialId && { materialId }),
        contract: {
          companyId: session.user.company!.id,
        },
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Transform data untuk menambahkan kuantitas tersisa
    const itemsWithRemaining = contractItems
      .map((item) => ({
        ...item,
        remainingQuantity: item.quantity - item.deliveredQuantity, // Kuantitas tersisa = kontrak - sudah dikirim
      }))
      .filter((item) => item.remainingQuantity > 0); // Hanya tampilkan item yang masih ada sisa

    return NextResponse.json(itemsWithRemaining);
  } catch (error) {
    console.error("Error fetching contract items:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract items" },
      { status: 500 }
    );
  }
}
