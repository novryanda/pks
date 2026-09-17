"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  RotateCcw,
  Download,
  DollarSign,
  Clock,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  Building,
  Zap,
  Users,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";
import {
  BiayaOperasionalFormDialog,
  type PengajuanBiayaFormData,
} from "./biaya-operasional-form-dialog";
import {
  BiayaOperasionalDetailDialog,
  type DetailPengajuanBiaya,
} from "./biaya-operasional-detail-dialog";

interface SummaryData {
  total: number;
  totalNominal: number;
  draft: number;
  pending: number;
  pendingNominal: number;
  approved: number;
  approvedNominal: number;
  paid: number;
  paidNominal: number;
  rejected: number;
}

const KATEGORI_OPTIONS = [
  { value: "OPERASIONAL_KEUANGAN", label: "Operasional Umum / Pabrik", icon: Building },
  { value: "PLN", label: "PLN / Listrik", icon: Zap },
  { value: "BPJS", label: "BPJS / Jamsostek", icon: Users },
  { value: "PPN", label: "PPN", icon: FileText },
  { value: "PPH_21", label: "PPH 21 (Karyawan)", icon: Users },
  { value: "PPH_22", label: "PPH 22 (Barang)", icon: FileText },
  { value: "PPH_23", label: "PPH 23 (Jasa)", icon: FileText },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
  },
  PENDING: {
    label: "Menunggu Persetujuan",
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300",
  },
  APPROVED: {
    label: "Disetujui",
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300",
  },
  REJECTED: {
    label: "Ditolak",
    className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300",
  },
  PAID: {
    label: "Lunas Dibayar",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className: "bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-900 dark:text-gray-400",
  },
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);

const ITEMS_PER_PAGE = 15;

