"use client";

import { ModuleAccessGuard } from "@/components/dashboard/module-access-guard";
import { BiayaOperasionalList } from "@/components/dashboard/pt-pks/biaya-operasional/biaya-operasional-list";

export default function BiayaOperasionalPage() {
  return (
    <ModuleAccessGuard module="gudang.biayaOperasional">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Biaya Operasional</h1>
          <p className="text-sm text-muted-foreground">
            Pengajuan biaya operasional gudang & operasional pabrik. Setelah disetujui, pengajuan akan otomatis terdaftar di modul Biaya Pengeluaran (Keuangan) untuk proses pembayaran.
          </p>
        </div>

        <BiayaOperasionalList />
      </div>
    </ModuleAccessGuard>
  );
}
