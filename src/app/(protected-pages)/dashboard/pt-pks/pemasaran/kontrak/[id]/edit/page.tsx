import { ContractForm } from "@/components/dashboard/pt-pks/buyer/contract-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";

async function getContract(id: string) {
  try {
    return await db.contract.findUnique({
      where: { id },
      include: {
        buyer: true,
        company: true,
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching contract:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);

  return {
    title: contract
      ? `Edit Kontrak ${contract.contractNumber} | Pemasaran PT PKS`
      : "Kontrak Tidak Ditemukan",
    description: contract
      ? `Edit kontrak ${contract.contractNumber}`
      : "Kontrak tidak ditemukan",
  };
}

export default async function EditKontrakPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);

  if (!contract) {
    notFound();
  }

  // Transform contract data for form
  const initialData = {
    id: contract.id,
    buyerId: contract.buyer.id,
    contractNumber: contract.contractNumber,
    contractDate: contract.contractDate,
    startDate: contract.startDate,
    endDate: contract.endDate,
    deliveryDate: contract.deliveryDate,
    deliveryAddress: contract.deliveryAddress,
    notes: contract.notes,
    status: contract.status,
    paymentMethod: contract.paymentMethod,
    paidAmount: contract.paidAmount,
    customFields: contract.customFields,
    attachments: contract.attachments,
    contractItems: contract.contractItems.map((item) => ({
      contractItemId: item.id,
      materialId: item.material.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      notes: item.notes,
      deliveredQuantity: item.deliveredQuantity,
    })),
  };

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
              <BreadcrumbLink href="/dashboard/pt-pks/pemasaran/kontrak">Kontrak</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/pt-pks/pemasaran/kontrak/${contract.id}`}>
                {contract.contractNumber}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-4 mt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/pt-pks/pemasaran/kontrak/${contract.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Kontrak</h1>
            <p className="text-muted-foreground">
              Edit kontrak {contract.contractNumber}
            </p>
          </div>
        </div>
      </div>

      <ContractForm initialData={initialData} mode="edit" />
    </div>
  );
}
