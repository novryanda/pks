import { PiutangCustomerList } from "@/components/dashboard/pt-pks/keuangan";

export const metadata = {
  title: "Piutang Customer | Keuangan",
  description: "Daftar piutang customer berdasarkan invoice aktif",
};

export default function PiutangCustomerPage() {
  return (
    <div className="container mx-auto py-6">
      <PiutangCustomerList />
    </div>
  );
}
