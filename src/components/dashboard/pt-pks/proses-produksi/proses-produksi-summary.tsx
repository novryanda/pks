"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Percent, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryStats {
  totalInput: number;
  totalProduksi: number;
  totalRendemen: number;
}

interface SummaryData {
  summary: {
    day: SummaryStats;
    month: SummaryStats;
    year: SummaryStats;
    global?: {
      day: SummaryStats;
      month: SummaryStats;
      year: SummaryStats;
    };
    products?: Array<{
      materialId: string;
      materialName: string;
      materialCode?: string;
      day: SummaryStats;
      month: SummaryStats;
      year: SummaryStats;
    }>;
  };
}

interface ProsesProduksiSummaryProps {
  filters: {
    tanggalMulai: string;
    tanggalAkhir: string;
    materialOutputId: string;
    filterMode?: "single" | "range"; // Added for dynamic labels
  };
}

export function ProsesProduksiSummary({ filters }: ProsesProduksiSummaryProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    debouncedFetchSummary(filters);

    return () => {
      debouncedFetchSummary.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters]);

  const debouncedFetchSummary = useMemo(
    () => debounce((currentFilters: any) => {
      fetchSummary(currentFilters);
    }, 800),
    []
  );

  const fetchSummary = async (currentFilters: any = filters) => {
    if (!currentFilters.materialOutputId) return;

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (currentFilters.tanggalMulai && currentFilters.tanggalAkhir) {
        params.append("tanggalMulai", currentFilters.tanggalMulai);
        params.append("tanggalAkhir", currentFilters.tanggalAkhir);
      }
      if (currentFilters.materialOutputId) params.append("materialOutputId", currentFilters.materialOutputId);

      const response = await fetch(`/api/pt-pks/proses-produksi/summary?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Failed to fetch summary");

      const result = await response.json();
      setData(result);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Summary fetch aborted');
      } else {
        console.error("Error fetching summary:", error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const isAll = filters.materialOutputId === "all" && data.summary.products;
  const mainStats = isAll ? data.summary.global! : data.summary;

  // Check if we're in period mode
  const isPeriodMode = filters.filterMode === "range" ||
    (filters.tanggalMulai !== filters.tanggalAkhir);

  const getTbsCards = (stats: any) => [
    {
      title: isPeriodMode ? "TBS Diolah Periode" : "TBS Diolah Hari Ini",
      value: stats.day.totalInput.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      unit: "kg",
      icon: Truck,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: isPeriodMode ? `TBS Diolah Bulan (Periode)` : "TBS Diolah Bulan Ini",
      value: stats.month.totalInput.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      unit: "kg",
      icon: Truck,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      title: isPeriodMode ? `TBS Diolah Tahun (Periode)` : "TBS Diolah Tahun Ini",
      value: stats.year.totalInput.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      unit: "kg",
      icon: Truck,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
  ];

  const getProductionCards = (stats: any, titlePrefix: string = "Total Produksi") => [
    {
      title: isPeriodMode ? `${titlePrefix} Periode` : `${titlePrefix} Hari Ini`,
      value: stats.day.totalProduksi.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      rendemen: stats.day.totalRendemen.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      unit: "kg",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: isPeriodMode ? `${titlePrefix} Bulan (Periode)` : `${titlePrefix} Bulan Ini`,
      value: stats.month.totalProduksi.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      rendemen: stats.month.totalRendemen.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      unit: "kg",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: isPeriodMode ? `${titlePrefix} Tahun (Periode)` : `${titlePrefix} Tahun Ini`,
      value: stats.year.totalProduksi.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      rendemen: stats.year.totalRendemen.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      unit: "kg",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* TBS Summary Cards (Global Input) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {getTbsCards(mainStats).map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {card.value}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {card.unit}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Production Summary Cards */}
      {isAll ? (
        <div className="space-y-6">
          {data.summary.products!.map((product) => (
            <div key={product.materialId} className="space-y-2">
              <div className="text-sm font-bold bg-muted/30 p-2 rounded border-l-4 border-l-primary">
                Produksi: {product.materialName}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {getProductionCards(product, "").map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <Card key={index} className="shadow-sm border-primary/10">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {card.title}
                        </CardTitle>
                        <div className={`rounded-full p-2 ${card.bgColor}`}>
                          <Icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold flex flex-wrap items-baseline gap-1">
                          <span>{card.value} {card.unit}</span>
                          <span className="text-muted-foreground font-normal">/</span>
                          <span className="text-amber-600">{card.rendemen} %</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {getProductionCards(mainStats).map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold flex flex-wrap items-baseline gap-1">
                    <span>{card.value} {card.unit}</span>
                    <span className="text-muted-foreground font-normal">/</span>
                    <span className="text-amber-600">{card.rendemen} %</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
