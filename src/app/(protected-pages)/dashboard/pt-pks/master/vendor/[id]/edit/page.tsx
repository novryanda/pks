import { VendorForm } from "@/components/dashboard/pt-pks/vendor/vendor-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { notFound } from "next/navigation";
import { db } from "@/server/db";

async function getVendor(id: string) {
  try {
    return await db.vendor.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getVendor(id);

  return {
    title: vendor ? `Edit ${vendor.name} | PT PKS` : "Vendor Tidak Ditemukan",
    description: vendor ? `Edit vendor ${vendor.name}` : "Vendor tidak ditemukan",
  };
}

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getVendor(id);

  if (!vendor) {
    notFound();
  }

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
              <BreadcrumbLink href="/dashboard/pt-pks/master/vendor">
                Vendor
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/pt-pks/master/vendor/${vendor.id}`}>
                {vendor.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold mt-2">Edit Vendor</h1>
        <p className="text-muted-foreground">Edit data vendor {vendor.name}</p>
      </div>

      <VendorForm
        mode="edit"
        initialData={{
          ...vendor,
          email: vendor.email || undefined,
          npwp: vendor.npwp || undefined,
          bankName: vendor.bankName || undefined,
          accountNumber: vendor.accountNumber || undefined,
          accountName: vendor.accountName || undefined,
        }}
      />
    </div>
  );
}
