"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Eye, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { TablePagination } from "@/components/ui/table-pagination";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

interface PenerimaanBarang {
  id: string;
  nomorPenerimaan: string;
  tanggalPenerimaan: string;
  receivedBy: string;
  status: string;
  purchaseOrder?: {
    nomorPO: string;
    namaSupplier: string;
  };
  purchaseRequest?: {
    nomorPR: string;
    judulPermintaan: string;
  };
  vendorName?: string;
  items: Array<{
    jumlahDiterima: number;
  }>;
}

interface PenerimaanBarangListProps {
  onCreateNew?: () => void;
  onViewDetail?: (id: string) => void;
}

const ITEMS_PER_PAGE = 25;

export function PenerimaanBarangList({
  onCreateNew,
  onViewDetail,
}: PenerimaanBarangListProps) {
  const { hasActionAccess } = useUserPermissions();
  const router = useRouter();
  const [penerimaanList, setPenerimaanList] = useState<PenerimaanBarang[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPenerimaanBarang();
  }, [statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, penerimaanList.length]);

  const fetchPenerimaanBarang = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/pt-pks/penerimaan-barang?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setPenerimaanList(data);
      }
    } catch (error) {
      console.error("Error fetching penerimaan barang:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      PENDING: "default",
      COMPLETED: "default",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const filteredPenerimaan = penerimaanList.filter((penerimaan) => {
    const matchesSearch =
      penerimaan.nomorPenerimaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      penerimaan.purchaseOrder?.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      penerimaan.purchaseOrder?.namaSupplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      penerimaan.purchaseRequest?.nomorPR.toLowerCase().includes(searchTerm.toLowerCase()) ||
      penerimaan.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filteredPenerimaan.length / ITEMS_PER_PAGE));
  const paginatedPenerimaan = filteredPenerimaan.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const pageStart = filteredPenerimaan.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredPenerimaan.length);

  const handleExportExcel = () => {
    const columns: ExportColumn[] = [
      { header: "Nomor Penerimaan", key: "nomorPenerimaan", width: 20 },
      { header: "Tanggal", key: "tanggalPenerimaan", width: 15 },
      { header: "Nomor PO / PR", key: "referensi", width: 20 },
      { header: "Supplier / Vendor", key: "supplierVendor", width: 25 },
      { header: "Penerima", key: "receivedBy", width: 20 },
      { header: "Total Item", key: "totalItem", width: 14 },
      { header: "Status", key: "status", width: 15 },
    ];

    const dataToExport = filteredPenerimaan.map((p) => {
      const referensi = p.purchaseOrder?.nomorPO || p.purchaseRequest?.nomorPR || "-";
      const supplierVendor = p.purchaseOrder?.namaSupplier || p.vendorName || "-";
      const totalItem = p.items ? p.items.reduce((sum, item) => sum + (item.jumlahDiterima || 0), 0) : 0;

      return {
        nomorPenerimaan: p.nomorPenerimaan,
        tanggalPenerimaan: p.tanggalPenerimaan ? format(new Date(p.tanggalPenerimaan), "dd/MM/yyyy") : "-",
        referensi,
        supplierVendor,
        receivedBy: p.receivedBy,
        totalItem,
        status: p.status.replace("_", " "),
      };
    });

    exportToExcel(dataToExport, columns, "Data_Penerimaan_Barang", "Penerimaan_Barang");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Penerimaan Barang</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={filteredPenerimaan.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
              Export Excel
            </Button>
            {hasActionAccess("gudang.penerimaanBarang", "create") && (
              <Button onClick={onCreateNew || (() => router.push('/dashboard/pt-pks/gudang/penerimaan-barang/create'))}>
                <Plus className="mr-2 h-4 w-4" />
                Terima Barang Baru
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <Input
            placeholder="Cari nomor penerimaan, PO, atau supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Penerimaan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Vendor/Supplier</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPenerimaan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPenerimaan.map((penerimaan) => (
                    <TableRow key={penerimaan.id}>
                      <TableCell className="font-medium">
                        {penerimaan.nomorPenerimaan}
                      </TableCell>
                      <TableCell>
                        {format(new Date(penerimaan.tanggalPenerimaan), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {penerimaan.purchaseOrder ? (
                          <div>
                            <div className="font-medium">PO</div>
                            <div className="text-sm text-muted-foreground">
                              {penerimaan.purchaseOrder.nomorPO}
                            </div>
                          </div>
                        ) : penerimaan.purchaseRequest ? (
                          <div>
                            <div className="font-medium">PR</div>
                            <div className="text-sm text-muted-foreground">
                              {penerimaan.purchaseRequest.nomorPR}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {penerimaan.purchaseOrder?.namaSupplier || penerimaan.vendorName || "-"}
                      </TableCell>
                      <TableCell>{penerimaan.receivedBy}</TableCell>
                      <TableCell>{penerimaan.items.length} item</TableCell>
                      <TableCell>{getStatusBadge(penerimaan.status)}</TableCell>
                      <TableCell className="text-right">
                        {onViewDetail && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(penerimaan.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPenerimaan.length}
          pageStart={pageStart}
          pageEnd={pageEnd}
          onPageChange={setCurrentPage}
        />
      </CardContent>
    </Card>
  );
}
