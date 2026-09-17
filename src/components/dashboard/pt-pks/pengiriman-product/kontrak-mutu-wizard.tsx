"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { KontrakMutuStep1 } from "./kontrak-mutu-step1";
import { InlineContractForm } from "./inline-contract-form";

// Types untuk data pengiriman yang menunggu pilih kontrak
export type PendingKontrakPengiriman = {
  id: string;
  nomorPengiriman: string;
  noSegel: string;
  tanggalPengiriman: string;
  operatorPenimbang: string;
  beratTarra: number;
  waktuTimbangTarra: string;
  metodeTarra: string;
  beratGross: number | null;
  waktuTimbangGross: string | null;
  metodeGross: string;
  beratNetto: number | null;
  materialId: string | null;
  material?: {
    id: string;
    name: string;
    code: string;
    kategori?: {
      name: string;
    };
    satuan?: {
      name: string;
      symbol: string;
    };
  } | null;
  mutuCustomFields: { fieldName: string; fieldValue: string }[] | null;
  status: string;
  vendorVehicleId: string;
  vendorVehicle: {
    nomorKendaraan: string;
    namaSupir: string;
    vendor: {
      name: string;
    };
  };
};

// Types untuk form kontrak
export type KontrakMutuFormData = {
  // Pilih Kontrak
  buyerId: string;
  contractId: string;
  contractItemId: string;

  // Mutu Kernel (sudah diisi sebelumnya, hanya untuk display)
  mutuCustomFields: { fieldName: string; fieldValue: string }[] | null;

  // Split Contract (optional)
  isSplit?: boolean;
  splitContractId?: string;
  splitContractItemId?: string;
};

type KontrakMutuWizardProps = {
  pengiriman: PendingKontrakPengiriman;
  onSuccess?: () => void;
  onCancel?: () => void;
  onDeleted?: () => void;
};

export function KontrakMutuWizard({ pengiriman, onSuccess, onCancel, onDeleted }: KontrakMutuWizardProps) {
  const [formData, setFormData] = useState<Partial<KontrakMutuFormData>>({
    mutuCustomFields: (pengiriman as any).mutuCustomFields || [],
    isSplit: false,
    splitContractId: "",
    splitContractItemId: "",
  });
  const [loading, setLoading] = useState(false);
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [selectedBuyerIdForNewContract, setSelectedBuyerIdForNewContract] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { hasActionAccess } = useUserPermissions();
  const canDeletePengiriman = hasActionAccess("pemasaran.pengirimanProduct", "delete");

  const updateFormData = (data: Partial<KontrakMutuFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleCreateContract = (buyerId: string) => {
    setSelectedBuyerIdForNewContract(buyerId);
    setShowCreateContract(true);
  };

  const handleContractCreated = (contractId: string, contractItemId: string) => {
    // Auto-select the newly created contract
    setFormData((prev) => ({
      ...prev,
      contractId,
      contractItemId,
    }));
    setShowCreateContract(false);
    setSelectedBuyerIdForNewContract(null);
  };

  // Submit: Simpan kontrak (status: COMPLETED)
  const handleSubmit = async () => {
    if (!formData.buyerId || !formData.contractId || !formData.contractItemId) {
      alert("Buyer, kontrak, dan item kontrak harus dipilih");
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        id: pengiriman.id,
        buyerId: formData.buyerId,
        contractId: formData.contractId,
        contractItemId: formData.contractItemId,
        // Split data
        isSplit: formData.isSplit,
        splitContractId: formData.splitContractId,
        splitContractItemId: formData.splitContractItemId,
      };

      console.log("Submitting kontrak data:", submitData);

      const res = await fetch("/api/pt-pks/pengiriman-product/update-kontrak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        alert(`Pengiriman ${pengiriman.nomorPengiriman} berhasil diselesaikan!\nStock material telah dikurangi.`);
        onSuccess?.();
      } else {
        const error = await res.json();
        alert(error.error || error.message || "Gagal menyimpan data");
      }
    } catch (error) {
      console.error("Error submitting kontrak:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pt-pks/pengiriman-product/${pengiriman.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert(`Pengiriman ${pengiriman.nomorPengiriman} berhasil dibatalkan dan dihapus.`);
        setDeleteDialogOpen(false);
        onDeleted?.();
        return;
      }

      const error = await res.json();
      alert(error.error || error.message || "Gagal membatalkan pengiriman");
    } catch (error) {
      console.error("Error deleting pengiriman:", error);
      alert("Terjadi kesalahan saat membatalkan pengiriman");
    } finally {
      setDeleting(false);
    }
  };

  // Show inline contract form
  if (showCreateContract && selectedBuyerIdForNewContract) {
    return (
      <InlineContractForm
        buyerId={selectedBuyerIdForNewContract}
        onSuccess={handleContractCreated}
        onCancel={() => {
          setShowCreateContract(false);
          setSelectedBuyerIdForNewContract(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info Pengiriman */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-2">
          Pilih Kontrak: {pengiriman.nomorPengiriman}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Kendaraan:</span>
            <p className="font-medium">{pengiriman.vendorVehicle.nomorKendaraan}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Supir:</span>
            <p className="font-medium">{pengiriman.vendorVehicle.namaSupir}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Vendor:</span>
            <p className="font-medium">{pengiriman.vendorVehicle.vendor.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Berat Netto:</span>
            <p className="font-bold text-green-600">{(pengiriman.beratNetto || 0).toLocaleString()} kg</p>
          </div>
        </div>
      </div>

      {/* Info Mutu Kernel yang sudah diinput */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">📊 Data Mutu Kernel</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {pengiriman.mutuCustomFields && (pengiriman.mutuCustomFields as any).length > 0 ? (
            (pengiriman.mutuCustomFields as any).map((field: { fieldName: string; fieldValue: string }, idx: number) => (
              <div key={idx} className="text-center p-2 bg-white/60 rounded-lg border border-amber-100">
                <div className="text-muted-foreground text-xs">{field.fieldName}</div>
                <div className="text-xl font-bold text-amber-700">
                  {field.fieldValue}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-2 italic">
              Data mutu tidak tersedia
            </div>
          )}
        </div>
      </div>

      {/* Form Pilih Kontrak */}
      <div className="border rounded-lg p-6">
        <KontrakMutuStep1
          data={formData}
          pengiriman={pengiriman}
          onUpdate={updateFormData}
          onNext={handleSubmit}
          onBack={() => onCancel?.()}
          onCreateContract={handleCreateContract}
          loading={loading}
          submitLabel="Selesaikan Pengiriman"
        />
      </div>

      {canDeletePengiriman && (
        <>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={loading || deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Batalkan Pengiriman
            </Button>
          </div>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Batalkan pengiriman ini?</AlertDialogTitle>
                <AlertDialogDescription>
                  Pengiriman <strong>{pengiriman.nomorPengiriman}</strong> akan dihapus dari tahap pilih kontrak.
                  Tindakan ini tidak bisa dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Kembali</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault();
                    void handleDelete();
                  }}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Membatalkan...
                    </>
                  ) : (
                    "Ya, Batalkan"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
