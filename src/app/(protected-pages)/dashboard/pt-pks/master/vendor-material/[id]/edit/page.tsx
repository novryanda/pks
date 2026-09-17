import { VendorMaterialForm } from "@/components/dashboard/pt-pks/vendor-material/vendor-material-form";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Props {
    params: Promise<{
        id: string;
    }>;
}

async function getVendorMaterial(id: string) {
    try {
        return await db.vendorMaterial.findUnique({
            where: { id },
        });
    } catch (error) {
        console.error("Error fetching vendor material:", error);
        return null;
    }
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const vendor = await getVendorMaterial(id);
    return {
        title: vendor ? `Edit ${vendor.name} | PT PKS` : "Vendor Material Tidak Ditemukan",
        description: vendor ? `Edit vendor material ${vendor.name}` : "Vendor material tidak ditemukan",
    };
}

export default async function EditVendorMaterialPage({ params }: Props) {
    const { id } = await params;
    const vendor = await getVendorMaterial(id);

    if (!vendor) {
        notFound();
    }

    return (
        <div className="space-y-6">
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
                        <BreadcrumbLink href="/dashboard/pt-pks/master/vendor-material">
                            Vendor Material
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/dashboard/pt-pks/master/vendor-material/${id}`}>
                            {vendor.code}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Edit</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <VendorMaterialForm mode="edit" initialData={vendor} />
        </div>
    );
}
