"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Loader2, Plus, Pencil, Trash2, Building2, Search, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/table-pagination";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

interface Divisi {
    id: string;
    nama: string;
    isActive: boolean;
}

interface DivisiFormData {
    id: string;
    nama: string;
    isActive: boolean;
}

const initialFormData: DivisiFormData = {
    id: "",
    nama: "",
    isActive: true,
};

interface DivisiManagerProps {
    onDataChange?: () => void;
}

const ITEMS_PER_PAGE = 25;

export function DivisiManager({ onDataChange }: DivisiManagerProps) {
    const [data, setData] = useState<Divisi[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<DivisiFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const fetchData = useCallback(async (searchQuery?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            const res = await fetch(`/api/pt-pks/master-divisi?${params}`);
            const result = await res.json();
            setData(result.data || []);
        } catch (error) {
            console.error("Error fetching divisi:", error);
            toast.error("Gagal memuat data divisi");
        } finally {
            setLoading(false);
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
        return () => {
            debouncedFetch.cancel();
        };
    }, [debouncedFetch]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, data.length]);

    const handleOpenDialog = (divisi?: Divisi) => {
        if (divisi) {
            setEditingId(divisi.id);
            setFormData({
                id: divisi.id,
                nama: divisi.nama,
                isActive: divisi.isActive,
            });
        } else {
            setEditingId(null);
            setFormData(initialFormData);
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.id.trim()) {
            toast.error("ID divisi wajib diisi");
            return;
        }
        if (!formData.nama.trim()) {
            toast.error("Nama divisi wajib diisi");
            return;
        }

        try {
            setSaving(true);
            const url = editingId
                ? `/api/pt-pks/master-divisi/${editingId}`
                : "/api/pt-pks/master-divisi";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Gagal menyimpan");

            toast.success(editingId ? "Divisi berhasil diupdate" : "Divisi berhasil ditambahkan");
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
        if (!confirm("Yakin ingin menghapus divisi ini?")) return;

        try {
            const res = await fetch(`/api/pt-pks/master-divisi/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || "Gagal menghapus");
            }
            toast.success("Divisi berhasil dihapus");
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
    const pageStart = data.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, data.length);

    const handleExportExcel = () => {
        if (data.length === 0) return;

        const columns: ExportColumn[] = [
            { header: "Kode Divisi", key: "id", width: 15 },
            { header: "Nama Divisi", key: "nama", width: 30 },
            { header: "Status", key: "statusLabel", width: 15 },
        ];

        const dataToExport = data.map((d) => ({
            id: d.id,
            nama: d.nama,
            statusLabel: d.isActive ? "Aktif" : "Nonaktif",
        }));

        exportToExcel(dataToExport, columns, `Master_Divisi_${new Date().toISOString().split("T")[0]}`, "Divisi");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Master Divisi</h3>
                    <Badge variant="secondary">{data.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-[200px]">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Cari divisi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 h-8 text-xs"
                        />
                    </div>
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
                                <DialogTitle>{editingId ? "Edit Divisi" : "Tambah Divisi"}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>ID/Kode Divisi *</Label>
                                    <Input
                                        value={formData.id}
                                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                        placeholder="Contoh: 01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nama Divisi *</Label>
                                    <Input
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        placeholder="Contoh: Divisi Kebun"
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
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data divisi</p>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Kode</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead className="w-[80px]">Status</TableHead>
                                    <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{item.id}</TableCell>
                                        <TableCell className="font-medium text-sm">{item.nama}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={item.isActive ? "default" : "secondary"}
                                                className={`text-[10px] px-1.5 py-0 h-4 ${item.isActive ? "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20" : ""}`}
                                            >
                                                {item.isActive ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(item)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
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