export function BiayaOperasionalList() {
  const { hasActionAccess, isAdmin } = useUserPermissions();
  const [data, setData] = useState<DetailPengajuanBiaya[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<PengajuanBiayaFormData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<DetailPengajuanBiaya | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (kategoriFilter !== "all") params.append("kategoriBiaya", kategoriFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/pt-pks/biaya-operasional?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || json);
      }
    } catch (err) {
      console.error("Error fetching pengajuan biaya:", err);
      toast.error("Gagal memuat data pengajuan biaya operasional");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, kategoriFilter, startDate, endDate, searchTerm]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/pt-pks/biaya-operasional/summary`);
      if (res.ok) {
        const json = await res.json();
        setSummary(json);
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSummary();
  }, [fetchData, fetchSummary]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setKategoriFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  // Local filtering & pagination
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      item.nomorPengajuan.toLowerCase().includes(s) ||
      item.keperluan.toLowerCase().includes(s) ||
      item.divisi.toLowerCase().includes(s) ||
      item.requestedBy.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const pageStart = filteredData.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length);

  const handleOpenDetail = (item: DetailPengajuanBiaya) => {
    setSelectedDetail(item);
    setDetailOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingData(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: DetailPengajuanBiaya) => {
    setEditingData({
      id: item.id,
      nomorPengajuan: item.nomorPengajuan,
      tanggalPengajuan: item.tanggalPengajuan,
      divisi: item.divisi,
      kategoriBiaya: item.kategoriBiaya as any,
      keperluan: item.keperluan,
      catatan: item.catatan,
      status: item.status,
      items: item.items.map((it) => ({
        id: it.id,
        deskripsi: it.deskripsi,
        jumlah: it.jumlah,
        satuan: it.satuan,
        estimasiHarga: it.estimasiHarga,
        keterangan: it.keterangan || undefined,
      })),
    });
    setFormOpen(true);
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Nomor Pengajuan", key: "nomorPengajuan", width: 18 },
      { header: "Tanggal", key: "tanggalPengajuan", width: 14 },
      { header: "Divisi", key: "divisi", width: 18 },
      { header: "Pemohon", key: "requestedBy", width: 20 },
      { header: "Kategori Biaya", key: "kategoriBiaya", width: 22 },
      { header: "Keperluan", key: "keperluan", width: 30 },
      { header: "Deskripsi Item", key: "deskripsiItem", width: 25 },
      { header: "Qty", key: "jumlah", width: 10 },
      { header: "Satuan", key: "satuan", width: 12 },
      { header: "Estimasi Harga", key: "estimasiHarga", width: 18 },
      { header: "Subtotal", key: "subtotal", width: 18 },
      { header: "Total Pengajuan", key: "totalBiaya", width: 18 },
      { header: "Status", key: "status", width: 16 },
      { header: "Approver", key: "approvedBy", width: 20 },
      { header: "No. Biaya Keuangan", key: "nomorBiaya", width: 18 },
    ];

    const exportRows: Record<string, unknown>[] = filteredData.flatMap((item) =>
      item.items.length > 0
        ? item.items.map((it) => ({
            nomorPengajuan: item.nomorPengajuan,
            tanggalPengajuan: format(new Date(item.tanggalPengajuan), "dd/MM/yyyy"),
            divisi: item.divisi,
            requestedBy: item.requestedBy,
            kategoriBiaya: item.kategoriBiaya,
            keperluan: item.keperluan,
            deskripsiItem: it.deskripsi,
            jumlah: it.jumlah,
            satuan: it.satuan,
            estimasiHarga: it.estimasiHarga,
            subtotal: it.subtotal,
            totalBiaya: item.totalBiaya,
            status: item.status,
            approvedBy: item.approvedBy || "-",
            nomorBiaya: item.biayaPengeluaran?.nomorBiaya || "-",
          }))
        : [
            {
              nomorPengajuan: item.nomorPengajuan,
              tanggalPengajuan: format(new Date(item.tanggalPengajuan), "dd/MM/yyyy"),
              divisi: item.divisi,
              requestedBy: item.requestedBy,
              kategoriBiaya: item.kategoriBiaya,
              keperluan: item.keperluan,
              deskripsiItem: "-",
              jumlah: 0,
              satuan: "-",
              estimasiHarga: 0,
              subtotal: 0,
              totalBiaya: item.totalBiaya,
              status: item.status,
              approvedBy: item.approvedBy || "-",
              nomorBiaya: item.biayaPengeluaran?.nomorBiaya || "-",
            },
          ]
    );

    exportToExcel(
      exportRows,
      columns,
      `Pengajuan_Biaya_Operasional_${format(new Date(), "yyyyMMdd")}`
    );
  };

  const canCreate =
    isAdmin || hasActionAccess("gudang.biayaOperasional", "create");

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Pengajuan
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatCurrency(summary?.totalNominal || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.total || 0} formulir diajukan
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Menunggu Persetujuan
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {summary?.pending || 0} Pengajuan
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nominal: {formatCurrency(summary?.pendingNominal || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Disetujui (Siap Dibayar)
            </CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {summary?.approved || 0} Pengajuan
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Antrean Keuangan: {formatCurrency(summary?.approvedNominal || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lunas Dibayarkan
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary?.paid || 0} Pengajuan
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Terealisasi: {formatCurrency(summary?.paidNominal || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">
                Daftar Pengajuan Biaya Operasional
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Alur pengajuan biaya kebutuhan pabrik/gudang yang otomatis masuk ke Biaya Pengeluaran (Keuangan) setelah disetujui.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="gap-1 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </Button>
              {canCreate && (
                <Button
                  size="sm"
                  onClick={handleOpenCreate}
                  className="gap-1 text-xs bg-primary text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Buat Pengajuan Biaya
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor, pemohon, keperluan..."
                className="pl-8 text-xs h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING">Menunggu Persetujuan</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="PAID">Lunas Dibayar</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {KATEGORI_OPTIONS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-1.5 items-center">
              <Input
                type="date"
                className="text-xs h-9 flex-1"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Tanggal Mulai"
              />
              <Input
                type="date"
                className="text-xs h-9 flex-1"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Tanggal Akhir"
              />
              {(searchTerm || statusFilter !== "all" || kategoriFilter !== "all" || startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 px-2 text-muted-foreground hover:text-foreground"
                  title="Reset Filter"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead>Tgl Pengajuan</TableHead>
                  <TableHead>No. Pengajuan</TableHead>
                  <TableHead>Divisi & Pemohon</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Keperluan</TableHead>
                  <TableHead className="text-right">Total Biaya</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-xs">
                      Memuat data pengajuan biaya operasional...
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-xs">
                      Tidak ada data pengajuan biaya operasional yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => {
                    const statusCfg = (STATUS_CONFIG[item.status] || STATUS_CONFIG.DRAFT)!;
                    return (
                      <TableRow key={item.id} className="text-xs hover:bg-muted/30">
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(new Date(item.tanggalPengajuan), "dd/MM/yyyy", {
                            locale: idLocale,
                          })}
                        </TableCell>
                        <TableCell className="font-semibold text-primary whitespace-nowrap">
                          {item.nomorPengajuan}
                          {item.biayaPengeluaran && (
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              Ref: {item.biayaPengeluaran.nomorBiaya}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium block">{item.divisi}</span>
                          <span className="text-[11px] text-muted-foreground">{item.requestedBy}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {KATEGORI_OPTIONS.find((k) => k.value === item.kategoriBiaya)?.label || item.kategoriBiaya.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          <p className="truncate font-medium" title={item.keperluan}>{item.keperluan}</p>
                          {item.items.length > 1 && (
                            <span className="text-[10px] text-muted-foreground">
                              {item.items.length} rincian item
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground whitespace-nowrap">
                          {formatCurrency(item.totalBiaya)}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge variant="outline" className={`text-[10px] ${statusCfg.className}`}>
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs gap-1"
                              onClick={() => handleOpenDetail(item)}
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Detail</span>
                            </Button>
                            {(isAdmin || hasActionAccess("gudang.biayaOperasional", "edit")) &&
                              item.status !== "PAID" &&
                              item.status !== "CANCELLED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                  onClick={() => handleOpenEdit(item)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </Button>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredData.length}
            pageStart={pageStart}
            pageEnd={pageEnd}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BiayaOperasionalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editingData}
        onSuccess={() => {
          fetchData();
          fetchSummary();
        }}
      />

      <BiayaOperasionalDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        data={selectedDetail}
        onRefresh={() => {
          fetchData();
          fetchSummary();
        }}
        onEdit={(d) => handleOpenEdit(d)}
      />
    </div>
  );
}
