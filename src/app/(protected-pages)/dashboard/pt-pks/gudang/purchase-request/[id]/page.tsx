"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleAccessGuard } from "@/components/dashboard/module-access-guard";
import { PurchaseRequestDetail } from "@/components/dashboard/pt-pks/purchase-request/purchase-request-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  tipePembelian: string;
  divisi?: string;
  requestedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  vendorNameDirect?: string;
  vendorAddressDirect?: string;
  vendorPhoneDirect?: string;
  status: string;
  keterangan?: string;
  items: Array<{
    id: string;
    jumlahRequest: number;
    estimasiHarga: number;
    keterangan?: string;
    material: {
      id: string;
      partNumber: string;
      namaMaterial: string;
      spesifikasi?: string | null;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

type PurchaseRequestResponse = PurchaseRequest;

export default function PurchaseRequestDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { id } = use(params);
  const [purchaseRequest, setPurchaseRequest] = useState<PurchaseRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPurchaseRequest = useCallback(async () => {
    try {
      const response = await fetch(`/api/pt-pks/purchase-request/${id}`);
      if (response.ok) {
        const data = (await response.json()) as PurchaseRequestResponse;
        setPurchaseRequest(data);
      } else {
        toast.error("Gagal memuat data Purchase Request");
      }
    } catch (error) {
      console.error("Error fetching purchase request:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchPurchaseRequest();
  }, [fetchPurchaseRequest]);

  const handleBack = () => {
    router.push("/dashboard/pt-pks/gudang/purchase-request");
  };

  const handleSuccess = () => {
    void fetchPurchaseRequest();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!purchaseRequest) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Purchase Request tidak ditemukan</div>
        <div className="mt-4 text-center">
          <Button onClick={handleBack}>Kembali</Button>
        </div>
      </div>
    );
  }

  return (
    <ModuleAccessGuard module="gudang.purchaseRequest">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar PR
          </Button>
        </div>
        <PurchaseRequestDetail 
          purchaseRequest={purchaseRequest} 
          onClose={handleBack}
          onSuccess={handleSuccess} 
        />
      </div>
    </ModuleAccessGuard>
  );
}
