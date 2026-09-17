"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { NumericInput } from "@/components/ui/numeric-input";
import { DecimalNumericInput } from "@/components/ui/decimal-numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  RefreshCw,
  FileText,
  Send,
  XCircle,
  CreditCard,
  Printer,
  Loader2,
  Eye,
  Package,
  Pencil,
  Search,
  RotateCcw,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

type Invoice = {
  id: string;
  nomorInvoice: string;
  tanggalInvoice: string;
  tanggalJatuhTempo: string | null;
  status: string;
  totalBerat: number;
  hargaPerKg: number;
  subtotalBruto: number;
  klaimMutuPersen: number;
  klaimMutuNilai: number;
  klaimMutuKeterangan?: string | null;
  klaimSusutPersen: number;
  klaimSusutNilai: number;
  klaimSusutKeterangan?: string | null;
  totalPotongan: number;
  subtotalNetto: number;
  ppnPersen: number;
  ppnNilai: number;
  pphPersen: number;
  pphNilai: number;
  totalNilai: number;
  totalDibayar: number;
  sisaPembayaran: number;
  catatan?: string | null;
  showPpnDisclaimer?: boolean;
  namaPenandatangan?: string | null;
  jabatanPenandatangan?: string | null;
  buyer: {
    id: string;
    name: string;
    code: string;
  };
  contract: {
    id: string;
    contractNumber: string;
    paymentMethod: "LUNAS_AWAL" | "SEBAGIAN" | "SETELAH_PENGIRIMAN";
  };
  contractSummary: {
    totalContractQuantity: number;
    totalInvoicedQuantity: number;
    remainingContractQuantity: number;
    invoicePercentage: number;
  };
  invoiceItems: {
    id: string;
    nomorPengiriman: string;
    beratNetto: number;
  }[];
  pembayaranInvoice: {
    id: string;
    tanggalBayar: string;
    jumlahBayar: number;
    metodePembayaran: string | null;
  }[];
};

type ContractInvoiceSummary = {
  contractId: string;
  contractNumber: string;
  buyer: {
    id: string;
    name: string;
    code: string;
  };
  contractItems: {
    id: string;
    materialName: string;
    materialCode: string;
    quantity: number;
    unitPrice: number;
    satuan: { name: string; symbol: string };
  }[];
  totalContractQuantity: number;
  totalInvoicedQuantity: number;
  remainingQuantity: number;
  invoicePercentage: number;
  totalInvoiceValue: number;
  totalPaid: number;
  invoices: {
    id: string;
    nomorInvoice: string;
    tanggalInvoice: string;
    status: string;
    totalBerat: number;
    totalNilai: number;
    totalDibayar: number;
    sisaPembayaran: number;
  }[];
  isFullyInvoiced: boolean;
  canCreateInvoice: boolean;
};

type InvoiceListViewProps = {
  onRefresh?: () => void;
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ISSUED: "bg-blue-100 text-blue-700",
  PARTIAL_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Terbit",
  PARTIAL_PAID: "Sebagian Dibayar",
  PAID: "Lunas",
  CANCELLED: "Batal",
};

const paymentMethodLabels: Record<string, string> = {
  LUNAS_AWAL: "Lunas Awal",
  SEBAGIAN: "Sebagian",
  SETELAH_PENGIRIMAN: "Setelah Kirim",
};

