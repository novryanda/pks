import { MaterialInventarisList } from "@/components/dashboard/pt-pks/material-inventaris/material-inventaris-list";

export default function InventarisPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inventaris Material</h1>
        <p className="text-muted-foreground">
          Kelola master data material dan monitoring stock
        </p>
      </div>
      <MaterialInventarisList />
    </div>
  );
}
