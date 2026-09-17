import { requireAuthWithPermission } from "@/lib/api-auth";
import { buyerService } from "@/server/services/pt-pks/buyer.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/buyer/generate-code - Generate new buyer code
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.buyer", "create");
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

    const code = await buyerService.generateBuyerCode(companyId);

    return NextResponse.json({ code });
  } catch (error: any) {
    console.error("Error generating buyer code:", error);
    return NextResponse.json(
      { error: "Failed to generate buyer code" },
      { status: 500 }
    );
  }
}
