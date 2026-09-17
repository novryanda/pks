import { VendorMaterialTable } from "@/components/dashboard/pt-pks/vendor-material/vendor-material-table";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata = {
    title: "Daftar Vendor Material | PT PKS",
    description: "Manajemen data vendor material untuk pengadaan barang PT PKS",
};

export default async function VendorMaterialPage() {
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
                            <BreadcrumbPage>Vendor Material</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl font-bold mt-2">Daftar Vendor Material</h1>
                <p className="text-muted-foreground">
                    Manajemen data vendor untuk pengadaan barang (PR/PO)
                </p>
            </div>

            <VendorMaterialTable />
        </div>
    );
}
