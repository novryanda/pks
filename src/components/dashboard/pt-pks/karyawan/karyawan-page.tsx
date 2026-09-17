"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, Trash2, Search, Users, Building2, Briefcase, Eye } from "lucide-react";
import { toast } from "sonner";
import { DivisiManager } from "./divisi-manager";
import { JabatanManager } from "./jabatan-manager";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";
import { downloadMasterKaryawanPDF } from "@/lib/pdf/pt-pks/master-karyawan-pdf";
import { FileSpreadsheet, FileText } from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";

interface Divisi {
    id: string;
    kode: string;
    nama: string;
}

interface Jabatan {
    id: string;
    kode: string;
    nama: string;
    level: number | null;
    divisiId: string | null;
}

interface Karyawan {
    id: string;
    namaKaryawan: string;
    divisiId: string | null;
    jabatanId: string | null;
    divisi: Divisi | null;
    jabatan: Jabatan | null;
    gol: string | null;
    tktk: string | null;
    nomorRekening: string | null;
    noBpjsTk: string | null;
    noBpjsKesehatan: string | null;
    gajiPokok: number;
    tunjanganJabatan: number;
    tunjanganPerumahan: number;
    potBpjsTkJht: number;
    potBpjsTkJn: number;
    potBpjsKesehatan: number;
    tanggalMulaiKerja: string | null;
    tanggalKeluar: string | null;
    isActive: boolean;
}

interface KaryawanFormData {
    namaKaryawan: string;
    divisiId: string;
    jabatanId: string;
    gol: string;
    tktk: string;
    nomorRekening: string;
    noBpjsTk: string;
    noBpjsKesehatan: string;
    gajiPokok: number;
    tunjanganJabatan: number;
    tunjanganPerumahan: number;
    potBpjsTkJht: number;
    potBpjsTkJn: number;
    potBpjsKesehatan: number;
    tanggalMulaiKerja: string;
    isActive: boolean;
}

const initialFormData: KaryawanFormData = {
    namaKaryawan: "",
    divisiId: "",
    jabatanId: "",
    gol: "",
    tktk: "",
    nomorRekening: "",
    noBpjsTk: "",
    noBpjsKesehatan: "",
    gajiPokok: 0,
    tunjanganJabatan: 0,
    tunjanganPerumahan: 0,
    potBpjsTkJht: 0,
    potBpjsTkJn: 0,
    potBpjsKesehatan: 0,
    tanggalMulaiKerja: "",
    isActive: true,
};

const ITEMS_PER_PAGE = 25;

