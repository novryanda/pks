"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Loader2, Download } from "lucide-react";
import { PengeluaranBarangForm } from "./pengeluaran-barang-form";
import { PengeluaranBarangDetail } from "./pengeluaran-barang-detail";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { TablePagination } from "@/components/ui/table-pagination";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

interface PengeluaranBarang {
  id: string;
  nomorPengeluaran: string;
  tanggalPengeluaran: string;
  divisi: string;
  requestedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  issuedBy?: string;
  receivedByDivisi?: string;
  tanggalDiterima?: string;
  status: string;
  keterangan?: string;
  storeRequest?: {
    nomorSR: string;
    tanggalRequest?: string;
  };
  items: Array<{
    id: string;
    jumlahKeluar: number;
    hargaSatuan: number;
    totalHarga: number;
    keterangan?: string;
    material: {
      namaMaterial: string;
      partNumber: string;
      kategoriMaterial: {
        nama: string;
      };
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

const ITEMS_PER_PAGE = 25;

export function PengeluaranBarangList() {
  const [pengeluaranBarang, setPengeluaranBarang] = useState<PengeluaranBarang[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedPengeluaran, setSelectedPengeluaran] = useState<PengeluaranBarang | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchPengeluaranBarang();
  }, [statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pengeluaranBarang.length]);

  const fetchPengeluaranBarang = async () => {
    try {
      let url = "/api/pt-pks/pengeluaran-barang";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPengeluaranBarang(data);
      }
    } catch (error) {
      console.error("Error fetching pengeluaran barang:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      PENDING: "default",
      APPROVED: "default",
      COMPLETED: "default",
      REJECTED: "destructive",
      CANCELLED: "secondary",
    };

    const labels: Record<string, string> = {
      DRAFT: "Draft",
      PENDING: "Menunggu Approval",
      APPROVED: "Disetujui",
      COMPLETED: "Selesai",
      REJECTED: "Ditolak",
      CANCELLED: "Dibatalkan",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const calculateTotal = (pengeluaran: PengeluaranBarang) => {
    return pengeluaran.items.reduce((total, item) => total + item.totalHarga, 0);
  };

  const getIssuedByDisplay = (pengeluaran: PengeluaranBarang) => {
    return pengeluaran.requestedBy;
  };

  const filteredPengeluaran = pengeluaranBarang.filter(
    (p) =>
      p.nomorPengeluaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.divisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.storeRequest?.nomorSR.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredPengeluaran.length / ITEMS_PER_PAGE));
  const paginatedPengeluaran = filteredPengeluaran.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const pageStart = filteredPengeluaran.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredPengeluaran.length);

  const handleSuccess = () => {
    setShowForm(false);
    setShowDetail(false);
    fetchPengeluaranBarang();
  };

  if (showForm) {
    return <PengeluaranBarangForm onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />;
  }

  if (showDetail && selectedPengeluaran) {
    // Ensure selectedPengeluaran has all required fields for PengeluaranBarangDetail
    const detailData = {
      ...selectedPengeluaran,
      storeRequest: selectedPengeluaran.storeRequest && 'tanggalRequest' in selectedPengeluaran.storeRequest
        ? {
            nomorSR: typeof selectedPengeluaran.storeRequest.nomorSR === "string" ? selectedPengeluaran.storeRequest.nomorSR : "",
            tanggalRequest: typeof selectedPengeluaran.storeRequest.tanggalRequest === "string" ? selectedPengeluaran.storeRequest.tanggalRequest : "",
          }
        : undefined,
    };
    return (
      <PengeluaranBarangDetail
        pengeluaranBarang={detailData}
        onClose={() => {
          setShowDetail(false);
          setSelectedPengeluaran(null);
        }}
        onSuccess={handleSuccess}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const handleExportExcel = () => {
    const columns: ExportColumn[] = [
      { header: "Nomor Pengeluaran", key: "nomorPengeluaran", width: 20 },
      { header: "Tanggal Keluar", key: "tanggalPengeluaran", width: 15 },
      { header: "Divisi", key: "divisi", width: 20 },
      { header: "Pemohon", key: "requestedBy", width: 20 },
      { header: "Nomor SR", key: "nomorSR", width: 18 },
      { header: "Total Nilai (Rp)", key: "totalHarga", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Keterangan", key: "keterangan", width: 30 },
    ];

    const dataToExport = filteredPengeluaran.map((p) => ({
      nomorPengeluaran: p.nomorPengeluaran,
      tanggalPengeluaran: p.tanggalPengeluaran ? format(new Date(p.tanggalPengeluaran), "dd/MM/yyyy") : "-",
      divisi: p.divisi,
      requestedBy: p.requestedBy,
      nomorSR: p.storeRequest?.nomorSR || "-",
      totalHarga: calculateTotal(p),
      status: p.status,
      keterangan: p.keterangan || "-",
    }));

    exportToExcel(dataToExport, columns, "Data_Pengeluaran_Barang", "Pengeluaran_Barang");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Pengeluaran Barang</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={filteredPengeluaran.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pengeluaran
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor pengeluaran, divisi, atau nomor SR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Menunggu Approval</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPengeluaran.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data pengeluaran barang
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nomor SR</TableHead>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Diminta oleh</TableHead>
                    <TableHead>Dikeluarkan oleh</TableHead>
                    <TableHead className="text-right">Total Nilai</TableHead>
                    <TableHead className="text-right">Total Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPengeluaran.map((pengeluaran) => (
                    <TableRow key={pengeluaran.id}>
                      <TableCell className="font-medium font-mono text-sm">
                        {pengeluaran.nomorPengeluaran}
                      </TableCell>
                      <TableCell>
                        {format(new Date(pengeluaran.tanggalPengeluaran), "dd MMM yyyy HH:mm", { locale: id })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {pengeluaran.storeRequest?.nomorSR || "-"}
                      </TableCell>
                      <TableCell>{pengeluaran.divisi}</TableCell>
                      <TableCell>{pengeluaran.requestedBy}</TableCell>
                      <TableCell>{getIssuedByDisplay(pengeluaran)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        Rp {calculateTotal(pengeluaran).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        {pengeluaran.items.length} item
                      </TableCell>
                      <TableCell>{getStatusBadge(pengeluaran.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPengeluaran(pengeluaran);
                            setShowDetail(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPengeluaran.length}
            pageStart={pageStart}
            pageEnd={pageEnd}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