export function InvoiceListView({ onRefresh }: InvoiceListViewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Detail Dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [contractSummary, setContractSummary] = useState<ContractInvoiceSummary | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Payment form
  const [tanggalBayar, setTanggalBayar] = useState(format(new Date(), "yyyy-MM-dd"));
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [metodePembayaran, setMetodePembayaran] = useState("");
  const [nomorReferensi, setNomorReferensi] = useState("");
  const [keterangan, setKeterangan] = useState("");

  // Edit Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editNomorInvoice, setEditNomorInvoice] = useState("");
  const [editTanggalInvoice, setEditTanggalInvoice] = useState("");
  const [editNamaPenandatangan, setEditNamaPenandatangan] = useState("");
  const [editJabatanPenandatangan, setEditJabatanPenandatangan] = useState("");
  const [editTotalBerat, setEditTotalBerat] = useState<number>(0);
  const [editKlaimMutuKg, setEditKlaimMutuKg] = useState<number>(0);
  const [editKlaimMutuKeterangan, setEditKlaimMutuKeterangan] = useState("");
  const [editKlaimSusutKg, setEditKlaimSusutKg] = useState<number>(0);
  const [editKlaimSusutKeterangan, setEditKlaimSusutKeterangan] = useState("");
  const [editPpnPersen, setEditPpnPersen] = useState<number>(0);
  const [editPphPersen, setEditPphPersen] = useState<number>(0);
  const [editCatatan, setEditCatatan] = useState("");
  const [editShowPpnDisclaimer, setEditShowPpnDisclaimer] = useState(false);

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", pageSize.toString());
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/pt-pks/invoice?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setInvoices(result.data || []);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
          setTotalCount(result.pagination.total || 0);
        } else {
          setTotalCount(result.data?.length || 0);
          setTotalPages(1);
        }
      } else {
        console.error("Failed to fetch invoices");
        setInvoices([]);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, pageSize, debouncedSearch, statusFilter, startDate, endDate]);

  const handleRefresh = () => {
    fetchInvoices();
    onRefresh?.();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const fetchContractSummary = async (contractId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/pt-pks/contract/${contractId}/invoice-summary`);
      if (res.ok) {
        const data = await res.json();
        setContractSummary(data);
      } else {
        console.error("Failed to fetch contract summary");
        toast.error("Gagal memuat detail kontrak");
      }
    } catch (error) {
      console.error("Error fetching contract summary:", error);
      toast.error("Gagal memuat detail kontrak");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailDialog(true);
    fetchContractSummary(invoice.contract.id);
  };

  const handleIssue = async (invoice: Invoice) => {
    const isLunasAwal = invoice.contract?.paymentMethod === "LUNAS_AWAL";
    const confirmMessage = isLunasAwal
      ? `Terbitkan invoice ${invoice.nomorInvoice}?\n\nKontrak ini menggunakan metode "Lunas Awal" - pembayaran akan otomatis tercatat saat invoice diterbitkan.`
      : `Terbitkan invoice ${invoice.nomorInvoice}? Invoice yang sudah diterbitkan tidak dapat diubah.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await fetch(`/api/pt-pks/invoice/${invoice.id}/issue`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menerbitkan invoice");
      }

      const successMessage = isLunasAwal
        ? `Invoice ${invoice.nomorInvoice} berhasil diterbitkan & pembayaran tercatat`
        : `Invoice ${invoice.nomorInvoice} berhasil diterbitkan`;
      toast.success(successMessage);
      handleRefresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menerbitkan invoice";
      toast.error(errorMessage);
    }
  };

  const handleCancel = async (invoice: Invoice) => {
    if (!confirm(`Batalkan invoice ${invoice.nomorInvoice}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/pt-pks/invoice/${invoice.id}/cancel`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membatalkan invoice");
      }

      toast.success(`Invoice ${invoice.nomorInvoice} berhasil dibatalkan`);
      handleRefresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal membatalkan invoice";
      toast.error(errorMessage);
    }
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setJumlahBayar(invoice.sisaPembayaran.toString());
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedInvoice) return;

    const amount = parseFloat(jumlahBayar);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Jumlah bayar harus lebih dari 0");
      return;
    }

    if (amount > selectedInvoice.sisaPembayaran) {
      toast.error(`Jumlah bayar melebihi sisa pembayaran (Rp ${selectedInvoice.sisaPembayaran.toLocaleString("id-ID")})`);
      return;
    }

    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/pt-pks/invoice/${selectedInvoice.id}/pembayaran`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggalBayar,
          jumlahBayar: amount,
          metodePembayaran: metodePembayaran || null,
          nomorReferensi: nomorReferensi || null,
          keterangan: keterangan || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menambahkan pembayaran");
      }

      toast.success("Pembayaran berhasil dicatat");
      setShowPaymentDialog(false);
      resetPaymentForm();
      handleRefresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan pembayaran";
      toast.error(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const resetPaymentForm = () => {
    setTanggalBayar(format(new Date(), "yyyy-MM-dd"));
    setJumlahBayar("");
    setMetodePembayaran("");
    setNomorReferensi("");
    setKeterangan("");
  };

  const handleOpenEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setEditNomorInvoice(invoice.nomorInvoice);
    setEditTanggalInvoice(format(new Date(invoice.tanggalInvoice), "yyyy-MM-dd"));
    setEditNamaPenandatangan(invoice.namaPenandatangan || "TARA MIFTAHUR");
    setEditJabatanPenandatangan(invoice.jabatanPenandatangan || "Direktur");
    setEditTotalBerat(invoice.totalBerat);

    // Calculate claims in kg
    const mutuKg = invoice.hargaPerKg > 0 ? invoice.klaimMutuNilai / invoice.hargaPerKg : 0;
    const susutKg = invoice.hargaPerKg > 0 ? invoice.klaimSusutNilai / invoice.hargaPerKg : 0;
    setEditKlaimMutuKg(parseFloat(mutuKg.toFixed(4)));
    setEditKlaimMutuKeterangan(invoice.klaimMutuKeterangan || "");
    setEditKlaimSusutKg(parseFloat(susutKg.toFixed(4)));
    setEditKlaimSusutKeterangan(invoice.klaimSusutKeterangan || "");

    setEditPpnPersen(invoice.ppnPersen);
    setEditPphPersen(invoice.pphPersen);
    setEditCatatan(invoice.catatan || "");
    setEditShowPpnDisclaimer(invoice.showPpnDisclaimer || false);

    setShowEditDialog(true);
  };

  const editCalculations = useMemo(() => {
    if (!editingInvoice) {
      return {
        subtotalBruto: 0,
        klaimMutuNilai: 0,
        klaimSusutNilai: 0,
        totalPotongan: 0,
        subtotalNetto: 0,
        ppnNilai: 0,
        pphNilai: 0,
        totalNilai: 0,
      };
    }

    const hargaPerKg = editingInvoice.hargaPerKg;
    const subtotalBruto = editTotalBerat * hargaPerKg;
    const klaimMutuNilai = editKlaimMutuKg * hargaPerKg;
    const klaimSusutNilai = editKlaimSusutKg * hargaPerKg;
    const totalPotongan = klaimMutuNilai + klaimSusutNilai;
    const subtotalNetto = subtotalBruto - totalPotongan;
    const ppnNilai = (subtotalNetto * editPpnPersen) / 100;
    const pphNilai = (subtotalNetto * editPphPersen) / 100;
    const totalNilai = subtotalNetto + ppnNilai - pphNilai;

    return {
      subtotalBruto,
      klaimMutuNilai,
      klaimSusutNilai,
      totalPotongan,
      subtotalNetto,
      ppnNilai,
      pphNilai,
      totalNilai,
    };
  }, [
    editingInvoice,
    editTotalBerat,
    editKlaimMutuKg,
    editKlaimSusutKg,
    editPpnPersen,
    editPphPersen,
  ]);

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;
    if (!editNomorInvoice.trim()) {
      toast.error("Nomor invoice tidak boleh kosong");
      return;
    }
    if (editTotalBerat <= 0) {
      toast.error("Kuantitas harus lebih dari 0");
      return;
    }

    setEditLoading(true);
    try {
      const payload = {
        nomorInvoice: editNomorInvoice.trim(),
        tanggalInvoice: editTanggalInvoice,
        namaPenandatangan: editNamaPenandatangan.trim() || "TARA MIFTAHUR",
        jabatanPenandatangan: editJabatanPenandatangan.trim() || "Direktur",
        totalBerat: editTotalBerat,
        hargaPerKg: editingInvoice.hargaPerKg,
        subtotalBruto: editCalculations.subtotalBruto,
        klaimMutuPersen: 0,
        klaimMutuNilai: editCalculations.klaimMutuNilai,
        klaimMutuKeterangan: editKlaimMutuKeterangan || null,
        klaimSusutPersen: 0,
        klaimSusutNilai: editCalculations.klaimSusutNilai,
        klaimSusutKeterangan: editKlaimSusutKeterangan || null,
        ppnPersen: editPpnPersen,
        pphPersen: editPphPersen,
        catatan: editCatatan || null,
        showPpnDisclaimer: editShowPpnDisclaimer,
      };

      const res = await fetch(`/api/pt-pks/invoice/${editingInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Gagal memperbarui invoice");
      }

      toast.success(`Invoice ${editNomorInvoice} berhasil diperbarui`);
      setShowEditDialog(false);
      setEditingInvoice(null);
      handleRefresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui invoice";
      toast.error(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "2000");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      let exportList: Invoice[] = invoices;
      const res = await fetch(`/api/pt-pks/invoice?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        if (Array.isArray(result.data) && result.data.length > 0) {
          exportList = result.data;
        }
      }

      if (exportList.length === 0) {
        toast.error("Tidak ada data invoice untuk diexport");
        return;
      }

      const columns: ExportColumn[] = [
        { header: "Nomor Invoice", key: "nomorInvoice", width: 22 },
        { header: "Tanggal Invoice", key: "tanggalInvoiceFormatted", width: 16 },
        { header: "Jatuh Tempo", key: "tanggalJatuhTempoFormatted", width: 16 },
        { header: "Nama Buyer", key: "buyerName", width: 25 },
        { header: "Nomor Kontrak", key: "contractNumber", width: 20 },
        { header: "Metode Bayar", key: "metodeBayar", width: 16 },
        { header: "Kuantitas (kg)", key: "totalBeratFormatted", width: 16 },
        { header: "Harga per Kg (Rp)", key: "hargaPerKgFormatted", width: 18 },
        { header: "Subtotal Bruto (Rp)", key: "subtotalBrutoFormatted", width: 20 },
        { header: "Klaim Mutu (Rp)", key: "klaimMutuFormatted", width: 18 },
        { header: "Klaim Susut (Rp)", key: "klaimSusutFormatted", width: 18 },
        { header: "PPN (Rp)", key: "ppnFormatted", width: 16 },
        { header: "PPh (Rp)", key: "pphFormatted", width: 16 },
        { header: "Total Nilai (Rp)", key: "totalNilaiFormatted", width: 20 },
        { header: "Total Dibayar (Rp)", key: "totalDibayarFormatted", width: 20 },
        { header: "Sisa Tagihan (Rp)", key: "sisaTagihanFormatted", width: 20 },
        { header: "Status", key: "statusLabel", width: 16 },
      ];

      const dataToExport = exportList.map((inv) => ({
        nomorInvoice: inv.nomorInvoice,
        tanggalInvoiceFormatted: format(new Date(inv.tanggalInvoice), "dd/MM/yyyy"),
        tanggalJatuhTempoFormatted: inv.tanggalJatuhTempo ? format(new Date(inv.tanggalJatuhTempo), "dd/MM/yyyy") : "-",
        buyerName: inv.buyer?.name || "-",
        contractNumber: inv.contract?.contractNumber || "-",
        metodeBayar: paymentMethodLabels[inv.contract?.paymentMethod] || inv.contract?.paymentMethod || "-",
        totalBeratFormatted: inv.totalBerat.toLocaleString("id-ID", { maximumFractionDigits: 2 }),
        hargaPerKgFormatted: (inv.hargaPerKg || 0).toLocaleString("id-ID"),
        subtotalBrutoFormatted: (inv.subtotalBruto || 0).toLocaleString("id-ID"),
        klaimMutuFormatted: (inv.klaimMutuNilai || 0).toLocaleString("id-ID"),
        klaimSusutFormatted: (inv.klaimSusutNilai || 0).toLocaleString("id-ID"),
        ppnFormatted: (inv.ppnNilai || 0).toLocaleString("id-ID"),
        pphFormatted: (inv.pphNilai || 0).toLocaleString("id-ID"),
        totalNilaiFormatted: (inv.totalNilai || 0).toLocaleString("id-ID"),
        totalDibayarFormatted: (inv.totalDibayar || 0).toLocaleString("id-ID"),
        sisaTagihanFormatted: Math.max(0, (inv.totalNilai || 0) - (inv.totalDibayar || 0)).toLocaleString("id-ID"),
        statusLabel: statusLabels[inv.status] || inv.status,
      }));

      exportToExcel(dataToExport, columns, `Data_Invoice_${format(new Date(), "yyyyMMdd")}`, "Invoice");
      toast.success("Data invoice berhasil diexport");
    } catch (err) {
      console.error("Error exporting invoice:", err);
      toast.error("Gagal mengekspor invoice");
    }
  };

  const pageStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h3 className="text-lg font-semibold">Daftar Invoice</h3>
          <p className="text-sm text-muted-foreground">
            {totalCount} invoice ditemukan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={invoices.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-muted/30 p-3 rounded-lg border">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari no. invoice, buyer, kontrak..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ISSUED">Terbit</SelectItem>
              <SelectItem value="PARTIAL_PAID">Sebagian Dibayar</SelectItem>
              <SelectItem value="PAID">Lunas</SelectItem>
              <SelectItem value="CANCELLED">Batal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center md:col-span-2">
          <div className="flex-1 flex gap-1.5 items-center">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 text-xs flex-1"
              title="Tanggal Mulai"
            />
            <span className="text-muted-foreground text-xs">s/d</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 text-xs flex-1"
              title="Tanggal Selesai"
            />
          </div>

          {(searchTerm || statusFilter !== "all" || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="Reset Filter"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Invoice</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Kontrak</TableHead>
              <TableHead className="text-right">Kuantitas (kg)</TableHead>
              <TableHead className="text-right">Total Nilai</TableHead>
              <TableHead className="text-right">Dibayar</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-xs">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  Memuat daftar invoice...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/60 mb-2" />
                  <p className="font-semibold text-sm">Tidak ada invoice ditemukan</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Coba ubah kata kunci pencarian atau sesuaikan filter tanggal.
                  </p>
                </TableCell>
              </TableRow>
            ) : invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="font-medium">{invoice.nomorInvoice}</div>
                  {invoice.invoiceItems.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {invoice.invoiceItems.length} pengiriman
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{format(new Date(invoice.tanggalInvoice), "d MMM yyyy", { locale: localeId })}</div>
                  {invoice.pembayaranInvoice?.[0] && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal whitespace-nowrap mt-0.5">
                      Bayar: {format(new Date(invoice.pembayaranInvoice[0].tanggalBayar), "d MMM yyyy", { locale: localeId })}
                    </div>
                  )}
                </TableCell>
                <TableCell>{invoice.buyer.name}</TableCell>
                <TableCell>
                  <div>{invoice.contract.contractNumber}</div>
                  <div className="text-xs">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {paymentMethodLabels[invoice.contract.paymentMethod] || invoice.contract.paymentMethod}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">{invoice.totalBerat.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</div>
                  <div className="text-xs text-muted-foreground">
                    Kontrak: {invoice.contractSummary?.totalContractQuantity.toLocaleString("id-ID", { maximumFractionDigits: 2 }) || "-"}
                  </div>
                  <div className="text-xs text-orange-600">
                    Sisa: {invoice.contractSummary?.remainingContractQuantity.toLocaleString("id-ID", { maximumFractionDigits: 2 }) || "-"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">
                    Rp {invoice.totalNilai.toLocaleString("id-ID")}
                  </div>
                  {invoice.totalPotongan > 0 && (
                    <div className="text-xs text-red-500">
                      Pot: Rp {invoice.totalPotongan.toLocaleString("id-ID")}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div>Rp {invoice.totalDibayar.toLocaleString("id-ID")}</div>
                  {invoice.pembayaranInvoice?.[0] && (
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {format(new Date(invoice.pembayaranInvoice[0].tanggalBayar), "d/MM/yyyy", { locale: localeId })}
                    </div>
                  )}
                  {invoice.sisaPembayaran > 0 && invoice.status !== "CANCELLED" && (
                    <div className="text-xs text-amber-600">
                      Sisa: Rp {invoice.sisaPembayaran.toLocaleString("id-ID")}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={statusColors[invoice.status]}>
                    {statusLabels[invoice.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-1">
                    {/* View Detail */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Lihat Detail"
                      onClick={() => handleViewDetail(invoice)}
                    >
                      <Eye className="h-4 w-4 text-slate-600" />
                    </Button>
                    {/* Print PDF - available for all except cancelled */}
                    {invoice.status !== "CANCELLED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Cetak PDF"
                        onClick={() => window.open(`/api/pt-pks/invoice/${invoice.id}/pdf`, '_blank')}
                      >
                        <Printer className="h-4 w-4 text-cyan-600" />
                      </Button>
                    )}
                    {invoice.status === "DRAFT" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          title="Edit Draft Invoice"
                          onClick={() => handleOpenEdit(invoice)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Terbitkan Invoice"
                          onClick={() => handleIssue(invoice)}
                        >
                          <Send className="h-4 w-4 text-blue-600" />
                        </Button>
                      </>
                    )}
                    {(invoice.status === "ISSUED" || invoice.status === "PARTIAL_PAID") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Input Pembayaran"
                        onClick={() => openPaymentDialog(invoice)}
                      >
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {(invoice.status === "DRAFT" || invoice.status === "ISSUED") &&
                      invoice.totalDibayar === 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Batalkan Invoice"
                          onClick={() => handleCancel(invoice)}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalCount > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageStart={pageStart}
          pageEnd={pageEnd}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Input Pembayaran</DialogTitle>
            <DialogDescription>
              Invoice: {selectedInvoice?.nomorInvoice}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              {/* Invoice Info */}
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Invoice</span>
                  <span className="font-medium">
                    Rp {selectedInvoice.totalNilai.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sudah Dibayar</span>
                  <span className="font-medium text-green-600">
                    Rp {selectedInvoice.totalDibayar.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa Pembayaran</span>
                  <span className="font-bold text-amber-600">
                    Rp {selectedInvoice.sisaPembayaran.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tanggalBayar">Tanggal Bayar</Label>
                  <Input
                    id="tanggalBayar"
                    type="date"
                    value={tanggalBayar}
                    onChange={(e) => setTanggalBayar(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jumlahBayar">Jumlah Bayar (Rp)</Label>
                  <Input
                    id="jumlahBayar"
                    type="number"
                    min="0"
                    value={jumlahBayar}
                    onChange={(e) => setJumlahBayar(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metodePembayaran">Metode Pembayaran</Label>
                  <Select value={metodePembayaran} onValueChange={setMetodePembayaran}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="GIRO">Giro</SelectItem>
                      <SelectItem value="CEK">Cek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomorReferensi">Nomor Referensi</Label>
                  <Input
                    id="nomorReferensi"
                    value={nomorReferensi}
                    onChange={(e) => setNomorReferensi(e.target.value)}
                    placeholder="Nomor bukti transfer / cek / dll"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Textarea
                    id="keterangan"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Keterangan tambahan (opsional)"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              disabled={paymentLoading}
            >
              Batal
            </Button>
            <Button onClick={handlePayment} disabled={paymentLoading}>
              {paymentLoading ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog - Contract Invoice Summary */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detail Invoice
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice?.nomorInvoice} - {selectedInvoice?.contract.contractNumber}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : contractSummary ? (
            <div className="space-y-6">
              {/* Invoice Info */}
              {selectedInvoice && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Informasi Invoice</span>
                      <Badge className={statusColors[selectedInvoice.status]}>
                        {statusLabels[selectedInvoice.status]}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">No. Invoice</p>
                        <p className="font-medium">{selectedInvoice.nomorInvoice}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tanggal Invoice</p>
                        <p className="font-medium">
                          {format(new Date(selectedInvoice.tanggalInvoice), "d MMMM yyyy", { locale: localeId })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Penandatangan</p>
                        <p className="font-medium">
                          {selectedInvoice.namaPenandatangan || "TARA MIFTAHUR"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedInvoice.jabatanPenandatangan || "Direktur"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Buyer</p>
                        <p className="font-medium">{selectedInvoice.buyer.name}</p>
                      </div>
                    </div>

                    {/* Quantity & Pricing */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Detail Kuantitas & Harga</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Kuantitas Invoice</p>
                          <p className="font-medium text-lg">{selectedInvoice.totalBerat.toLocaleString("id-ID")} kg</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Harga per kg</p>
                          <p className="font-medium">Rp {selectedInvoice.hargaPerKg.toLocaleString("id-ID")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Subtotal Bruto</p>
                          <p className="font-medium">Rp {selectedInvoice.subtotalBruto.toLocaleString("id-ID")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Potongan</p>
                          <p className="font-medium text-red-600">
                            {selectedInvoice.totalPotongan > 0
                              ? `- Rp ${selectedInvoice.totalPotongan.toLocaleString("id-ID")}`
                              : "-"
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Potongan Detail */}
                    {(selectedInvoice.klaimMutuNilai > 0 || selectedInvoice.klaimSusutNilai > 0) && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Detail Potongan</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {selectedInvoice.klaimMutuNilai > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg">
                              <p className="text-muted-foreground">Klaim Mutu ({selectedInvoice.hargaPerKg > 0 ? (selectedInvoice.klaimMutuNilai / selectedInvoice.hargaPerKg).toLocaleString("id-ID", { maximumFractionDigits: 2 }) : 0} kg)</p>
                              <p className="font-medium text-red-600">- Rp {selectedInvoice.klaimMutuNilai.toLocaleString("id-ID")}</p>
                            </div>
                          )}
                          {selectedInvoice.klaimSusutNilai > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg">
                              <p className="text-muted-foreground">Klaim Susut ({selectedInvoice.hargaPerKg > 0 ? (selectedInvoice.klaimSusutNilai / selectedInvoice.hargaPerKg).toLocaleString("id-ID", { maximumFractionDigits: 2 }) : 0} kg)</p>
                              <p className="font-medium text-red-600">- Rp {selectedInvoice.klaimSusutNilai.toLocaleString("id-ID")}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tax & Total */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Pajak & Total</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Subtotal Netto</p>
                          <p className="font-medium">Rp {selectedInvoice.subtotalNetto.toLocaleString("id-ID")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">PPN ({selectedInvoice.ppnPersen}%)</p>
                          <p className="font-medium">
                            {selectedInvoice.ppnNilai > 0
                              ? `+ Rp ${selectedInvoice.ppnNilai.toLocaleString("id-ID")}`
                              : "-"
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">PPh ({selectedInvoice.pphPersen}%)</p>
                          <p className="font-medium">
                            {selectedInvoice.pphNilai > 0
                              ? `- Rp ${selectedInvoice.pphNilai.toLocaleString("id-ID")}`
                              : "-"
                            }
                          </p>
                        </div>
                        <div className="bg-primary/10 p-2 rounded">
                          <p className="text-muted-foreground">Total Invoice</p>
                          <p className="font-bold text-lg text-primary">Rp {selectedInvoice.totalNilai.toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Status Pembayaran</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            Rp {selectedInvoice.totalDibayar.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">
                            Rp {selectedInvoice.sisaPembayaran.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground">Sisa Pembayaran</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedInvoice.totalNilai > 0
                              ? ((selectedInvoice.totalDibayar / selectedInvoice.totalNilai) * 100).toFixed(1)
                              : 0
                            }%
                          </p>
                          <p className="text-xs text-muted-foreground">Persentase Bayar</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment History */}
                    {selectedInvoice.pembayaranInvoice && selectedInvoice.pembayaranInvoice.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Riwayat Pembayaran</h4>
                        <div className="space-y-2">
                          {selectedInvoice.pembayaranInvoice.map((payment) => (
                            <div key={payment.id} className="flex justify-between items-center p-2 border rounded text-sm">
                              <div>
                                <p className="font-medium">
                                  {format(new Date(payment.tanggalBayar), "d MMM yyyy", { locale: localeId })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {payment.metodePembayaran || "-"}
                                </p>
                              </div>
                              <p className="font-medium text-green-600">
                                Rp {payment.jumlahBayar.toLocaleString("id-ID")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contract Invoice Summary */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Ringkasan Invoice Kontrak
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contract Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">No. Kontrak</p>
                      <p className="font-medium">{contractSummary.contractNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Buyer</p>
                      <p className="font-medium">{contractSummary.buyer.name}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress Invoice</span>
                      <span className="font-medium">{contractSummary.invoicePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={contractSummary.invoicePercentage} className="h-3" />
                  </div>

                  {/* Quantity Summary */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {contractSummary.totalContractQuantity.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Kontrak (kg)</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {contractSummary.totalInvoicedQuantity.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-muted-foreground">Sudah Diinvoice (kg)</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {contractSummary.remainingQuantity.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-muted-foreground">Sisa Invoice (kg)</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-center">
                    {contractSummary.isFullyInvoiced ? (
                      <Badge className="bg-green-100 text-green-700">
                        ✓ Kontrak Sudah Diinvoice Penuh
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700">
                        Masih dapat dibuatkan invoice {contractSummary.remainingQuantity.toLocaleString("id-ID")} kg lagi
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Invoice List for this Contract */}
              {contractSummary.invoices.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Daftar Invoice Kontrak Ini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {contractSummary.invoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-3 border rounded-lg text-sm"
                        >
                          <div>
                            <p className="font-medium">{inv.nomorInvoice}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(inv.tanggalInvoice), "d MMM yyyy", { locale: localeId })} • {inv.totalBerat.toLocaleString("id-ID")} kg
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">Rp {inv.totalNilai.toLocaleString("id-ID")}</p>
                            <Badge className={statusColors[inv.status]} variant="secondary">
                              {statusLabels[inv.status]}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Tidak dapat memuat data
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedInvoice && selectedInvoice.status === "DRAFT" && (
              <Button
                variant="outline"
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-300"
                onClick={() => {
                  setShowDetailDialog(false);
                  handleOpenEdit(selectedInvoice);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Draft
              </Button>
            )}
            {selectedInvoice && selectedInvoice.status !== "CANCELLED" && (
              <Button
                variant="outline"
                onClick={() => window.open(`/api/pt-pks/invoice/${selectedInvoice.id}/pdf`, '_blank')}
              >
                <Printer className="mr-2 h-4 w-4" />
                Cetak PDF
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Draft Invoice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-600" />
              Edit Draft Invoice {editingInvoice?.nomorInvoice}
            </DialogTitle>
            <DialogDescription>
              Ubah rincian invoice draft sebelum diterbitkan. Nomor invoice, tanggal, penandatangan, kuantitas, klaim, dan pajak dapat disesuaikan.
            </DialogDescription>
          </DialogHeader>

          {editingInvoice && (
            <div className="space-y-6 py-2">
              {/* Buyer & Kontrak Info (Readonly) */}
              <div className="p-3 bg-muted rounded-lg grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Buyer:</span>{" "}
                  <span className="font-semibold">{editingInvoice.buyer.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Kontrak:</span>{" "}
                  <span className="font-semibold">{editingInvoice.contract.contractNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Harga per kg:</span>{" "}
                  <span className="font-semibold">Rp {editingInvoice.hargaPerKg.toLocaleString("id-ID")}/kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Metode Pembayaran:</span>{" "}
                  <Badge variant="outline" className="text-xs">
                    {paymentMethodLabels[editingInvoice.contract.paymentMethod] || editingInvoice.contract.paymentMethod}
                  </Badge>
                </div>
              </div>

              {/* Basic Info: Nomor Invoice, Tanggal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editNomorInvoice">Nomor Invoice *</Label>
                  <Input
                    id="editNomorInvoice"
                    value={editNomorInvoice}
                    onChange={(e) => setEditNomorInvoice(e.target.value)}
                    placeholder="INV/YYYY/MM/XXXX"
                  />
                  <p className="text-xs text-muted-foreground">Nomor invoice dapat diedit</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editTanggalInvoice">Tanggal Invoice *</Label>
                  <Input
                    id="editTanggalInvoice"
                    type="date"
                    value={editTanggalInvoice}
                    onChange={(e) => setEditTanggalInvoice(e.target.value)}
                  />
                </div>
              </div>

              {/* Penandatangan Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editNamaPenandatangan">Nama Penandatangan</Label>
                  <Input
                    id="editNamaPenandatangan"
                    value={editNamaPenandatangan}
                    onChange={(e) => setEditNamaPenandatangan(e.target.value)}
                    placeholder="Nama yang menandatangani"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editJabatanPenandatangan">Jabatan Penandatangan</Label>
                  <Input
                    id="editJabatanPenandatangan"
                    value={editJabatanPenandatangan}
                    onChange={(e) => setEditJabatanPenandatangan(e.target.value)}
                    placeholder="Contoh: Direktur"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="editTotalBerat">Kuantitas (kg) *</Label>
                <DecimalNumericInput
                  id="editTotalBerat"
                  value={editTotalBerat}
                  onValueChange={setEditTotalBerat}
                  placeholder="Kuantitas dalam kg"
                />
              </div>

              {/* Klaim Mutu & Susut */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Klaim Mutu */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium text-sm">Klaim Mutu</h4>
                  <div className="space-y-1">
                    <Label htmlFor="editKlaimMutuKg" className="text-xs">Potongan Klaim Mutu (kg)</Label>
                    <DecimalNumericInput
                      id="editKlaimMutuKg"
                      value={editKlaimMutuKg}
                      onValueChange={setEditKlaimMutuKg}
                      placeholder="0 atau contoh: 12,5"
                    />
                    <p className="text-xs text-muted-foreground">Bisa koma atau bulatan</p>
                  </div>
                  {editKlaimMutuKg > 0 && (
                    <>
                      <div className="text-xs text-red-600 font-medium">
                        Nilai: - Rp {editCalculations.klaimMutuNilai.toLocaleString("id-ID")}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editKlaimMutuKeterangan" className="text-xs">Keterangan</Label>
                        <Textarea
                          id="editKlaimMutuKeterangan"
                          value={editKlaimMutuKeterangan}
                          onChange={(e) => setEditKlaimMutuKeterangan(e.target.value)}
                          placeholder="Alasan klaim mutu..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Klaim Susut */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium text-sm">Klaim Susut (Shrinkage)</h4>
                  <div className="space-y-1">
                    <Label htmlFor="editKlaimSusutKg" className="text-xs">Potongan Klaim Susut (kg)</Label>
                    <DecimalNumericInput
                      id="editKlaimSusutKg"
                      value={editKlaimSusutKg}
                      onValueChange={setEditKlaimSusutKg}
                      placeholder="0 atau contoh: 5,5"
                    />
                    <p className="text-xs text-muted-foreground">Bisa koma atau bulatan</p>
                  </div>
                  {editKlaimSusutKg > 0 && (
                    <>
                      <div className="text-xs text-red-600 font-medium">
                        Nilai: - Rp {editCalculations.klaimSusutNilai.toLocaleString("id-ID")}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="editKlaimSusutKeterangan" className="text-xs">Keterangan</Label>
                        <Textarea
                          id="editKlaimSusutKeterangan"
                          value={editKlaimSusutKeterangan}
                          onChange={(e) => setEditKlaimSusutKeterangan(e.target.value)}
                          placeholder="Alasan klaim susut..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Pajak: PPN & PPh */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPpnPersen">PPN (%)</Label>
                  <NumericInput
                    id="editPpnPersen"
                    min={0}
                    max={100}
                    value={editPpnPersen}
                    onValueChange={setEditPpnPersen}
                  />
                  {editPpnPersen > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nilai PPN: Rp {editCalculations.ppnNilai.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPphPersen">PPh (%)</Label>
                  <NumericInput
                    id="editPphPersen"
                    min={0}
                    max={100}
                    value={editPphPersen}
                    onValueChange={setEditPphPersen}
                  />
                  {editPphPersen > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nilai PPh: Rp {editCalculations.pphNilai.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-2">
                <Label htmlFor="editCatatan">Catatan</Label>
                <Textarea
                  id="editCatatan"
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  placeholder="Catatan tambahan (opsional)..."
                  rows={2}
                />
              </div>

              {/* PPN Disclaimer Checkbox */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg bg-amber-50">
                <Checkbox
                  id="editShowPpnDisclaimer"
                  checked={editShowPpnDisclaimer}
                  onCheckedChange={(checked) => setEditShowPpnDisclaimer(checked === true)}
                />
                <Label htmlFor="editShowPpnDisclaimer" className="text-sm cursor-pointer">
                  Tampilkan keterangan <strong>&quot;PPN tidak dipungut sesuai PP tempat Penimbunan Berikat&quot;</strong> di PDF
                </Label>
              </div>

              {/* Ringkasan Perhitungan */}
              <Card className="bg-gradient-to-r from-blue-50 to-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Ringkasan Nilai Invoice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal Bruto ({editTotalBerat.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg x Rp {editingInvoice.hargaPerKg.toLocaleString("id-ID")})</span>
                    <span className="font-medium">Rp {editCalculations.subtotalBruto.toLocaleString("id-ID")}</span>
                  </div>
                  {editCalculations.totalPotongan > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Total Potongan Klaim</span>
                      <span className="font-medium">- Rp {editCalculations.totalPotongan.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Subtotal Netto</span>
                    <span className="font-medium">Rp {editCalculations.subtotalNetto.toLocaleString("id-ID")}</span>
                  </div>
                  {editPpnPersen > 0 && (
                    <div className="flex justify-between">
                      <span>PPN ({editPpnPersen}%)</span>
                      <span>+ Rp {editCalculations.ppnNilai.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {editPphPersen > 0 && (
                    <div className="flex justify-between">
                      <span>PPh ({editPphPersen}%)</span>
                      <span>- Rp {editCalculations.pphNilai.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>TOTAL INVOICE</span>
                    <span className="text-green-600">Rp {editCalculations.totalNilai.toLocaleString("id-ID")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={editLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editLoading || editTotalBerat <= 0 || !editNomorInvoice.trim()}
            >
              {editLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
