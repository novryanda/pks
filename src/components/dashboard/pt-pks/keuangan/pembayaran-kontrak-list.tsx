"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  CheckCircle,
  DollarSign,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

type Invoice = {
  id: string;
  nomorInvoice: string;
  tanggalInvoice: string;
  tanggalJatuhTempo: string | null;
  status: string;
  totalNilai: number;
  totalDibayar: number;
  sisaPembayaran: number;
  buyer: {
    id: string;
    name: string;
    code: string;
  };
  contract: {
    id: string;
    contractNumber: string;
    paymentMethod: string;
  };
  pembayaranInvoice: {
    id: string;
    tanggalBayar: string;
    jumlahBayar: number;
    metodePembayaran: string | null;
  }[];
};

type Summary = {
  totalNilai: number;
  totalDibayar: number;
  sisaPembayaran: number;
  jumlahIssued: number;
  jumlahPartial: number;
  jumlahPaid: number;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
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
  PARTIAL_PAID: "Sebagian",
  PAID: "Lunas",
  CANCELLED: "Batal",
};

const paymentMethodLabels: Record<string, string> = {
  LUNAS_AWAL: "Lunas Awal",
  SEBAGIAN: "Sebagian",
  SETELAH_PENGIRIMAN: "Setelah Kirim",
};

