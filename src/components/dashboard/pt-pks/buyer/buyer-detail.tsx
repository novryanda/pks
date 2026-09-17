"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Pencil, FileText } from "lucide-react";

type Buyer = {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string | null;
  phone: string;
  address: string;
  npwp: string | null;
  taxStatus: string;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  status: string;
  createdAt: Date;
  _count: {
    contracts: number;
  };
  contracts?: Array<{
    id: string;
    contractNumber: string;
    deliveryDate: Date | null;
    status: string;
    totalAmount: number;
  }>;
};

const taxStatusLabels: Record<string, string> = {
  NON_PKP: "Non PKP (0%)",
  PKP_11: "PKP 11%",
  PKP_1_1: "PKP 1.1%",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" }> = {
  ACTIVE: { label: "Aktif", variant: "default" },
  INACTIVE: { label: "Tidak Aktif", variant: "secondary" },
};

export function BuyerDetail({ buyer }: { buyer: Buyer }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{buyer.name}</h2>
          <p className="text-muted-foreground">{buyer.code}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/pt-pks/master/buyer/${buyer.id}/edit`)
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={() =>
              router.push(`/dashboard/pt-pks/master/buyer/${buyer.id}/contracts`)
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Lihat Kontrak ({buyer._count.contracts})
          </Button>
        </div>
      </div>

      {/* Informasi Umum */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Umum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Kode Buyer</p>
              <p className="font-medium">{buyer.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nama Buyer</p>
              <p className="font-medium">{buyer.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium">{buyer.contactPerson}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nomor Telepon</p>
              <p className="font-medium">{buyer.phone}</p>
            </div>
          </div>

          {buyer.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{buyer.email}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Alamat</p>
            <p className="font-medium">{buyer.address}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={statusLabels[buyer.status]?.variant || "default"}>
              {statusLabels[buyer.status]?.label || buyer.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Informasi Pajak */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pajak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">NPWP</p>
              <p className="font-medium">{buyer.npwp || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status Pajak</p>
              <Badge variant="outline">
                {taxStatusLabels[buyer.taxStatus] || buyer.taxStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informasi Rekening */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Rekening</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nama Bank</p>
              <p className="font-medium">{buyer.bankName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nomor Rekening</p>
              <p className="font-medium">{buyer.accountNumber || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Nama Pemilik Rekening
              </p>
              <p className="font-medium">{buyer.accountName || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Contracts */}
      {buyer.contracts && buyer.contracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kontrak Terbaru</CardTitle>
            <CardDescription>5 kontrak terakhir dari buyer ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {buyer.contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{contract.contractNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      Pengiriman:{" "}
                      {contract.deliveryDate ? new Date(contract.deliveryDate).toLocaleDateString("id-ID") : "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      Rp {contract.totalAmount.toLocaleString("id-ID")}
                    </p>
                    <Badge variant="outline">{contract.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
