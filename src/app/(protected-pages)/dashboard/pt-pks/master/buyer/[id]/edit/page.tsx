import { BuyerForm } from "@/components/dashboard/pt-pks/buyer/buyer-form";
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

async function getBuyer(id: string) {
  try {
    return await db.buyer.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching buyer:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getBuyer(id);

  return {
    title: buyer ? `Edit ${buyer.name} | PT PKS` : "Buyer Tidak Ditemukan",
    description: buyer ? `Edit buyer ${buyer.name}` : "Buyer tidak ditemukan",
  };
}

export default async function EditBuyerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const buyer = await getBuyer(id);

  if (!buyer) {
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
              <BreadcrumbLink href="/dashboard/pt-pks/master/buyer">
                Buyer
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/pt-pks/master/buyer/${buyer.id}`}>
                {buyer.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold mt-2">Edit Buyer</h1>
        <p className="text-muted-foreground">Edit data buyer {buyer.name}</p>
      </div>

      <BuyerForm
        mode="edit"
        initialData={{
          ...buyer,
          email: buyer.email || undefined,
          npwp: buyer.npwp || undefined,
          bankName: buyer.bankName || undefined,
          accountNumber: buyer.accountNumber || undefined,
          accountName: buyer.accountName || undefined,
        }}
      />
    </div>
  );
}
