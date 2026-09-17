"use client";

import { useRouter } from "next/navigation";
import { ModuleAccessGuard } from "@/components/dashboard/module-access-guard";
import { PurchaseRequestList } from "@/components/dashboard/pt-pks/purchase-request/purchase-request-list";

export default function PurchaseRequestPage() {
  const router = useRouter();

  const handleViewDetail = (id: string) => {
    router.push(`/dashboard/pt-pks/gudang/purchase-request/${id}`);
  };

  return (
    <ModuleAccessGuard module="gudang.purchaseRequest">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Purchase Request (PR)</h1>
          <p className="text-muted-foreground">
            Permintaan pembelian dari gudang ke Head Office untuk persetujuan
          </p>
        </div>
        <PurchaseRequestList onViewDetail={handleViewDetail} />
      </div>
    </ModuleAccessGuard>
  );
}
