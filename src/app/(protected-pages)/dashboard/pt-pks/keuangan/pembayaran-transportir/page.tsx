import { PembayaranTransportirList } from "@/components/dashboard/pt-pks/keuangan";

export const metadata = {
  title: "Pembayaran Transportir | Keuangan",
  description: "Validasi dan pembayaran vendor transportir dari pengiriman product",
};

export default function PembayaranTransportirPage() {
  return (
    <div className="container mx-auto py-6">
      <PembayaranTransportirList />
    </div>
  );
}
