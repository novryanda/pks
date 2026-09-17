import { ContractTable } from "@/components/dashboard/pt-pks/buyer/contract-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata = {
  title: "Kontrak | Pemasaran PT PKS",
  description: "Manajemen kontrak penjualan produk",
};

export default function KontrakPemasaranPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/pt-pks">PT PKS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/pt-pks/pemasaran">Pemasaran</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Kontrak</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold mt-2">Daftar Kontrak</h1>
        <p className="text-muted-foreground">
          Manajemen kontrak penjualan produk dengan buyer
        </p>
      </div>

      <ContractTable
        basePath="/dashboard/pt-pks/pemasaran/kontrak"
        enableExport
      />
    </div>
  );
}