export function PembayaranKontrakList() {
  const [data, setData] = useState<Invoice[]>([]);
  const [filteredData, setFilteredData] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, filterStatus, data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch invoices that are ISSUED, PARTIAL_PAID, or PAID (excluding DRAFT and CANCELLED)
      const res = await fetch("/api/pt-pks/invoice?limit=100");
      if (res.ok) {
        const result = await res.json();
        const invoices = (result.data || []).filter(
          (inv: Invoice) => inv.status !== "DRAFT" && inv.status !== "CANCELLED"
        );
        setData(invoices);
        
        // Calculate summary
        const totalNilai = invoices.reduce((sum: number, inv: Invoice) => sum + inv.totalNilai, 0);
        const totalDibayar = invoices.reduce((sum: number, inv: Invoice) => sum + inv.totalDibayar, 0);
        const sisaPembayaran = invoices.reduce((sum: number, inv: Invoice) => sum + inv.sisaPembayaran, 0);
        const jumlahIssued = invoices.filter((inv: Invoice) => inv.status === "ISSUED").length;
        const jumlahPartial = invoices.filter((inv: Invoice) => inv.status === "PARTIAL_PAID").length;
        const jumlahPaid = invoices.filter((inv: Invoice) => inv.status === "PAID").length;
        
        setSummary({
          totalNilai,
          totalDibayar,
          sisaPembayaran,
          jumlahIssued,
          jumlahPartial,
          jumlahPaid,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data pembayaran kontrak");
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...data];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nomorInvoice.toLowerCase().includes(search) ||
          item.buyer.name.toLowerCase().includes(search) ||
          item.contract.contractNumber.toLowerCase().includes(search)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    setFilteredData(filtered);
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentAmount(invoice.sisaPembayaran.toString());
    setPaymentMethod("");
    setPaymentRef("");
    setPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Jumlah pembayaran tidak valid");
      return;
    }

    if (amount > selectedInvoice.sisaPembayaran) {
      toast.error("Jumlah pembayaran melebihi sisa yang harus dibayar");
      return;
    }

    try {
      setProcessingPayment(true);
      const res = await fetch(`/api/pt-pks/invoice/${selectedInvoice.id}/pembayaran`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggalBayar: paymentDate || format(new Date(), "yyyy-MM-dd"),
          jumlahBayar: amount,
          metodePembayaran: paymentMethod || null,
          nomorReferensi: paymentRef || null,
        }),
      });

      if (res.ok) {
        toast.success("Pembayaran berhasil dicatat");
        setPaymentDialog(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Gagal mencatat pembayaran");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Gagal mencatat pembayaran");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Tgl Transaksi", key: "tglTransaksi", width: 15 },
      { header: "Tgl Bayar", key: "tglBayar", width: 15 },
      { header: "No. Invoice", key: "nomorInvoice", width: 20 },
      { header: "Buyer", key: "buyerNama", width: 25 },
      { header: "No. Kontrak", key: "nomorKontrak", width: 20 },
      { header: "Metode Pembayaran", key: "metodePembayaran", width: 18 },
      { header: "Total Nilai (Rp)", key: "totalNilai", width: 18 },
      { header: "Total Diterima (Rp)", key: "totalDibayar", width: 18 },
      { header: "Sisa Piutang (Rp)", key: "sisaPembayaran", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Metode Bayar Terakhir", key: "metodeBayarTerakhir", width: 18 },
    ];

    const dataToExport = filteredData.map((item) => {
      const latestPayment = item.pembayaranInvoice?.[0];
      return {
        tglTransaksi: format(new Date(item.tanggalInvoice), "dd/MM/yyyy"),
        tglBayar: latestPayment ? format(new Date(latestPayment.tanggalBayar), "dd/MM/yyyy") : "-",
        nomorInvoice: item.nomorInvoice,
        buyerNama: item.buyer.name,
        nomorKontrak: item.contract.contractNumber,
        metodePembayaran: paymentMethodLabels[item.contract.paymentMethod] || item.contract.paymentMethod,
        totalNilai: item.totalNilai,
        totalDibayar: item.totalDibayar,
        sisaPembayaran: item.sisaPembayaran,
        status: statusLabels[item.status] || item.status,
        metodeBayarTerakhir: latestPayment?.metodePembayaran || "-",
      };
    });

    exportToExcel(dataToExport, columns, "Pembayaran_Kontrak");
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nilai Kontrak</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalNilai)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dibayar</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalDibayar)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sisa Pembayaran</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.sisaPembayaran)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Invoice</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Belum Dibayar:</span>
                  <span className="font-semibold">{summary.jumlahIssued}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sebagian:</span>
                  <span className="font-semibold">{summary.jumlahPartial}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lunas:</span>
                  <span className="font-semibold">{summary.jumlahPaid}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Pembayaran Kontrak</CardTitle>
              <CardDescription>
                Daftar pembayaran dari invoice kontrak buyer
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 text-xs">
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
              <Button onClick={fetchData} disabled={loading} size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nomor invoice, buyer, atau kontrak..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="ISSUED">Belum Dibayar</SelectItem>
                <SelectItem value="PARTIAL_PAID">Sebagian</SelectItem>
                <SelectItem value="PAID">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>No. Kontrak</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Total Nilai</TableHead>
                  <TableHead className="text-right">Dibayar</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Tidak ada data pembayaran kontrak
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((invoice) => {
                    const latestPayment = invoice.pembayaranInvoice?.[0];

                    return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium whitespace-nowrap">
                          <span className="text-xs text-muted-foreground font-normal">Tgl Transaksi: </span>
                          {format(new Date(invoice.tanggalInvoice), "dd/MM/yyyy", {
                            locale: idLocale,
                          })}
                        </div>
                        {latestPayment && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal whitespace-nowrap mt-0.5">
                            <span className="font-medium">Tgl Bayar: </span>
                            {format(new Date(latestPayment.tanggalBayar), "dd/MM/yyyy", { locale: idLocale })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.nomorInvoice}
                      </TableCell>
                      <TableCell>{invoice.buyer.name}</TableCell>
                      <TableCell>{invoice.contract.contractNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {paymentMethodLabels[invoice.contract.paymentMethod] || invoice.contract.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.totalNilai)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        <div>{formatCurrency(invoice.totalDibayar)}</div>
                        {latestPayment && (
                          <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(latestPayment.tanggalBayar), "dd/MM/yyyy", { locale: idLocale })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-blue-600 font-semibold">
                        {formatCurrency(invoice.sisaPembayaran)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge className={statusColors[invoice.status]}>
                            {statusLabels[invoice.status]}
                          </Badge>
                        </div>
                        {latestPayment && (
                          <div className="text-[11px] text-muted-foreground whitespace-nowrap mt-1">
                            {format(new Date(latestPayment.tanggalBayar), "dd/MM/yyyy", { locale: idLocale })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          {(invoice.status === "ISSUED" || invoice.status === "PARTIAL_PAID") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPaymentDialog(invoice)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Bayar
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
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>
                  Pembayaran untuk {selectedInvoice.nomorInvoice} -{" "}
                  {selectedInvoice.buyer.name}
                  <br />
                  Sisa Pembayaran: {formatCurrency(selectedInvoice.sisaPembayaran)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contract-payment-date">Tanggal Pembayaran</Label>
              <Input
                id="contract-payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Dibayar</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                  <SelectItem value="GIRO">Giro</SelectItem>
                  <SelectItem value="CEK">Cek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">No. Referensi/Bukti Bayar</Label>
              <Input
                id="ref"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Opsional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>
              Batal
            </Button>
            <Button onClick={handlePayment} disabled={processingPayment}>
              {processingPayment ? "Memproses..." : "Simpan Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
