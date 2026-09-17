import { requireAuthWithPermission } from "@/lib/api-auth";
import { vendorService } from "@/server/services/pt-pks/vendor.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/vendor/generate-code - Generate new vendor code
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.vendor", "create");
  if (error) return error;

  try {
    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const code = await vendorService.generateVendorCode(companyId);

    return NextResponse.json({ code });
  } catch (error: any) {
    console.error("Error generating vendor code:", error);
    return NextResponse.json(
      { error: "Failed to generate vendor code" },
      { status: 500 }
    );
  }
}
