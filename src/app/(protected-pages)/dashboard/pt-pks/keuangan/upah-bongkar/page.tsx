import { UpahBongkarList } from "@/components/dashboard/pt-pks/keuangan";

export const metadata = {
  title: "Upah Bongkar | Keuangan",
  description: "Pembayaran upah bongkar dari penerimaan TBS",
};

export default function UpahBongkarPage() {
  return (
    <div className="container mx-auto py-6">
      <UpahBongkarList />
    </div>
  );
}
