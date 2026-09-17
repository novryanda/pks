import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { invoiceService } from "@/server/services/pt-pks/invoice.service";
import { createInvoiceSchema, invoiceQuerySchema } from "@/server/schema/invoice";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const invoice = await invoiceService.getInvoiceById(id, companyId);
      return NextResponse.json(invoice);
    }

    // Build query params
    const queryParams: any = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    if (searchParams.get("search")) queryParams.search = searchParams.get("search");
    if (searchParams.get("contractId")) queryParams.contractId = searchParams.get("contractId");
    if (searchParams.get("buyerId")) queryParams.buyerId = searchParams.get("buyerId");
    if (searchParams.get("status")) queryParams.status = searchParams.get("status");
    if (searchParams.get("startDate")) queryParams.startDate = new Date(searchParams.get("startDate")!);
    if (searchParams.get("endDate")) queryParams.endDate = new Date(searchParams.get("endDate")!);

    const validatedQuery = invoiceQuerySchema.parse(queryParams);
    const invoices = await invoiceService.getInvoices(companyId, validatedQuery);
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.pengirimanProduct", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    const userName = session.user.name;
    if (!companyId || !userName) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    
    // Parse dates
    const parsedBody = {
      ...body,
      tanggalInvoice: new Date(body.tanggalInvoice),
      tanggalJatuhTempo: body.tanggalJatuhTempo ? new Date(body.tanggalJatuhTempo) : null,
      items: body.items?.map((item: any) => ({
        ...item,
        tanggalPengiriman: new Date(item.tanggalPengiriman),
      })),
    };

    const data = createInvoiceSchema.parse(parsedBody);

    const invoice = await invoiceService.createInvoice(companyId, data, userName);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 400 }
    );
  }
}
