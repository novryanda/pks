import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/pt-pks/contract/[id]/deliveries - Get all deliveries for a contract
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithPermission(
    "pemasaran.contract",
    "view",
  );
  if (error) return error;

  try {
    const { id } = await params;

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 },
      );
    }

    // Get contract with items and calculate original quantities
    const contract = await db.contract.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        buyer: true,
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Kontrak tidak ditemukan" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const startOfPeriod =
      parseJakartaDateBoundary(dateParam || startDateParam) || undefined;
    const endOfPeriod =
      parseJakartaDateBoundary(dateParam || endDateParam, { endOfDay: true }) ||
      undefined;

    // Get all deliveries for this contract (historical or all)
    const historicalDeliveries = await db.pengirimanProduct.findMany({
      where: {
        contractId: id,
        companyId,
        ...(endOfPeriod && {
          tanggalPengiriman: {
            lte: endOfPeriod,
          },
        }),
      },
      include: {
        buyer: true,
        contractItem: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: {
        tanggalPengiriman: "desc",
      },
    });

    // Deliveries in the selected period (or all deliveries if no date filter is applied)
    const filteredDeliveries = historicalDeliveries.filter((d) => {
      const dDate = new Date(d.tanggalPengiriman);
      if (startOfPeriod && dDate < startOfPeriod) {
        return false;
      }
      if (endOfPeriod && dDate > endOfPeriod) {
        return false;
      }
      return true;
    });

    // Historical progress should still accumulate until the selected end date
    const progressDeliveries = endOfPeriod
      ? historicalDeliveries
      : filteredDeliveries;

    // Calculate delivery summary per contract item
    const itemSummaries = contract.contractItems.map((item) => {
      const itemDeliveriesUpToDate = progressDeliveries.filter(
        (d) => d.contractItemId === item.id && d.status === "COMPLETED",
      );

      const deliveredWeightUpToDate = itemDeliveriesUpToDate.reduce(
        (sum, d) => sum + (d.beratNetto || 0),
        0,
      );

      // Quantity kontrak tetap
      const contractQuantity = item.quantity;

      // Sisa yang harus dikirim (Historical)
      const remainingQuantity = Math.max(
        0,
        contractQuantity - deliveredWeightUpToDate,
      );

      // Delivery percentage
      const deliveryPercentage =
        contractQuantity > 0
          ? (deliveredWeightUpToDate / contractQuantity) * 100
          : 0;

      return {
        contractItemId: item.id,
        materialId: item.materialId,
        materialCode: item.material.code,
        materialName: item.material.name,
        satuan: item.material.satuan,
        contractQuantity,
        deliveredQuantity: deliveredWeightUpToDate,
        remainingQuantity,
        deliveryPercentage,
        unitPrice: item.unitPrice,
        totalValue: contractQuantity * item.unitPrice,
        deliveredValue: deliveredWeightUpToDate * item.unitPrice,
        remainingValue: remainingQuantity * item.unitPrice,
        deliveryCount: itemDeliveriesUpToDate.length,
      };
    });

    // Overall summary for the table
    const overallSummary = {
      totalItems: contract.contractItems.length,
      totalDeliveries: filteredDeliveries.filter(
        (d) => d.status === "COMPLETED",
      ).length,
      totalDeliveredWeight: filteredDeliveries
        .filter((d) => d.status === "COMPLETED")
        .reduce((sum, d) => sum + (d.beratNetto || 0), 0),
      pendingDeliveries: filteredDeliveries.filter((d) => d.status === "DRAFT")
        .length,
      cancelledDeliveries: filteredDeliveries.filter(
        (d) => d.status === "CANCELLED",
      ).length,
    };

    return NextResponse.json({
      contract: {
        id: contract.id,
        contractNumber: contract.contractNumber,
        status: contract.status,
        buyer: contract.buyer,
        startDate: contract.startDate,
        endDate: contract.endDate,
        deliveryDate: contract.deliveryDate,
        deliveryAddress: contract.deliveryAddress,
      },
      itemSummaries,
      deliveries: filteredDeliveries,
      overallSummary,
    });
  } catch (error: any) {
    console.error("Error fetching contract deliveries:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch contract deliveries" },
      { status: 500 },
    );
  }
}
