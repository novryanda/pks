"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DateFilterMode, type DateFilterModeType } from "@/components/ui/date-filter-mode";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Package, TrendingUp, AlertCircle } from "lucide-react";
import debounce from "lodash.debounce";

type Material = {
    id: string;
    name: string;
    code: string;
    satuan: { symbol: string };
};

type TrendDataPoint = {
    date: string;
    produksi: number;
    pengiriman: number;
    sisaStock: number;
};

const chartConfig = {
    produksi: {
        label: "Produksi",
        color: "#22C55E", // Green-500
    },
    pengiriman: {
        label: "Pengiriman",
        color: "#F97316", // Orange-500
    },
    sisaStock: {
        label: "Sisa Stock",
        color: "#3B82F6", // Blue-500
    },
} satisfies ChartConfig;

export function StockProductTrendChart() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState<string>("");
    const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Date filters
    const today = new Date().toISOString().split("T")[0]!;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
    const [filterMode, setFilterMode] = useState<DateFilterModeType>("range");
    const [singleDate, setSingleDate] = useState<string>(today);
    const [startDate, setStartDate] = useState<string>(weekAgo);
    const [endDate, setEndDate] = useState<string>(today);

    const effectiveDates = useMemo(() => {
        if (filterMode === "single") {
            return { startDate: singleDate, endDate: singleDate };
        }
        return { startDate, endDate };
    }, [filterMode, singleDate, startDate, endDate]);

    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const debouncedFetchTrend = useMemo(
        () =>
            debounce((materialId: string, start: string, end: string) => {
                fetchTrendData(materialId, start, end);
            }, 500),
        []
    );

    useEffect(() => {
        if (selectedMaterial) {
            debouncedFetchTrend(
                selectedMaterial,
                effectiveDates.startDate,
                effectiveDates.endDate
            );
        }

        return () => {
            debouncedFetchTrend.cancel();
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [selectedMaterial, effectiveDates.startDate, effectiveDates.endDate]);

    const fetchMaterials = async () => {
        try {
            const res = await fetch("/api/pt-pks/material");
            if (res.ok) {
                const data = await res.json();
                // Filter product materials (CPO, PKO, etc.) - exclude TBS
                const productMaterials = data.filter(
                    (m: Material) =>
                        !m.name.toLowerCase().includes("tbs") &&
                        !m.code.toLowerCase().includes("tbs")
                );
                setMaterials(productMaterials.length > 0 ? productMaterials : data);

                if (productMaterials.length > 0) {
                    setSelectedMaterial(productMaterials[0].id);
                } else if (data.length > 0) {
                    setSelectedMaterial(data[0].id);
                }
            }
        } catch (err) {
            console.error("Error fetching materials:", err);
        }
    };

    const fetchTrendData = async (
        materialId: string,
        start: string,
        end: string
    ) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setError(null);

        try {
            const url = `/api/pt-pks/stock-product/daily-trend?materialId=${materialId}&startDate=${start}&endDate=${end}`;
            const res = await fetch(url, { signal: controller.signal });

            if (res.ok) {
                const data = await res.json();
                setTrendData(data);
            } else {
                const errorData = await res.json();
                setError(errorData.error || "Gagal memuat data trend");
            }
        } catch (err) {
            if ((err as Error).name === "AbortError") {
                console.log("Fetch aborted");
            } else {
                console.error("Error fetching trend data:", err);
                setError("Terjadi kesalahan saat memuat data");
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setLoading(false);
            }
        }
    };

    const resetFilters = () => {
        const todayDate = new Date().toISOString().split("T")[0]!;
        const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]!;
        setFilterMode("range");
        setSingleDate(todayDate);
        setStartDate(weekAgoDate);
        setEndDate(todayDate);
    };

    const selectedMaterialData = materials.find((m) => m.id === selectedMaterial);

    // Format date for display on X-axis
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    };

    if (materials.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            Belum ada material product terdaftar.
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
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Trend Stock Product
                    </CardTitle>
                    <CardDescription>
                        Visualisasi pergerakan produk (produksi, pengiriman, sisa stok) per
                        hari
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="material" className="text-sm font-semibold">
                                Pilih Material Product
                            </Label>
                            <Select
                                value={selectedMaterial}
                                onValueChange={setSelectedMaterial}
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
                                allowedModes={["range"]}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Grafik Pergerakan {selectedMaterialData?.name || "Product"}
                    </CardTitle>
                    <CardDescription>
                        Data harian dari{" "}
                        {new Date(effectiveDates.startDate).toLocaleDateString("id-ID")} s/d{" "}
                        {new Date(effectiveDates.endDate).toLocaleDateString("id-ID")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-muted-foreground">Memuat data chart...</div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-destructive">
                            <AlertCircle className="h-12 w-12 mb-4" />
                            <p>{error}</p>
                        </div>
                    ) : trendData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                Tidak ada data untuk periode ini
                            </p>
                        </div>
                    ) : (
                        <ChartContainer config={chartConfig} className="h-[400px] w-full">
                            <LineChart
                                data={trendData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) =>
                                        value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
                                    }
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            labelFormatter={(_, payload) => {
                                                if (payload && payload.length > 0 && payload[0]?.payload?.date) {
                                                    const date = new Date(payload[0].payload.date);
                                                    return date.toLocaleDateString("id-ID", {
                                                        weekday: "long",
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    });
                                                }
                                                return "";
                                            }}
                                        />
                                    }
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="produksi"
                                    name="Produksi"
                                    stroke="var(--color-produksi)"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="pengiriman"
                                    name="Pengiriman"
                                    stroke="var(--color-pengiriman)"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sisaStock"
                                    name="Sisa Stock"
                                    stroke="var(--color-sisaStock)"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            {/* Summary Stats */}
            {trendData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="pt-6">
                            <div className="text-sm font-medium text-green-700">
                                Total Produksi
                            </div>
                            <div className="text-2xl font-bold text-green-900">
                                {trendData
                                    .reduce((sum, d) => sum + d.produksi, 0)
                                    .toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                                <span className="text-sm font-normal">
                                    {selectedMaterialData?.satuan.symbol || "kg"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-6">
                            <div className="text-sm font-medium text-orange-700">
                                Total Pengiriman
                            </div>
                            <div className="text-2xl font-bold text-orange-900">
                                {trendData
                                    .reduce((sum, d) => sum + d.pengiriman, 0)
                                    .toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                                <span className="text-sm font-normal">
                                    {selectedMaterialData?.satuan.symbol || "kg"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="pt-6">
                            <div className="text-sm font-medium text-blue-700">
                                Sisa Stock Akhir
                            </div>
                            <div className="text-2xl font-bold text-blue-900">
                                {(trendData[trendData.length - 1]?.sisaStock || 0).toLocaleString(
                                    "id-ID",
                                    { maximumFractionDigits: 2 }
                                )}{" "}
                                <span className="text-sm font-normal">
                                    {selectedMaterialData?.satuan.symbol || "kg"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
