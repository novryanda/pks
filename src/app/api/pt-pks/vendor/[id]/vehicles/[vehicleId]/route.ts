import { requireAuthWithPermission } from "@/lib/api-auth";
import { vendorVehicleService } from "@/server/services/pt-pks/vendor-vehicle.service";
import { NextResponse } from "next/server";

interface Params {
  params: {
    id: string;
    vehicleId: string;
  };
}

// GET /api/pt-pks/vendor/[id]/vehicles/[vehicleId] - Get vehicle by id
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("masterData.vendor", "view");
  if (error) return error;

  try {
    const vendorId = params.id;
    const vehicleId = params.vehicleId;

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const vehicle = await vendorVehicleService.getVehicleById(vehicleId, vendorId, companyId);

    return NextResponse.json({ vehicle });
  } catch (error: any) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vehicle" },
      { status: 404 }
    );
  }
}

// PUT /api/pt-pks/vendor/[id]/vehicles/[vehicleId] - Update vehicle
export async function PUT(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("masterData.vendor", "edit");
  if (error) return error;

  try {
    const vendorId = params.id;
    const vehicleId = params.vehicleId;
    const body = await request.json();

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const vehicle = await vendorVehicleService.updateVehicle(vehicleId, vendorId, companyId, body);

    return NextResponse.json({ vehicle });
  } catch (error: any) {
    console.error("Error updating vehicle:", error);

    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update vehicle" },
      { status: 400 }
    );
  }
}

// DELETE /api/pt-pks/vendor/[id]/vehicles/[vehicleId] - Delete vehicle
export async function DELETE(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission("masterData.vendor", "delete");
  if (error) return error;

  try {
    const vendorId = params.id;
    const vehicleId = params.vehicleId;

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    await vendorVehicleService.deleteVehicle(vehicleId, vendorId, companyId);

    return NextResponse.json(
      { message: "Vehicle deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete vehicle" },
      { status: 400 }
    );
  }
}
