"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    User,
    BarChart3,
    History,
    FileText,
    Loader2,
    Calendar,
    Briefcase,
    Building2,
    CreditCard,
    Shield,
    TrendingUp,
    Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KaryawanStatsCharts } from "./karyawan-stats-charts";

type KaryawanDetail = {
    id: string;
    namaKaryawan: string;
    divisi: { id: string; nama: string } | null;
    jabatan: { id: string; nama: string } | null;
    gol: string | null;
    tktk: string | null;
    nomorRekening: string | null;
    noBpjsTk: string | null;
    noBpjsKesehatan: string | null;
    gajiPokok: number;
    tunjanganJabatan: number;
    tunjanganPerumahan: number;
    tanggalMulaiKerja: string | null;
    tanggalKeluar: string | null;
    isActive: boolean;
    createdAt: string;
};

type Statistics = {
    totalPeriods: number;
    totalUpah: number;
    avgUpah: number;
    avgKehadiran: number;
    totalLemburJam: number;
};

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
};

type HistoryItem = {
    id: string;
    periode: string;
    periodeBulan: number;
    periodeTahun: number;
    gajiPokok: number;
    tunjanganJabatan: number;
    tunjanganPerumahan: number;
    overtime: number;
    totalSebelumPotongan: number;
    totalPotongan: number;
    upahDiterima: number;
    hk: number;
    hkDibayar: number;
    hkTidakDibayar: number;
    lemburJam: number;
};

type ChangeLogItem = {
    id: string;
    fieldName: string;
    oldDisplayValue: string | null;
    newDisplayValue: string | null;
    changedBy: string;
    changedAt: string;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value);
};

const getMonthName = (month: number) => {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    return months[month - 1] || "";
};

