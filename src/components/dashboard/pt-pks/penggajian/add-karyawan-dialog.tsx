"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Users, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

interface Divisi {
    id: string;
    kode: string;
    nama: string;
}

interface Karyawan {
    id: string;
    namaKaryawan: string;
    divisi: Divisi | null;
    jabatan: { id: string; nama: string } | null;
    gajiPokok: number;
    isActive: boolean;
}

interface AddKaryawanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    defaultPeriodeBulan?: string;
    defaultPeriodeTahun?: string;
}

const currentYear = new Date().getFullYear();
const bulanOptions = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
];
const startYear = 2020;
const tahunOptions = Array.from({ length: 21 }, (_, i) => ({
    value: String(startYear + i),
    label: String(startYear + i),
}));

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value);
};

export function AddKaryawanDialog({
    open,
    onOpenChange,
    onSuccess,
    defaultPeriodeBulan,
    defaultPeriodeTahun,
}: AddKaryawanDialogProps) {
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [divisiList, setDivisiList] = useState<Divisi[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [filterDivisi, setFilterDivisi] = useState<string>("all");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [periodeBulan, setPeriodeBulan] = useState(
        defaultPeriodeBulan || String(new Date().getMonth() + 1)
    );
    const [periodeTahun, setPeriodeTahun] = useState(
        defaultPeriodeTahun || String(currentYear)
    );

    // Existing karyawan IDs in the selected period
    const [existingKaryawanIds, setExistingKaryawanIds] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [karyawanRes, divisiRes] = await Promise.all([
                fetch("/api/pt-pks/master-karyawan?isActive=true&limit=500"),
                fetch("/api/pt-pks/master-divisi?activeList=true"),
            ]);

            const karyawanData = await karyawanRes.json();
            const divisiData = await divisiRes.json();

            setKaryawanList(karyawanData.data || []);
            setDivisiList(divisiData.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Gagal memuat data karyawan");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch existing karyawan in the selected period
    const fetchExistingKaryawan = useCallback(async () => {
        if (!periodeBulan || !periodeTahun) return;

        try {
            const res = await fetch(
                `/api/pt-pks/penggajian?periodeBulan=${periodeBulan}&periodeTahun=${periodeTahun}&limit=1000`
            );
            const data = await res.json();
            const ids = new Set<string>(
                (data.data || []).map((item: { masterKaryawanId: string }) => item.masterKaryawanId)
            );
            setExistingKaryawanIds(ids);
        } catch (error) {
            console.error("Error fetching existing karyawan:", error);
        }
    }, [periodeBulan, periodeTahun]);

    useEffect(() => {
        if (open) {
            fetchData();
            setSelectedIds(new Set());
            setSearch("");
            setFilterDivisi("all");
        }
    }, [open, fetchData]);

    // Fetch existing karyawan when period changes
    useEffect(() => {
        if (open && periodeBulan && periodeTahun) {
            fetchExistingKaryawan();
        }
    }, [open, periodeBulan, periodeTahun, fetchExistingKaryawan]);

    // Filter karyawan based on search, divisi, and exclude existing
    const filteredKaryawan = karyawanList.filter((k) => {
        const matchSearch = k.namaKaryawan.toLowerCase().includes(search.toLowerCase());
        const matchDivisi = filterDivisi === "all" || k.divisi?.id === filterDivisi;
        const notExisting = !existingKaryawanIds.has(k.id);
        return matchSearch && matchDivisi && notExisting;
    });

    const handleToggle = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        const allIds = new Set(filteredKaryawan.map((k) => k.id));
        setSelectedIds(allIds);
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleSubmit = async () => {
        if (selectedIds.size === 0) {
            toast.error("Pilih minimal satu karyawan");
            return;
        }

        if (!periodeBulan || !periodeTahun) {
            toast.error("Pilih periode bulan dan tahun");
            return;
        }

        try {
            setSaving(true);
            const res = await fetch("/api/pt-pks/penggajian/add-karyawan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    karyawanIds: Array.from(selectedIds),
                    periodeBulan: parseInt(periodeBulan),
                    periodeTahun: parseInt(periodeTahun),
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Gagal menambahkan");

            toast.success(result.message);
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error("Error adding karyawan:", error);
            toast.error(error instanceof Error ? error.message : "Gagal menambahkan karyawan");
        } finally {
            setSaving(false);
        }
    };

    const getBulanLabel = (val: string) => bulanOptions.find((b) => b.value === val)?.label || val;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[90vw] h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>Tambah Karyawan</DialogTitle>
                </DialogHeader>

                <div className="p-6 pt-2 space-y-4 flex-1 flex flex-col min-h-0">
                    {/* Periode Selection */}
                    <div className="flex gap-4 items-end">
                        <div className="space-y-1">
                            <Label className="text-xs">Periode Bulan</Label>
                            <Select value={periodeBulan} onValueChange={setPeriodeBulan}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bulanOptions.map((b) => (
                                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Tahun</Label>
                            <Select value={periodeTahun} onValueChange={setPeriodeTahun}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Tahun" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[160px]">
                                    {tahunOptions.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                            Periode: {getBulanLabel(periodeBulan)} {periodeTahun}
                        </Badge>
                    </div>

                    {/* Filters & Bulk Actions */}
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1 max-w-lg">
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
                            className="w-[160px]"
                        />
                        <div className="flex gap-1 ml-auto">
                            <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                <CheckSquare className="h-4 w-4 mr-1" />
                                Pilih Semua
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                                <Square className="h-4 w-4 mr-1" />
                                Hapus Pilihan
                            </Button>
                        </div>
                    </div>

                    {/* Employee Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredKaryawan.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Tidak ada karyawan ditemukan
                        </div>
                    ) : (
                        <div className="border rounded-md overflow-hidden bg-background flex-1 min-h-0 flex flex-col">
                            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[40px] px-3"></TableHead>
                                            <TableHead className="text-xs font-bold py-2">Nama Karyawan</TableHead>
                                            <TableHead className="text-xs font-bold py-2">Divisi/Jabatan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredKaryawan.map((k) => (
                                            <TableRow
                                                key={k.id}
                                                className={`cursor-pointer transition-colors ${selectedIds.has(k.id) ? "bg-primary/5" : "hover:bg-muted/30"}`}
                                                onClick={() => handleToggle(k.id)}
                                            >
                                                <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={selectedIds.has(k.id)}
                                                        onCheckedChange={() => handleToggle(k.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <div className="font-medium text-sm">{k.namaKaryawan}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono">
                                                        Rp {formatCurrency(Number(k.gajiPokok))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <div className="text-[11px] font-medium text-gray-700">
                                                        {k.divisi?.nama || "-"}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {k.jabatan?.nama || "-"}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-sm text-muted-foreground">
                            {selectedIds.size} dari {filteredKaryawan.length} karyawan dipilih
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleSubmit} disabled={saving || selectedIds.size === 0}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Tambahkan {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
