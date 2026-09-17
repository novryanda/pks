import { requireAuthWithPermission } from "@/lib/api-auth";
import { contractService } from "@/server/services/pt-pks/contract.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/contract/generate-number - Generate new contract number
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.contract", "create");
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

    const contractNumber = await contractService.generateContractNumber(companyId);

    return NextResponse.json({ contractNumber });
  } catch (error: any) {
    console.error("Error generating contract number:", error);
    return NextResponse.json(
      { error: "Failed to generate contract number" },
      { status: 500 }
    );
  }
}