export function KaryawanPage() {
    const router = useRouter();
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [divisiList, setDivisiList] = useState<Divisi[]>([]);
    const [jabatanList, setJabatanList] = useState<Jabatan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterDivisi, setFilterDivisi] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<KaryawanFormData>(initialFormData);
    const [saving, setSaving] = useState(false);

    const fetchKaryawan = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (filterDivisi && filterDivisi !== "all") params.append("divisiId", filterDivisi);
            if (filterStatus && filterStatus !== "all") params.append("isActive", filterStatus);

            const res = await fetch(`/api/pt-pks/master-karyawan?${params}`);
            const data = await res.json();
            setKaryawanList(data.data || []);
        } catch (error) {
            console.error("Error fetching karyawan:", error);
            toast.error("Gagal memuat data karyawan");
        } finally {
            setLoading(false);
        }
    }, [search, filterDivisi, filterStatus]);

    const fetchDivisiJabatan = useCallback(async () => {
        try {
            const [divisiRes, jabatanRes] = await Promise.all([
                fetch("/api/pt-pks/master-divisi?activeList=true"),
                fetch("/api/pt-pks/master-jabatan?activeList=true"),
            ]);
            const divisiData = await divisiRes.json();
            const jabatanData = await jabatanRes.json();
            setDivisiList(divisiData.data || []);
            setJabatanList(jabatanData.data || []);
        } catch (error) {
            console.error("Error fetching divisi/jabatan:", error);
        }
    }, []);

    useEffect(() => {
        fetchKaryawan();
        fetchDivisiJabatan();
    }, [fetchKaryawan, fetchDivisiJabatan]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterDivisi, filterStatus, karyawanList.length]);

    const handleOpenDialog = (karyawan?: Karyawan) => {
        if (karyawan) {
            setEditingId(karyawan.id);
            setFormData({
                namaKaryawan: karyawan.namaKaryawan,
                divisiId: karyawan.divisiId || "",
                jabatanId: karyawan.jabatanId || "",
                gol: karyawan.gol || "",
                tktk: karyawan.tktk || "",
                nomorRekening: karyawan.nomorRekening || "",
                noBpjsTk: karyawan.noBpjsTk || "",
                noBpjsKesehatan: karyawan.noBpjsKesehatan || "",
                gajiPokok: Number(karyawan.gajiPokok) || 0,
                tunjanganJabatan: Number(karyawan.tunjanganJabatan) || 0,
                tunjanganPerumahan: Number(karyawan.tunjanganPerumahan) || 0,
                potBpjsTkJht: Number(karyawan.potBpjsTkJht) || 0,
                potBpjsTkJn: Number(karyawan.potBpjsTkJn) || 0,
                potBpjsKesehatan: Number(karyawan.potBpjsKesehatan) || 0,
                tanggalMulaiKerja: karyawan.tanggalMulaiKerja?.split("T")[0] || "",
                isActive: karyawan.isActive,
            });
        } else {
            setEditingId(null);
            setFormData(initialFormData);
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        // Validation for all fields
        const requiredFields: { key: keyof KaryawanFormData; label: string }[] = [
            { key: "namaKaryawan", label: "Nama Karyawan" },
            { key: "divisiId", label: "Divisi" },
            { key: "jabatanId", label: "Jabatan" },
            { key: "gol", label: "Golongan" },
            { key: "tktk", label: "Status Keluarga" },
            { key: "nomorRekening", label: "No. Rekening" },
            { key: "noBpjsTk", label: "No. BPJS TK" },
            { key: "noBpjsKesehatan", label: "No. BPJS Kesehatan" },
            { key: "tanggalMulaiKerja", label: "Tanggal Mulai Kerja" },
        ];

        for (const field of requiredFields) {
            const value = formData[field.key];
            if (typeof value === "string" && !value.trim()) {
                toast.error(`${field.label} wajib diisi`);
                return;
            }
        }

        // Additional validation for numeric fields if they must be > 0 (optional based on requirement "wajib diisi")
        // But "wajib diisi" usually implies a value must be provided. 
        // For numbers, 0 might be valid but let's assume they must be provided.
        if (formData.gajiPokok <= 0) {
            toast.error("Gaji Pokok wajib diisi");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                divisiId: formData.divisiId || null,
                jabatanId: formData.jabatanId || null,
                tanggalMulaiKerja: formData.tanggalMulaiKerja || null,
            };

            const url = editingId
                ? `/api/pt-pks/master-karyawan/${editingId}`
                : "/api/pt-pks/master-karyawan";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Gagal menyimpan");

            toast.success(editingId ? "Karyawan berhasil diupdate" : "Karyawan berhasil ditambahkan");
            setDialogOpen(false);
            fetchKaryawan();
        } catch (error) {
            console.error("Error saving:", error);
            toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus karyawan ini?")) return;

        try {
            const res = await fetch(`/api/pt-pks/master-karyawan/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal menghapus");
            }
            toast.success("Karyawan berhasil dihapus");
            fetchKaryawan();
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error(error instanceof Error ? error.message : "Gagal menghapus");
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleExportExcel = () => {
        if (karyawanList.length === 0) {
            toast.error("Tidak ada data untuk diexport");
            return;
        }

        const columns: ExportColumn[] = [
            { header: "Nama Karyawan", key: "namaKaryawan", width: 30 },
            { header: "Divisi", key: "divisi.nama", width: 20 },
            { header: "Jabatan", key: "jabatan.nama", width: 20 },
            { header: "Golongan", key: "gol", width: 10 },
            { header: "Status Keluarga", key: "tktk", width: 15 },
            { header: "No. Rekening", key: "nomorRekening", width: 20 },
            { header: "No. BPJS TK", key: "noBpjsTk", width: 20 },
            { header: "No. BPJS Kesehatan", key: "noBpjsKesehatan", width: 20 },
            { header: "Gaji Pokok", key: "gajiPokok", width: 15 },
            { header: "Tunjangan Jabatan", key: "tunjanganJabatan", width: 20 },
            { header: "Tunjangan Perumahan", key: "tunjanganPerumahan", width: 20 },
            { header: "Tanggal Mulai Kerja", key: "tanggalMulaiKerja", width: 20 },
            { header: "Status", key: "isActive", width: 10 },
        ];

        const exportData = karyawanList.map((k) => ({
            ...k,
            isActive: k.isActive ? "Aktif" : "Non-Aktif",
            tanggalMulaiKerja: k.tanggalMulaiKerja?.split("T")[0] || "-",
        }));

        exportToExcel(exportData, columns, "Data_Karyawan", "Karyawan");
        toast.success("Excel berhasil diunduh");
    };

    const handleExportPdf = async () => {
        if (karyawanList.length === 0) {
            toast.error("Tidak ada data untuk diexport");
            return;
        }

        try {
            toast.loading("Menyiapkan PDF...", { id: "export-pdf" });
            await downloadMasterKaryawanPDF(karyawanList);
            toast.success("PDF berhasil diunduh", { id: "export-pdf" });
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Gagal mengunduh PDF", { id: "export-pdf" });
        }
    };

    const totalPages = Math.max(1, Math.ceil(karyawanList.length / ITEMS_PER_PAGE));
    const paginatedKaryawanList = karyawanList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const groupedPaginatedKaryawan = Object.entries(
        paginatedKaryawanList.reduce((acc, k) => {
            const divisiName = k.divisi?.nama || "Tanpa Divisi";
            if (!acc[divisiName]) acc[divisiName] = [];
            acc[divisiName].push(k);
            return acc;
        }, {} as Record<string, Karyawan[]>)
    );
    const pageStart = karyawanList.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, karyawanList.length);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Master Karyawan</h1>
                <p className="text-muted-foreground">Kelola data karyawan, divisi, dan jabatan</p>
            </div>

            <Tabs defaultValue="karyawan" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="karyawan" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Karyawan
                    </TabsTrigger>
                    <TabsTrigger value="divisi" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Divisi
                    </TabsTrigger>
                    <TabsTrigger value="jabatan" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Jabatan
                    </TabsTrigger>
                </TabsList>

                {/* Karyawan Tab */}
                <TabsContent value="karyawan" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Daftar Karyawan
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={handleExportExcel}>
                                        <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                                        Excel
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleExportPdf}>
                                        <FileText className="mr-2 h-4 w-4 text-red-600" />
                                        PDF
                                    </Button>
                                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" onClick={() => handleOpenDialog()}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Tambah Karyawan
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>{editingId ? "Edit Karyawan" : "Tambah Karyawan"}</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                {/* Basic Info */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-2">
                                                        <Label>Nama Karyawan *</Label>
                                                        <Input
                                                            value={formData.namaKaryawan}
                                                            onChange={(e) => setFormData({ ...formData, namaKaryawan: e.target.value })}
                                                            placeholder="Nama lengkap karyawan"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Divisi *</Label>
                                                        <SearchableSelect
                                                            options={divisiList.map((d) => ({ value: d.id, label: d.nama }))}
                                                            value={formData.divisiId}
                                                            onValueChange={(v) => {
                                                                setFormData({
                                                                    ...formData,
                                                                    divisiId: v,
                                                                    jabatanId: "" // Reset jabatan when divisi changes
                                                                });
                                                            }}
                                                            placeholder="Pilih Divisi"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Jabatan *</Label>
                                                        <SearchableSelect
                                                            options={jabatanList
                                                                .filter((j) => j.divisiId === formData.divisiId || !j.divisiId)
                                                                .map((j) => ({ value: j.id, label: j.nama }))}
                                                            value={formData.jabatanId}
                                                            onValueChange={(v) => setFormData({ ...formData, jabatanId: v })}
                                                            placeholder={formData.divisiId ? "Pilih Jabatan" : "Pilih Divisi Terlebih Dahulu"}
                                                            disabled={!formData.divisiId}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Golongan *</Label>
                                                        <Input
                                                            value={formData.gol}
                                                            onChange={(e) => setFormData({ ...formData, gol: e.target.value })}
                                                            placeholder="Golongan"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Status Keluarga *</Label>
                                                        <Select
                                                            value={formData.tktk}
                                                            onValueChange={(v) => setFormData({ ...formData, tktk: v })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih Status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="TK">TK</SelectItem>
                                                                <SelectItem value="K0">K0</SelectItem>
                                                                <SelectItem value="K1">K1</SelectItem>
                                                                <SelectItem value="K2">K2</SelectItem>
                                                                <SelectItem value="K3">K3</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Rekening & BPJS */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <Label>No. Rekening *</Label>
                                                        <Input
                                                            value={formData.nomorRekening}
                                                            onChange={(e) => setFormData({ ...formData, nomorRekening: e.target.value })}
                                                            placeholder="Nomor rekening"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>No. BPJS TK *</Label>
                                                        <Input
                                                            value={formData.noBpjsTk}
                                                            onChange={(e) => setFormData({ ...formData, noBpjsTk: e.target.value })}
                                                            placeholder="No. BPJS TK"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>No. BPJS Kesehatan *</Label>
                                                        <Input
                                                            value={formData.noBpjsKesehatan}
                                                            onChange={(e) => setFormData({ ...formData, noBpjsKesehatan: e.target.value })}
                                                            placeholder="No. BPJS Kesehatan"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Salary */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <Label>Gaji Pokok *</Label>
                                                        <NumericInput
                                                            value={formData.gajiPokok}
                                                            onValueChange={(v) => setFormData({ ...formData, gajiPokok: v })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Tunjangan Jabatan *</Label>
                                                        <NumericInput
                                                            value={formData.tunjanganJabatan}
                                                            onValueChange={(v) => setFormData({ ...formData, tunjanganJabatan: v })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Tunjangan Perumahan *</Label>
                                                        <NumericInput
                                                            value={formData.tunjanganPerumahan}
                                                            onValueChange={(v) => setFormData({ ...formData, tunjanganPerumahan: v })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* BPJS Nominal */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <Label>BPJS TK JHT *</Label>
                                                        <NumericInput
                                                            value={formData.potBpjsTkJht}
                                                            onValueChange={(v) => setFormData({ ...formData, potBpjsTkJht: v })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>BPJS TK JN *</Label>
                                                        <NumericInput
                                                            value={formData.potBpjsTkJn}
                                                            onValueChange={(v) => setFormData({ ...formData, potBpjsTkJn: v })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>BPJS Kesehatan *</Label>
                                                        <NumericInput
                                                            value={formData.potBpjsKesehatan}
                                                            onValueChange={(v) => setFormData({ ...formData, potBpjsKesehatan: v })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Status */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Tanggal Mulai Kerja *</Label>
                                                        <Input
                                                            type="date"
                                                            value={formData.tanggalMulaiKerja}
                                                            onChange={(e) => setFormData({ ...formData, tanggalMulaiKerja: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2 pt-6">
                                                        <Switch
                                                            checked={formData.isActive}
                                                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                                        />
                                                        <Label>Karyawan Aktif</Label>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-2 pt-4">
                                                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                                                    <Button onClick={handleSave} disabled={saving}>
                                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Simpan
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama karyawan..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <SearchableSelect
                                    options={[
                                        { value: "all", label: "Semua Divisi" },
                                        ...divisiList.map((d) => ({ value: d.id, label: d.nama }))
                                    ]}
                                    value={filterDivisi}
                                    onValueChange={setFilterDivisi}
                                    placeholder="Filter Divisi"
                                    className="w-[180px]"
                                />
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua</SelectItem>
                                        <SelectItem value="true">Aktif</SelectItem>
                                        <SelectItem value="false">Non-Aktif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : karyawanList.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Tidak ada data karyawan
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama Karyawan</TableHead>
                                                    <TableHead>Divisi</TableHead>
                                                    <TableHead>Jabatan</TableHead>
                                                    <TableHead>Status Keluarga</TableHead>
                                                    <TableHead>Gaji Pokok</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {groupedPaginatedKaryawan.map(([divisiName, group]) => (
                                                    <React.Fragment key={divisiName}>
                                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                            <TableCell colSpan={7} className="py-1 px-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold px-2 py-0 h-5">
                                                                        {divisiName}
                                                                    </Badge>
                                                                    <div className="h-[1px] flex-1 bg-border/50" />
                                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 min-w-[20px] pointer-events-none">
                                                                        {group.length}
                                                                    </Badge>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                        {group.map((k) => (
                                                            <TableRow key={k.id} className="hover:bg-muted/50 transition-colors">
                                                                <TableCell
                                                                    className="font-medium cursor-pointer hover:text-primary hover:underline py-2"
                                                                    onClick={() => router.push(`/dashboard/pt-pks/master/karyawan/${k.id}`)}
                                                                >
                                                                    {k.namaKaryawan}
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4 border-muted-foreground/20 text-muted-foreground">
                                                                        {k.divisi?.id || "-"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="py-2 text-sm">{k.jabatan?.nama || "-"}</TableCell>
                                                                <TableCell className="py-2">
                                                                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4">
                                                                        {k.tktk || "-"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="py-2 text-sm">{formatCurrency(Number(k.gajiPokok))}</TableCell>
                                                                <TableCell className="py-2">
                                                                    <Badge
                                                                        variant={k.isActive ? "default" : "secondary"}
                                                                        className={`text-[10px] px-1.5 py-0 h-4 ${k.isActive ? "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20" : ""}`}
                                                                    >
                                                                        {k.isActive ? "Aktif" : "Non-Aktif"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right py-2">
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
                                                                            onClick={() => router.push(`/dashboard/pt-pks/master/karyawan/${k.id}`)}
                                                                            title="Lihat Detail"
                                                                        >
                                                                            <Eye className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
                                                                            onClick={() => handleOpenDialog(k)}
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                                                                            onClick={() => handleDelete(k.id)}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <TablePagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={karyawanList.length}
                                        pageStart={pageStart}
                                        pageEnd={pageEnd}
                                        onPageChange={setCurrentPage}
                                    />
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Divisi Tab */}
                <TabsContent value="divisi">
                    <Card>
                        <CardContent className="pt-6">
                            <DivisiManager onDataChange={fetchDivisiJabatan} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Jabatan Tab */}
                <TabsContent value="jabatan">
                    <Card>
                        <CardContent className="pt-6">
                            <JabatanManager onDataChange={fetchDivisiJabatan} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
