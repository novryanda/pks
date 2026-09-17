"use client";

import { useState, useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Loader2,
    Truck,
    CheckCircle2,
    Building2,
    CreditCard,
    Search,
    X,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { buildPaginationItems } from "@/lib/pagination";

type BankAccount = {
    bankName: string;
    accountNumber: string;
    accountName: string;
    isDefault?: boolean;
};

type PenerimaanTBS = {
    id: string;
    nomorPenerimaan: string;
    tanggalTerima: string;
    beratBruto: number;
    beratTarra: number;
    beratNetto1: number;
    potonganPersen: number;
    potonganKg: number;
    beratNetto2: number;
    jenisBuah?: string;
    supplier: {
        ownerName: string;
        companyName?: string | null;
        nik: string;
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
};

type VendorBongkar = {
    id: string;
    code: string;
    name: string;
    tipe: "SPSI" | "SPLO";
    bankAccounts: BankAccount[] | null;
};

type InputBongkarListProps = {
    onRefresh?: () => void;
};

const ITEMS_PER_PAGE = 25;

export function InputBongkarList({ onRefresh }: InputBongkarListProps) {
    const [data, setData] = useState<PenerimaanTBS[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Form state
    const [selectedTipe, setSelectedTipe] = useState<"SPSI" | "SPLO" | "">("");
    const [vendors, setVendors] = useState<VendorBongkar[]>([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState("");
    const [selectedBankIndex, setSelectedBankIndex] = useState<string>("");
    const [upahBongkar, setUpahBongkar] = useState<number>(16);

    // Fetch pending bongkar data
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/pt-pks/penerimaan-tbs/pending-bongkar");
            if (res.ok) {
                const result = await res.json();
                setData(result);
                setSelectedIds((prev) =>
                    prev.filter((id) => result.some((item: PenerimaanTBS) => item.id === id))
                );
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Fetch vendors by tipe
    useEffect(() => {
        if (!selectedTipe) {
            setVendors([]);
            setSelectedVendorId("");
            return;
        }

        const fetchVendors = async () => {
            setLoadingVendors(true);
            try {
                const res = await fetch(`/api/pt-pks/vendor-bongkar/by-tipe?tipe=${selectedTipe}`);
                if (res.ok) {
                    const result = await res.json();
                    setVendors(result);
                }
            } catch (error) {
                console.error("Error fetching vendors:", error);
            } finally {
                setLoadingVendors(false);
            }
        };

        fetchVendors();
    }, [selectedTipe]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, data.length]);

    // Auto-select default bank when vendor changes
    useEffect(() => {
        if (selectedVendorId) {
            const vendor = vendors.find((v) => v.id === selectedVendorId);
            if (vendor?.bankAccounts && vendor.bankAccounts.length > 0) {
                const defaultIndex = vendor.bankAccounts.findIndex((b) => b.isDefault);
                setSelectedBankIndex(defaultIndex >= 0 ? defaultIndex.toString() : "0");
            } else {
                setSelectedBankIndex("");
            }
        }
    }, [selectedVendorId, vendors]);

    // Toggle selection
    const toggleSelection = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // Get selected vendor
    const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
    const selectedBank =
        selectedVendor?.bankAccounts && selectedBankIndex !== ""
            ? selectedVendor.bankAccounts[parseInt(selectedBankIndex)]
            : null;

    // Handle submit
    const handleSubmit = async () => {
        if (selectedIds.length === 0) {
            toast.error("Pilih minimal 1 penerimaan");
            return;
        }

        if (!selectedVendorId) {
            toast.error("Pilih vendor bongkar");
            return;
        }

        if (upahBongkar <= 0) {
            toast.error("Upah bongkar harus lebih dari 0");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/pt-pks/penerimaan-tbs/input-bongkar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    penerimaanIds: selectedIds,
                    vendorBongkarId: selectedVendorId,
                    upahBongkar,
                    selectedVendorBongkarBank: selectedBank
                        ? {
                            bankName: selectedBank.bankName,
                            accountNumber: selectedBank.accountNumber,
                            accountName: selectedBank.accountName,
                        }
                        : null,
                }),
            });

            if (res.ok) {
                const result = await res.json();
                toast.success(result.message);
                setSelectedIds([]);
                setSelectedTipe("");
                setSelectedVendorId("");
                setSelectedBankIndex("");
                fetchData();
                onRefresh?.();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Gagal menyimpan data");
            }
        } catch (error) {
            console.error("Error submitting:", error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setSubmitting(false);
        }
    };

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredData = data.filter((item) => {
        if (!normalizedSearch) return true;

        const searchableText = [
            item.nomorPenerimaan,
            item.supplier.companyName?.trim() || item.supplier.ownerName,
            item.supplier.nik,
            item.transporter.nomorKendaraan,
            item.transporter.namaSupir,
            item.material.name,
            item.jenisBuah || "",
        ]
            .join(" ")
            .toLowerCase();

        return searchableText.includes(normalizedSearch);
    });

    const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
    const paginationItems = buildPaginationItems(currentPage, totalPages);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    const currentPageIds = paginatedData.map((item) => item.id);
    const allCurrentPageSelected =
        currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));
    const someCurrentPageSelected =
        !allCurrentPageSelected && currentPageIds.some((id) => selectedIds.includes(id));
    const pageStart = filteredData.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length);

    const toggleAll = () => {
        if (allCurrentPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
            return;
        }

        setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    };

    // Calculate totals
    const selectedItems = data.filter((d) => selectedIds.includes(d.id));
    const totalNetto = selectedItems.reduce((sum, item) => sum + item.beratNetto2, 0);
    const totalUpah = Math.round(totalNetto * upahBongkar);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada penerimaan yang menunggu input bongkar</p>
                <p className="text-sm mt-2">
                    Semua penerimaan yang sudah tarra sudah memiliki vendor bongkar
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari no. penerimaan, supplier, kendaraan, supir..."
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
                <div className="text-sm text-muted-foreground">
                    Ditemukan <span className="font-semibold text-foreground">{filteredData.length}</span> dari{" "}
                    <span className="font-semibold text-foreground">{data.length}</span> data
                </div>
            </div>

            {/* Table */}
            <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={
                                        allCurrentPageSelected
                                            ? true
                                            : someCurrentPageSelected
                                                ? "indeterminate"
                                                : false
                                    }
                                    onCheckedChange={toggleAll}
                                />
                            </TableHead>
                            <TableHead>No. Penerimaan</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Kendaraan</TableHead>
                            <TableHead className="text-right">Netto (kg)</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                    Tidak ada data yang sesuai dengan pencarian
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className={selectedIds.includes(item.id) ? "bg-muted/50" : ""}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(item.id)}
                                            onCheckedChange={() => toggleSelection(item.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono font-medium">
                                        {item.nomorPenerimaan}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(item.tanggalTerima), "dd MMM yyyy", {
                                            locale: idLocale,
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{item.supplier.companyName?.trim() || item.supplier.ownerName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.supplier.nik}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">
                                                {item.transporter.nomorKendaraan}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.transporter.namaSupir}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {item.beratNetto2.toLocaleString("id-ID")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-700 border-blue-200"
                                        >
                                            Tarra OK
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {filteredData.length > 0 && (
                    <div className="flex flex-col gap-3 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-muted-foreground">
                            Menampilkan <span className="font-semibold text-foreground">{pageStart}</span> -{" "}
                            <span className="font-semibold text-foreground">{pageEnd}</span> dari{" "}
                            <span className="font-semibold text-foreground">{filteredData.length}</span> data
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
                )}
            </div>

            {/* Selection Summary */}
            {selectedIds.length > 0 && (
                <Card className="border-2 border-primary/20">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <span className="font-semibold">
                                    {selectedIds.length} penerimaan dipilih
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">Total Netto</div>
                                <div className="text-xl font-bold">
                                    {totalNetto.toLocaleString("id-ID")} kg
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Vendor Selection */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Tipe Vendor *</Label>
                                <Select
                                    value={selectedTipe}
                                    onValueChange={(v) => {
                                        setSelectedTipe(v as "SPSI" | "SPLO");
                                        setSelectedVendorId("");
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih tipe vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SPSI">SPSI</SelectItem>
                                        <SelectItem value="SPLO">SPLO</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Vendor Bongkar *</Label>
                                <Select
                                    value={selectedVendorId}
                                    onValueChange={setSelectedVendorId}
                                    disabled={!selectedTipe || loadingVendors}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={
                                                loadingVendors
                                                    ? "Memuat..."
                                                    : selectedTipe
                                                        ? "Pilih vendor bongkar"
                                                        : "Pilih tipe dulu"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendors.map((vendor) => (
                                            <SelectItem key={vendor.id} value={vendor.id}>
                                                {vendor.name} ({vendor.tipe})
                                            </SelectItem>
                                        ))}
                                        {vendors.length === 0 && !loadingVendors && (
                                            <div className="p-2 text-center text-sm text-muted-foreground">
                                                Tidak ada vendor {selectedTipe}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Bank Account Selection */}
                        {selectedVendor && selectedVendor.bankAccounts && selectedVendor.bankAccounts.length > 0 && (
                            <div className="space-y-2">
                                <Label>Rekening Vendor Bongkar</Label>
                                <Select value={selectedBankIndex} onValueChange={setSelectedBankIndex}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih rekening" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedVendor.bankAccounts.map((bank, index) => (
                                            <SelectItem key={index} value={index.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" />
                                                    <span>
                                                        {bank.bankName} - {bank.accountNumber}
                                                    </span>
                                                    {bank.isDefault && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Default
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedBank && (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-start gap-3">
                                            <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                                            <div className="text-sm">
                                                <div className="font-semibold text-blue-900">
                                                    {selectedBank.bankName}
                                                </div>
                                                <div className="text-blue-700">
                                                    No. Rekening: {selectedBank.accountNumber}
                                                </div>
                                                <div className="text-blue-700">
                                                    A/N: {selectedBank.accountName}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upah Bongkar */}
                        <div className="space-y-2">
                            <Label htmlFor="upahBongkar">Upah Bongkar per Kilogram *</Label>
                            <div className="relative max-w-xs">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    Rp
                                </div>
                                <Input
                                    id="upahBongkar"
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={upahBongkar || ""}
                                    readOnly
                                    className="text-right text-lg font-semibold pl-12 pr-16 bg-muted cursor-not-allowed"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    / kg
                                </div>
                            </div>
                        </div>

                        {/* Total Preview */}
                        {upahBongkar > 0 && (
                            <div className="p-4 bg-gradient-to-br from-orange-600 to-orange-700 text-white rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm opacity-90">Total Upah Bongkar</div>
                                        <div className="text-xs opacity-75 mt-1">
                                            {totalNetto.toLocaleString("id-ID")} kg × Rp{" "}
                                            {upahBongkar.toLocaleString("id-ID")}
                                        </div>
                                    </div>
                                    <Truck className="h-8 w-8 opacity-50" />
                                </div>
                                <div className="text-3xl font-bold mt-2">
                                    {new Intl.NumberFormat("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        minimumFractionDigits: 0,
                                    }).format(totalUpah)}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleSubmit}
                                size="lg"
                                disabled={
                                    submitting ||
                                    selectedIds.length === 0 ||
                                    !selectedVendorId ||
                                    upahBongkar <= 0
                                }
                                className="min-w-[200px]"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-5 w-5" />
                                        Simpan Bongkar
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
