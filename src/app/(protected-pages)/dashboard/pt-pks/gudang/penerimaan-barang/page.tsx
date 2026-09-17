"use client";

import { useRouter } from "next/navigation";
import { PenerimaanBarangList } from "@/components/dashboard/pt-pks/penerimaan-barang/penerimaan-barang-list";

export default function PenerimaanBarangPage() {
  const router = useRouter();

  const handleCreateNew = () => {
    router.push("/dashboard/pt-pks/gudang/penerimaan-barang/create");
  };

  const handleViewDetail = (id: string) => {
    router.push(`/dashboard/pt-pks/gudang/penerimaan-barang/${id}`);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Penerimaan Barang</h1>
        <p className="text-muted-foreground">
          Penerimaan barang dari vendor dan update stock otomatis
        </p>
      </div>
      <PenerimaanBarangList 
        onCreateNew={handleCreateNew}
        onViewDetail={handleViewDetail}
      />
    </div>
  );
}
