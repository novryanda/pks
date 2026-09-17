import { requireAuthWithPermission } from "@/lib/api-auth";
import { supplierService } from "@/server/services/pt-pks/supplier.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/supplier - Get all suppliers
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.supplier", "view");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const pengelolaan = searchParams.get("pengelolaan") as
      | "swadaya"
      | "kelompok"
      | "perusahaan"
      | null;
    const sertifikasi = searchParams.get("sertifikasi") as
      | "ISPO"
      | "RSPO"
      | null;

    // Get companyId from session or default to PT PKS
    const companyId = session.user.company?.id;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    let suppliers;

    if (type === "map") {
      // Get suppliers for map view
      suppliers = await supplierService.getSuppliersForMap(companyId);
    } else if (search || pengelolaan || sertifikasi) {
      // Search or filter suppliers
      const filters: {
        pengelolaan?: "swadaya" | "kelompok" | "perusahaan";
        sertifikasi?: "ISPO" | "RSPO";
      } = {};

      if (pengelolaan) filters.pengelolaan = pengelolaan;
      if (sertifikasi) filters.sertifikasi = sertifikasi;

      suppliers = await supplierService.searchSuppliers(
        companyId,
        search || undefined,
        filters
      );
    } else {
      // Get all suppliers
      suppliers = await supplierService.getSuppliers(companyId);
    }

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

// POST /api/pt-pks/supplier - Create new supplier
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.supplier", "create");
  if (error) return error;

  try {
    const body = await request.json();

    // Get companyId from session or use from body
    const companyId = session.user.company?.id || body.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    // Create supplier
    const supplierData = {
      ...body,
      companyId,
      swadaya: body.managementType === "swadaya",
      kelompok: body.managementType === "kelompok",
      perusahaan: body.managementType === "perusahaan",
    };
    delete supplierData.managementType;

    const supplier = await supplierService.createSupplier(supplierData);

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supplier:", error);

    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create supplier" },
      { status: 500 }
    );
  }
}
