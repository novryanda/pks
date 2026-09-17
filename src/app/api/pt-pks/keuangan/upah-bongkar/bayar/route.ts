import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuthWithPermission } from "@/lib/api-auth";
import { keuanganDashboardService } from "@/server/services/pt-pks/keuangan-dashboard.service";

const bayarSchema = z.object({
  penerimaanId: z.string().min(1, "Penerimaan wajib dipilih"),
  jumlahBayar: z.number().positive("Jumlah bayar harus lebih dari 0"),
  metodePembayaran: z.string().optional().nullable(),
  nomorReferensi: z.string().optional().nullable(),
  keterangan: z.string().optional().nullable(),
  tanggalBayar: z.string().or(z.date()).optional().nullable(),
});

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("keuangan.upahBongkar", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    const userName = session.user.name;
    if (!companyId || !userName) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const data = bayarSchema.parse(body);

    const result = await keuanganDashboardService.payUnloadingWage(
      companyId,
      "PENERIMAAN_TBS",
      data.penerimaanId,
      {
        hutangId: "",
        jumlahBayar: data.jumlahBayar,
        metodePembayaran: data.metodePembayaran || undefined,
        nomorReferensi: data.nomorReferensi || undefined,
        keterangan: data.keterangan || undefined,
        tanggalBayar: data.tanggalBayar ? new Date(data.tanggalBayar) : undefined,
      },
      userName
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error paying unloading wage:", error);
    return NextResponse.json(
      { error: error.message || "Failed to pay unloading wage" },
      { status: 400 }
    );
  }
}
