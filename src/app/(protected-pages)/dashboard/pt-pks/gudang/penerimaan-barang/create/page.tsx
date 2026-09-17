"use client";

import { useRouter } from "next/navigation";
import { PenerimaanBarangForm } from "@/components/dashboard/pt-pks/penerimaan-barang/penerimaan-barang-form";

export default function CreatePenerimaanBarangPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/pt-pks/gudang/penerimaan-barang");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Terima Barang Baru</h1>
        <p className="text-muted-foreground">
          Buat penerimaan barang dari Purchase Order atau Purchase Request
        </p>
      </div>
      <PenerimaanBarangForm onSuccess={handleSuccess} />
    </div>
  );
}
