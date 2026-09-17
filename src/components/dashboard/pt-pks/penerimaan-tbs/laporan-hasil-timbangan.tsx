"use client";

import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    FileSpreadsheet,
    FileText,
    Download,
    Calendar,
    Scale,
    Printer,
    Search,
    X,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Pencil,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { exportToExcel } from "@/lib/export-excel";
import type { ExportColumn } from "@/lib/export-excel";
import { formatDateInJakarta, formatTimeInJakarta } from "@/lib/date-time";
import { buildPaginationItems } from "@/lib/pagination";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { PenerimaanEditForm } from "@/components/dashboard/pt-pks/pembayaran-supplier/penerimaan-edit-form";
import {
    type LaporanHasilTimbanganSortDirection,
    type LaporanHasilTimbanganSortField,
    sortLaporanHasilTimbangan,
} from "@/lib/laporan-hasil-timbangan-sort";

type PenerimaanTBS = {
    id: string;
    nomorPenerimaan: string;
    tanggalTerima: string;
    operatorPenimbang?: string | null;
    waktuTimbangBruto?: string | null;
    waktuTimbangTarra?: string | null;
    beratBruto: number;
    beratTarra: number;
    beratNetto1: number;
    potonganPersen: number;
    potonganKg: number;
    beratNetto2: number;
    jenisBuah?: string | null;
    lokasiKebun?: string | null;
    upahBongkar?: number;
    totalUpahBongkar?: number;
    supplier: {
        ownerName: string;
        companyName?: string | null;
        npwp: string;
    };
    transporter: {
        nomorKendaraan: string;
        namaSupir: string;
    };
    material: {
        name: string;
        kategori: { name: string };
        satuan: { name: string };
    };
    vendorBongkar?: {
        id: string;
        code: string;
        name: string;
        tipe: string;
    } | null;
    selectedVendorBongkarBank?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    } | null;
};

type PenerimaanEditData = ComponentProps<typeof PenerimaanEditForm>["data"];
type LaporanHasilTimbanganResponse = PenerimaanTBS[];

const formatNumber = (num: number) => num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const formatDate = (dateString: string) => {
    return formatDateInJakarta(dateString);
};

const formatTime = (dateString?: string | null) => {
    return formatTimeInJakarta(dateString);
};

const getJenisBuahLabel = (jenis?: string | null) => {
    switch (jenis) {
        case "TBS-BB": return "Buah Besar";
        case "TBS-BS": return "Buah Biasa";
        case "TBS-BK": return "Buah Kecil";
        default: return jenis ?? "-";
    }
};

const getSupplierDisplayName = (supplier: PenerimaanTBS["supplier"]) =>
    supplier.companyName?.trim() ?? supplier.ownerName;

const ITEMS_PER_PAGE = 25;

