"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Factory,
  Calendar,
  Download,
  RotateCcw,
  FileText,
  TrendingUp,
  Package,
  Truck,
} from "lucide-react";
import { ProsesProduksiSummary } from "@/components/dashboard/pt-pks/proses-produksi/proses-produksi-summary";
import { DeliverySummaryTable } from "@/components/dashboard/pt-pks/riwayat-pengiriman/delivery-summary-table";

export default function ProductionDashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]!,
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("all");
  const [materials, setMaterials] = useState<any[]>([]);
  const [tbsStats, setTbsStats] = useState<any>(null);
  const [productStats, setProductStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    debouncedFetchDashboardData(selectedDate, selectedMaterialId);

    return () => {
      debouncedFetchDashboardData.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedDate, selectedMaterialId]);

  const debouncedFetchDashboardData = useMemo(
    () =>
      debounce((date: string, materialId: string) => {
        fetchDashboardData(date, materialId);
      }, 500),
    [],
  );

  const fetchInitialData = async () => {
    try {
      const res = await fetch("/api/pt-pks/material");
      if (res.ok) {
        const data = await res.json();
        const outputMaterials = data.filter(
          (m: any) =>
            !m.name.toLowerCase().includes("tbs") &&
            !m.code.toLowerCase().includes("tbs"),
        );
        setMaterials(outputMaterials);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchDashboardData = async (date: string, materialId: string) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      // Fetch TBS Stats and Product Stats in parallel
      const [tbsMaterial, productsData] = await Promise.all([
        fetch("/api/pt-pks/material", { signal: controller.signal })
          .then((res) => res.json())
          .then((data) =>
            data.find(
              (m: any) =>
                m.name.toLowerCase().includes("tbs") ||
                m.code.toLowerCase().includes("tbs"),
            ),
          ),
        (async () => {
          const productFilter =
            materialId !== "all" ? `&materialId=${materialId}` : "";
          const res = await fetch(
            `/api/pt-pks/stock-product/summary?startDate=${date}&endDate=${date}${productFilter}`,
            { signal: controller.signal },
          );
          if (res.ok) {
            const data = await res.json();
            data.materials = data.materials.filter(
              (m: any) => !m.materialName.toLowerCase().includes("tbs"),
            );
            return data;
          }
          return null;
        })(),
      ]);

      if (tbsMaterial) {
        const tbsStatsRes = await fetch(
          `/api/pt-pks/tbs-statistics?materialId=${tbsMaterial.id}&date=${date}`,
          { signal: controller.signal },
        );
        if (tbsStatsRes.ok) setTbsStats(await tbsStatsRes.json());
      }

      if (productsData) {
        setProductStats(productsData);
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Fetch aborted");
      } else {
        console.error("Error fetching dashboard data:", error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const resetFilters = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]!);
    setSelectedMaterialId("all");
  };

  const exportToPdf = () => {
    window.open(
      `/api/pt-pks/produksi/dashboard/export-pdf?date=${selectedDate}&materialId=${selectedMaterialId}`,
      "_blank",
    );
  };

  const exportToExcel = () => {
    window.open(
      `/api/pt-pks/produksi/dashboard/export-excel?date=${selectedDate}&materialId=${selectedMaterialId}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Factory className="text-primary h-8 w-8" />
            Dashboard Produksi
          </h1>
          <p className="text-muted-foreground">
            Ringkasan operasional harian produksi dalam satu halaman
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button
            onClick={exportToPdf}
            variant="default"
            className="bg-red-600 hover:bg-red-700"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF Laporan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full max-w-[200px] space-y-2">
              <Label htmlFor="date-filter" className="text-sm font-semibold">
                Pilih Tanggal
              </Label>
              <Input
                id="date-filter"
                type="date"
                className="h-10"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={resetFilters}
              className="h-10 w-10 shrink-0"
              title="Reset Filter"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 1. Stock TBS Section */}
      <div className="space-y-4">
        <h2 className="border-l-4 border-l-blue-500 pl-3 text-xl font-bold">
          I. Stock TBS
        </h2>
        {isLoading ? (
          <div className="bg-muted/20 flex h-24 animate-pulse items-center justify-center rounded-lg border">
            Loading...
          </div>
        ) : tbsStats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="border-blue-100 bg-blue-50">
              <CardContent className="pt-6">
                <div className="mb-1 text-sm font-medium text-blue-600">
                  Stock Kemarin
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {tbsStats.tbsHariIni.toLocaleString("id-ID")}{" "}
                  <span className="text-sm font-normal">kg</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-100 bg-green-50">
              <CardContent className="pt-6">
                <div className="mb-1 text-sm font-medium text-green-600">
                  Masuk Hari Ini
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {tbsStats.tbsBulanIni.toLocaleString("id-ID")}{" "}
                  <span className="text-sm font-normal">kg</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-indigo-100 bg-indigo-50">
              <CardContent className="pt-6">
                <div className="mb-1 text-sm font-medium text-indigo-600">
                  Total Stok Saat Ini
                </div>
                <div className="text-2xl font-bold text-indigo-900">
                  {tbsStats.stockTBS.toLocaleString("id-ID")}{" "}
                  <span className="text-sm font-normal">kg</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-teal-100 bg-teal-50">
              <CardContent className="pt-6">
                <div className="mb-1 text-sm font-medium text-teal-600">
                  Masuk Bulan Ini
                </div>
                <div className="text-2xl font-bold text-teal-900">
                  {tbsStats.tbsPeriode.toLocaleString("id-ID")}{" "}
                  <span className="text-sm font-normal">kg</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-100 bg-orange-50">
              <CardContent className="pt-6">
                <div className="mb-1 text-sm font-medium text-orange-600">
                  Masuk Tahun Ini
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {tbsStats.tbsMasukTahunIni.toLocaleString("id-ID")}{" "}
                  <span className="text-sm font-normal">kg</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-muted-foreground rounded-lg border p-4 italic">
            Data TBS tidak tersedia
          </div>
        )}
      </div>

      {/* 2. Proses Produksi Section */}
      <div className="space-y-4">
        <h2 className="border-l-4 border-l-purple-500 pl-3 text-xl font-bold">
          II. Proses Produksi
        </h2>
        <ProsesProduksiSummary
          filters={{
            tanggalMulai: selectedDate,
            tanggalAkhir: selectedDate,
            materialOutputId: "all",
          }}
        />
      </div>

      {/* 3. Stock Product Section */}
      <div className="space-y-4">
        <h2 className="border-l-4 border-l-green-500 pl-3 text-xl font-bold">
          III. Stock Product
        </h2>
        {isLoading ? (
          <div className="bg-muted/20 flex h-24 animate-pulse items-center justify-center rounded-lg border">
            Loading...
          </div>
        ) : productStats?.materials?.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {productStats.materials.map((mat: any) => (
              <Card
                key={mat.materialId}
                className="border-green-100 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="border-b border-green-100 bg-green-50/50 px-4 py-3">
                  <CardTitle className="text-sm font-bold text-green-800">
                    {mat.materialName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div>
                    <div className="text-2xl font-bold text-green-700">
                      {mat.netBalance.toLocaleString("id-ID")}{" "}
                      <span className="text-sm font-normal">{mat.satuan}</span>
                    </div>
                    <div className="text-muted-foreground text-[10px]">
                      Total Sisa Stok Produksi
                    </div>
                  </div>

                  {/* Tank breakdown */}
                  {mat.tanks && mat.tanks.length > 0 && (
                    <div className="space-y-2 border-t pt-2">
                      <div className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                        Rincian Tangki:
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {mat.tanks.map((tank: any) => (
                          <div
                            key={tank.id}
                            className="bg-muted/20 flex items-center justify-between rounded p-1.5 text-xs"
                          >
                            <span className="font-medium">
                              {tank.namaTangki}
                            </span>
                            <span className="text-primary font-bold">
                              {(tank.isiPadaTanggal || 0).toLocaleString(
                                "id-ID",
                              )}{" "}
                              kg
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground rounded-lg border p-4 italic">
            Data Produk tidak tersedia
          </div>
        )}
      </div>

      {/* 4. Riwayat Pengiriman Section */}
      <div className="space-y-4">
        <h2 className="border-l-4 border-l-orange-500 pl-3 text-xl font-bold">
          IV. Rekapitulasi Pengiriman
        </h2>
        <DeliverySummaryTable startDate={selectedDate} endDate={selectedDate} />
      </div>
    </div>
  );
}
