import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { materialService } from "@/server/services/pt-pks/material.service";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId");

    // If materialId provided, get specific stock
    if (materialId) {
      const stock = await materialService.getStockByMaterialId(
        session.user.company.id,
        materialId
      );
      return NextResponse.json(stock || { jumlah: 0 });
    }

    // Otherwise get all stocks
    const stocks = await materialService.getStockMaterialsByCompany(
      session.user.company.id
    );
    return NextResponse.json(stocks);
  } catch (error) {
    console.error("Error fetching stock materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock materials" },
      { status: 500 }
    );
  }
}
