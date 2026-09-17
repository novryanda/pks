"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Beaker, Printer, CheckCircle, FileText, Scale } from "lucide-react";
import { MutuWizard, type PendingMutuPengiriman } from "./mutu-wizard";

// Type untuk pengiriman yang sudah selesai (COMPLETED)
type CompletedMutuPengiriman = PendingMutuPengiriman & {
  mutuCustomFields: { fieldName: string; fieldValue: string }[] | null;
  buyer?: {
    name: string;
    code: string;
  };
  contract?: {
    contractNumber: string;
  };
  contractItem?: {
    material: {
      name: string;
      code: string;
    };
  };
};

type PendingMutuListProps = {
  onRefresh?: () => void;
};

export function PendingMutuList({ onRefresh }: PendingMutuListProps) {
  const [pengirimanList, setPengirimanList] = useState<PendingMutuPengiriman[]>([]);
  const [completedList, setCompletedList] = useState<CompletedMutuPengiriman[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPengiriman, setSelectedPengiriman] = useState<PendingMutuPengiriman | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending mutu
      const res = await fetch("/api/pt-pks/pengiriman-product/pending-mutu");
      if (res.ok) {
        const result = await res.json();
        setPengirimanList(Array.isArray(result) ? result : []);
      } else {
        console.error("Failed to fetch pending mutu");
        setPengirimanList([]);
      }

      // Fetch completed mutu (untuk cetak surat pengantar)
      const resCompleted = await fetch("/api/pt-pks/pengiriman-product/completed-mutu");
      if (resCompleted.ok) {
        const resultCompleted = await resCompleted.json();
        setCompletedList(Array.isArray(resultCompleted) ? resultCompleted : []);
      } else {
        setCompletedList([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setPengirimanList([]);
      setCompletedList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
    onRefresh?.();
  };

  const handleSelect = (pengiriman: PendingMutuPengiriman) => {
    setSelectedPengiriman(pengiriman);
  };

  const handleWizardSuccess = () => {
    setSelectedPengiriman(null);
    handleRefresh();
  };

  const handleWizardCancel = () => {
    setSelectedPengiriman(null);
  };

  const handlePrintSuratPengantar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/pt-pks/pengiriman-product/${id}/surat-pengantar`, "_blank");
  };

  // Show wizard if a pengiriman is selected
  if (selectedPengiriman) {
    return (
      <MutuWizard
        pengiriman={selectedPengiriman}
        onSuccess={handleWizardSuccess}
        onCancel={handleWizardCancel}
      />
    );
  }

  if (loading) {
    return <div className="flex justify-center p-8">Memuat data...</div>;
  }

  // Tampilkan list kosong jika tidak ada data pending maupun completed
  if (pengirimanList.length === 0 && completedList.length === 0) {
    return (
      <div className="text-center py-12">
        <Beaker className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Tidak Ada Pengiriman</h3>
        <p className="text-muted-foreground mb-4">
          Belum ada pengiriman yang menunggu atau sudah selesai input mutu hari ini.
        </p>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section: Pengiriman Menunggu Input Mutu */}
      {pengirimanList.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Daftar Pengiriman Menunggu Input Mutu</h3>
              <p className="text-sm text-muted-foreground">
                {pengirimanList.length} pengiriman menunggu input mutu kernel
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pengirimanList.map((pengiriman) => (
              <div
                key={pengiriman.id}
                className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleSelect(pengiriman)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{pengiriman.nomorPengiriman}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(pengiriman.tanggalPengiriman).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                    Menunggu Mutu
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
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

                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Timbang Gross:</span>
                    <span className="font-medium">
                      {pengiriman.waktuTimbangGross
                        ? new Date(pengiriman.waktuTimbangGross).toLocaleString("id-ID")
                        : "-"}
                    </span>
                  </div>
                </div>

                <Button className="w-full mt-3" size="sm">
                  <Beaker className="mr-2 h-4 w-4" />
                  Input Mutu
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section: Pengiriman Sudah Selesai (Cetak Surat Pengantar) */}
      {completedList.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Pengiriman Selesai Hari Ini
              </h3>
              <p className="text-sm text-muted-foreground">
                Cetak surat pengantar untuk pengiriman yang sudah selesai
              </p>
            </div>
            {pengirimanList.length === 0 && (
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {completedList.map((pengiriman) => (
              <div
                key={pengiriman.id}
                className="border rounded-lg p-4 border-green-200 bg-green-50/50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{pengiriman.nomorPengiriman}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(pengiriman.tanggalPengiriman).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    Selesai
                  </Badge>
                </div>

                {/* Info Buyer & Kontrak */}
                {pengiriman.buyer && pengiriman.contract && (
                  <div className="bg-white/80 p-2 rounded mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{pengiriman.buyer.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pengiriman.contract.contractNumber} - {pengiriman.contractItem?.material.name || "N/A"}
                    </div>
                  </div>
                )}

                {/* Berat */}
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <span>Berat Netto:</span>
                  <span className="font-bold text-green-600">{(pengiriman.beratNetto || 0).toLocaleString()} kg</span>
                </div>

                {/* Mutu */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm bg-white/80 p-2 rounded mb-3">
                  {pengiriman.mutuCustomFields && pengiriman.mutuCustomFields.length > 0 ? (
                    pengiriman.mutuCustomFields.map((field: { fieldName: string; fieldValue: string }, idx: number) => (
                      <div key={idx} className="border-r last:border-0 pr-2">
                        <div className="text-muted-foreground text-xs">{field.fieldName}</div>
                        <div className="font-semibold">{field.fieldValue}</div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-muted-foreground text-xs py-1">
                      Data mutu tidak tersedia
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="sm"
                  variant="outline"
                  onClick={(e) => handlePrintSuratPengantar(pengiriman.id, e)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak Surat Pengantar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
