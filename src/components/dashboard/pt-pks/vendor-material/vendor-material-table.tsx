"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Pencil, Trash2, Plus, Package, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

interface VendorMaterial {
    id: string;
    code: string;
    name: string;
    contactPerson: string;
    email: string | null;
    phone: string;
    address: string;
    npwp: string | null;
    taxStatus: string;
    kategori: string | null;
    status: string;
    createdAt: Date;
}

interface VendorMaterialTableProps {
    initialData?: VendorMaterial[];
}

const taxStatusLabels: Record<string, string> = {
    NON_PKP: "Non PKP",
    PKP_11: "PKP 11%",
    PKP_1_1: "PKP 1.1%",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" }> = {
    ACTIVE: { label: "Aktif", variant: "default" },
    INACTIVE: { label: "Tidak Aktif", variant: "secondary" },
};

export function VendorMaterialTable({ initialData = [] }: VendorMaterialTableProps) {
    const router = useRouter();
    const [vendors, setVendors] = useState<VendorMaterial[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [kategoriFilter, setKategoriFilter] = useState<string>("all");
    const [categories, setCategories] = useState<string[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        vendor: VendorMaterial | null;
    }>({ open: false, vendor: null });

    useEffect(() => {
        fetchVendors();
        fetchCategories();
    }, [search, statusFilter, kategoriFilter, pagination.page]);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/pt-pks/vendor-material?categories=true");
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (search) params.set("search", search);
            if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
            if (kategoriFilter && kategoriFilter !== "all") params.set("kategori", kategoriFilter);

            const response = await fetch(`/api/pt-pks/vendor-material?${params}`);
            if (response.ok) {
                const data = await response.json();
                setVendors(data.data || []);
                setPagination((prev) => ({
                    ...prev,
                    total: data.pagination?.total || 0,
                    totalPages: data.pagination?.totalPages || 0,
                }));
            }
        } catch (error) {
            console.error("Error fetching vendors:", error);
            toast.error("Gagal memuat data vendor");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (vendor: VendorMaterial) => {
        setDeleteDialog({ open: true, vendor });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.vendor) return;

        try {
            const response = await fetch(
                `/api/pt-pks/vendor-material/${deleteDialog.vendor.id}`,
                { method: "DELETE" }
            );

            if (response.ok) {
                toast.success("Vendor Material berhasil dihapus");
                fetchVendors();
            } else {
                const error = await response.json();
                toast.error(error.error || "Gagal menghapus vendor");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setDeleteDialog({ open: false, vendor: null });
        }
    };

    const handleView = (id: string) => {
        router.push(`/dashboard/pt-pks/master/vendor-material/${id}`);
    };

    const handleEdit = (id: string) => {
        router.push(`/dashboard/pt-pks/master/vendor-material/${id}/edit`);
    };

    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (kategoriFilter !== "all") params.set("kategori", kategoriFilter);
            params.set("page", "1");
            params.set("limit", "1000");

            const res = await fetch(`/api/pt-pks/vendor-material?${params.toString()}`);
            let exportList = vendors;
            if (res.ok) {
                const result = await res.json();
                if (result.data && Array.isArray(result.data)) {
                    exportList = result.data;
                }
            }

            const columns: ExportColumn[] = [
                { header: "Kode", key: "code", width: 15 },
                { header: "Nama Vendor", key: "name", width: 25 },
                { header: "Contact Person", key: "contactPerson", width: 20 },
                { header: "Telepon", key: "phone", width: 18 },
                { header: "Email", key: "email", width: 25 },
                { header: "Alamat", key: "address", width: 35 },
                { header: "NPWP", key: "npwp", width: 20 },
                { header: "Status Pajak", key: "taxStatusLabel", width: 15 },
                { header: "Kategori", key: "kategori", width: 18 },
                { header: "Status", key: "statusLabel", width: 15 },
            ];

            const dataToExport = exportList.map((v) => ({
                code: v.code,
                name: v.name,
                contactPerson: v.contactPerson,
                phone: v.phone,
                email: v.email || "-",
                address: v.address,
                npwp: v.npwp || "-",
                taxStatusLabel: taxStatusLabels[v.taxStatus] || v.taxStatus,
                kategori: v.kategori || "-",
                statusLabel: v.status === "ACTIVE" ? "Aktif" : "Tidak Aktif",
            }));

            exportToExcel(dataToExport, columns, "Data_Vendor_Material", "Vendor_Material");
        } catch (err) {
            console.error("Error exporting vendor material data:", err);
            toast.error("Gagal mengekspor data vendor material");
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari vendor..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                            setStatusFilter(value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="ACTIVE">Aktif</SelectItem>
                            <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                        </SelectContent>
                    </Select>
                    {categories.length > 0 && (
                        <Select
                            value={kategoriFilter}
                            onValueChange={(value) => {
                                setKategoriFilter(value);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        disabled={vendors.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                    <Button onClick={() => router.push("/dashboard/pt-pks/master/vendor-material/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Vendor Material
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kode</TableHead>
                            <TableHead>Nama Vendor</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Telepon</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Status Pajak</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    <div className="flex items-center justify-center gap-2">
                                        <Package className="h-4 w-4 animate-pulse" />
                                        Memuat data...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : vendors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    Tidak ada data vendor material
                                </TableCell>
                            </TableRow>
                        ) : (
                            vendors.map((vendor) => (
                                <TableRow key={vendor.id}>
                                    <TableCell className="font-medium">{vendor.code}</TableCell>
                                    <TableCell>{vendor.name}</TableCell>
                                    <TableCell>{vendor.contactPerson}</TableCell>
                                    <TableCell>{vendor.phone}</TableCell>
                                    <TableCell>
                                        {vendor.kategori ? (
                                            <Badge variant="outline">{vendor.kategori}</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{taxStatusLabels[vendor.taxStatus] || vendor.taxStatus}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusLabels[vendor.status]?.variant || "secondary"}>
                                            {statusLabels[vendor.status]?.label || vendor.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleView(vendor.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(vendor.id)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(vendor)}
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
                        {pagination.total} vendor
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page <= 1}
                        >
                            Sebelumnya
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Selanjutnya
                        </Button>
                    </div>
                </div>
            )}

            {/* Delete Dialog */}
            <AlertDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, vendor: null })}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Vendor Material</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus vendor &quot;{deleteDialog.vendor?.name}&quot;?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
