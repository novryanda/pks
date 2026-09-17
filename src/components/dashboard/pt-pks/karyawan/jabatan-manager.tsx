"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import debounce from "lodash.debounce";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Loader2, Plus, Pencil, Trash2, Briefcase, Search, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/table-pagination";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

interface Divisi {
    id: string;
    nama: string;
}

interface Jabatan {
    id: string;
    nama: string;
    divisiId: string;
    divisi: Divisi;
    isActive: boolean;
}

interface JabatanFormData {
    id: string;
    nama: string;
    divisiId: string;
    isActive: boolean;
}

const initialFormData: JabatanFormData = {
    id: "",
    nama: "",
    divisiId: "",
    isActive: true,
};

interface JabatanManagerProps {
    onDataChange?: () => void;
}

const ITEMS_PER_PAGE = 25;

export function JabatanManager({ onDataChange }: JabatanManagerProps) {
    const [data, setData] = useState<Jabatan[]>([]);
    const [divisiList, setDivisiList] = useState<Divisi[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<JabatanFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [filterDivisi, setFilterDivisi] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const fetchData = useCallback(async (searchQuery?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            // This table paginates on the client, so fetch the full dataset
            // instead of the API default first 50 rows.
            params.append("limit", "100");
            if (filterDivisi && filterDivisi !== "all") {
                params.append("divisiId", filterDivisi);
            }
            if (searchQuery) {
                params.append("search", searchQuery);
            }
            const res = await fetch(`/api/pt-pks/master-jabatan?${params}`);
            const result = await res.json();
            setData(result.data || []);
        } catch (error) {
            console.error("Error fetching jabatan:", error);
            toast.error("Gagal memuat data jabatan");
        } finally {
            setLoading(false);
        }
    }, [filterDivisi]);

    const fetchDivisiList = useCallback(async () => {
        try {
            const res = await fetch("/api/pt-pks/master-divisi?activeList=true");
            const result = await res.json();
            setDivisiList(result.data || []);
        } catch (error) {
            console.error("Error fetching divisi:", error);
        }
    }, []);

    const debouncedFetch = useMemo(
        () => debounce((q: string) => fetchData(q), 500),
        [fetchData]
    );

    useEffect(() => {
        debouncedFetch(search);
        return () => debouncedFetch.cancel();
    }, [search, debouncedFetch]);

    useEffect(() => {
        fetchDivisiList();
    }, [fetchDivisiList]);

    useEffect(() => {
        return () => {
            debouncedFetch.cancel();
        };
    }, [debouncedFetch]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterDivisi, data.length]);

    const handleOpenDialog = (jabatan?: Jabatan) => {
        if (jabatan) {
            setEditingId(jabatan.id);
            setFormData({
                id: jabatan.id,
                nama: jabatan.nama,
                divisiId: jabatan.divisiId,
                isActive: jabatan.isActive,
            });
        } else {
            setEditingId(null);
            setFormData(initialFormData);
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.id.trim()) {
            toast.error("ID jabatan wajib diisi");
            return;
        }
        if (!formData.divisiId) {
            toast.error("Divisi wajib dipilih");
            return;
        }
        if (!formData.nama.trim()) {
            toast.error("Nama jabatan wajib diisi");
            return;
        }

        try {
            setSaving(true);
            const url = editingId
                ? `/api/pt-pks/master-jabatan/${editingId}`
                : "/api/pt-pks/master-jabatan";
            const method = editingId ? "PUT" : "POST";

            const payload = {
                ...formData,
                divisiId: formData.divisiId || null,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Gagal menyimpan");

            toast.success(editingId ? "Jabatan berhasil diupdate" : "Jabatan berhasil ditambahkan");
            setDialogOpen(false);
            fetchData();
            onDataChange?.();
        } catch (error) {
            console.error("Error saving:", error);
            toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus jabatan ini?")) return;

        try {
            const res = await fetch(`/api/pt-pks/master-jabatan/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || "Gagal menghapus");
            }
            toast.success("Jabatan berhasil dihapus");
            fetchData();
            onDataChange?.();
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error(error instanceof Error ? error.message : "Gagal menghapus");
        }
    };

    const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
    const paginatedData = data.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const groupedPaginatedData = Object.entries(
        paginatedData.reduce((acc, item) => {
            const divisiName = item.divisi?.nama || "Tanpa Divisi";
            if (!acc[divisiName]) acc[divisiName] = [];
            acc[divisiName].push(item);
            return acc;
        }, {} as Record<string, Jabatan[]>)
    );
    const pageStart = data.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, data.length);

    const handleExportExcel = () => {
        if (data.length === 0) return;

        const columns: ExportColumn[] = [
            { header: "Kode Jabatan", key: "id", width: 15 },
            { header: "Nama Jabatan", key: "nama", width: 30 },
            { header: "Divisi", key: "divisiNama", width: 25 },
            { header: "Status", key: "statusLabel", width: 15 },
        ];

        const dataToExport = data.map((j) => ({
            id: j.id,
            nama: j.nama,
            divisiNama: j.divisi?.nama || "-",
            statusLabel: j.isActive ? "Aktif" : "Nonaktif",
        }));

        exportToExcel(dataToExport, columns, `Master_Jabatan_${new Date().toISOString().split("T")[0]}`, "Jabatan");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Master Jabatan</h3>
                    <Badge variant="secondary">{data.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-[180px]">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Cari jabatan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-8 text-xs"
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
                    <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={data.length === 0}>
                        <FileSpreadsheet className="mr-1 h-4 w-4 text-green-600" />
                        Excel
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={() => handleOpenDialog()}>
                                <Plus className="mr-1 h-4 w-4" />
                                Tambah
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Edit Jabatan" : "Tambah Jabatan"}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>ID/Kode Jabatan *</Label>
                                    <Input
                                        value={formData.id}
                                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                        placeholder="Contoh: DIR-01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Divisi *</Label>
                                    <SearchableSelect
                                        options={divisiList.map((d) => ({ value: d.id, label: d.nama }))}
                                        value={formData.divisiId}
                                        onValueChange={(v) => setFormData({ ...formData, divisiId: v })}
                                        placeholder="Pilih Divisi"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Nama Jabatan *</Label>
                                    <Input
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        placeholder="Contoh: Mandor Kebun"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                    />
                                    <Label>Aktif</Label>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
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

            {loading ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : data.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data jabatan</p>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-[120px]">Kode</TableHead>
                                    <TableHead>Nama Jabatan</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedPaginatedData.map(([divisiName, group]) => (
                                    <React.Fragment key={divisiName}>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableCell colSpan={4} className="py-1 px-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold px-2 py-0 h-5">
                                                        {divisiName}
                                                    </Badge>
                                                    <div className="h-[1px] flex-1 bg-border/50" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {group.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-mono text-[10px] text-muted-foreground py-2">{item.id}</TableCell>
                                                <TableCell className="font-medium text-sm py-2">{item.nama}</TableCell>
                                                <TableCell className="py-2">
                                                    <Badge
                                                        variant={item.isActive ? "default" : "secondary"}
                                                        className={`text-[10px] px-1.5 py-0 h-4 ${item.isActive ? "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20" : ""}`}
                                                    >
                                                        {item.isActive ? "Aktif" : "Nonaktif"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right py-2">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
                                                            onClick={() => handleOpenDialog(item)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                                                            onClick={() => handleDelete(item.id)}
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
                        totalItems={data.length}
                        pageStart={pageStart}
                        pageEnd={pageEnd}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
}
