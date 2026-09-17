import { ContractTable } from "@/components/dashboard/pt-pks/buyer/contract-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
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
    title: buyer
      ? `Kontrak ${buyer.name} | PT PKS`
      : "Buyer Tidak Ditemukan",
    description: buyer
      ? `Daftar kontrak buyer ${buyer.name}`
      : "Buyer tidak ditemukan",
  };
}

export default async function BuyerContractsPage({
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
              <BreadcrumbPage>Kontrak</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex justify-between items-center mt-2">
          <div>
            <h1 className="text-3xl font-bold">Kontrak {buyer.name}</h1>
            <p className="text-muted-foreground">
              Daftar kontrak pembelian dari buyer ini
            </p>
          </div>
          <Link href={`/dashboard/pt-pks/master/buyer/${buyer.id}/contracts/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Buat Kontrak Baru
            </Button>
          </Link>
        </div>
      </div>

      <ContractTable buyerId={buyer.id} />
    </div>
  );
}
