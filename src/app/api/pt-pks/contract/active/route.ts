import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("pemasaran.contract", "view");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get("buyerId");

    const where: any = {
      company: {
        id: session.user.company!.id,
      },
      status: "ACTIVE",
    };

    if (buyerId) {
      where.buyerId = buyerId;
    }

    const contracts = await db.contract.findMany({
      where,
      include: {
        buyer: true,
        contractItems: {
          where: {
            quantity: {
              gt: 0, // Only contracts with remaining items
            },
          },
          include: {
            material: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
      },
      orderBy: {
        deliveryDate: "asc",
      },
    });

    // Filter out contracts with no remaining items
    const activeContracts = contracts.filter(
      contract => contract.contractItems.length > 0
    );

    return NextResponse.json(activeContracts);
  } catch (error) {
    console.error("Error fetching active contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch active contracts" },
      { status: 500 }
    );
  }
}
