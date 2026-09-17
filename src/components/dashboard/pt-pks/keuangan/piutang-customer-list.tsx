"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Download, HandCoins, RefreshCw, Search } from "lucide-react";
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

type PiutangCustomerItem = {
  id: string;
  nomorReferensi: string;
  tanggal: string;
  buyerNama: string;
  buyerCode: string | null;
  contractNumber: string | null;
  paymentMethod: string | null;
  totalNilai: number;
  totalDibayar: number;
  sisaPiutang: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  pembayaran?: Array<{
    id: string;
    tanggalBayar: string;
    jumlahBayar: number;
    metodePembayaran: string | null;
  }>;
};

type PiutangCustomerResponse = {
  items: PiutangCustomerItem[];
  summary: {
    totalNilai: number;
    totalDibayar: number;
    sisaPiutang: number;
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

const getStatusBadge = (status: PiutangCustomerItem["status"]) => {
  if (status === "PAID") return <Badge variant="default">Lunas</Badge>;
  if (status === "PARTIAL") return <Badge variant="secondary">Sebagian</Badge>;
  return <Badge variant="destructive">Belum Terima</Badge>;
};

const ITEMS_PER_PAGE = 10;

export function PiutangCustomerList() {
  const [response, setResponse] = useState<PiutangCustomerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedItem, setSelectedItem] = useState<PiutangCustomerItem | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [receiptMethod, setReceiptMethod] = useState("");
  const [receiptReference, setReceiptReference] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
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

      const res = await fetch(`/api/pt-pks/keuangan/piutang-customer?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal memuat piutang customer");
      }

      const data = (await res.json()) as PiutangCustomerResponse;
      setResponse(data);
    } catch (error) {
      console.error("Error fetching piutang customer:", error);
      toast.error("Gagal memuat piutang customer");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [search, status, startDate, endDate]);

  const openReceiptDialog = (item: PiutangCustomerItem) => {
    setSelectedItem(item);
    setReceiptDate(format(new Date(), "yyyy-MM-dd"));
    setReceiptAmount(item.sisaPiutang.toString());
    setReceiptMethod("");
    setReceiptReference("");
    setReceiptNote("");
    setShowReceiptDialog(true);
  };

  const handleReceipt = async () => {
    if (!selectedItem) return;

    const amount = Number(receiptAmount);
    if (!amount || amount <= 0) {
      toast.error("Jumlah penerimaan tidak valid");
      return;
    }

    if (amount > selectedItem.sisaPiutang) {
      toast.error("Jumlah penerimaan melebihi sisa piutang");
      return;
    }

    try {
      setProcessingReceipt(true);
      const res = await fetch(`/api/pt-pks/invoice/${selectedItem.id}/pembayaran`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggalBayar: receiptDate || format(new Date(), "yyyy-MM-dd"),
          jumlahBayar: amount,
          metodePembayaran: receiptMethod || null,
          nomorReferensi: receiptReference || null,
          keterangan: receiptNote || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menyimpan penerimaan");
      }

      toast.success("Penerimaan piutang berhasil dicatat");
      setShowReceiptDialog(false);
      await fetchData(true);
    } catch (error: any) {
      console.error("Error receiving piutang:", error);
      toast.error(error.message || "Gagal menyimpan penerimaan");
    } finally {
      setProcessingReceipt(false);
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
      { header: "Tgl Terima", key: "tglTerima", width: 15 },
      { header: "No. Invoice", key: "nomorReferensi", width: 20 },
      { header: "Buyer", key: "buyerNama", width: 25 },
      { header: "No. Kontrak", key: "contractNumber", width: 20 },
      { header: "Metode Bayar", key: "paymentMethod", width: 18 },
      { header: "Total Nilai (Rp)", key: "totalNilai", width: 18 },
      { header: "Total Diterima (Rp)", key: "totalDibayar", width: 18 },
      { header: "Sisa Piutang (Rp)", key: "sisaPiutang", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Metode Bayar Terakhir", key: "metodeBayar", width: 18 },
    ];

    const dataToExport = items.map((item) => {
      const latestPayment = item.pembayaran?.[0];
      return {
        tglTransaksi: format(new Date(item.tanggal), "dd/MM/yyyy"),
        tglTerima: latestPayment ? format(new Date(latestPayment.tanggalBayar), "dd/MM/yyyy") : "-",
        nomorReferensi: item.nomorReferensi,
        buyerNama: item.buyerNama,
        contractNumber: item.contractNumber || "-",
        paymentMethod: item.paymentMethod || "-",
        totalNilai: item.totalNilai,
        totalDibayar: item.totalDibayar,
        sisaPiutang: item.sisaPiutang,
        status: item.status,
        metodeBayar: latestPayment?.metodePembayaran || "-",
      };
    });

    exportToExcel(dataToExport, columns, "Piutang_Customer");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Piutang Customer</h1>
          <p className="text-muted-foreground">Piutang diambil langsung dari invoice customer yang aktif dengan status pembayaran aktual.</p>
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
              <CardDescription>Total Nilai Invoice</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(summary.totalNilai)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Diterima</CardDescription>
              <CardTitle className="text-xl text-green-600">{formatCurrency(summary.totalDibayar)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sisa Piutang</CardDescription>
              <CardTitle className="text-xl text-blue-600">{formatCurrency(summary.sisaPiutang)}</CardTitle>
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
          <CardDescription>Filter berdasarkan status pembayaran invoice dan periode tanggal invoice.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nomor invoice, buyer, atau kontrak"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="UNPAID">Belum Terima</SelectItem>
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
          <CardTitle>Daftar Piutang Customer</CardTitle>
          <CardDescription>Menampilkan saldo piutang berdasarkan invoice customer yang belum lunas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Kontrak</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Diterima</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      Tidak ada data piutang customer.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => {
                    const latestReceipt = item.pembayaran?.[0];

                    return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nomorReferensi}</TableCell>
                      <TableCell>
                        <div className="font-medium whitespace-nowrap">
                          <span className="text-xs text-muted-foreground font-normal">Tgl Transaksi: </span>
                          {format(new Date(item.tanggal), "dd MMM yyyy", { locale: idLocale })}
                        </div>
                        {latestReceipt && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal whitespace-nowrap mt-0.5">
                            <span className="font-medium">Tgl Terima: </span>
                            {format(new Date(latestReceipt.tanggalBayar), "dd MMM yyyy", { locale: idLocale })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{item.buyerNama}</div>
                        <div className="text-xs text-muted-foreground">{item.buyerCode || "-"}</div>
                      </TableCell>
                      <TableCell>{item.contractNumber || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalNilai)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        <div>{formatCurrency(item.totalDibayar)}</div>
                        {latestReceipt && (
                          <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(latestReceipt.tanggalBayar), "dd/MM/yyyy", { locale: idLocale })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(item.sisaPiutang)}</TableCell>
                      <TableCell>
                        <div>{getStatusBadge(item.status)}</div>
                        {latestReceipt && (
                          <div className="text-[11px] text-muted-foreground whitespace-nowrap mt-1">
                            {format(new Date(latestReceipt.tanggalBayar), "dd MMM yyyy", { locale: idLocale })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {item.status !== "PAID" && (
                            <Button size="sm" variant="outline" onClick={() => openReceiptDialog(item)}>
                              <HandCoins className="mr-1 h-4 w-4" />
                              Terima
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

      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Penerimaan Piutang</DialogTitle>
            <DialogDescription>
              {selectedItem ? `${selectedItem.nomorReferensi} - ${selectedItem.buyerNama}` : "Pilih invoice"}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Invoice</span>
                  <span className="font-medium">{formatCurrency(selectedItem.totalNilai)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sudah Diterima</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedItem.totalDibayar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa Piutang</span>
                  <span className="font-medium text-blue-600">{formatCurrency(selectedItem.sisaPiutang)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-date">Tanggal Penerimaan</Label>
                <Input
                  id="receipt-date"
                  type="date"
                  value={receiptDate}
                  onChange={(event) => setReceiptDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-amount">Jumlah Diterima</Label>
                <Input
                  id="receipt-amount"
                  type="number"
                  value={receiptAmount}
                  onChange={(event) => setReceiptAmount(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-method">Metode Pembayaran</Label>
                <Select value={receiptMethod} onValueChange={setReceiptMethod}>
                  <SelectTrigger id="receipt-method">
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
                <Label htmlFor="receipt-reference">No. Referensi</Label>
                <Input
                  id="receipt-reference"
                  value={receiptReference}
                  onChange={(event) => setReceiptReference(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt-note">Keterangan</Label>
                <Textarea
                  id="receipt-note"
                  value={receiptNote}
                  onChange={(event) => setReceiptNote(event.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => void handleReceipt()} disabled={processingReceipt}>
              {processingReceipt ? "Menyimpan..." : "Simpan Penerimaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
