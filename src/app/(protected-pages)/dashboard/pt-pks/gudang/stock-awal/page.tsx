"use client";

import { ModuleAccessGuard } from "@/components/dashboard/module-access-guard";
import { StockAwalPage } from "@/components/dashboard/pt-pks/stock-awal/stock-awal-page";

export default function OpeningStockPage() {
  return (
    <ModuleAccessGuard module="gudang.stockAwal">
      <div className="container mx-auto py-6">
        <StockAwalPage />
      </div>
    </ModuleAccessGuard>
  );
}
