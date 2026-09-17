import { notFound } from "next/navigation";
import { penggajianService } from "@/server/services/pt-pks/penggajian.service";
import { KaryawanDetailPage } from "@/components/dashboard/pt-pks/penggajian/karyawan-detail-page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Detail Penggajian Karyawan | PT PKS",
  description: "Detail penggajian dan kehadiran karyawan",
};

export default async function PenggajianDetailPage({ params }: PageProps) {
  const { id } = await params;

  let penggajian;
  try {
    penggajian = await penggajianService.getPenggajianById(id);
  } catch {
    notFound();
  }

  const bulanOptions = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  const getBulanLabel = (bulan: number) => {
    return bulanOptions.find((o) => o.value === bulan)?.label || String(bulan);
  };

  const namaKaryawan = penggajian.masterKaryawan?.namaKaryawan || "Unknown";
  const divisiNama = penggajian.masterKaryawan?.divisi?.nama || "-";
  const jabatanNama = penggajian.masterKaryawan?.jabatan?.nama || "-";

  return (
    <div className="space-y-6">
      <KaryawanDetailPage penggajianId={id} initialData={JSON.parse(JSON.stringify(penggajian))} />
    </div>
  );
}
