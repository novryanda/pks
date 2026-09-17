"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CreditCard, Download, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Textarea } from "@/components/ui/textarea";

type POItem = {
  id: string;
  nomorReferensi: string;
  tanggal: string;
  vendorNama: string;
  documentStatus: string;
  totalNilai: number;
  totalDibayar: number;
  sisaHutang: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  termPembayaran: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  pembayaran?: Array<{
    id: string;
    jumlahBayar: number;
    tanggalBayar: string;
    metodePembayaran: string | null;
    nomorReferensi: string | null;
    keterangan: string | null;
  }>;
};

type POResponse = {
  items: POItem[];
  summary: {
    totalNilai: number;
    totalDibayar: number;
    sisaBelumBayar: number;
    jumlahUnpaid: number;
    jumlahPartial: number;
    jumlahPaid: number;
  };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

const getStatusBadge = (status: POItem["status"]) => {
  if (status === "PAID") return <Badge variant="default">Lunas</Badge>;
  if (status === "PARTIAL") return <Badge variant="secondary">Sebagian</Badge>;
  return <Badge variant="destructive">Belum Bayar</Badge>;
};

const ITEMS_PER_PAGE = 10;

export function PembayaranPOList() {
  const [response, setResponse] = useState<POResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedItem, setSelectedItem] = useState<POItem | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/pt-pks/keuangan/pembayaran-po?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal memuat pembayaran PO");
      }

      const data = (await res.json()) as POResponse;
      setResponse(data);
    } catch (error) {
      console.error("Error fetching pembayaran PO:", error);
      toast.error("Gagal memuat pembayaran PO");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [search, status, startDate, endDate]);

  const openPaymentDialog = (item: POItem) => {
    setSelectedItem(item);
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentAmount(item.sisaHutang.toString());
    setPaymentMethod("");
    setPaymentReference("");
    setPaymentNote("");
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedItem) return;

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Jumlah pembayaran tidak valid");
      return;
    }

    if (amount > selectedItem.sisaHutang) {
      toast.error("Jumlah pembayaran melebihi sisa PO");
      return;
    }

    try {
      setProcessingPayment(true);
      const res = await fetch(`/api/pt-pks/keuangan/pembayaran-po/${selectedItem.id}/bayar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumlahBayar: amount,
          tanggalBayar: paymentDate || format(new Date(), "yyyy-MM-dd"),
          metodePembayaran: paymentMethod || null,
          nomorReferensi: paymentReference || null,
          keterangan: paymentNote || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menyimpan pembayaran PO");
      }

      toast.success("Pembayaran PO berhasil dicatat");
      setShowPaymentDialog(false);
      await fetchData(true);
    } catch (error: any) {
      console.error("Error paying PO:", error);
      toast.error(error.message || "Gagal menyimpan pembayaran PO");
    } finally {
      setProcessingPayment(false);
    }
  };

  const summary = response?.summary;
  const items = response?.items || [];
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const paginatedItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const pageStart = items.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, items.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, startDate, endDate]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Tgl Transaksi", key: "tglTransaksi", width: 15 },
      { header: "Tgl Bayar", key: "tglBayar", width: 15 },
      { header: "No. PO", key: "nomorReferensi", width: 20 },
      { header: "Vendor", key: "vendorNama", width: 25 },
      { header: "Term Pembayaran", key: "termPembayaran", width: 18 },
      { header: "Total Nilai (Rp)", key: "totalNilai", width: 18 },
      { header: "Total Dibayar (Rp)", key: "totalDibayar", width: 18 },
      { header: "Sisa Hutang (Rp)", key: "sisaHutang", width: 18 },
      { header: "Status", key: "status", width: 12 },
      { header: "Bank", key: "bankName", width: 15 },
      { header: "No. Rekening", key: "accountNumber", width: 20 },
      { header: "Atas Nama", key: "accountName", width: 22 },
      { header: "Metode Bayar", key: "metodeBayar", width: 18 },
      { header: "Ref Bayar", key: "referensiBayar", width: 20 },
    ];

    const dataToExport = items.map((item) => {
      const latestPayment = item.pembayaran?.[0];
      return {
        tglTransaksi: format(new Date(item.tanggal), "dd/MM/yyyy"),
        tglBayar: latestPayment ? format(new Date(latestPayment.tanggalBayar), "dd/MM/yyyy") : "-",
        nomorReferensi: item.nomorReferensi,
        vendorNama: item.vendorNama,
        termPembayaran: item.termPembayaran || "-",
        totalNilai: item.totalNilai,
        totalDibayar: item.totalDibayar,
        sisaHutang: item.sisaHutang,
        status: item.status,
        bankName: item.bankName || "-",
        accountNumber: item.accountNumber || "-",
        accountName: item.accountName || "-",
        metodeBayar: latestPayment?.metodePembayaran || "-",
        referensiBayar: latestPayment?.nomorReferensi || "-",
      };
    });

    exportToExcel(dataToExport, columns, "Pembayaran_PO");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pembayaran Purchase Order</h1>
          <p className="text-muted-foreground">Menampilkan hanya PO perusahaan aktif dengan status bayar dan periode tanggal.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="gap-1.5 text-xs">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => void fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Nilai PO</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(summary.totalNilai)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Dibayar</CardDescription>
              <CardTitle className="text-xl text-green-600">{formatCurrency(summary.totalDibayar)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sisa Belum Bayar</CardDescription>
              <CardTitle className="text-xl text-red-600">{formatCurrency(summary.sisaBelumBayar)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status</CardDescription>
              <CardTitle className="text-sm">
                <span className="text-red-600">{summary.jumlahUnpaid} belum</span> •{" "}
                <span className="text-yellow-600">{summary.jumlahPartial} sebagian</span> •{" "}
                <span className="text-green-600">{summary.jumlahPaid} lunas</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Filter berdasarkan status pembayaran dan periode tanggal PO.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nomor PO, vendor, atau rekening"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="UNPAID">Belum Bayar</SelectItem>
              <SelectItem value="PARTIAL">Sebagian</SelectItem>
              <SelectItem value="PAID">Lunas</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Purchase Order</CardTitle>
          <CardDescription>Menampilkan total PO, rekening vendor, dan sisa hutang yang masih harus dibayar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. PO</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Rekening</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Dibayar</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                      Tidak ada data PO.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => {
                    const latestPayment = item.pembayaran?.[0];

                    return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nomorReferensi}</TableCell>
                      <TableCell>
                        <div className="font-medium whitespace-nowrap">
                          <span className="text-xs text-muted-foreground font-normal">Tgl Transaksi: </span>
                          {format(new Date(item.tanggal), "dd MMM yyyy", { locale: idLocale })}
                        </div>
                        {latestPayment && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal whitespace-nowrap mt-0.5">
                            <span className="font-medium">Tgl Bayar: </span>
                            {format(new Date(latestPayment.tanggalBayar), "dd MMM yyyy", { locale: idLocale })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{item.vendorNama}</TableCell>
                      <TableCell>{item.termPembayaran || "-"}</TableCell>
                      <TableCell>
                        {item.accountNumber ? (
                          <div>
                            <div className="font-medium">{item.bankName}</div>
                            <div className="text-xs text-muted-foreground">{item.accountNumber}</div>
                            <div className="text-xs text-muted-foreground">a.n. {item.accountName}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Belum ada rekening</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalNilai)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        <div>{formatCurrency(item.totalDibayar)}</div>
                        {latestPayment && (
                          <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(latestPayment.tanggalBayar), "dd/MM/yyyy", { locale: idLocale })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(item.sisaHutang)}</TableCell>
                      <TableCell>
                        <div>{getStatusBadge(item.status)}</div>
                        {latestPayment && (
                          <div className="text-[11px] text-muted-foreground whitespace-nowrap mt-1">
                            {format(new Date(latestPayment.tanggalBayar), "dd MMM yyyy", { locale: idLocale })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {item.status !== "PAID" && (
                            <Button size="sm" variant="outline" onClick={() => openPaymentDialog(item)}>
                              <CreditCard className="mr-1 h-4 w-4" />
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
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={items.length}
            pageStart={pageStart}
            pageEnd={pageEnd}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran PO</DialogTitle>
            <DialogDescription>
              {selectedItem ? `${selectedItem.nomorReferensi} - ${selectedItem.vendorNama}` : "Pilih PO"}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-medium">{formatCurrency(selectedItem.totalNilai)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dibayar</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedItem.totalDibayar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa</span>
                  <span className="font-medium text-red-600">{formatCurrency(selectedItem.sisaHutang)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="po-payment-date">Tanggal Pembayaran</Label>
                <Input
                  id="po-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="po-payment-amount">Jumlah Bayar</Label>
                <Input
                  id="po-payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="po-payment-method">Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="po-payment-method">
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                    <SelectItem value="CASH">Tunai</SelectItem>
                    <SelectItem value="GIRO">Giro</SelectItem>
                    <SelectItem value="CHEQUE">Cek</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="po-payment-reference">No. Referensi</Label>
                <Input
                  id="po-payment-reference"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="po-payment-note">Keterangan</Label>
                <Textarea
                  id="po-payment-note"
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => void handlePayment()} disabled={processingPayment}>
              {processingPayment ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
