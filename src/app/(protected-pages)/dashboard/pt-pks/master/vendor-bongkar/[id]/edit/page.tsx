import { VendorBongkarForm } from "@/components/dashboard/pt-pks/vendor-bongkar/vendor-bongkar-form";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { db } from "@/server/db";
import { notFound } from "next/navigation";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function EditVendorBongkarPage({ params }: PageProps) {
    const { id } = await params;

    const vendor = await db.vendorBongkar.findUnique({
        where: { id },
    });

    if (!vendor) {
        notFound();
    }

    const initialData = {
        id: vendor.id,
        code: vendor.code,
        name: vendor.name,
        contactPerson: vendor.contactPerson,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        tipe: vendor.tipe as "SPSI" | "SPLO",
        bankAccounts: vendor.bankAccounts as { bankName: string; accountNumber: string; accountName: string; isDefault?: boolean }[] | null,
        status: vendor.status,
    };

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/pt-pks">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/pt-pks/master/vendor-bongkar">
                            Vendor Bongkar
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/dashboard/pt-pks/master/vendor-bongkar/${id}`}>
                            {vendor.name}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Edit</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <VendorBongkarForm mode="edit" initialData={initialData} />
        </div>
    );
}
