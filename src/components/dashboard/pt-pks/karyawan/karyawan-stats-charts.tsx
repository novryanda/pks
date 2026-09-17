"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    RadialBarChart,
    RadialBar,
    PolarGrid,
    PolarRadiusAxis,
    Label,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Clock } from "lucide-react";
import { ATTENDANCE_CATEGORIES } from "@/server/schema/penggajian";

type ChartDataItem = {
    periode: string;
    bulan: number;
    tahun: number;
    upahDiterima: number;
    gajiPokok: number;
    overtime: number;
    hk: number;
    hkDibayar: number;
    hkTidakDibayar: number;
    lemburJam: number;
    totalPotongan: number;
    attendanceBreakdown?: Record<string, number>;
};

const chartConfigSalary = {
    upahDiterima: {
        label: "Upah Diterima",
        color: "var(--chart-1)",
    },
    overtime: {
        label: "Overtime",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig;

const chartConfigAttendance = {
    hk: {
        label: "HK",
        color: "var(--chart-2)", // Green
    },
    hkDibayar: {
        label: "HK Dibayar",
        color: "var(--chart-1)", // Blue
    },
    hkTidakDibayar: {
        label: "HK Tidak Dibayar",
        color: "var(--chart-5)", // Red
    },
} satisfies ChartConfig;

const chartConfigLembur = {
    lemburJam: {
        label: "Jam Lembur",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig;

// Colors for pie chart categories
const CATEGORY_COLORS: Record<string, string> = {
    green: "#22c55e",
    blue: "#3b82f6",
    red: "#ef4444",
    cyan: "#06b6d4",
    orange: "#f97316",
    yellow: "#eab308",
    gray: "#6b7280",
    purple: "#a855f7",
    amber: "#f59e0b",
};

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}jt`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}rb`;
    }
    return value.toString();
};

const getMonthName = (month: number) => {
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return months[month - 1] || "";
};

export function KaryawanStatsCharts({ chartData }: { chartData: ChartDataItem[] }) {
    const [selectedPeriode, setSelectedPeriode] = useState<string>("all");

    // Get available periods for filter   
    const periodeOptions = useMemo(() => {
        return chartData.map(d => ({
            value: d.periode,
            label: `${getMonthName(d.bulan)} ${d.tahun}`
        }));
    }, [chartData]);

    // Get selected period data for radial chart
    const selectedData = useMemo(() => {
        if (selectedPeriode === "all" && chartData.length > 0) {
            // Default to latest period
            return chartData[chartData.length - 1];
        }
        return chartData.find(d => d.periode === selectedPeriode) || chartData[chartData.length - 1];
    }, [chartData, selectedPeriode]);

    // Radial chart data - max 200 jam for full circle
    const radialData = useMemo(() => {
        if (!selectedData) return [];
        const maxJam = 200; // Maximum expected hours for full circle
        return [{
            name: "lembur",
            value: selectedData.lemburJam,
            fill: "var(--chart-5)",
        }];
    }, [selectedData]);

    // Calculate end angle based on lembur hours (max 200 jam = full circle)
    const endAngle = useMemo(() => {
        if (!selectedData) return 0;
        const maxJam = 200;
        const percentage = Math.min(selectedData.lemburJam / maxJam, 1);
        return percentage * 360;
    }, [selectedData]);

    if (chartData.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12">
                Belum ada data untuk ditampilkan
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Period Filter */}
            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Filter Periode:</span>
                <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Pilih Periode" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Periode Terakhir</SelectItem>
                        {periodeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Salary Trend Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Trend Gaji</CardTitle>
                        <CardDescription>Upah diterima dan overtime per bulan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfigSalary} className="h-[300px] w-full">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="fillUpah" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-upahDiterima)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-upahDiterima)" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="fillOvertime" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-overtime)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-overtime)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="periode"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    fontSize={12}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={formatCurrency}
                                    fontSize={12}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`}
                                        />
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="upahDiterima"
                                    stroke="var(--color-upahDiterima)"
                                    fill="url(#fillUpah)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="overtime"
                                    stroke="var(--color-overtime)"
                                    fill="url(#fillOvertime)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Attendance Chart - Only HK Dibayar and HK Tidak Dibayar */}
                <Card>
                    <CardHeader>
                        <CardTitle>Kehadiran</CardTitle>
                        <CardDescription>Hari Kerja (HK) per bulan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfigAttendance} className="h-[300px] w-full">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="periode"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    fontSize={12}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    fontSize={12}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar
                                    dataKey="hk"
                                    fill="var(--color-hk)"
                                    radius={[4, 4, 0, 0]}
                                    name="HK"
                                />
                                <Bar
                                    dataKey="hkDibayar"
                                    fill="var(--color-hkDibayar)"
                                    radius={[4, 4, 0, 0]}
                                    name="HK Dibayar"
                                />
                                <Bar
                                    dataKey="hkTidakDibayar"
                                    fill="var(--color-hkTidakDibayar)"
                                    radius={[4, 4, 0, 0]}
                                    name="HK Tidak Dibayar"
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Category Breakdown */}
            {selectedData?.attendanceBreakdown && (
                <Card>
                    <CardHeader>
                        <CardTitle>Breakdown Kehadiran per Kategori</CardTitle>
                        <CardDescription>
                            {selectedData ? `${getMonthName(selectedData.bulan)} ${selectedData.tahun}` : ""}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Pie Chart */}
                            <div className="h-[280px]">
                                <PieChart width={280} height={280}>
                                    <Pie
                                        data={Object.entries(selectedData.attendanceBreakdown)
                                            .filter(([_, count]) => count > 0)
                                            .map(([code, count]) => {
                                                const cat = ATTENDANCE_CATEGORIES.find(c => c.code === code);
                                                return {
                                                    name: cat?.label || code,
                                                    value: count,
                                                    color: cat ? CATEGORY_COLORS[cat.color] : "#6b7280",
                                                };
                                            })}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {Object.entries(selectedData.attendanceBreakdown)
                                            .filter(([_, count]) => count > 0)
                                            .map(([code], index) => {
                                                const cat = ATTENDANCE_CATEGORIES.find(c => c.code === code);
                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={cat ? CATEGORY_COLORS[cat.color] : "#6b7280"}
                                                    />
                                                );
                                            })}
                                    </Pie>
                                    <ChartTooltip />
                                </PieChart>
                            </div>
                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-2">
                                {ATTENDANCE_CATEGORIES.map((cat) => {
                                    const count = selectedData.attendanceBreakdown?.[cat.code] || 0;
                                    return (
                                        <div
                                            key={cat.code}
                                            className="flex items-center gap-2 p-2 rounded-lg"
                                            style={{ backgroundColor: count > 0 ? `${CATEGORY_COLORS[cat.color]}20` : undefined }}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: CATEGORY_COLORS[cat.color] }}
                                            />
                                            <span className="text-sm flex-1">{cat.label}</span>
                                            <span className="font-bold">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Attendance Categories Legend (when no breakdown data) */}
            {!selectedData?.attendanceBreakdown && (
                <Card>
                    <CardHeader>
                        <CardTitle>Keterangan Kategori Kehadiran</CardTitle>
                        <CardDescription>Daftar semua kategori kehadiran yang tersedia</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {ATTENDANCE_CATEGORIES.map((cat) => (
                                <div
                                    key={cat.code}
                                    className="flex items-center gap-2 p-2 border rounded-lg"
                                    style={{ borderColor: CATEGORY_COLORS[cat.color] }}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: CATEGORY_COLORS[cat.color] }}
                                    />
                                    <div className="flex-1">
                                        <span className="text-xs font-bold">{cat.code}</span>
                                        <p className="text-[10px] text-muted-foreground">{cat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lembur Radial Chart */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Total Jam Lembur
                        </CardTitle>
                        <CardDescription>
                            {selectedData ? `${getMonthName(selectedData.bulan)} ${selectedData.tahun}` : ""}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfigLembur} className="mx-auto aspect-square max-h-[280px]">
                        <RadialBarChart
                            data={radialData}
                            startAngle={90}
                            endAngle={90 - endAngle}
                            innerRadius={90}
                            outerRadius={130}
                        >
                            <PolarGrid
                                gridType="circle"
                                radialLines={false}
                                stroke="none"
                                className="first:fill-muted last:fill-background"
                                polarRadius={[96, 84]}
                            />
                            <RadialBar dataKey="value" background cornerRadius={10} />
                            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                            return (
                                                <text
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        className="fill-foreground text-4xl font-bold"
                                                    >
                                                        {selectedData?.lemburJam.toLocaleString() || 0}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) + 28}
                                                        className="fill-muted-foreground text-sm"
                                                    >
                                                        Jam Lembur
                                                    </tspan>
                                                </text>
                                            );
                                        }
                                    }}
                                />
                            </PolarRadiusAxis>
                        </RadialBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
