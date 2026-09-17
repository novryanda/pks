"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Loader2,
    Plus,
    Search,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    Truck,
    Download,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

type VendorBongkar = {
    id: string;
    code: string;
    name: string;
    contactPerson: string;
    email: string | null;
    phone: string;
    address: string;
    tipe: "SPSI" | "SPLO";
    bankAccounts: { bankName: string; accountNumber: string; accountName: string; isDefault?: boolean }[] | null;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
};

type PaginatedResponse = {
    data: VendorBongkar[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export function VendorBongkarTable() {
    const router = useRouter();
    const [data, setData] = useState<VendorBongkar[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [tipeFilter, setTipeFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<VendorBongkar | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (tipeFilter !== "all") params.set("tipe", tipeFilter);
            params.set("page", page.toString());
            params.set("limit", "10");

            const res = await fetch(`/api/pt-pks/vendor-bongkar?${params.toString()}`);
            if (res.ok) {
                const result: PaginatedResponse = await res.json();
                setData(result.data);
                setTotalPages(result.totalPages);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Gagal memuat data vendor bongkar");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter, tipeFilter]);

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };

    const handleDelete = async () => {
        if (!vendorToDelete) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/pt-pks/vendor-bongkar/${vendorToDelete.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Vendor bongkar berhasil dihapus");
                fetchData();
            } else {
                const error = await res.json();
                toast.error(error.error || "Gagal menghapus vendor bongkar");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat menghapus");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
            setVendorToDelete(null);
        }
    };

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (tipeFilter !== "all") params.set("tipe", tipeFilter);
            params.set("page", "1");
            params.set("limit", "1000");

            const res = await fetch(`/api/pt-pks/vendor-bongkar?${params.toString()}`);
            let exportList = data;
            if (res.ok) {
                const result = await res.json();
                if (result.data && Array.isArray(result.data)) {
                    exportList = result.data;
                }
            }

            const columns: ExportColumn[] = [
                { header: "Kode", key: "code", width: 15 },
                { header: "Nama Vendor Bongkar", key: "name", width: 25 },
                { header: "Contact Person", key: "contactPerson", width: 20 },
                { header: "Telepon", key: "phone", width: 18 },
                { header: "Email", key: "email", width: 25 },
                { header: "Alamat", key: "address", width: 35 },
                { header: "Tipe", key: "tipe", width: 15 },
                { header: "Status", key: "statusLabel", width: 15 },
            ];

            const dataToExport = exportList.map((v) => ({
                code: v.code,
                name: v.name,
                contactPerson: v.contactPerson,
                phone: v.phone,
                email: v.email || "-",
                address: v.address,
                tipe: v.tipe,
                statusLabel: v.status === "ACTIVE" ? "Aktif" : "Tidak Aktif",
            }));

            exportToExcel(dataToExport, columns, "Data_Vendor_Bongkar", "Vendor_Bongkar");
        } catch (err) {
            console.error("Error exporting vendor bongkar data:", err);
            toast.error("Gagal mengekspor data vendor bongkar");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Bongkar</h1>
                    <p className="text-muted-foreground">
                        Kelola data vendor bongkar untuk upah bongkar TBS
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        disabled={data.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                    <Button onClick={() => router.push("/dashboard/pt-pks/master/vendor-bongkar/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Vendor
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Daftar Vendor Bongkar
                    </CardTitle>
                    <CardDescription>
                        Vendor yang menyediakan jasa bongkar TBS
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex gap-2 flex-1 min-w-[200px]">
                            <Input
                                placeholder="Cari nama, kode, atau contact..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <Button variant="outline" onClick={handleSearch}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                        <Select value={tipeFilter} onValueChange={(v) => { setTipeFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                <SelectItem value="SPSI">SPSI</SelectItem>
                                <SelectItem value="SPLO">SPLO</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="ACTIVE">Aktif</SelectItem>
                                <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Tidak ada data vendor bongkar</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Vendor</TableHead>
                                    <TableHead>Contact Person</TableHead>
                                    <TableHead>Telepon</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Rekening</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((vendor) => (
                                    <TableRow key={vendor.id}>
                                        <TableCell className="font-mono">{vendor.code}</TableCell>
                                        <TableCell className="font-medium">{vendor.name}</TableCell>
                                        <TableCell>{vendor.contactPerson}</TableCell>
                                        <TableCell>{vendor.phone}</TableCell>
                                        <TableCell>
                                            <Badge variant={vendor.tipe === "SPSI" ? "default" : "secondary"}>
                                                {vendor.tipe}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {vendor.bankAccounts && vendor.bankAccounts.length > 0 ? (
                                                <span className="text-sm text-muted-foreground">
                                                    {vendor.bankAccounts.length} rekening
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={vendor.status === "ACTIVE" ? "default" : "outline"}>
                                                {vendor.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/dashboard/pt-pks/master/vendor-bongkar/${vendor.id}`)}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Lihat Detail
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/dashboard/pt-pks/master/vendor-bongkar/${vendor.id}/edit`)}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setVendorToDelete(vendor);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Sebelumnya
                            </Button>
                            <span className="flex items-center px-4 text-sm text-muted-foreground">
                                Halaman {page} dari {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Selanjutnya
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Vendor Bongkar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin menghapus vendor &quot;{vendorToDelete?.name}&quot;?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                "Hapus"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
