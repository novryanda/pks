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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Search, Eye, Pencil, Trash2, Plus, Truck, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

type Vendor = {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string | null;
  phone: string;
  address: string;
  npwp: string | null;
  taxStatus: string;
  status: string;
  createdAt: Date;
  _count: {
    vehicles: number;
  };
};

type VendorTableProps = {
  initialData?: Vendor[];
};

const taxStatusLabels: Record<string, string> = {
  NON_PKP: "Non PKP",
  PKP_11: "PKP 11%",
  PKP_1_1: "PKP 1.1%",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" }> = {
  ACTIVE: { label: "Aktif", variant: "default" },
  INACTIVE: { label: "Tidak Aktif", variant: "secondary" },
};

export function VendorTable({ initialData = [] }: VendorTableProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", "10");

      const response = await fetch(`/api/pt-pks/vendor?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch vendors");

      const result = await response.json();
      setVendors(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [searchTerm, statusFilter, page]);

  const handleDelete = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVendor) return;

    try {
      const response = await fetch(`/api/pt-pks/vendor/${selectedVendor.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete vendor");
      }

      // Refresh data
      await fetchVendors();
      setDeleteDialogOpen(false);
      setSelectedVendor(null);
    } catch (error: any) {
      console.error("Error deleting vendor:", error);
      alert(error.message);
    }
  };

  const handleView = (id: string) => {
    router.push(`/dashboard/pt-pks/master/vendor/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/pt-pks/master/vendor/${id}/edit`);
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", "1");
      params.append("limit", "1000");

      const response = await fetch(`/api/pt-pks/vendor?${params.toString()}`);
      let exportList = vendors;
      if (response.ok) {
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          exportList = result.data;
        }
      }

      const columns: ExportColumn[] = [
        { header: "Kode Vendor", key: "code", width: 15 },
        { header: "Nama Vendor", key: "name", width: 25 },
        { header: "Contact Person", key: "contactPerson", width: 20 },
        { header: "Telepon", key: "phone", width: 18 },
        { header: "Email", key: "email", width: 25 },
        { header: "Alamat", key: "address", width: 35 },
        { header: "NPWP", key: "npwp", width: 20 },
        { header: "Status Pajak", key: "taxStatusLabel", width: 15 },
        { header: "Status", key: "statusLabel", width: 15 },
        { header: "Jumlah Kendaraan", key: "vehicleCount", width: 18 },
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
        statusLabel: statusLabels[v.status]?.label || v.status,
        vehicleCount: v._count?.vehicles || 0,
      }));

      exportToExcel(dataToExport, columns, "Data_Vendor", "Vendor");
    } catch (err) {
      console.error("Error exporting vendor data:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari vendor, contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={handleExportExcel}
          disabled={vendors.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
        <Button onClick={() => router.push("/dashboard/pt-pks/master/vendor/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Vendor
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Vendor</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>No. Telepon</TableHead>
              <TableHead>Jumlah Kendaraan</TableHead>
              <TableHead>Status Pajak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Tidak ada data vendor
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.code}</TableCell>
                  <TableCell>
                    <div className="font-medium">{vendor.name}</div>
                  </TableCell>
                  <TableCell>{vendor.contactPerson}</TableCell>
                  <TableCell>{vendor.phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {vendor._count.vehicles} kendaraan
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {taxStatusLabels[vendor.taxStatus] || vendor.taxStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[vendor.status]?.variant || "default"}>
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
                        <Trash2 className="h-4 w-4 text-destructive" />
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus vendor{" "}
              <strong>{selectedVendor?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