export function LaporanHasilTimbangan() {
    const { hasActionAccess } = useUserPermissions();
    const [data, setData] = useState<PenerimaanTBS[]>([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [showBongkar, setShowBongkar] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<LaporanHasilTimbanganSortField | null>(null);
    const [sortDirection, setSortDirection] =
        useState<LaporanHasilTimbanganSortDirection>("asc");
    const [editingData, setEditingData] = useState<PenerimaanEditData | null>(null);
    const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

    const canEdit = hasActionAccess("supplyChain.penerimaanTbs", "edit");

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);

            const res = await fetch(`/api/pt-pks/penerimaan-tbs/export-laporan?${params.toString()}`);
            if (res.ok) {
                const result = (await res.json()) as LaporanHasilTimbanganResponse;
                setData(result);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, data.length, sortBy, sortDirection]);

    const handleFilter = () => {
        void fetchData();
    };

    const handlePrintSlip = (id: string) => {
        window.open(`/api/pt-pks/penerimaan-tbs/${id}/slip-tiket`, "_blank");
    };

    const handleOpenEdit = async (id: string) => {
        setLoadingEditId(id);
        try {
            const res = await fetch(`/api/pt-pks/penerimaan-tbs?id=${id}`);
            if (!res.ok) {
                throw new Error("Gagal memuat detail penerimaan TBS");
            }

            const result = (await res.json()) as PenerimaanEditData;
            setEditingData(result);
        } catch (error) {
            console.error("Error fetching penerimaan detail:", error);
            alert(error instanceof Error ? error.message : "Gagal memuat detail penerimaan TBS");
        } finally {
            setLoadingEditId(null);
        }
    };

    const handleCloseEdit = () => {
        setEditingData(null);
        setLoadingEditId(null);
    };

    const handleEditSuccess = async () => {
        handleCloseEdit();
        await fetchData();
    };

    const handleSort = (field: LaporanHasilTimbanganSortField) => {
        setCurrentPage(1);

        if (sortBy === field) {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortBy(field);
        setSortDirection("asc");
    };

    const handleExportExcel = () => {
        if (sortedFilteredData.length === 0) {
            alert("Tidak ada data untuk diexport");
            return;
        }

        const columns: ExportColumn[] = [
            { header: "No", key: "no", width: 5 },
            { header: "No Penerimaan", key: "nomorPenerimaan", width: 15 },
            { header: "Tanggal", key: "tanggal", width: 12 },
            { header: "Jam Masuk", key: "jamMasuk", width: 10 },
            { header: "Jam Keluar", key: "jamKeluar", width: 10 },
            { header: "Supplier", key: "supplier", width: 25 },
            { header: "Operator", key: "operator", width: 20 },
            { header: "Kendaraan", key: "kendaraan", width: 12 },
            { header: "Supir", key: "supir", width: 20 },
            { header: "Lokasi Kebun", key: "lokasiKebun", width: 20 },
            { header: "Jenis Buah", key: "jenisBuah", width: 12 },
            { header: "Bruto (kg)", key: "beratBruto", width: 12 },
            { header: "Tarra (kg)", key: "beratTarra", width: 12 },
            { header: "Netto 1 (kg)", key: "beratNetto1", width: 12 },
            { header: "Pot %", key: "potonganPersen", width: 8 },
            { header: "Pot (kg)", key: "potonganKg", width: 10 },
            { header: "Netto Final (kg)", key: "beratNetto2", width: 15 },
            ...(showBongkar ? [
                { header: "Vendor Bongkar", key: "vendorBongkar", width: 20 },
                { header: "Rekening Bongkar", key: "rekeningBongkar", width: 30 },
                { header: "Upah/kg", key: "upahBongkar", width: 10 },
                { header: "Total Upah", key: "totalUpahBongkar", width: 15 },
            ] : []),
        ];

        const exportData = sortedFilteredData.map((item, index) => ({
            no: index + 1,
            nomorPenerimaan: item.nomorPenerimaan,
            tanggal: formatDate(item.tanggalTerima),
            jamMasuk: formatTime(item.waktuTimbangBruto),
            jamKeluar: formatTime(item.waktuTimbangTarra),
            supplier: getSupplierDisplayName(item.supplier),
            operator: item.operatorPenimbang || "-",
            kendaraan: item.transporter.nomorKendaraan,
            supir: item.transporter.namaSupir,
            lokasiKebun: item.lokasiKebun || "-",
            jenisBuah: getJenisBuahLabel(item.jenisBuah),
            beratBruto: item.beratBruto,
            beratTarra: item.beratTarra,
            beratNetto1: item.beratNetto1,
            potonganPersen: item.potonganPersen,
            potonganKg: item.potonganKg,
            beratNetto2: item.beratNetto2,
            ...(showBongkar ? {
                vendorBongkar: item.vendorBongkar?.name || "-",
                rekeningBongkar: item.selectedVendorBongkarBank
                    ? `${item.selectedVendorBongkarBank.bankName} - ${item.selectedVendorBongkarBank.accountNumber} a/n ${item.selectedVendorBongkarBank.accountName}`
                    : "-",
                upahBongkar: item.upahBongkar || 0,
                totalUpahBongkar: item.totalUpahBongkar || 0,
            } : {}),
        }));

        // Add total row
        const totalRow = {
            no: "",
            nomorPenerimaan: "",
            tanggal: "",
            jamMasuk: "",
            jamKeluar: "",
            supplier: "",
            operator: "",
            kendaraan: "",
            supir: "",
            lokasiKebun: "",
            jenisBuah: `TOTAL (${sortedFilteredData.length} Data)`,
            beratBruto: sortedFilteredData.reduce((sum, item) => sum + item.beratBruto, 0),
            beratTarra: sortedFilteredData.reduce((sum, item) => sum + item.beratTarra, 0),
            beratNetto1: sortedFilteredData.reduce((sum, item) => sum + item.beratNetto1, 0),
            potonganPersen: "",
            potonganKg: sortedFilteredData.reduce((sum, item) => sum + item.potonganKg, 0),
            beratNetto2: sortedFilteredData.reduce((sum, item) => sum + item.beratNetto2, 0),
            ...(showBongkar ? {
                vendorBongkar: "",
                rekeningBongkar: "",
                upahBongkar: "",
                totalUpahBongkar: sortedFilteredData.reduce((sum, item) => sum + (item.totalUpahBongkar || 0), 0),
            } : {}),
        };

        exportToExcel(
            [...exportData, totalRow] as Record<string, unknown>[],
            columns,
            "Laporan_Hasil_Timbangan",
            "Hasil Timbangan"
        );
    };

    const handleExportPDF = async () => {
        if (sortedFilteredData.length === 0) {
            alert("Tidak ada data untuk diexport");
            return;
        }

        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);
            if (showBongkar) params.set("showBongkar", "true");
            if (searchTerm.trim()) params.set("search", searchTerm.trim());
            if (sortBy) {
                params.set("sortBy", sortBy);
                params.set("sortDirection", sortDirection);
            }

            const res = await fetch(`/api/pt-pks/penerimaan-tbs/export-laporan/pdf?${params.toString()}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Laporan_Hasil_Timbangan_${startDate || "all"}_${endDate || "all"}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert("Gagal mengexport PDF");
            }
        } catch (error) {
            console.error("Error exporting PDF:", error);
            alert("Terjadi kesalahan saat mengexport PDF");
        } finally {
            setExporting(false);
        }
    };

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredData = data.filter((item) => {
        if (!normalizedSearch) return true;

        const searchableText = [
            item.nomorPenerimaan,
            getSupplierDisplayName(item.supplier),
            item.operatorPenimbang || "",
            item.transporter.nomorKendaraan,
            item.transporter.namaSupir,
            item.lokasiKebun || "",
            getJenisBuahLabel(item.jenisBuah),
            item.vendorBongkar?.name || "",
            item.selectedVendorBongkarBank?.bankName || "",
            item.selectedVendorBongkarBank?.accountNumber || "",
        ]
            .join(" ")
            .toLowerCase();

        return searchableText.includes(normalizedSearch);
    });

    const sortedFilteredData = sortLaporanHasilTimbangan(
        filteredData,
        sortBy,
        sortDirection
    );

    const totalPages = Math.max(1, Math.ceil(sortedFilteredData.length / ITEMS_PER_PAGE));
    const paginationItems = buildPaginationItems(currentPage, totalPages);
    const paginatedData = sortedFilteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const pageStart = sortedFilteredData.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, sortedFilteredData.length);

    // Calculate totals
    const totalBruto = filteredData.reduce((sum, item) => sum + item.beratBruto, 0);
    const totalTarra = filteredData.reduce((sum, item) => sum + item.beratTarra, 0);
    const totalNetto1 = filteredData.reduce((sum, item) => sum + item.beratNetto1, 0);
    const totalPotonganKg = filteredData.reduce((sum, item) => sum + item.potonganKg, 0);
    const totalNetto2 = filteredData.reduce((sum, item) => sum + item.beratNetto2, 0);
    const totalUpahBongkar = filteredData.reduce((sum, item) => sum + (item.totalUpahBongkar || 0), 0);

    const renderSortableHeader = (
        field: LaporanHasilTimbanganSortField,
        label: string
    ) => {
        const isActive = sortBy === field;
        const Icon = !isActive ? ArrowUpDown : sortDirection === "asc" ? ArrowUp : ArrowDown;

        return (
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 gap-1 px-3 font-semibold hover:bg-transparent"
                onClick={() => handleSort(field)}
            >
                <span>{label}</span>
                <Icon className="h-4 w-4" />
            </Button>
        );
    };

    if (editingData) {
        return (
            <PenerimaanEditForm
                data={editingData}
                mode="timbangan"
                onCancel={handleCloseEdit}
                onSuccess={() => {
                    void handleEditSuccess();
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Filter Periode
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Tanggal Mulai</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-[180px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Tanggal Akhir</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-[180px]"
                            />
                        </div>
                        <div className="space-y-2 min-w-[260px] flex-1">
                            <Label htmlFor="searchLaporan">Cari Data</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="searchLaporan"
                                    placeholder="No. penerimaan, supplier, operator, kendaraan, supir..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-9"
                                />
                                {searchTerm && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 h-10 px-3 border rounded-md bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setShowBongkar(!showBongkar)}>
                            <Checkbox
                                id="showBongkar"
                                checked={showBongkar}
                                onCheckedChange={(checked) => setShowBongkar(!!checked)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Label htmlFor="showBongkar" className="text-sm font-medium cursor-pointer">
                                Data Bongkar
                            </Label>
                        </div>
                        <Button onClick={handleFilter} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memuat...
                                </>
                            ) : (
                                "Tampilkan"
                            )}
                        </Button>
                        <div className="flex-1" />
                        <Button
                            variant="outline"
                            onClick={handleExportExcel}
                            disabled={loading || filteredData.length === 0}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Export Excel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExportPDF}
                            disabled={loading || exporting || filteredData.length === 0}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                            {exporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="mr-2 h-4 w-4" />
                            )}
                            Export PDF
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {filteredData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground">Jumlah Data</div>
                            <div className="text-2xl font-bold">{filteredData.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground">Total Bruto</div>
                            <div className="text-2xl font-bold text-blue-600">{formatNumber(totalBruto)} kg</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground">Total Tarra</div>
                            <div className="text-2xl font-bold text-orange-600">{formatNumber(totalTarra)} kg</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-sm text-muted-foreground">Total Netto Final</div>
                            <div className="text-2xl font-bold text-green-600">{formatNumber(totalNetto2)} kg</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        Laporan Hasil Timbangan
                        {filteredData.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {filteredData.length} Data
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Tidak ada data untuk periode yang dipilih</p>
                            <p className="text-sm mt-2">Pilih tanggal dan klik Tampilkan untuk melihat data</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Tidak ada data yang sesuai dengan pencarian</p>
                            <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2">
                                Reset Pencarian
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">No</TableHead>
                                            <TableHead>{renderSortableHeader("nomorPenerimaan", "No Penerimaan")}</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>{renderSortableHeader("jamMasuk", "Jam Masuk")}</TableHead>
                                            <TableHead>{renderSortableHeader("jamKeluar", "Jam Keluar")}</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Operator</TableHead>
                                            <TableHead>Kendaraan</TableHead>
                                            <TableHead>Supir</TableHead>
                                            <TableHead>Lokasi Kebun</TableHead>
                                            <TableHead>Barang</TableHead>
                                            <TableHead className="text-right">Bruto</TableHead>
                                            <TableHead className="text-right">Tarra</TableHead>
                                            <TableHead className="text-right">Netto 1</TableHead>
                                            <TableHead className="text-center">Pot %</TableHead>
                                            <TableHead className="text-right">Pot kg</TableHead>
                                            <TableHead className="text-right">Netto Final</TableHead>
                                            {showBongkar && (
                                                <>
                                                    <TableHead>Vendor Bongkar</TableHead>
                                                    <TableHead>Rekening Bongkar</TableHead>
                                                    <TableHead className="text-right">Upah/kg</TableHead>
                                                    <TableHead className="text-right">Total Upah</TableHead>
                                                </>
                                            )}
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{pageStart + index}</TableCell>
                                                <TableCell className="font-mono">{item.nomorPenerimaan}</TableCell>
                                                <TableCell>{formatDate(item.tanggalTerima)}</TableCell>
                                                <TableCell>{formatTime(item.waktuTimbangBruto)}</TableCell>
                                                <TableCell>{formatTime(item.waktuTimbangTarra)}</TableCell>
                                                <TableCell>
                                                    <div className="max-w-[150px] truncate" title={getSupplierDisplayName(item.supplier)}>
                                                        {getSupplierDisplayName(item.supplier)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-[140px] truncate" title={item.operatorPenimbang || "-"}>
                                                        {item.operatorPenimbang || "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.transporter.nomorKendaraan}</TableCell>
                                                <TableCell>
                                                    <div className="max-w-[100px] truncate" title={item.transporter.namaSupir}>
                                                        {item.transporter.namaSupir}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.lokasiKebun || "-"}</TableCell>
                                                <TableCell>{getJenisBuahLabel(item.jenisBuah)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(item.beratBruto)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(item.beratTarra)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(item.beratNetto1)}</TableCell>
                                                <TableCell className="text-center">{item.potonganPersen}%</TableCell>
                                                <TableCell className="text-right">{formatNumber(item.potonganKg)}</TableCell>
                                                <TableCell className="text-right font-bold">{formatNumber(item.beratNetto2)}</TableCell>
                                                {showBongkar && (
                                                    <>
                                                        <TableCell>{item.vendorBongkar?.name || "-"}</TableCell>
                                                        <TableCell>
                                                            {item.selectedVendorBongkarBank ? (
                                                                <div className="text-xs">
                                                                    <div className="font-semibold">{item.selectedVendorBongkarBank.bankName}</div>
                                                                    <div>{item.selectedVendorBongkarBank.accountNumber}</div>
                                                                    <div className="text-muted-foreground">{item.selectedVendorBongkarBank.accountName}</div>
                                                                </div>
                                                            ) : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">{formatNumber(item.upahBongkar || 0)}</TableCell>
                                                        <TableCell className="text-right font-bold text-orange-600">{formatNumber(item.totalUpahBongkar || 0)}</TableCell>
                                                    </>
                                                )}
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {canEdit && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => void handleOpenEdit(item.id)}
                                                                title="Edit Penerimaan TBS"
                                                                disabled={loadingEditId === item.id}
                                                            >
                                                                {loadingEditId === item.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Pencil className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handlePrintSlip(item.id)}
                                                            title="Cetak Slip Tiket"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-bold">
                                            <TableCell colSpan={11} className="text-right">
                                                TOTAL ({filteredData.length} Data)
                                            </TableCell>
                                            <TableCell className="text-right">{formatNumber(totalBruto)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(totalTarra)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(totalNetto1)}</TableCell>
                                            <TableCell className="text-center">-</TableCell>
                                            <TableCell className="text-right">{formatNumber(totalPotonganKg)}</TableCell>
                                            <TableCell className="text-right text-primary">{formatNumber(totalNetto2)}</TableCell>
                                            {showBongkar && (
                                                <>
                                                    <TableCell>-</TableCell>
                                                    <TableCell>-</TableCell>
                                                    <TableCell>-</TableCell>
                                                    <TableCell className="text-right text-orange-600">{formatNumber(totalUpahBongkar)}</TableCell>
                                                </>
                                            )}
                                            <TableCell />
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex flex-col gap-3 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-muted-foreground">
                                    Menampilkan <span className="font-semibold text-foreground">{pageStart}</span> -{" "}
                                    <span className="font-semibold text-foreground">{pageEnd}</span> dari{" "}
                                    <span className="font-semibold text-foreground">{sortedFilteredData.length}</span> data
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            Sebelumnya
                                        </Button>
                                        {paginationItems.map((item) =>
                                            typeof item === "number" ? (
                                                <Button
                                                    key={item}
                                                    variant={item === currentPage ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(item)}
                                                >
                                                    {item}
                                                </Button>
                                            ) : (
                                                <div
                                                    key={item}
                                                    className="flex items-center px-2 text-muted-foreground"
                                                >
                                                    ...
                                                </div>
                                            )
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Selanjutnya
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
