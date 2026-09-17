import { ModuleAccessGuard } from "@/components/dashboard/module-access-guard";
import { PurchaseOrderEditForm } from "@/components/dashboard/pt-pks/purchase-order/purchase-order-edit-form";
import { db } from "@/server/db";
import { notFound } from "next/navigation";

async function getDraftPurchaseOrder(id: string) {
  return db.purchaseOrder.findFirst({
    where: {
      id,
      status: "DRAFT",
    },
    include: {
      purchaseRequest: {
        select: {
          id: true,
          nomorPR: true,
        },
      },
      items: {
        include: {
          material: {
            include: {
              satuanMaterial: true,
            },
          },
          prItemMappings: {
            include: {
              purchaseRequestItem: {
                include: {
                  material: {
                    include: {
                      satuanMaterial: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchaseOrder = await getDraftPurchaseOrder(id);

  if (!purchaseOrder) {
    notFound();
  }

  const initialData = {
    id: purchaseOrder.id,
    nomorPO: purchaseOrder.nomorPO,
    status: purchaseOrder.status,
    purchaseRequestId: purchaseOrder.purchaseRequestId,
    purchaseRequest: purchaseOrder.purchaseRequest,
    vendorMaterialId: purchaseOrder.vendorMaterialId,
    vendorName: purchaseOrder.vendorName,
    vendorPhone: purchaseOrder.vendorPhone,
    vendorAddress: purchaseOrder.vendorAddress,
    tanggalKirimDiharapkan: purchaseOrder.tanggalKirimDiharapkan?.toISOString() || null,
    termPembayaran: purchaseOrder.termPembayaran,
    issuedBy: purchaseOrder.issuedBy,
    taxPercent: purchaseOrder.taxPercent,
    discountType: purchaseOrder.discountType as "PERCENT" | "AMOUNT" | null,
    discountPercent: purchaseOrder.discountPercent,
    discountAmount: purchaseOrder.discountAmount,
    shipping: purchaseOrder.shipping,
    keterangan: purchaseOrder.keterangan,
    items: purchaseOrder.items.map((item) => {
      const prMapping = item.prItemMappings[0];
      const currentMappedQuantity = prMapping?.quantity || 0;
      const prItem = prMapping?.purchaseRequestItem;
      const prItemMaxQty = prItem
        ? prItem.jumlahRequest - prItem.jumlahPOCreated + currentMappedQuantity
        : undefined;

      return {
        id: item.id,
        materialId: item.materialId,
        jumlahOrder: item.jumlahOrder,
        hargaSatuan: item.hargaSatuan,
        keterangan: item.keterangan || "",
        prItemId: prMapping?.purchaseRequestItemId,
        prItemMaxQty,
        prLabel: prItem
          ? `${prItem.material.partNumber} - ${prItem.material.namaMaterial}`
          : undefined,
      };
    }),
  };

  return (
    <ModuleAccessGuard module="gudang.purchaseOrder" action="edit">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Purchase Order</h1>
          <p className="text-muted-foreground">
            Ubah data purchase order draft sebelum diterbitkan.
          </p>
        </div>
        <PurchaseOrderEditForm purchaseOrder={initialData} />
      </div>
    </ModuleAccessGuard>
  );
}
