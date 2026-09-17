import { requireAuthWithPermission } from "@/lib/api-auth";
import { supplierService } from "@/server/services/pt-pks/supplier.service";
import { NextResponse } from "next/server";

type Params = {
  params: {
    id: string;
  };
};

// GET /api/pt-pks/supplier/[id] - Get supplier by ID
export async function GET(request: Request, { params }: Params) {
  const { error } = await requireAuthWithPermission("masterData.supplier", "view");
  if (error) return error;

  try {
    const supplier = await supplierService.getSupplierById(params.id);
    return NextResponse.json({ supplier });
  } catch (err: any) {
    console.error("Error fetching supplier:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch supplier" },
      { status: 404 }
    );
  }
}

// PUT /api/pt-pks/supplier/[id] - Update supplier
export async function PUT(request: Request, { params }: Params) {
  const { error } = await requireAuthWithPermission("masterData.supplier", "edit");
  if (error) return error;

  try {
    const body = await request.json();

    const supplierData: any = { ...body };
    
    // Convert managementType to boolean fields if exists
    if (body.managementType) {
      supplierData.swadaya = body.managementType === "swadaya";
      supplierData.kelompok = body.managementType === "kelompok";
      supplierData.perusahaan = body.managementType === "perusahaan";
      delete supplierData.managementType;
    }

    const supplier = await supplierService.updateSupplier(params.id, supplierData);

    return NextResponse.json({ supplier });
  } catch (err: any) {
    console.error("Error updating supplier:", err);

    // Handle validation errors
    if (err.errors) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Failed to update supplier" },
      { status: 500 }
    );
  }
}

// DELETE /api/pt-pks/supplier/[id] - Delete supplier
export async function DELETE(request: Request, { params }: Params) {
  const { error } = await requireAuthWithPermission("masterData.supplier", "delete");
  if (error) return error;

  try {
    await supplierService.deleteSupplier(params.id);
    return NextResponse.json({ message: "Supplier deleted successfully" });
  } catch (err: any) {
    console.error("Error deleting supplier:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
