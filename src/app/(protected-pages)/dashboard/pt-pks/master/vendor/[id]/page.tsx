import { VendorDetail } from "@/components/dashboard/pt-pks/vendor/vendor-detail";
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
      include: {
        vehicles: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { vehicles: true },
        },
      },
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
    title: vendor ? `${vendor.name} | PT PKS` : "Vendor Tidak Ditemukan",
    description: vendor ? `Detail vendor ${vendor.name}` : "Vendor tidak ditemukan",
  };
}

export default async function VendorDetailPage({
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
              <BreadcrumbPage>Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <VendorDetail vendor={vendor} />
    </div>
  );
}
