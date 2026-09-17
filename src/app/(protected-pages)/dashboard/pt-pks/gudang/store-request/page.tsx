import { StoreRequestList } from "@/components/dashboard/pt-pks/store-request/store-request-list";
import { ModuleAccessGuard } from "@/components/dashboard/module-access-guard";

export default function StoreRequestPage() {
  return (
    <ModuleAccessGuard module="gudang.storeRequest">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Store Request (SR)</h1>
          <p className="text-muted-foreground">
            Permintaan barang dari divisi yang membutuhkan persetujuan
          </p>
        </div>
        <StoreRequestList />
      </div>
    </ModuleAccessGuard>
  );
}
