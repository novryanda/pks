import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.vendor", "view");
  if (error) return error;

  try {
    const companyId = session?.user?.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    const where: any = {
      vendor: {
        companyId,
      },
      status: "ACTIVE",
    };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const vehicles = await db.vendorVehicle.findMany({
      where,
      include: {
        vendor: true,
      },
      orderBy: {
        nomorKendaraan: "asc",
      },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Error fetching vendor vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor vehicles" },
      { status: 500 }
    );
  }
}
