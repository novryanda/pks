import { PenggajianTable } from "@/components/dashboard/pt-pks/penggajian";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata = {
  title: "Data Penggajian | PT PKS",
};

export default async function PenggajianPage() {
  return (
    <div className="flex min-h-[calc(100vh-9.5rem)] flex-col gap-3">
      <div className="shrink-0">
        <div className="flex items-baseline gap-3 mt-1">
          <h1 className="text-xl font-bold">Data Penggajian Karyawan</h1>
        </div>
      </div>

      <PenggajianTable />
    </div>
  );
}
