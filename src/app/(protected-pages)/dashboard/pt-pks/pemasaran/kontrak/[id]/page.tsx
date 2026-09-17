import { ContractDetail } from "@/components/dashboard/pt-pks/buyer/contract-detail";
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
      ? `Kontrak ${contract.contractNumber} | Pemasaran PT PKS`
      : "Kontrak Tidak Ditemukan",
    description: contract
      ? `Detail kontrak ${contract.contractNumber} dengan ${contract.buyer.name}`
      : "Kontrak tidak ditemukan",
  };
}

export default async function KontrakDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);

  if (!contract) {
    notFound();
  }

  // Transform contract to match Contract type exactly (especially attachments)
  let fixedContract = null;
  if (contract) {
    let parsedAttachments: { fileName: string; originalName: string; path: string; size: number; mimeType: string; uploadedAt: string; }[] | null = null;
    const att = contract.attachments;
    if (Array.isArray(att)) {
      parsedAttachments = att as any;
    } else if (typeof att === "string") {
      try {
        const parsed = JSON.parse(att);
        parsedAttachments = Array.isArray(parsed) ? parsed : null;
      } catch {
        parsedAttachments = null;
      }
    } else {
      parsedAttachments = null;
    }
    fixedContract = {
      id: contract.id,
      contractNumber: contract.contractNumber,
      contractDate: contract.contractDate,
      startDate: contract.startDate,
      endDate: contract.endDate,
      deliveryDate: contract.deliveryDate,
      deliveryAddress: contract.deliveryAddress,
      notes: contract.notes,
      status: contract.status,
      subtotal: contract.subtotal,
      taxAmount: contract.taxAmount,
      totalAmount: contract.totalAmount,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      buyer: contract.buyer,
      company: contract.company,
      contractItems: contract.contractItems,
      attachments: parsedAttachments,
    };
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
              <BreadcrumbLink href="/dashboard/pt-pks/pemasaran">Pemasaran</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/pt-pks/pemasaran/kontrak">Kontrak</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{contract.contractNumber}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-4 mt-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/pt-pks/pemasaran/kontrak">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detail Kontrak</h1>
            <p className="text-muted-foreground">
              Informasi lengkap kontrak penjualan
            </p>
          </div>
        </div>
      </div>

      {fixedContract && <ContractDetail contract={fixedContract} basePath="/dashboard/pt-pks/pemasaran/kontrak" />}
    </div>
  );
}
