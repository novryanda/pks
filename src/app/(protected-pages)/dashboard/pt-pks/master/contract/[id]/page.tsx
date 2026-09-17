import { ContractDetail } from "@/components/dashboard/pt-pks/buyer/contract-detail";
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
      ? `Kontrak ${contract.contractNumber} | PT PKS`
      : "Kontrak Tidak Ditemukan",
    description: contract
      ? `Detail kontrak ${contract.contractNumber} dengan ${contract.buyer.name}`
      : "Kontrak tidak ditemukan",
  };
}

export default async function ContractDetailPage({
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
              <BreadcrumbLink href="/dashboard/pt-pks/master/buyer">
                Buyer
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/pt-pks/master/buyer/${contract.buyer.id}`}>
                {contract.buyer.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/pt-pks/master/buyer/${contract.buyer.id}/contracts`}>
                Kontrak
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{contract.contractNumber}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-2">
          <h1 className="text-3xl font-bold">Detail Kontrak</h1>
          <p className="text-muted-foreground">
            Informasi lengkap kontrak pembelian
          </p>
        </div>
      </div>

      {fixedContract && <ContractDetail contract={fixedContract} />}
    </div>
  );
}
