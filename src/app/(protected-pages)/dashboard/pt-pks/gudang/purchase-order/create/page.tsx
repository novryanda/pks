import { ModuleAccessGuard } from "@/components/dashboard/module-access-guard";
import { PurchaseOrderFormFromPR } from "@/components/dashboard/pt-pks/purchase-order/purchase-order-form-from-pr";

export default function CreatePurchaseOrderPage() {
  return (
    <ModuleAccessGuard module="gudang.purchaseOrder" action="create">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Buat Purchase Order</h1>
          <p className="text-muted-foreground">
            Buat PO baru dengan referensi dari Purchase Request yang sudah diapprove
          </p>
        </div>
        <PurchaseOrderFormFromPR />
      </div>
    </ModuleAccessGuard>
  );
}
