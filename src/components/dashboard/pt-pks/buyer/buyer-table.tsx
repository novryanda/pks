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
import { Search, Eye, Pencil, Trash2, Plus, FileText, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

type Buyer = {
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
  _count: {
    contracts: number;
  };
  createdAt: Date;
};

type BuyerTableProps = {
  initialData?: Buyer[];
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

export function BuyerTable({ initialData = [] }: BuyerTableProps) {
  const router = useRouter();
  const [buyers, setBuyers] = useState<Buyer[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBuyers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", "10");

      const response = await fetch(`/api/pt-pks/buyer?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch buyers");

      const result = await response.json();
      setBuyers(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching buyers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, [searchTerm, statusFilter, page]);

  const handleDelete = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBuyer) return;

    try {
      const response = await fetch(`/api/pt-pks/buyer/${selectedBuyer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete buyer");
      }

      // Refresh data
      await fetchBuyers();
      setDeleteDialogOpen(false);
      setSelectedBuyer(null);
    } catch (error: any) {
      console.error("Error deleting buyer:", error);
      alert(error.message);
    }
  };

  const handleView = (id: string) => {
    router.push(`/dashboard/pt-pks/master/buyer/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/pt-pks/master/buyer/${id}/edit`);
  };

  const handleViewContracts = (id: string) => {
    router.push(`/dashboard/pt-pks/master/buyer/${id}/contracts`);
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", "1");
      params.append("limit", "1000");

      const response = await fetch(`/api/pt-pks/buyer?${params.toString()}`);
      let exportList = buyers;
      if (response.ok) {
        const result = await response.json();
        if (result.data && Array.isArray(result.data)) {
          exportList = result.data;
        }
      }

      const columns: ExportColumn[] = [
        { header: "Kode Buyer", key: "code", width: 15 },
        { header: "Nama Buyer", key: "name", width: 25 },
        { header: "Contact Person", key: "contactPerson", width: 20 },
        { header: "Telepon", key: "phone", width: 18 },
        { header: "Email", key: "email", width: 25 },
        { header: "Alamat", key: "address", width: 35 },
        { header: "NPWP", key: "npwp", width: 20 },
        { header: "Status Pajak", key: "taxStatusLabel", width: 15 },
        { header: "Status", key: "statusLabel", width: 15 },
        { header: "Jumlah Kontrak", key: "contractCount", width: 16 },
      ];

      const dataToExport = exportList.map((b) => ({
        code: b.code,
        name: b.name,
        contactPerson: b.contactPerson,
        phone: b.phone,
        email: b.email || "-",
        address: b.address,
        npwp: b.npwp || "-",
        taxStatusLabel: taxStatusLabels[b.taxStatus] || b.taxStatus,
        statusLabel: statusLabels[b.status]?.label || b.status,
        contractCount: b._count?.contracts || 0,
      }));

      exportToExcel(dataToExport, columns, "Data_Buyer", "Buyer");
    } catch (err) {
      console.error("Error exporting buyer data:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari buyer (nama, kode, contact person, email, telepon)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
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
          disabled={buyers.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
        <Button onClick={() => router.push("/dashboard/pt-pks/master/buyer/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Buyer
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Buyer</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Status Pajak</TableHead>
              <TableHead>Jumlah Kontrak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : buyers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Tidak ada data buyer
                </TableCell>
              </TableRow>
            ) : (
              buyers.map((buyer) => (
                <TableRow key={buyer.id}>
                  <TableCell className="font-medium">{buyer.code}</TableCell>
                  <TableCell>{buyer.name}</TableCell>
                  <TableCell>{buyer.contactPerson}</TableCell>
                  <TableCell>{buyer.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {taxStatusLabels[buyer.taxStatus] || buyer.taxStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => handleViewContracts(buyer.id)}
                    >
                      {buyer._count.contracts} kontrak
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[buyer.status]?.variant || "default"}>
                      {statusLabels[buyer.status]?.label || buyer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(buyer.id)}
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(buyer.id)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(buyer)}
                        title="Hapus"
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
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus buyer{" "}
              <strong>{selectedBuyer?.name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBuyer(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
