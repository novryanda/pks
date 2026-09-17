"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
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
import { Search, Eye, Pencil, Trash2, FileText, FileSignature, Download } from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

// Type and label

type Supplier = {
  id: string;
  type: string;
  ownerName: string;
  companyName: string | null;
  address: string;
  personalPhone: string;
  longitude: number;
  latitude: number;
  swadaya?: boolean;
  kelompok?: boolean;
  perusahaan?: boolean;
  certificationISPO: boolean;
  certificationRSPO: boolean;
  createdAt: Date;
};

type SupplierTypeLabel = {
  [key: string]: string;
};

const supplierTypeLabels: SupplierTypeLabel = {
  RAMP_PERON: "Ramp/Peron",
  KUD: "KUD",
  KELOMPOK_TANI: "Kelompok Tani",
};

const ITEMS_PER_PAGE = 25;

// SearchBar component
function SupplierSearchBar({
  searchTerm,
  setSearchTerm,
  pengelolaanFilter,
  setPengelolaanFilter,
  sertifikasiFilter,
  setSertifikasiFilter,
  onExport,
  canExport,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  pengelolaanFilter: string;
  setPengelolaanFilter: (v: string) => void;
  sertifikasiFilter: string;
  setSertifikasiFilter: (v: string) => void;
  onExport?: () => void;
  canExport?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari supplier (nama, perusahaan, alamat, no HP)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>
        {onExport && (
          <Button
            variant="outline"
            onClick={onExport}
            disabled={!canExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Select
          value={pengelolaanFilter}
          onValueChange={setPengelolaanFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Jenis Pengelolaan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pengelolaan</SelectItem>
            <SelectItem value="swadaya">Swadaya</SelectItem>
            <SelectItem value="kelompok">Kelompok</SelectItem>
            <SelectItem value="perusahaan">Perusahaan</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sertifikasiFilter}
          onValueChange={setSertifikasiFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sertifikasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Sertifikasi</SelectItem>
            <SelectItem value="ISPO">ISPO</SelectItem>
            <SelectItem value="RSPO">RSPO</SelectItem>
          </SelectContent>
        </Select>
        {(pengelolaanFilter || sertifikasiFilter) && (
          <Button
            variant="outline"
            onClick={() => {
              setPengelolaanFilter("");
              setSertifikasiFilter("");
            }}
          >
            Reset Filter
          </Button>
        )}
      </div>
    </div>
  );
}

// Table only component
function SupplierTableOnly({
  suppliers,
  loading,
  onViewDetail,
  onEdit,
  onDelete,
  deleteDialogOpen,
  setDeleteDialogOpen,
  handleDeleteCancel,
  handleDeleteConfirm,
}: {
  suppliers: Supplier[];
  loading: boolean;
  onViewDetail?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (v: boolean) => void;
  handleDeleteCancel: () => void;
  handleDeleteConfirm: () => void;
}) {
  const handleGenerateStatement = (supplierId: string) => {
    window.open(`/api/pt-pks/supplier/${supplierId}/statement-pdf`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipe</TableHead>
            <TableHead>Nama Pemilik</TableHead>
            <TableHead>Nama Perusahaan</TableHead>
            <TableHead>Alamat</TableHead>
            <TableHead>No. HP</TableHead>
            <TableHead>Jenis Pengelolaan</TableHead>
            <TableHead>Sertifikasi</TableHead>
            <TableHead>Koordinat</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground"
              >
                Tidak ada data supplier
              </TableCell>
            </TableRow>
          ) : (
            suppliers.map((supplier) => {
              return (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    {supplierTypeLabels[supplier.type] || supplier.type}
                  </TableCell>
                  <TableCell>{supplier.ownerName}</TableCell>
                  <TableCell>{supplier.companyName || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {supplier.address}
                  </TableCell>
                  <TableCell>{supplier.personalPhone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {supplier.swadaya && (
                        <Badge variant="outline">Swadaya</Badge>
                      )}
                      {supplier.kelompok && (
                        <Badge variant="outline">Kelompok</Badge>
                      )}
                      {supplier.perusahaan && (
                        <Badge variant="outline">Perusahaan</Badge>
                      )}
                      {!supplier.swadaya &&
                        !supplier.kelompok &&
                        !supplier.perusahaan && (
                          <span className="text-muted-foreground">-</span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {supplier.certificationISPO && (
                        <Badge variant="default">ISPO</Badge>
                      )}
                      {supplier.certificationRSPO && (
                        <Badge variant="default">RSPO</Badge>
                      )}
                      {!supplier.certificationISPO &&
                        !supplier.certificationRSPO && (
                          <span className="text-muted-foreground">-</span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {supplier.latitude.toFixed(6)}, {supplier.longitude.toFixed(6)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Lihat detail"
                        onClick={() => onViewDetail?.(supplier.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => onEdit?.(supplier.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Generate Form PDF"
                        onClick={() => window.open(`/api/pt-pks/supplier/${supplier.id}/form-pdf`, "_blank")}
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Generate Surat Pernyataan"
                        onClick={() => handleGenerateStatement(supplier.id)}
                      >
                        <FileSignature className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Hapus"
                        onClick={() => onDelete(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Statement dialog removed: PDF now generated directly from table action */}
    </div>
  );
}

// Parent component
export function SupplierTable({ onViewDetail, onEdit }: { onViewDetail?: (id: string) => void; onEdit?: (id: string) => void; }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pengelolaanFilter, setPengelolaanFilter] = useState<string>("");
  const [sertifikasiFilter, setSertifikasiFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  // Fetch when filter changes
  useEffect(() => {
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pengelolaanFilter, sertifikasiFilter]);

  // Debounce search, only update table
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuppliers();
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pengelolaanFilter, sertifikasiFilter, suppliers.length]);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append("search", searchTerm);
      }
      if (pengelolaanFilter && pengelolaanFilter !== "all") {
        params.append("pengelolaan", pengelolaanFilter);
      }
      if (sertifikasiFilter && sertifikasiFilter !== "all") {
        params.append("sertifikasi", sertifikasiFilter);
      }
      const url = `/api/pt-pks/supplier${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setSuppliers(data.suppliers);
      } else {
        console.error("Error fetching suppliers:", data.error);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pengelolaanFilter, sertifikasiFilter]);

  const handleDeleteClick = (id: string) => {
    setSupplierToDelete(id);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;
    try {
      const response = await fetch(`/api/pt-pks/supplier/${supplierToDelete}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchSuppliers();
        setDeleteDialogOpen(false);
        setSupplierToDelete(null);
      } else {
        const data = await response.json();
        alert(data.error || "Gagal menghapus supplier");
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Gagal menghapus supplier");
    }
  };
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  const handleExportExcel = () => {
    const columns: ExportColumn[] = [
      { header: "Tipe Supplier", key: "typeLabel", width: 18 },
      { header: "Nama Pemilik", key: "ownerName", width: 25 },
      { header: "Perusahaan", key: "companyName", width: 25 },
      { header: "Alamat", key: "address", width: 35 },
      { header: "No. HP", key: "personalPhone", width: 18 },
      { header: "Pengelolaan", key: "pengelolaan", width: 20 },
      { header: "Sertifikasi", key: "sertifikasi", width: 20 },
      { header: "Koordinat", key: "koordinat", width: 25 },
    ];

    const dataToExport = suppliers.map((s) => {
      const pengelolaan = [
        s.swadaya && "Swadaya",
        s.kelompok && "Kelompok",
        s.perusahaan && "Perusahaan",
      ]
        .filter(Boolean)
        .join(", ") || "-";

      const sertifikasi = [
        s.certificationISPO && "ISPO",
        s.certificationRSPO && "RSPO",
      ]
        .filter(Boolean)
        .join(", ") || "-";

      return {
        typeLabel: supplierTypeLabels[s.type] || s.type,
        ownerName: s.ownerName,
        companyName: s.companyName || "-",
        address: s.address,
        personalPhone: s.personalPhone,
        pengelolaan,
        sertifikasi,
        koordinat: `${s.latitude.toFixed(6)}, ${s.longitude.toFixed(6)}`,
      };
    });

    exportToExcel(dataToExport, columns, "Data_Supplier", "Supplier");
  };

  const totalPages = Math.max(1, Math.ceil(suppliers.length / ITEMS_PER_PAGE));
  const paginatedSuppliers = suppliers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const pageStart = suppliers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, suppliers.length);

  return (
    <div className="space-y-4">
      <SupplierSearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        pengelolaanFilter={pengelolaanFilter}
        setPengelolaanFilter={setPengelolaanFilter}
        sertifikasiFilter={sertifikasiFilter}
        setSertifikasiFilter={setSertifikasiFilter}
        onExport={handleExportExcel}
        canExport={suppliers.length > 0}
      />
      <SupplierTableOnly
        suppliers={paginatedSuppliers}
        loading={loading}
        onViewDetail={onViewDetail}
        onEdit={onEdit}
        onDelete={handleDeleteClick}
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
      />
      {!loading && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={suppliers.length}
          pageStart={pageStart}
          pageEnd={pageEnd}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
