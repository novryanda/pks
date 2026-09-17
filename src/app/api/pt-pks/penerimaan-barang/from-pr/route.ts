import { requireAuthWithPermission } from "@/lib/api-auth";
import { penerimaanBarangService } from "@/server/services/pt-pks/penerimaan-barang.service";
import { NextResponse } from "next/server";
import { z } from "zod";

const createFromPRSchema = z.object({
  purchaseRequestId: z.string(),
  receivedBy: z.string().min(1, "Penerima wajib diisi"),
  nomorSuratJalan: z.string().optional(),
  tanggalSuratJalan: z.string().optional(),
  tanggalPenerimaan: z.string().optional(),
  keterangan: z.string().optional(),
});

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("gudang.penerimaanBarang", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = createFromPRSchema.parse(body);

    const gr = await penerimaanBarangService.createFromPR(
      companyId,
      validatedData.purchaseRequestId,
      {
        receivedBy: validatedData.receivedBy,
        nomorSuratJalan: validatedData.nomorSuratJalan,
        tanggalSuratJalan: validatedData.tanggalSuratJalan,
        tanggalPenerimaan: validatedData.tanggalPenerimaan,
        keterangan: validatedData.keterangan,
      }
    );
    
    return NextResponse.json(gr, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
