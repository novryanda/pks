"use client";

import { useRouter } from "next/navigation";
import { ModuleAccessGuard } from "@/components/dashboard/module-access-guard";
import { PurchaseRequestForm } from "@/components/dashboard/pt-pks/purchase-request/purchase-request-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CreatePurchaseRequestPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/pt-pks/gudang/purchase-request");
  };

  const handleBack = () => {
    router.push("/dashboard/pt-pks/gudang/purchase-request");
  };

  return (
    <ModuleAccessGuard module="gudang.purchaseRequest" action="create">
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Buat Purchase Request Baru</h1>
            <p className="text-muted-foreground">
              Buat permintaan pembelian material untuk gudang
            </p>
          </div>
        </div>
        <PurchaseRequestForm onSuccess={handleSuccess} />
      </div>
    </ModuleAccessGuard>
  );
}
