import { BiayaPengeluaranList } from "@/components/dashboard/pt-pks/keuangan/biaya-pengeluaran-list";

export const metadata = {
    title: "Biaya Pengeluaran - PT PKS",
    description: "Pencatatan biaya pengeluaran operasional perusahaan",
};

export default function BiayaPengeluaranPage() {
    return <BiayaPengeluaranList />;
}
