import { PengeluaranBarangList } from "@/components/dashboard/pt-pks/pengeluaran-barang/pengeluaran-barang-list";

export default function PengeluaranBarangPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pengeluaran Barang</h1>
        <p className="text-muted-foreground">
          Pengeluaran barang dari gudang berdasarkan Store Request yang sudah disetujui
        </p>
      </div>
      <PengeluaranBarangList />
    </div>
  );
}
