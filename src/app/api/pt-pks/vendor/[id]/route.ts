import { requireAuthWithPermission } from "@/lib/api-auth";
import { vendorService } from "@/server/services/pt-pks/vendor.service";
import { NextResponse } from "next/server";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/pt-pks/vendor/[id] - Get vendor by id
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("masterData.vendor", "view");
  if (error) return error;

  try {
    const { id } = params;

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const vendor = await vendorService.getVendorById(id, companyId);

    return NextResponse.json({ vendor });
  } catch (error: any) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vendor" },
      { status: 404 }
    );
  }
}

// PUT /api/pt-pks/vendor/[id] - Update vendor
export async function PUT(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("masterData.vendor", "edit");
  if (error) return error;

  try {
    const { id } = params;
    const body = await request.json();

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const vendor = await vendorService.updateVendor(id, companyId, body);

    return NextResponse.json({ vendor });
  } catch (error: any) {
    console.error("Error updating vendor:", error);

    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update vendor" },
      { status: 400 }
    );
  }
}

// DELETE /api/pt-pks/vendor/[id] - Delete vendor
export async function DELETE(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("masterData.vendor", "delete");
  if (error) return error;

  try {
    const { id } = params;

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    await vendorService.deleteVendor(id, companyId);

    return NextResponse.json(
      { message: "Vendor deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete vendor" },
      { status: 400 }
    );
  }
}
