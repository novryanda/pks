import { PurchaseOrderList } from "@/components/dashboard/pt-pks/purchase-order/purchase-order-list";
import { ModuleAccessGuard } from "@/components/dashboard/module-access-guard";

export default function PurchaseOrderPage() {
  return (
    <ModuleAccessGuard module="gudang.purchaseOrder">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Purchase Order (PO)</h1>
          <p className="text-muted-foreground">
            Order pembelian yang diterbitkan ke vendor
          </p>
        </div>
        <PurchaseOrderList />
      </div>
    </ModuleAccessGuard>
  );
}
