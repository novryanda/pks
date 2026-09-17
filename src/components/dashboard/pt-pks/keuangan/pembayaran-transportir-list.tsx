"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CheckCircle2, Download, RefreshCw, Search, Wallet } from "lucide-react";
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

type TransporterPaymentItem = {
  id: string;
  hutangId: string | null;
  nomorReferensi: string;
  tanggal: string;
  buyerNama: string;
  vendorNama: string;
  vendorId: string;
  nomorKendaraan: string;
  namaSupir: string;
  beratNetto: number;
  hargaPerKg: number;
  dpp?: number;
  ppnPersen?: number;
  pphPersen?: number;
  nilaiPpn?: number;
  nilaiPph?: number;
  totalNilai: number;
  totalDibayar: number;
  sisaHutang: number;
  status: "PENDING_PRICE" | "UNPAID" | "PARTIAL" | "PAID";
  hasHarga: boolean;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  pembayaranHutang?: Array<{
    id: string;
    jumlahBayar: number;
    tanggalBayar: string;
    metodePembayaran: string | null;
    nomorReferensi: string | null;
    keterangan: string | null;
    dibayarOleh: string;
  }>;
};

type TransporterPaymentResponse = {
  items: TransporterPaymentItem[];
  summary: {
    totalNilai: number;
    totalDibayar: number;
    sisaHutang: number;
    jumlahBelumInputHarga: number;
    jumlahUnpaid: number;
    jumlahPartial: number;
    jumlahPaid: number;
  };
};

type ErrorResponse = {
  error?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) => new Intl.NumberFormat("id-ID").format(value);

const getStatusBadge = (status: TransporterPaymentItem["status"]) => {
  if (status === "PENDING_PRICE") {
    return <Badge variant="outline">Belum Input Harga</Badge>;
  }

  if (status === "PAID") {
    return <Badge variant="default">Lunas</Badge>;
  }

  if (status === "PARTIAL") {
    return <Badge variant="secondary">Sebagian</Badge>;
  }

  return <Badge variant="destructive">Belum Bayar</Badge>;
};

const ITEMS_PER_PAGE = 10;

