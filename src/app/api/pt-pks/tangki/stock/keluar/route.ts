import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { tangkiService } from "@/server/services/pt-pks/tangki.service";

/**
 * POST /api/pt-pks/tangki/stock/keluar
 * Remove stock from tangki
 */
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.stockProduct", "edit");
  if (error) return error;

  try {
    if (!session.user.company?.id) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 403 },
      );
    }

    const body = await request.json();
    
    const result = await tangkiService.removeStock({
      companyId: session.user.company.id,
      tangkiId: body.tangkiId,
      jumlah: body.jumlah,
      referensi: body.referensi,
      keterangan: body.keterangan,
      operator: session.user.name ?? "Unknown",
      tanggalTransaksi: body.tanggalTransaksi,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error removing stock:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to remove stock" },
      { status: 500 },
    );
  }
}
