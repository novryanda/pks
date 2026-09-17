import { HargaTransportirList } from "@/components/dashboard/pt-pks/pengiriman-product/harga-transportir-list";

export const metadata = {
  title: "Harga Transportir | Pemasaran",
  description: "Input harga vendor transportir dari pengiriman product yang sudah selesai",
};

export default function HargaTransportirPage() {
  return (
    <div className="container mx-auto py-6">
      <HargaTransportirList />
    </div>
  );
}