export function KaryawanDetailPage({ karyawanId }: { karyawanId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [karyawan, setKaryawan] = useState<KaryawanDetail | null>(null);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [chartData, setChartData] = useState<ChartDataItem[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [changeLogs, setChangeLogs] = useState<ChangeLogItem[]>([]);
    const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/pt-pks/master-karyawan/${karyawanId}/detail`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setKaryawan(data.karyawan);
                setStatistics(data.statistics);
                setChartData(data.chartData);
                setHistory(data.history);
                setChangeLogs(data.changeLogs);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [karyawanId]);

    const handleDownloadPdf = async (penggajianId: string, item: HistoryItem) => {
        setDownloadingPdfId(penggajianId);
        try {
            const response = await fetch(`/api/pt-pks/penggajian/${penggajianId}/pdf`);

            if (!response.ok) {
                throw new Error("Gagal generate PDF");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const namaKaryawan = karyawan?.namaKaryawan || "unknown";
            a.download = `slip-gaji-${namaKaryawan.replace(/\s+/g, "-")}-${item.periodeBulan}-${item.periodeTahun}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert("Gagal download PDF");
        } finally {
            setDownloadingPdfId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!karyawan) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-muted-foreground">Karyawan tidak ditemukan</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{karyawan.namaKaryawan}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            {karyawan.jabatan && <span>{karyawan.jabatan.nama}</span>}
                            {karyawan.divisi && (
                                <>
                                    <span>•</span>
                                    <span>{karyawan.divisi.nama}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <Badge variant={karyawan.isActive ? "default" : "secondary"}>
                    {karyawan.isActive ? "Aktif" : "Non-Aktif"}
                </Badge>
            </div>

            {/* Stats Summary Cards */}
            {statistics && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Total Periode</span>
                            </div>
                            <p className="text-2xl font-bold mt-1">{statistics.totalPeriods}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-muted-foreground">Total Diterima</span>
                            </div>
                            <p className="text-xl font-bold mt-1 text-green-600">Rp {formatCurrency(statistics.totalUpah)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-muted-foreground">Rata-rata Gaji</span>
                            </div>
                            <p className="text-xl font-bold mt-1 text-blue-600">Rp {formatCurrency(statistics.avgUpah)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-purple-600" />
                                <span className="text-sm text-muted-foreground">Rata-rata HK</span>
                            </div>
                            <p className="text-2xl font-bold mt-1 text-purple-600">{statistics.avgKehadiran}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-orange-600" />
                                <span className="text-sm text-muted-foreground">Total Lembur</span>
                            </div>
                            <p className="text-2xl font-bold mt-1 text-orange-600">{statistics.totalLemburJam} jam</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info" className="gap-2">
                        <User className="h-4 w-4" />
                        Info
                    </TabsTrigger>
                    <TabsTrigger value="statistik" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Statistik
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" />
                        History Gaji
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Log Perubahan
                    </TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informasi Karyawan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nama Karyawan</p>
                                        <p className="font-medium">{karyawan.namaKaryawan}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Golongan</p>
                                        <p className="font-medium">{karyawan.gol || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status Keluarga</p>
                                        <p className="font-medium">{karyawan.tktk || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">No. Rekening</p>
                                        <p className="font-medium">{karyawan.nomorRekening || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tanggal Mulai Kerja</p>
                                        <p className="font-medium">
                                            {karyawan.tanggalMulaiKerja
                                                ? new Date(karyawan.tanggalMulaiKerja).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                })
                                                : "-"
                                            }
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Jabatan & Divisi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Divisi</p>
                                        <p className="font-medium">{karyawan.divisi?.nama || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Jabatan</p>
                                        <p className="font-medium">{karyawan.jabatan?.nama || "-"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Gaji & Tunjangan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Gaji Pokok</p>
                                        <p className="font-medium">Rp {formatCurrency(Number(karyawan.gajiPokok))}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tunjangan Jabatan</p>
                                        <p className="font-medium">Rp {formatCurrency(Number(karyawan.tunjanganJabatan))}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tunjangan Perumahan</p>
                                        <p className="font-medium">Rp {formatCurrency(Number(karyawan.tunjanganPerumahan))}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    BPJS
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">No. BPJS TK</p>
                                        <p className="font-medium">{karyawan.noBpjsTk || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">No. BPJS Kesehatan</p>
                                        <p className="font-medium">{karyawan.noBpjsKesehatan || "-"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Statistik Tab */}
                <TabsContent value="statistik" className="mt-6">
                    <KaryawanStatsCharts chartData={chartData} />
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>History Penerimaan Gaji</CardTitle>
                            <CardDescription>Riwayat gaji yang diterima per periode</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {history.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Belum ada data penggajian
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Periode</TableHead>
                                            <TableHead className="text-right">Gaji Pokok</TableHead>
                                            <TableHead className="text-right">Overtime</TableHead>
                                            <TableHead className="text-right">Total Pendapatan</TableHead>
                                            <TableHead className="text-right">Potongan</TableHead>
                                            <TableHead className="text-right">Upah Diterima</TableHead>
                                            <TableHead className="text-center">HK</TableHead>
                                            <TableHead className="text-center">Lembur</TableHead>
                                            <TableHead className="text-center">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {getMonthName(item.periodeBulan)} {item.periodeTahun}
                                                </TableCell>
                                                <TableCell className="text-right">Rp {formatCurrency(item.gajiPokok)}</TableCell>
                                                <TableCell className="text-right text-orange-600">Rp {formatCurrency(item.overtime)}</TableCell>
                                                <TableCell className="text-right">Rp {formatCurrency(item.totalSebelumPotongan)}</TableCell>
                                                <TableCell className="text-right text-red-600">-Rp {formatCurrency(item.totalPotongan)}</TableCell>
                                                <TableCell className="text-right font-bold text-green-600">Rp {formatCurrency(item.upahDiterima)}</TableCell>
                                                <TableCell className="text-center">{item.hkDibayar}/{item.hk}</TableCell>
                                                <TableCell className="text-center">{item.lemburJam} jam</TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDownloadPdf(item.id, item)}
                                                        disabled={downloadingPdfId === item.id}
                                                        title="Cetak Slip"
                                                    >
                                                        {downloadingPdfId === item.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Printer className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Logs Tab */}
                <TabsContent value="logs" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Log Perubahan Data</CardTitle>
                            <CardDescription>Riwayat perubahan data karyawan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {changeLogs.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Belum ada perubahan data
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {changeLogs.map((log) => (
                                        <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium">{log.fieldName}</p>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(log.changedAt).toLocaleDateString("id-ID", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm mt-1">
                                                    <span className="text-red-600 line-through">{log.oldDisplayValue || "-"}</span>
                                                    <span>→</span>
                                                    <span className="text-green-600 font-medium">{log.newDisplayValue || "-"}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">Oleh: {log.changedBy}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