export function PembayaranTransportirList() {
  const [response, setResponse] = useState<TransporterPaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedPaymentItem, setSelectedPaymentItem] = useState<TransporterPaymentItem | null>(null);
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

      const res = await fetch(`/api/pt-pks/keuangan/pembayaran-transportir?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal memuat pembayaran transportir");
      }

      const data = (await res.json()) as TransporterPaymentResponse;
      setResponse(data);
    } catch (error) {
      console.error("Error fetching transporter payments:", error);
      toast.error("Gagal memuat pembayaran transportir");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [search, status, startDate, endDate]);

  const openPaymentDialog = (item: TransporterPaymentItem) => {
    setSelectedPaymentItem(item);
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentAmount(item.sisaHutang.toString());
    setPaymentMethod("");
    setPaymentReference("");
    setPaymentNote("");
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedPaymentItem) return;

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Jumlah bayar tidak valid");
      return;
    }

    if (amount > selectedPaymentItem.sisaHutang) {
      toast.error("Jumlah bayar melebihi sisa tagihan");
      return;
    }

    try {
      setProcessingPayment(true);
      const res = await fetch("/api/pt-pks/keuangan/pembayaran-transportir/bayar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pengirimanId: selectedPaymentItem.id,
          jumlahBayar: amount,
          tanggalBayar: paymentDate || format(new Date(), "yyyy-MM-dd"),
          metodePembayaran: paymentMethod || null,
          nomorReferensi: paymentReference || null,
          keterangan: paymentNote || null,
        }),
      });

      if (!res.ok) {
        const error = (await res.json()) as ErrorResponse;
        throw new Error(error.error ?? "Gagal mencatat pembayaran");
      }

      toast.success("Pembayaran vendor transportir berhasil dicatat");
      setShowPaymentDialog(false);
      await fetchData(true);
    } catch (error: unknown) {
      console.error("Error paying transporter:", error);
      toast.error(getErrorMessage(error, "Gagal mencatat pembayaran"));
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleMarkPaid = async (item: TransporterPaymentItem) => {
    if (!confirm(`Tandai ${item.nomorReferensi} sebagai lunas?`)) {
      return;
    }

    try {
      const res = await fetch("/api/pt-pks/keuangan/pembayaran-transportir/lunas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pengirimanId: item.id,
        }),
      });

      if (!res.ok) {
        const error = (await res.json()) as ErrorResponse;
        throw new Error(error.error ?? "Gagal menandai lunas");
      }

      toast.success("Pembayaran vendor transportir berhasil ditandai lunas");
      await fetchData(true);
    } catch (error: unknown) {
      console.error("Error settling transporter payment:", error);
      toast.error(getErrorMessage(error, "Gagal menandai lunas"));
    }
  };

  const summary = response?.summary;
  const items = response?.items ?? [];
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
      { header: "No. Pengiriman", key: "nomorReferensi", width: 20 },
      { header: "Vendor Transportir", key: "vendorNama", width: 25 },
      { header: "Buyer", key: "buyerNama", width: 25 },
      { header: "No. Kendaraan", key: "nomorKendaraan", width: 15 },
      { header: "Supir", key: "namaSupir", width: 20 },
      { header: "Berat Netto (kg)", key: "beratNetto", width: 15 },
      { header: "Harga/Kg (Rp)", key: "hargaPerKg", width: 15 },
      { header: "DPP (Rp)", key: "dpp", width: 18 },
      { header: "PPN (%)", key: "ppnPersen", width: 12 },
      { header: "Nilai PPN (Rp)", key: "nilaiPpn", width: 18 },
      { header: "PPh 23 (%)", key: "pphPersen", width: 12 },
      { header: "Nilai PPh (Rp)", key: "nilaiPph", width: 18 },
      { header: "Total Nilai (Rp)", key: "totalNilai", width: 18 },
      { header: "Total Dibayar (Rp)", key: "totalDibayar", width: 18 },
      { header: "Sisa Hutang (Rp)", key: "sisaHutang", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Bank", key: "bankName", width: 15 },
      { header: "No. Rekening", key: "accountNumber", width: 20 },
      { header: "Atas Nama", key: "accountName", width: 22 },
      { header: "Metode Bayar", key: "metodeBayar", width: 18 },
      { header: "Ref Bayar", key: "referensiBayar", width: 20 },
    ];

    const dataToExport = items.map((item) => {
      const latestPayment = item.pembayaranHutang?.[0];
      return {
        tglTransaksi: format(new Date(item.tanggal), "dd/MM/yyyy"),
        tglBayar: latestPayment ? format(new Date(latestPayment.tanggalBayar), "dd/MM/yyyy") : "-",
        nomorReferensi: item.nomorReferensi,
        vendorNama: item.vendorNama,
        buyerNama: item.buyerNama,
        nomorKendaraan: item.nomorKendaraan,
        namaSupir: item.namaSupir,
        beratNetto: item.beratNetto,
        hargaPerKg: item.hargaPerKg,
        dpp: item.dpp ?? (item.beratNetto * item.hargaPerKg),
        ppnPersen: item.ppnPersen || 0,
        nilaiPpn: item.nilaiPpn || 0,
        pphPersen: item.pphPersen || 0,
        nilaiPph: item.nilaiPph || 0,
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

    exportToExcel(dataToExport, columns, "Pembayaran_Transportir");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pembayaran Transportir</h1>
          <p className="text-muted-foreground">
            Validasi dan pembayaran vendor transportir berdasarkan harga yang sudah diinput dari menu pemasaran.
          </p>
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
              <CardDescription>Total Tagihan Transportir</CardDescription>
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
              <CardDescription>Sisa Tagihan</CardDescription>
              <CardTitle className="text-xl text-red-600">{formatCurrency(summary.sisaHutang)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status Data</CardDescription>
              <CardTitle className="text-sm">
                <span className="text-slate-600">{summary.jumlahBelumInputHarga} belum harga</span> {" • "}
                <span className="text-red-600">{summary.jumlahUnpaid} belum bayar</span> {" • "}
                <span className="text-yellow-600">{summary.jumlahPartial} sebagian</span> {" • "}
                <span className="text-green-600">{summary.jumlahPaid} lunas</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Filter berdasarkan status, kata kunci, dan periode tanggal pengiriman.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari no. pengiriman, vendor, buyer, kendaraan, atau rekening"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PENDING_PRICE">Belum Input Harga</SelectItem>
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
          <CardTitle>Daftar Pembayaran Transportir</CardTitle>
          <CardDescription>
            Total tagihan dihitung dari berat netto dikali harga vendor transportir per kilogram.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Pengiriman</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Kendaraan</TableHead>
                  <TableHead className="text-right">Netto</TableHead>
                  <TableHead className="text-right">Harga/Kg</TableHead>
                  <TableHead className="text-right">DPP</TableHead>
                  <TableHead className="text-right">PPN</TableHead>
                  <TableHead className="text-right">PPh 23</TableHead>
                  <TableHead className="text-right">Total Tagihan</TableHead>
                  <TableHead>Rekening</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="py-8 text-center">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="py-8 text-center text-muted-foreground">
                      Tidak ada data pembayaran transportir.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => {
                    const latestPayment = item.pembayaranHutang?.[0];

                    return (
                    <TableRow key={item.id}>
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
                      <TableCell className="font-medium">{item.nomorReferensi}</TableCell>
                      <TableCell>
                        <div>{item.vendorNama}</div>
                        <div className="text-xs text-muted-foreground">{item.namaSupir}</div>
                      </TableCell>
                      <TableCell>{item.buyerNama}</TableCell>
                      <TableCell>{item.nomorKendaraan}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.beratNetto)} kg</TableCell>
                      <TableCell className="text-right">
                        {item.hasHarga ? formatNumber(item.hargaPerKg) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.hasHarga ? formatCurrency(item.dpp ?? (item.beratNetto * item.hargaPerKg)) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.hasHarga ? (
                          (item.ppnPersen ?? 0) > 0 ? (
                            <div className="font-medium text-blue-600 dark:text-blue-400">
                              <div>+{formatCurrency(item.nilaiPpn ?? 0)}</div>
                              <div className="text-[11px] text-muted-foreground">{item.ppnPersen}%</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">0%</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.hasHarga ? (
                          (item.pphPersen ?? 0) > 0 ? (
                            <div className="font-medium text-red-600 dark:text-red-400">
                              <div>-{formatCurrency(item.nilaiPph ?? 0)}</div>
                              <div className="text-[11px] text-muted-foreground">{item.pphPersen}%</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">0%</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.hasHarga ? formatCurrency(item.totalNilai) : <span className="text-muted-foreground">Menunggu input harga</span>}
                      </TableCell>
                      <TableCell>
                        {item.accountNumber ? (
                          <div>
                            <div className="font-medium">{item.bankName}</div>
                            <div className="text-xs text-muted-foreground">{item.accountNumber}</div>
                            <div className="text-xs text-muted-foreground">a.n. {item.accountName}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Rekening vendor belum diisi</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{getStatusBadge(item.status)}</div>
                        {latestPayment && (
                          <div className="text-[11px] text-muted-foreground whitespace-nowrap mt-1">
                            {format(new Date(latestPayment.tanggalBayar), "dd MMM yyyy", { locale: idLocale })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          {item.status === "PENDING_PRICE" ? (
                            <span className="text-center text-xs text-muted-foreground">
                              Input harga dilakukan dari menu pemasaran
                            </span>
                          ) : item.status !== "PAID" ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openPaymentDialog(item)}>
                                <Wallet className="mr-1 h-4 w-4" />
                                Bayar
                              </Button>
                              <Button size="sm" onClick={() => void handleMarkPaid(item)}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : null}
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
            <DialogTitle>Catat Pembayaran Transportir</DialogTitle>
            <DialogDescription>
              {selectedPaymentItem
                ? `${selectedPaymentItem.nomorReferensi} - ${selectedPaymentItem.vendorNama}`
                : "Pilih data pengiriman"}
            </DialogDescription>
          </DialogHeader>
          {selectedPaymentItem && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Tagihan</span>
                  <span className="font-medium">{formatCurrency(selectedPaymentItem.totalNilai)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sudah Dibayar</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedPaymentItem.totalDibayar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa</span>
                  <span className="font-medium text-red-600">{formatCurrency(selectedPaymentItem.sisaHutang)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-date">Tanggal Pembayaran</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-amount">Jumlah Bayar</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
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
                <Label htmlFor="payment-reference">No. Referensi</Label>
                <Input
                  id="payment-reference"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-note">Keterangan</Label>
                <Textarea id="payment-note" value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} />
              </div>

              {selectedPaymentItem.pembayaranHutang && selectedPaymentItem.pembayaranHutang.length > 0 && (
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="text-sm font-medium">Riwayat Pembayaran</div>
                  <div className="space-y-2">
                    {selectedPaymentItem.pembayaranHutang.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 md:flex-row md:items-start md:justify-between"
                      >
                        <div className="space-y-1 text-sm">
                          <div className="font-medium">{formatCurrency(payment.jumlahBayar)}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(payment.tanggalBayar), "dd MMM yyyy HH:mm", {
                              locale: idLocale,
                            })}
                            {payment.metodePembayaran ? ` • ${payment.metodePembayaran}` : ""}
                          </div>
                          <div className="text-muted-foreground">
                            Ref: {payment.nomorReferensi || "-"} • Oleh: {payment.dibayarOleh}
                          </div>
                          {payment.keterangan && (
                            <div className="text-muted-foreground">{payment.keterangan}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
