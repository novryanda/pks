"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Receipt,
    Zap,
    Building,
    FileText,
    Users,
    CheckCircle,
    RotateCcw,
    Download,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

// Local type definitions (will match Prisma types after migration)
type StatusBiaya = "DRAFT" | "ACTIVE" | "PAID" | "CANCELLED";

type BiayaPengeluaran = {
    id: string;
    nomorBiaya: string;
    tanggalBiaya: string;
    kategoriBiaya: string;
    deskripsi: string;
    jumlahBiaya: number;
    periodeBulan: number | null;
    periodeTahun: number | null;
    keterangan: string | null;
    status: StatusBiaya;
    dibuatOleh: string;
    pengajuanBiayaOperasionalId?: string | null;
    pengajuanBiayaOperasional?: {
        nomorPengajuan: string;
        divisi: string;
    } | null;
    createdAt: string;
};

type Summary = {
    byKategori: { kategori: string; total: number; count: number }[];
    total: number;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

const KATEGORI_OPTIONS = [
    { value: "PLN", label: "Biaya PLN", icon: <Zap className="h-4 w-4" /> },
    { value: "OPERASIONAL_KEUANGAN", label: "Biaya Operasional Keuangan", icon: <Building className="h-4 w-4" /> },
    { value: "PPN", label: "PPN", icon: <FileText className="h-4 w-4" /> },
    { value: "PPH_21", label: "PPH 21 (Karyawan)", icon: <Users className="h-4 w-4" /> },
    { value: "PPH_22", label: "PPH 22 (Barang)", icon: <FileText className="h-4 w-4" /> },
    { value: "PPH_23", label: "PPH 23 (Jasa)", icon: <FileText className="h-4 w-4" /> },
    { value: "BPJS", label: "BPJS", icon: <Users className="h-4 w-4" /> },
];

const getKategoriLabel = (kategori: string): string => {
    const found = KATEGORI_OPTIONS.find((k) => k.value === kategori);
    return found?.label || kategori;
};

const STATUS_CONFIG: Record<StatusBiaya, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
    DRAFT: { label: "Draft", variant: "outline" },
    ACTIVE: { label: "Aktif", variant: "default" },
    PAID: { label: "Dibayar", variant: "secondary" },
    CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

const getStatusBadge = (status: StatusBiaya) => {
    const config = STATUS_CONFIG[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
};

const ITEMS_PER_PAGE = 10;

export function BiayaPengeluaranList() {
    const [data, setData] = useState<BiayaPengeluaran[]>([]);
    const [filteredData, setFilteredData] = useState<BiayaPengeluaran[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterKategori, setFilterKategori] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBiaya, setEditingBiaya] = useState<BiayaPengeluaran | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        tanggalBiaya: format(new Date(), "yyyy-MM-dd"),
        kategoriBiaya: "" as string,
        isCustomKategori: false,
        customKategori: "",
        deskripsi: "",
        jumlahBiaya: "",
        periodeBulan: "",
        periodeTahun: "",
        keterangan: "",
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/pt-pks/keuangan/biaya-pengeluaran");
            if (res.ok) {
                const biayaData = await res.json();
                setData(biayaData);
            }
        } catch (error) {
            console.error("Error fetching biaya:", error);
            toast.error("Gagal memuat data biaya pengeluaran");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSummary = useCallback(async () => {
        try {
            const res = await fetch("/api/pt-pks/keuangan/biaya-pengeluaran?summary=true");
            if (res.ok) {
                const summaryData = await res.json();
                setSummary(summaryData);
            }
        } catch (error) {
            console.error("Error fetching summary:", error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchSummary();
    }, [fetchData, fetchSummary]);

    useEffect(() => {
        let filtered = [...data];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.nomorBiaya.toLowerCase().includes(search) ||
                    item.deskripsi.toLowerCase().includes(search)
            );
        }

        if (filterKategori !== "all") {
            filtered = filtered.filter((item) => item.kategoriBiaya === filterKategori);
        }

        if (filterStatus !== "all") {
            filtered = filtered.filter((item) => item.status === filterStatus);
        }

        setFilteredData(filtered);
    }, [searchTerm, filterKategori, filterStatus, data]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterKategori, filterStatus]);

    const resetForm = () => {
        setFormData({
            tanggalBiaya: format(new Date(), "yyyy-MM-dd"),
            kategoriBiaya: "",
            isCustomKategori: false,
            customKategori: "",
            deskripsi: "",
            jumlahBiaya: "",
            periodeBulan: "",
            periodeTahun: "",
            keterangan: "",
        });
        setEditingBiaya(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setDialogOpen(true);
    };

    const openEditDialog = (biaya: BiayaPengeluaran) => {
        setEditingBiaya(biaya);
        const isCustom = !KATEGORI_OPTIONS.some(k => k.value === biaya.kategoriBiaya);
        setFormData({
            tanggalBiaya: format(new Date(biaya.tanggalBiaya), "yyyy-MM-dd"),
            kategoriBiaya: isCustom ? "custom" : biaya.kategoriBiaya,
            isCustomKategori: isCustom,
            customKategori: isCustom ? biaya.kategoriBiaya : "",
            deskripsi: biaya.deskripsi,
            jumlahBiaya: biaya.jumlahBiaya.toString(),
            periodeBulan: biaya.periodeBulan?.toString() || "",
            periodeTahun: biaya.periodeTahun?.toString() || "",
            keterangan: biaya.keterangan || "",
        });
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        const finalKategori = formData.kategoriBiaya === "custom" ? formData.customKategori : formData.kategoriBiaya;

        if (!finalKategori || !formData.deskripsi || !formData.jumlahBiaya) {
            toast.error("Kategori, deskripsi, dan jumlah biaya wajib diisi");
            return;
        }

        try {
            setSaving(true);
            const url = editingBiaya
                ? `/api/pt-pks/keuangan/biaya-pengeluaran/${editingBiaya.id}`
                : "/api/pt-pks/keuangan/biaya-pengeluaran";
            const method = editingBiaya ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tanggalBiaya: formData.tanggalBiaya,
                    kategoriBiaya: finalKategori,
                    deskripsi: formData.deskripsi,
                    jumlahBiaya: parseFloat(formData.jumlahBiaya),
                    periodeBulan: formData.periodeBulan ? parseInt(formData.periodeBulan, 10) : undefined,
                    periodeTahun: formData.periodeTahun ? parseInt(formData.periodeTahun, 10) : undefined,
                    keterangan: formData.keterangan || undefined,
                }),
            });

            if (res.ok) {
                toast.success(editingBiaya ? "Biaya berhasil diupdate" : "Biaya berhasil ditambahkan");
                setDialogOpen(false);
                resetForm();
                fetchData();
                fetchSummary();
            } else {
                const error = await res.json();
                toast.error(error.error || "Gagal menyimpan biaya");
            }
        } catch (error) {
            console.error("Error saving biaya:", error);
            toast.error("Gagal menyimpan biaya");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (biaya: BiayaPengeluaran) => {
        if (!confirm(`Hapus biaya ${biaya.nomorBiaya}?`)) return;

        try {
            const res = await fetch(`/api/pt-pks/keuangan/biaya-pengeluaran/${biaya.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Biaya berhasil dihapus");
                fetchData();
                fetchSummary();
            } else {
                toast.error("Gagal menghapus biaya");
            }
        } catch (error) {
            console.error("Error deleting biaya:", error);
            toast.error("Gagal menghapus biaya");
        }
    };

    const handleStatusChange = async (biaya: BiayaPengeluaran, action: "markAsPaid" | "reactivate") => {
        const confirmMessage = action === "markAsPaid"
            ? `Tandai biaya ${biaya.nomorBiaya} sebagai sudah dibayar?`
            : `Aktifkan kembali biaya ${biaya.nomorBiaya}?`;

        if (!confirm(confirmMessage)) return;

        try {
            const res = await fetch(`/api/pt-pks/keuangan/biaya-pengeluaran/${biaya.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                toast.success(action === "markAsPaid" ? "Biaya ditandai sudah dibayar" : "Biaya diaktifkan kembali");
                fetchData();
                fetchSummary();
            } else {
                toast.error("Gagal mengubah status biaya");
            }
        } catch (error) {
            console.error("Error changing status:", error);
            toast.error("Gagal mengubah status biaya");
        }
    };

    const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const pageStart = filteredData.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleExportExcel = () => {
        if (filteredData.length === 0) {
            toast.error("Tidak ada data untuk diexport");
            return;
        }

        const columns: ExportColumn[] = [
            { header: "Tanggal", key: "tanggalBiaya", width: 15 },
            { header: "No. Biaya", key: "nomorBiaya", width: 20 },
            { header: "Kategori", key: "kategoriLabel", width: 25 },
            { header: "Deskripsi", key: "deskripsi", width: 30 },
            { header: "Ref Pengajuan BO", key: "refPengajuan", width: 20 },
            { header: "Periode", key: "periode", width: 15 },
            { header: "Jumlah Biaya (Rp)", key: "jumlahBiaya", width: 18 },
            { header: "Status", key: "statusLabel", width: 15 },
            { header: "Dibuat Oleh", key: "dibuatOleh", width: 20 },
            { header: "Keterangan", key: "keterangan", width: 30 },
        ];

        const dataToExport = filteredData.map((item) => ({
            tanggalBiaya: format(new Date(item.tanggalBiaya), "dd/MM/yyyy"),
            nomorBiaya: item.nomorBiaya,
            kategoriLabel: getKategoriLabel(item.kategoriBiaya),
            deskripsi: item.deskripsi,
            refPengajuan: item.pengajuanBiayaOperasional?.nomorPengajuan || "-",
            periode: item.periodeBulan && item.periodeTahun ? `${item.periodeBulan}/${item.periodeTahun}` : "-",
            jumlahBiaya: item.jumlahBiaya,
            statusLabel: STATUS_CONFIG[item.status]?.label || item.status,
            dibuatOleh: item.dibuatOleh,
            keterangan: item.keterangan || "-",
        }));

        exportToExcel(dataToExport, columns, "Biaya_Pengeluaran");
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Biaya</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary?.total || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            {summary?.byKategori?.length || 0} kategori
                        </p>
                    </CardContent>
                </Card>

                {KATEGORI_OPTIONS.slice(0, 3).map((kat) => {
                    const katSummary = summary?.byKategori?.find((k) => k.kategori === kat.value);
                    return (
                        <Card key={kat.value}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{kat.label}</CardTitle>
                                {kat.icon}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(katSummary?.total || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {katSummary?.count || 0} transaksi
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Main Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Biaya Pengeluaran</CardTitle>
                            <CardDescription>
                                Pencatatan biaya operasional perusahaan (PLN, PPH, BPJS, dll)
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs">
                                <Download className="h-4 w-4" />
                                Export Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nomor atau deskripsi..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Select value={filterKategori} onValueChange={setFilterKategori}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {KATEGORI_OPTIONS.map((kat) => (
                                    <SelectItem key={kat.value} value={kat.value}>
                                        {kat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="ACTIVE">Aktif</SelectItem>
                                <SelectItem value="PAID">Dibayar</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>No. Biaya</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                    <TableHead>Periode</TableHead>
                                    <TableHead className="text-right">Jumlah</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            Memuat data...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            Tidak ada data biaya pengeluaran
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((biaya) => (
                                        <TableRow key={biaya.id}>
                                            <TableCell>
                                                {format(new Date(biaya.tanggalBiaya), "dd/MM/yyyy", {
                                                    locale: idLocale,
                                                })}
                                            </TableCell>
                                            <TableCell className="font-medium">{biaya.nomorBiaya}</TableCell>
                                            <TableCell>{getKategoriLabel(biaya.kategoriBiaya)}</TableCell>
                                            <TableCell className="max-w-[240px]">
                                                <div className="truncate font-medium">{biaya.deskripsi}</div>
                                                {(biaya.pengajuanBiayaOperasionalId || biaya.pengajuanBiayaOperasional || biaya.deskripsi.includes("[Pengajuan BO-")) && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900 mt-0.5">
                                                        Ref: {biaya.pengajuanBiayaOperasional?.nomorPengajuan || "Pengajuan BO"}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {biaya.periodeBulan && biaya.periodeTahun
                                                    ? `${biaya.periodeBulan}/${biaya.periodeTahun}`
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(biaya.jumlahBiaya)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(biaya.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-1">
                                                    {biaya.status === "ACTIVE" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 hover:text-green-700"
                                                            onClick={() => handleStatusChange(biaya, "markAsPaid")}
                                                            title="Tandai Dibayar"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {biaya.status === "PAID" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-orange-600 hover:text-orange-700"
                                                            onClick={() => handleStatusChange(biaya, "reactivate")}
                                                            title="Aktifkan Kembali"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditDialog(biaya)}
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDelete(biaya)}
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredData.length}
                        pageStart={pageStart}
                        pageEnd={pageEnd}
                        onPageChange={setCurrentPage}
                    />
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingBiaya ? "Edit Biaya Pengeluaran" : "Tambah Biaya Pengeluaran"}
                        </DialogTitle>
                        <DialogDescription>
                            Masukkan detail biaya pengeluaran operasional
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tanggal">Tanggal</Label>
                                <Input
                                    id="tanggal"
                                    type="date"
                                    value={formData.tanggalBiaya}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tanggalBiaya: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="kategori">Kategori *</Label>
                                <Select
                                    value={formData.kategoriBiaya}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            kategoriBiaya: value,
                                            isCustomKategori: value === "custom"
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {KATEGORI_OPTIONS.map((kat) => (
                                            <SelectItem key={kat.value} value={kat.value}>
                                                {kat.label}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="custom" className="text-primary font-medium italic">
                                            -- Input Manual / Lainnya --
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.isCustomKategori && (
                            <div className="space-y-2">
                                <Label htmlFor="customKategori">Nama Kategori Kustom *</Label>
                                <Input
                                    id="customKategori"
                                    value={formData.customKategori}
                                    onChange={(e) =>
                                        setFormData({ ...formData, customKategori: e.target.value })
                                    }
                                    placeholder="Contoh: Biaya Konsumsi, Service AC, dll"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="deskripsi">Deskripsi *</Label>
                            <Input
                                id="deskripsi"
                                value={formData.deskripsi}
                                onChange={(e) =>
                                    setFormData({ ...formData, deskripsi: e.target.value })
                                }
                                placeholder="Contoh: Tagihan PLN Januari 2026"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jumlah">Jumlah Biaya *</Label>
                            <Input
                                id="jumlah"
                                type="number"
                                value={formData.jumlahBiaya}
                                onChange={(e) =>
                                    setFormData({ ...formData, jumlahBiaya: e.target.value })
                                }
                                placeholder="0"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="periodeBulan">Periode Bulan</Label>
                                <Select
                                    value={formData.periodeBulan}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, periodeBulan: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih bulan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                {format(new Date(2024, i, 1), "MMMM", { locale: idLocale })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="periodeTahun">Periode Tahun</Label>
                                <Input
                                    id="periodeTahun"
                                    type="number"
                                    value={formData.periodeTahun}
                                    onChange={(e) =>
                                        setFormData({ ...formData, periodeTahun: e.target.value })
                                    }
                                    placeholder={new Date().getFullYear().toString()}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="keterangan">Keterangan</Label>
                            <Textarea
                                id="keterangan"
                                value={formData.keterangan}
                                onChange={(e) =>
                                    setFormData({ ...formData, keterangan: e.target.value })
                                }
                                placeholder="Keterangan tambahan (opsional)"
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving ? "Menyimpan..." : editingBiaya ? "Update" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
