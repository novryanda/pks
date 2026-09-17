import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { invoiceService } from "@/server/services/pt-pks/invoice.service";
import { pembayaranInvoiceSchema } from "@/server/schema/invoice";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const { id } = await params;
    const pembayaran = await invoiceService.getPembayaranByInvoice(id);
    return NextResponse.json(pembayaran);
  } catch (error: any) {
    console.error("Error fetching pembayaran:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pembayaran" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "edit");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    const userName = session.user.name;
    if (!companyId || !userName) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const parsedBody = {
      ...body,
      invoiceId: id,
      tanggalBayar: new Date(body.tanggalBayar),
    };

    const data = pembayaranInvoiceSchema.parse(parsedBody);
    const pembayaran = await invoiceService.addPembayaran(companyId, data, userName);
    return NextResponse.json(pembayaran, { status: 201 });
  } catch (error: any) {
    console.error("Error adding pembayaran:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add pembayaran" },
      { status: 400 }
    );
  }
}
