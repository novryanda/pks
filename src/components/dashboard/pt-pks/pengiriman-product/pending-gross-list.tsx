"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Scale, Truck, Clock, Printer, CheckCircle } from "lucide-react";
import { GrossWizard, type PendingGrossPengiriman } from "./gross-wizard";

// Type untuk pengiriman yang sudah selesai timbang gross
type CompletedGrossPengiriman = PendingGrossPengiriman & {
  beratGross: number;
  beratNetto: number;
  waktuTimbangGross: string;
  metodeGross: string;
};

type PendingGrossListProps = {
  onRefresh?: () => void;
};

export function PendingGrossList({ onRefresh }: PendingGrossListProps) {
  const [pengirimanList, setPengirimanList] = useState<PendingGrossPengiriman[]>([]);
  const [completedList, setCompletedList] = useState<CompletedGrossPengiriman[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPengiriman, setSelectedPengiriman] = useState<PendingGrossPengiriman | null>(null);

  const fetchPendingGross = async () => {
    setLoading(true);
    try {
      // Fetch pending gross
      const res = await fetch("/api/pt-pks/pengiriman-product/pending-gross");
      if (res.ok) {
        const result = await res.json();
        setPengirimanList(Array.isArray(result) ? result : []);
      } else {
        console.error("Failed to fetch pending gross");
        setPengirimanList([]);
      }

      // Fetch completed gross (untuk cetak tiket)
      const resCompleted = await fetch("/api/pt-pks/pengiriman-product/completed-gross");
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
    fetchPendingGross();
  }, []);

  const handleRefresh = () => {
    fetchPendingGross();
    onRefresh?.();
  };

  const handleSelect = (pengiriman: PendingGrossPengiriman) => {
    setSelectedPengiriman(pengiriman);
  };

  const handleWizardSuccess = () => {
    setSelectedPengiriman(null);
    handleRefresh();
  };

  const handleWizardCancel = () => {
    setSelectedPengiriman(null);
  };

  const handlePrintTiketTimbangan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/pt-pks/pengiriman-product/${id}/tiket-timbangan`, "_blank");
  };

  // Show wizard if a pengiriman is selected
  if (selectedPengiriman) {
    return (
      <GrossWizard
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
        <Scale className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Tidak Ada Pengiriman</h3>
        <p className="text-muted-foreground mb-4">
          Belum ada kendaraan yang menunggu atau sudah selesai timbang gross hari ini.
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
      {/* Section: Pengiriman Menunggu Timbang Gross */}
      {pengirimanList.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Menunggu Timbang Gross</h3>
              <p className="text-sm text-muted-foreground">
                Klik pada item untuk melanjutkan proses timbang gross
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pengirimanList.map((pengiriman) => (
              <Card
                key={pengiriman.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelect(pengiriman)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">
                      {pengiriman.nomorPengiriman}
                    </CardTitle>
                    <Badge variant="secondary">
                      Menunggu Gross
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
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <span>Berat Tarra:</span>
                    <span className="font-semibold">{pengiriman.beratTarra.toLocaleString()} kg</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(pengiriman.waktuTimbangTarra).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Vendor: {pengiriman.vendorVehicle.vendor.name}
                  </div>

                  <Button className="w-full mt-2" size="sm">
                    Lanjut Timbang Gross
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Section: Pengiriman Sudah Selesai Timbang Gross (Cetak Tiket) */}
      {completedList.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Selesai Timbang Gross Hari Ini
              </h3>
              <p className="text-sm text-muted-foreground">
                Cetak tiket timbangan untuk pengiriman yang sudah selesai
              </p>
            </div>
            {pengirimanList.length === 0 && (
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {completedList.map((pengiriman) => (
              <Card key={pengiriman.id} className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">
                      {pengiriman.nomorPengiriman}
                    </CardTitle>
                    <Badge variant="default" className="bg-green-500">
                      Selesai
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
                  
                  <div className="grid grid-cols-3 gap-2 text-sm bg-white/80 p-2 rounded">
                    <div>
                      <div className="text-muted-foreground text-xs">Tarra</div>
                      <div className="font-semibold">{pengiriman.beratTarra.toLocaleString()} kg</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Gross</div>
                      <div className="font-semibold">{pengiriman.beratGross.toLocaleString()} kg</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Netto</div>
                      <div className="font-semibold text-green-600">{pengiriman.beratNetto.toLocaleString()} kg</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(pengiriman.waktuTimbangGross).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <Button 
                    className="w-full mt-2" 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => handlePrintTiketTimbangan(pengiriman.id, e)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Tiket Timbangan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
