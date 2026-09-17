"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
import { getJakartaDateKey } from "@/lib/date-time";
import { Plus, Pencil, DollarSign, FileText, History, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TankVisualization } from "./tank-visualization";
import { TankTransactionModal } from "./tank-transaction-modal";
import { CreateTankModal } from "./create-tank-modal";
import { PriceHistoryModal } from "./price-history-modal";
import { NumericInput } from "@/components/ui/numeric-input";
import { DateFilterMode, type DateFilterModeType } from "@/components/ui/date-filter-mode";

interface Material {
  id: string;
  name: string;
  code: string;
  kategori: {
    name: string;
  };
  satuan: {
    symbol: string;
  };
}

interface Tangki {
  id: string;
  namaTangki: string;
  kapasitas: number;
  isiSaatIni: number;
  materialId: string;
  material: Material;
}

export function StockProductList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("all");

  // Filters - Dual Mode
  const today = getJakartaDateKey(new Date()) || "";
  const [filterMode, setFilterMode] = useState<DateFilterModeType>("single");
  const [singleDate, setSingleDate] = useState<string>(today);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  // Get effective dates based on mode
  const effectiveDates = useMemo(() => {
    if (filterMode === "single") {
      return { startDate: singleDate, endDate: singleDate };
    }
    return { startDate, endDate };
  }, [filterMode, singleDate, startDate, endDate]);

  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [stockSummaryData, setStockSummaryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTangki, setSelectedTangki] = useState<any>(null);
  const [editTangkiData, setEditTangkiData] = useState<any>(null);

  // Harga modal states
  const [isHargaModalOpen, setIsHargaModalOpen] = useState(false);
  const [editHargaMaterial, setEditHargaMaterial] = useState<{ id: string; name: string; hargaPerUnit: number } | null>(null);
  const [hargaInput, setHargaInput] = useState<number | null>(0);
  const [isUpdatingHarga, setIsUpdatingHarga] = useState(false);

  // History modal states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryMaterial, setSelectedHistoryMaterial] = useState<{ id: string; name: string; satuan: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    debouncedFetchAll(selectedMaterialId, effectiveDates.startDate, effectiveDates.endDate);

    return () => {
      debouncedFetchAll.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedMaterialId, effectiveDates.startDate, effectiveDates.endDate]);

  const debouncedFetchAll = useMemo(
    () => debounce((materialId: string, start: string, end: string) => {
      fetchAllSummary(materialId, start, end);
      fetchStockHistory(materialId, start, end);
    }, 500),
    []
  );

  // Reset filters
  const resetFilters = () => {
    const todayDate = getJakartaDateKey(new Date()) || "";
    setFilterMode("single");
    setSingleDate(todayDate);
    setStartDate(todayDate);
    setEndDate(todayDate);
  };

  const fetchInitialData = async () => {
    try {
      const res = await fetch("/api/pt-pks/material");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchAllSummary = async (materialId: string, start: string, end: string) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const materialFilter = materialId !== "all" ? `&materialId=${materialId}` : "";
      const url = `/api/pt-pks/stock-product/summary?startDate=${start}&endDate=${end}${materialFilter}`;
      const res = await fetch(url, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        setStockSummaryData(data.materials || []);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Summary fetch aborted');
      } else {
        console.error("Error fetching summary data:", error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const fetchStockHistory = async (materialId: string, start: string, end: string) => {
    try {
      const materialFilter = materialId !== "all" ? `&materialId=${materialId}` : "";
      const url = `/api/pt-pks/stock-product/history?startDate=${start}&endDate=${end}${materialFilter}`;
      // Note: We use the same abort controller logic as in fetchAllSummary if we want to cancel both
      // But fetchAllSummary already handles the ref. For stock history, we can either use the same or a separate one.
      // Since they are called together, using the same one is fine.
      const res = await fetch(url, { signal: abortControllerRef.current?.signal });
      if (res.ok) {
        const data = await res.json();
        setProductionLogs(data);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('History fetch aborted');
      } else {
        console.error("Error fetching stock history:", error);
      }
    }
  };

  const handleTankClick = (tank: any) => {
    setSelectedTangki(tank);
    setIsTransactionModalOpen(true);
  };

  const handleEditTank = (tank: any) => {
    setEditTangkiData({
      id: tank.id,
      namaTangki: tank.namaTangki,
      kapasitas: tank.kapasitas,
      materialId: tank.materialId,
    });
    setIsCreateModalOpen(true);
  };

  const handleDeleteTank = async (tank: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tangki ${tank.namaTangki}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/pt-pks/tangki/${tank.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menghapus tangki");
      }

      fetchAllSummary(selectedMaterialId, effectiveDates.startDate, effectiveDates.endDate);
    } catch (error) {
      console.error("Error deleting tank:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus tangki");
    }
  };

  // Handler untuk modal edit harga
  const openHargaModal = (material: { materialId: string; materialName: string; hargaPerUnit: number }) => {
    setEditHargaMaterial({
      id: material.materialId,
      name: material.materialName,
      hargaPerUnit: material.hargaPerUnit || 0
    });
    setHargaInput(material.hargaPerUnit || 0);
    setIsHargaModalOpen(true);
  };

  const openHistoryModal = (material: { materialId: string; materialName: string; satuan: string }) => {
    setSelectedHistoryMaterial({
      id: material.materialId,
      name: material.materialName,
      satuan: material.satuan
    });
    setIsHistoryModalOpen(true);
  };

  const handleUpdateHarga = async () => {
    if (!editHargaMaterial) return;

    const harga = hargaInput || 0;
    if (harga < 0) {
      alert("Harga tidak boleh negatif");
      return;
    }

    setIsUpdatingHarga(true);
    try {
      const res = await fetch(`/api/pt-pks/material/${editHargaMaterial.id}/harga`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hargaPerUnit: harga }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal update harga");
      }

      setIsHargaModalOpen(false);
      setEditHargaMaterial(null);
      fetchAllSummary(selectedMaterialId, effectiveDates.startDate, effectiveDates.endDate);
    } catch (error) {
      console.error("Error updating price:", error);
      alert(error instanceof Error ? error.message : "Gagal update harga");
    } finally {
      setIsUpdatingHarga(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleExportExcel = () => {
    if (stockSummaryData.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Nama Material", key: "materialName", width: 25 },
      { header: "Kategori", key: "kategoriName", width: 20 },
      { header: "Satuan", key: "satuan", width: 10 },
      { header: "Sisa Stok Net", key: "netBalanceFormatted", width: 18 },
      { header: "Harga per Satuan (Rp)", key: "hargaPerUnitFormatted", width: 22 },
      { header: "Nilai Total Stok (Rp)", key: "nilaiTotalFormatted", width: 25 },
      { header: "Total Stok Fisik", key: "totalStockFormatted", width: 18 },
    ];

    const dataToExport = stockSummaryData.map((item) => ({
      materialName: item.materialName || "-",
      kategoriName: item.kategoriName || "-",
      satuan: item.satuan || "-",
      netBalanceFormatted: (item.netBalance || 0).toLocaleString("id-ID"),
      hargaPerUnitFormatted: (item.hargaPerUnit || 0).toLocaleString("id-ID"),
      nilaiTotalFormatted: (item.nilaiTotal || 0).toLocaleString("id-ID"),
      totalStockFormatted: (item.totalStock || 0).toLocaleString("id-ID"),
    }));

    exportToExcel(
      dataToExport,
      columns,
      `Stock_Product_${effectiveDates.startDate}_sd_${effectiveDates.endDate}`,
      "Stock_Product"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Stock Product - Gudang
          </h1>
          <p className="text-muted-foreground">
            Kelola stock hasil produksi dalam tangki penyimpanan
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={stockSummaryData.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const url = `/api/pt-pks/stock-product/export-pdf?startDate=${effectiveDates.startDate}&endDate=${effectiveDates.endDate}`;
              window.open(url, "_blank");
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => {
            setEditTangkiData(null);
            setIsCreateModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Tangki
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter Material:</label>
              <Select
                value={selectedMaterialId}
                onValueChange={setSelectedMaterialId}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Semua Material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Material</SelectItem>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.kategori.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DateFilterMode
              mode={filterMode}
              singleDate={singleDate}
              startDate={startDate}
              endDate={endDate}
              onModeChange={setFilterMode}
              onSingleDateChange={setSingleDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onReset={resetFilters}
              allowedModes={["single"]}
            />
          </div>
        </CardContent>
      </Card>



      {/* Material Sections with integrated Tanks */}
      <div className="space-y-8">
        {stockSummaryData.map((item) => (
          <div key={item.materialId} className="space-y-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold">{item.materialName}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openHargaModal(item)}
                    className="gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit Harga
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openHistoryModal(item)}
                    className="gap-1 text-muted-foreground hover:text-primary"
                  >
                    <History className="h-3.5 w-3.5" />
                    History
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  {filterMode === "range" && (
                    <div className="flex justify-between items-center text-sm text-orange-700 bg-orange-50/50 p-1.5 rounded-md mb-2 border border-orange-100/50">
                      <span className="font-medium">Sisa Stok (Net) Periode:</span>
                      <span className="text-lg font-bold">
                        {(item.netPeriod || 0).toLocaleString("id-ID")} {item.satuan}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {filterMode === "single" ? "Sisa Stok Produksi:" : "Sisa Stok Kumulatif s/d Selesai:"}
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {(item.netBalance || 0).toLocaleString("id-ID")} {item.satuan}
                    </span>
                  </div>

                  {/* Harga dan Nilai */}
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-muted-foreground">Harga per {item.satuan}:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(item.hargaPerUnit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Nilai Stok:</span>
                    <span className="text-lg font-bold text-green-700">
                      {formatCurrency(item.nilaiTotal || 0)}
                    </span>
                  </div>

                  {/* Tank Breakdown Description - Only show in single mode */}
                  {filterMode === "single" && item.tanks && item.tanks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Uraian Tangki:</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {item.tanks.map((tank: any) => (
                          <div key={tank.id} className="flex justify-between text-xs border-b border-dashed pb-1">
                            <span className="text-muted-foreground">{tank.namaTangki}:</span>
                            <span className="font-medium">{(tank.isiPadaTanggal || 0).toLocaleString("id-ID")} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground border-t pt-1">
                    * Saldo kumulatif (Produksi - Pengiriman) hingga {(() => {
                      const parts = effectiveDates.endDate.split("-");
                      if (parts.length === 3) {
                        return new Date(parseInt(parts[0]!), parseInt(parts[1]!) - 1, parseInt(parts[2]!)).toLocaleDateString("id-ID");
                      }
                      return new Date(effectiveDates.endDate).toLocaleDateString("id-ID");
                    })()}
                  </p>
                </div>
                <div className="flex justify-between items-center text-xs opacity-70 self-end">
                  <span className="text-muted-foreground">Total Stok Gudang Fisik:</span>
                  <span className="font-medium">
                    {(item.totalStock || 0).toLocaleString("id-ID")} {item.satuan}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Historical Tanks for this specific material - Only show in single mode */}
            {filterMode === "single" && item.tanks && item.tanks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                {item.tanks.map((tank: any) => (
                  <TankVisualization
                    key={tank.id}
                    namaTangki={tank.namaTangki}
                    kapasitas={tank.kapasitas}
                    isiSaatIni={tank.isiPadaTanggal}
                    satuan={tank.satuan}
                    onTankClick={() => handleTankClick(tank)}
                    onEdit={() => handleEditTank(tank)}
                    onDelete={() => handleDeleteTank(tank)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Movement Logs Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">
          Riwayat Pergerakan Stok (Detail Transaksi)
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              {productionLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Tidak ada data transaksi untuk tanggal{" "}
                    {new Date(effectiveDates.endDate).toLocaleDateString("id-ID")}
                  </p>
                </div>
              ) : (
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 transition-colors">
                      <th className="h-12 px-4 text-left font-medium">Waktu</th>
                      <th className="h-12 px-4 text-left font-medium">Material</th>
                      <th className="h-12 px-4 text-right font-medium">Jumlah</th>
                      <th className="h-12 px-4 text-left font-medium">No. Referensi</th>
                      <th className="h-12 px-4 text-left font-medium">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {productionLogs.map((log: any) => (
                      <tr key={log.id} className="border-b transition-colors hover:bg-muted/10">
                        <td className="p-4 align-middle">
                          {new Date(log.tanggalTransaksi).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="p-4 align-middle font-medium">{log.material}</td>
                        <td className={`p-4 align-middle text-right font-bold ${log.tipe === "IN" ? "text-green-600" : log.tipe === "OUT" ? "text-red-600" : "text-blue-600"}`}>
                          {log.tipe === "IN" ? "+" : log.tipe === "OUT" ? "-" : ""}
                          {log.jumlah.toLocaleString("id-ID")} {log.satuan}
                        </td>
                        <td className="p-4 align-middle text-xs">{log.referensi || "-"}</td>
                        <td className="p-4 align-middle text-xs">{log.keterangan || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateTankModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditTangkiData(null);
          fetchAllSummary(selectedMaterialId, effectiveDates.startDate, effectiveDates.endDate);
        }}
        editData={editTangkiData}
      />

      {selectedTangki && (
        <TankTransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => {
            setIsTransactionModalOpen(false);
            setSelectedTangki(null);
            fetchAllSummary(selectedMaterialId, effectiveDates.startDate, effectiveDates.endDate);
          }}
          tangki={selectedTangki}
          allTangkis={stockSummaryData.flatMap(item => item.tanks || [])}
          filterDate={effectiveDates.endDate}
          netBalance={stockSummaryData.find(s => s.materialId === selectedTangki.materialId)?.netBalance || 0}
          totalInTanks={stockSummaryData.find(s => s.materialId === selectedTangki.materialId)?.totalInTanks || 0}
        />
      )}

      {/* Modal Edit Harga */}
      <Dialog open={isHargaModalOpen} onOpenChange={setIsHargaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Edit Harga Material
            </DialogTitle>
            <DialogDescription>
              Update harga per unit untuk {editHargaMaterial?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Harga per kg (Rp)</label>
              <NumericInput
                value={hargaInput}
                onValueChange={setHargaInput}
                placeholder="Masukkan harga per kg"
                className="text-right text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Preview: {formatCurrency(hargaInput || 0)} / kg
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHargaModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateHarga} disabled={isUpdatingHarga}>
              {isUpdatingHarga ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedHistoryMaterial && (
        <PriceHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedHistoryMaterial(null);
          }}
          materialId={selectedHistoryMaterial.id}
          materialName={selectedHistoryMaterial.name}
          satuan={selectedHistoryMaterial.satuan}
        />
      )}
    </div>
  );
}
