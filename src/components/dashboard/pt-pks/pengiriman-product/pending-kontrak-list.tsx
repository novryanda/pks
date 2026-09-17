"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { RefreshCw, FileText, Truck, Clock, Scale, Pencil, Trash2, Loader2 } from "lucide-react";
import { KontrakMutuWizard, type PendingKontrakPengiriman } from "./kontrak-mutu-wizard";
import { EditPengirimanForm } from "./edit-pengiriman-form";

type PendingKontrakListProps = {
  onRefresh?: () => void;
};

export function PendingKontrakList({ onRefresh }: PendingKontrakListProps) {
  const [pengirimanList, setPengirimanList] = useState<PendingKontrakPengiriman[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPengiriman, setSelectedPengiriman] = useState<PendingKontrakPengiriman | null>(null);
  const [editingPengiriman, setEditingPengiriman] = useState<PendingKontrakPengiriman | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PendingKontrakPengiriman | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { hasActionAccess } = useUserPermissions();
  const canDeletePengiriman = hasActionAccess("pemasaran.pengirimanProduct", "delete");

  const fetchPendingKontrak = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pt-pks/pengiriman-product/pending-kontrak");
      if (res.ok) {
        const result = await res.json();
        setPengirimanList(Array.isArray(result) ? result : []);
      } else {
        console.error("Failed to fetch pending kontrak");
        setPengirimanList([]);
      }
    } catch (error) {
      console.error("Error fetching pending kontrak:", error);
      setPengirimanList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingKontrak();
  }, []);

  const handleRefresh = () => {
    fetchPendingKontrak();
    onRefresh?.();
  };

  const handleWizardSuccess = () => {
    setSelectedPengiriman(null);
    handleRefresh();
  };

  const handleWizardCancel = () => {
    setSelectedPengiriman(null);
  };

  const handleWizardDeleted = () => {
    setSelectedPengiriman(null);
    handleRefresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/pt-pks/pengiriman-product/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert(`Pengiriman ${deleteTarget.nomorPengiriman} berhasil dibatalkan dan dihapus.`);
        setDeleteTarget(null);
        handleRefresh();
        return;
      }

      const error = await res.json();
      alert(error.error || error.message || "Gagal membatalkan pengiriman");
    } catch (error) {
      console.error("Error deleting pengiriman:", error);
      alert("Terjadi kesalahan saat membatalkan pengiriman");
    } finally {
      setDeletingId(null);
    }
  };

  // Show edit form if an editing pengiriman is selected
  if (editingPengiriman) {
    return (
      <EditPengirimanForm
        pengiriman={editingPengiriman}
        onSuccess={() => {
          setEditingPengiriman(null);
          handleRefresh();
        }}
        onCancel={() => setEditingPengiriman(null)}
      />
    );
  }

  // Show wizard if a pengiriman is selected
  if (selectedPengiriman) {
    return (
      <KontrakMutuWizard
        pengiriman={selectedPengiriman}
        onSuccess={handleWizardSuccess}
        onCancel={handleWizardCancel}
        onDeleted={handleWizardDeleted}
      />
    );
  }

  if (loading) {
    return <div className="flex justify-center p-8">Memuat data...</div>;
  }

  if (pengirimanList.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Tidak Ada Pengiriman Menunggu</h3>
        <p className="text-muted-foreground mb-4">
          Belum ada pengiriman yang menunggu pemilihan kontrak.
        </p>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Menunggu Pilih Kontrak</h3>
          <p className="text-sm text-muted-foreground">
            Klik pada item untuk memilih kontrak buyer
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pengirimanList.map((pengiriman) => (
          <Card key={pengiriman.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">
                  {pengiriman.nomorPengiriman}
                </CardTitle>
                <Badge variant="outline">
                  Menunggu Kontrak
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{pengiriman.vendorVehicle.nomorKendaraan}</span>
                <span className="text-muted-foreground">-</span>
                <span>{pengiriman.vendorVehicle.namaSupir}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">Tarra</div>
                  <div className="font-semibold">{pengiriman.beratTarra.toLocaleString()} kg</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">Gross</div>
                  <div className="font-semibold">{(pengiriman.beratGross || 0).toLocaleString()} kg</div>
                </div>
                <div className="text-center p-2 bg-green-100 rounded">
                  <div className="text-xs text-muted-foreground">Netto</div>
                  <div className="font-bold text-green-600">{(pengiriman.beratNetto || 0).toLocaleString()} kg</div>
                </div>
              </div>

              {/* Data Mutu yang sudah diinput (Custom Fields) */}
              {pengiriman.mutuCustomFields && pengiriman.mutuCustomFields.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {pengiriman.mutuCustomFields.map((field, idx) => (
                    <div key={idx} className="text-center p-2 bg-amber-50 rounded border border-amber-100">
                      <div className="text-xs text-muted-foreground">{field.fieldName}</div>
                      <div className="font-semibold text-amber-700">{field.fieldValue}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {new Date(pengiriman.tanggalPengiriman).toLocaleDateString("id-ID")}
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                Vendor: {pengiriman.vendorVehicle.vendor.name}
              </div>

              <div className="flex gap-2 mt-2">
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={() => setSelectedPengiriman(pengiriman)}
                >
                  Pilih Kontrak
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPengiriman(pengiriman)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {canDeletePengiriman && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(pengiriman)}
                    disabled={deletingId === pengiriman.id}
                  >
                    {deletingId === pengiriman.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan pengiriman ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengiriman <strong>{deleteTarget?.nomorPengiriman}</strong> akan dihapus dari daftar menunggu pilih kontrak.
              Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? (
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
    </div>
  );
}
