"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, Package, Calendar, Users, Eye, Download, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { Badge } from "@/components/ui/badge";
import { SupplierDetailView } from "./supplier-detail-view";
import { DateFilterMode, type DateFilterModeType } from "@/components/ui/date-filter-mode";
import { formatDateInJakarta, getJakartaDateKey } from "@/lib/date-time";

type Material = {
  id: string;
  name: string;
  code: string;
  satuan: { symbol: string };
};

type TBSStatistics = {
  tbsHariIni: number;
  tbsBulanIni: number;
  tbsPeriode: number; // Added tbsPeriode
  tbsMasukTahunIni: number; // Added tbsMasukTahunIni
  stockTBS: number;
  stockTBSYesterday: number;
  tbsBySupplier: Array<{
    supplierId: string;
    _sum: { beratNetto2: number | null };
    _count: { id: number };
  }>;
};

type SupplierData = {
  id: string;
  ownerName: string;
  type: string;
  totalBerat: number;
  jumlahPenerimaan: number;
};

export function StockTBSDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedMaterialName, setSelectedMaterialName] = useState<string>("");
  const [statistics, setStatistics] = useState<TBSStatistics | null>(null);
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
  const [suppliers, setSuppliers] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);

  // Filters - Dual Mode
  const today = getJakartaDateKey(new Date())!;
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

  useEffect(() => {
    fetchMaterials();
    fetchSuppliers();
  }, []);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (selectedMaterial) {
      debouncedFetchStatistics(selectedMaterial, effectiveDates.startDate, effectiveDates.endDate);
    }

    return () => {
      debouncedFetchStatistics.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedMaterial, effectiveDates.startDate, effectiveDates.endDate]);

  const debouncedFetchStatistics = useMemo(
    () => debounce((materialId: string, start: string, end: string) => {
      fetchStatistics(materialId, start, end);
    }, 500),
    [selectedMaterial]
  );

  // Reset filters to today
  const resetFilters = () => {
    const todayDate = getJakartaDateKey(new Date())!;
    setFilterMode("single");
    setSingleDate(todayDate);
    setStartDate(todayDate);
    setEndDate(todayDate);
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/pt-pks/material");
      if (res.ok) {
        const data = await res.json();
        // Filter hanya material kategori TBS
        const tbsMaterials = data.filter((m: Material) =>
          m.name.toLowerCase().includes("tbs") ||
          m.code.toLowerCase().includes("tbs")
        );
        setMaterials(tbsMaterials.length > 0 ? tbsMaterials : data);

        if (tbsMaterials.length > 0) {
          setSelectedMaterial(tbsMaterials[0].id);
        } else if (data.length > 0) {
          setSelectedMaterial(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/pt-pks/supplier");
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (Array.isArray(data.suppliers) ? data.suppliers : []);
        const supplierMap = new Map<string, any>(
          arr.map((s: any) => [s.id as string, s])
        );
        setSuppliers(supplierMap);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  // Removed duplicate resetFilters - now defined earlier

  const fetchStatistics = async (materialId: string, start: string, end: string) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const url = `/api/pt-pks/tbs-statistics?materialId=${materialId}&startDate=${start}&endDate=${end}`;
      const res = await fetch(url, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        setStatistics(data);

        // Process supplier data
        const processedSuppliers = data.tbsBySupplier.map((item: any) => {
          return {
            id: item.supplierId,
            ownerName: item.supplier?.ownerName || "Unknown",
            type: item.supplier?.type || "-",
            totalBerat: item._sum.beratNetto2 || 0,
            jumlahPenerimaan: item._count.id,
          };
        }).sort((a: SupplierData, b: SupplierData) => b.totalBerat - a.totalBerat);

        setSupplierData(processedSuppliers);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error("Error fetching statistics:", error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const exportToExcel = () => {
    if (!statistics || supplierData.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    const totalAllSuppliers = supplierData.reduce((sum, s) => sum + s.totalBerat, 0);

    const dateLabel = filterMode === "single"
      ? effectiveDates.endDate
      : `${effectiveDates.startDate} s/d ${effectiveDates.endDate}`;
    // 1. Create Summary Sheet
    const summaryData = [
      ["LAPORAN STOCK TBS"],
      ["Material", selectedMaterialData?.name || ""],
      ["Periode", dateLabel],
      [""],
      ["RINGKASAN STOK"],
      ["Keterangan", "Jumlah", "Satuan"],
      ["Sisa Stok Kemarin", statistics.tbsHariIni, selectedMaterialData?.satuan.symbol || "kg"],
      ["TBS Masuk Hari Ini", statistics.tbsBulanIni, selectedMaterialData?.satuan.symbol || "kg"],
      ["TBS Masuk Bulan Ini", statistics.tbsPeriode, selectedMaterialData?.satuan.symbol || "kg"],
      ["TBS Masuk Tahun Ini", statistics.tbsMasukTahunIni, selectedMaterialData?.satuan.symbol || "kg"],
      ["total stok TBS sampai saat ini", statistics.stockTBS, selectedMaterialData?.satuan.symbol || "kg"],
      [""],
      ["DETAIL PENERIMAAN PER SUPPLIER"],
      ["No", "Nama Supplier", "Jumlah Penerimaan", "Total Berat (kg)", "Rata-rata (kg)", "% dari Total"],
    ];

    supplierData.forEach((supplier, index) => {
      const percentage = (supplier.totalBerat / totalAllSuppliers);
      const averagePerDelivery = supplier.totalBerat / supplier.jumlahPenerimaan;

      summaryData.push([
        (index + 1),
        supplier.ownerName,
        supplier.jumlahPenerimaan,
        supplier.totalBerat,
        averagePerDelivery,
        percentage
      ]);
    });

    // Add totals
    summaryData.push(
      ["", "TOTAL", supplierData.reduce((sum, s) => sum + s.jumlahPenerimaan, 0), totalAllSuppliers, "", 1]
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(summaryData);

    // Formatting (optional but nice)
    const fmtKg = "#,##0.00 \"kg\"";
    const fmtPct = "0.0%";

    // Applied to specific cells (example for rows starting from index 6 to 9 for summary)
    // and from index 13 onwards for supplier data.
    // In a real scenario, you'd iterate and set z property.

    XLSX.utils.book_append_sheet(wb, ws, "Laporan Stock TBS");
    XLSX.writeFile(wb, `Laporan_Stock_TBS_${effectiveDates.endDate}.xlsx`);
  };

  const exportToPdf = () => {
    const url = `/api/pt-pks/stock-tbs/export-pdf?materialId=${selectedMaterial}&startDate=${effectiveDates.startDate}&endDate=${effectiveDates.endDate}`;
    window.open(url, "_blank");
  };

  const selectedMaterialData = materials.find((m) => m.id === selectedMaterial);

  // Show detail view
  if (showDetail && selectedSupplier) {
    return (
      <SupplierDetailView
        supplier={selectedSupplier}
        materialId={selectedMaterial}
        materialName={selectedMaterialData?.name || ""}
        month={effectiveDates.endDate}
        onBack={() => {
          setShowDetail(false);
          setSelectedSupplier(null);
        }}
      />
    );
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Belum ada material TBS terdaftar. Silakan tambahkan material terlebih dahulu.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Stock TBS</CardTitle>
          <CardDescription>
            Monitoring stock dan penerimaan Tandan Buah Segar (TBS)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="material" className="text-sm font-semibold">Pilih Material</Label>
              <Select
                value={selectedMaterial}
                onValueChange={(value) => {
                  setSelectedMaterial(value);
                  const material = materials.find(m => m.id === value);
                  setSelectedMaterialName(material?.name || "");
                }}
              >
                <SelectTrigger id="material" className="h-10">
                  <SelectValue placeholder="Pilih material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
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
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">Memuat data statistik...</div>
          </CardContent>
        </Card>
      ) : statistics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {filterMode === "single" ? "Sisa Stok Kemarin" : "Stok Awal Periode"}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {statistics.tbsHariIni.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {selectedMaterialData?.satuan.symbol || "kg"}
                    </div>
                  </div>
                  <TrendingUp className="h-6 w-6 text-blue-300" />
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-xs text-blue-700">
                    {filterMode === "single" ? "Saldo akhir hari sebelumnya" : "Saldo sebelum tanggal mulai periode"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {filterMode === "single" ? "TBS Masuk Hari Ini" : "TBS Masuk Periode"}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {statistics.tbsBulanIni.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      {selectedMaterialData?.satuan.symbol || "kg"}
                    </div>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-300" />
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="text-xs text-green-700">
                    {filterMode === "single"
                      ? `Penerimaan tgl ${formatDateInJakarta(effectiveDates.endDate)}`
                      : `Akumulasi dari ${formatDateInJakarta(effectiveDates.startDate)} s/d ${formatDateInJakarta(effectiveDates.endDate)}`}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Package className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {filterMode === "single" ? "total stok TBS hari ini" : `total stok TBS s/d ${formatDateInJakarta(effectiveDates.endDate)}`}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {statistics.stockTBS.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-primary/70 mt-1">
                      {selectedMaterialData?.satuan.symbol || "kg"}
                    </div>
                  </div>
                  <Package className="h-8 w-8 text-primary/30" />
                </div>
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="text-xs text-primary/70">Saldo akhir sampai saat ini</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-purple-700 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {filterMode === "range" ? "TBS Masuk Akumulasi Bulan (Periode)" : "TBS Masuk Bulan Ini"}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {statistics.tbsPeriode.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-purple-700 mt-1">
                      {selectedMaterialData?.satuan.symbol || "kg"}
                    </div>
                  </div>
                  <TrendingUp className="h-6 w-6 text-purple-300" />
                </div>
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <div className="text-xs text-purple-700">
                    {filterMode === "range"
                      ? "Total akumulasi bulan dlm periode"
                      : "Akumulasi penerimaan bulan ini"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-orange-700 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {filterMode === "range" ? "TBS Masuk Akumulasi Tahun (Periode)" : "TBS MASUK sampai tahun ini"}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-orange-900">
                      {statistics.tbsMasukTahunIni.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-orange-700 mt-1">
                      {selectedMaterialData?.satuan.symbol || "kg"}
                    </div>
                  </div>
                  <TrendingUp className="h-6 w-6 text-orange-300" />
                </div>
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="text-xs text-orange-700">
                    {filterMode === "range"
                      ? "Total akumulasi tahun dlm periode"
                      : "Akumulasi penerimaan tahun ini"}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Supplier Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Daftar Total TBS Masuk dari Supplier
                  </CardTitle>
                  <CardDescription>
                    Total penerimaan TBS per supplier untuk material {selectedMaterialData?.name}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-base px-4 py-2">
                    {supplierData.length} Supplier
                  </Badge>
                  <Button onClick={exportToExcel} variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                  <Button onClick={exportToPdf} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {supplierData.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Belum ada data penerimaan TBS dari supplier
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Supplier</TableHead>
                        <TableHead className="text-center">Jumlah Penerimaan</TableHead>
                        <TableHead className="text-right">Total Berat (kg)</TableHead>
                        <TableHead className="text-right">Rata-rata per Penerimaan</TableHead>
                        <TableHead className="text-right">% dari Total</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierData.map((supplier, index) => {
                        const totalAllSuppliers = supplierData.reduce(
                          (sum, s) => sum + s.totalBerat,
                          0
                        );
                        const percentage = (supplier.totalBerat / totalAllSuppliers) * 100;
                        const averagePerDelivery = supplier.totalBerat / supplier.jumlahPenerimaan;

                        return (
                          <TableRow key={supplier.id}>
                            <TableCell>
                              <div className="font-medium">{supplier.ownerName}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{supplier.jumlahPenerimaan}×</Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {supplier.totalBerat.toLocaleString("id-ID", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {averagePerDelivery.toLocaleString("id-ID", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-primary h-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="font-medium text-sm w-12 text-right">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedSupplier(supplier);
                                  setShowDetail(true);
                                }}
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Summary Footer */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Supplier</div>
                        <div className="text-2xl font-bold">{supplierData.length}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Penerimaan</div>
                        <div className="text-2xl font-bold">
                          {supplierData.reduce((sum, s) => sum + s.jumlahPenerimaan, 0)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Berat</div>
                        <div className="text-2xl font-bold text-primary">
                          {supplierData
                            .reduce((sum, s) => sum + s.totalBerat, 0)
                            .toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                          kg
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data statistik tersedia
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
