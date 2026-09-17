"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CheckCircle2, Download, RefreshCw, Wallet, XCircle } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Textarea } from "@/components/ui/textarea";

type HutangSupplierItem = {
  id: string;
  hutangId: string | null;
  nomorReferensi: string;
  tanggal: string;
  supplierId: string;
  supplierNama: string;
  supplierTipe: string;
  materialNama: string;
  beratNetto: number;
  hargaPerKg: number;
  totalNilai: number;
  totalDibayar: number;
  sisaHutang: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  pembayaranHutang: Array<{
    id: string;
    tanggalBayar: string;
    jumlahBayar: number;
    metodePembayaran: string | null;
    nomorReferensi: string | null;
    keterangan: string | null;
    dibayarOleh: string;
  }>;
};

type HutangSupplierResponse = {
  items: HutangSupplierItem[];
  summary: {
    totalNilai: number;
    totalDibayar: number;
    sisaHutang: number;
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

const getLatestPayment = <
  T extends {
    tanggalBayar: string;
  },
>(
  payments: T[],
) =>
  payments.reduce<T | null>((latest, payment) => {
    if (!latest) {
      return payment;
    }

    return new Date(payment.tanggalBayar) > new Date(latest.tanggalBayar) ? payment : latest;
  }, null);

const getStatusBadge = (status: HutangSupplierItem["status"]) => {
  if (status === "PAID") {
    return <Badge variant="default">Lunas</Badge>;
  }

  if (status === "PARTIAL") {
    return <Badge variant="secondary">Sebagian</Badge>;
  }

  return <Badge variant="destructive">Belum Bayar</Badge>;
};

const ITEMS_PER_PAGE = 10;

export function HutangSupplierList() {
  const [response, setResponse] = useState<HutangSupplierResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partyName, setPartyName] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedItem, setSelectedItem] = useState<HutangSupplierItem | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchData = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (partyName) params.set("name", partyName);
      if (status !== "all") params.set("status", status);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/pt-pks/keuangan/hutang-supplier?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal memuat hutang supplier");
      }

      const data = (await res.json()) as HutangSupplierResponse;
      setResponse(data);
      setSelectedItem((current) => {
        if (!current) return current;
        return data.items.find((item) => item.id === current.id) ?? null;
      });
      setSelectedIds((current) => current.filter((id) => data.items.some((item) => item.id === id && item.status !== "PAID")));
    } catch (error) {
      console.error("Error fetching hutang supplier:", error);
      toast.error("Gagal memuat hutang supplier");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [partyName, status, startDate, endDate]);

  const openPaymentDialog = (item: HutangSupplierItem) => {
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
      toast.error("Jumlah bayar tidak valid");
      return;
    }

    if (amount > selectedItem.sisaHutang) {
      toast.error("Jumlah bayar melebihi sisa hutang");
      return;
    }

    try {
      setProcessingPayment(true);
      const res = await fetch("/api/pt-pks/keuangan/hutang-supplier/bayar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          penerimaanId: selectedItem.id,
          jumlahBayar: amount,
          tanggalBayar: paymentDate || format(new Date(), "yyyy-MM-dd"),
          metodePembayaran: paymentMethod || null,
          nomorReferensi: paymentReference || null,
          keterangan: paymentNote || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal mencatat pembayaran");
      }

      toast.success("Pembayaran hutang supplier berhasil dicatat");
      setShowPaymentDialog(false);
      await fetchData(true);
    } catch (error: any) {
      console.error("Error paying hutang supplier:", error);
      toast.error(error.message || "Gagal mencatat pembayaran");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleMarkPaid = async (item: HutangSupplierItem) => {
    if (!confirm(`Tandai ${item.nomorReferensi} sebagai lunas?`)) {
      return;
    }

    try {
      const res = await fetch("/api/pt-pks/keuangan/hutang-supplier/lunas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ penerimaanId: item.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menandai lunas");
      }

      toast.success("Hutang supplier berhasil ditandai lunas");
      await fetchData(true);
    } catch (error: any) {
      console.error("Error settling hutang supplier:", error);
      toast.error(error.message || "Gagal menandai lunas");
    }
  };

  const handleBatchMarkPaid = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih minimal satu data");
      return;
    }

    if (!confirm(`Lunasi ${selectedIds.length} data hutang supplier terpilih?`)) {
      return;
    }

    try {
      const res = await fetch("/api/pt-pks/keuangan/hutang-supplier/batch-lunas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ penerimaanIds: selectedIds }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal melunasi data terpilih");
      }

      toast.success(`${selectedIds.length} hutang supplier berhasil dilunasi`);
      setSelectedIds([]);
      await fetchData(true);
    } catch (error: any) {
      console.error("Error batch settling hutang supplier:", error);
      toast.error(error.message || "Gagal melunasi data terpilih");
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    if (!confirm("Batalkan pembayaran ini? Saldo hutang akan dihitung ulang.")) {
      return;
    }

    try {
      const res = await fetch(`/api/pt-pks/keuangan/hutang-supplier/pembayaran/${paymentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal membatalkan pembayaran");
      }

      toast.success("Pembayaran berhasil dibatalkan");
      await fetchData(true);
    } catch (error: any) {
      console.error("Error cancelling hutang supplier payment:", error);
      toast.error(error.message || "Gagal membatalkan pembayaran");
    }
  };

  const summary = response?.summary;
  const items = response?.items || [];
  const supplierOptions = useMemo(() => {
    const uniqueNames = Array.from(new Set(items.map((item) => item.supplierNama))).sort((a, b) =>
      a.localeCompare(b, "id-ID"),
    );

    return [
      { value: "__all__", label: "Semua Nama" },
      ...uniqueNames.map((name) => ({
        value: name,
        label: name,
      })),
    ];
  }, [items]);
  const selectableIds = items.filter((item) => item.status !== "PAID").map((item) => item.id);
  const allSelectableChecked = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const paginatedItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const pageStart = items.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, items.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [partyName, status, startDate, endDate]);

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
      { header: "No. Penerimaan", key: "nomorReferensi", width: 20 },
      { header: "Supplier", key: "supplierNama", width: 25 },
      { header: "Tipe Supplier", key: "supplierTipe", width: 15 },
      { header: "Material", key: "materialNama", width: 20 },
      { header: "Berat Netto (kg)", key: "beratNetto", width: 15 },
      { header: "Harga/Kg (Rp)", key: "hargaPerKg", width: 15 },
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
      const latestPayment = item.pembayaranHutang?.[0];
      return {
        tglTransaksi: format(new Date(item.tanggal), "dd/MM/yyyy"),
        tglBayar: latestPayment ? format(new Date(latestPayment.tanggalBayar), "dd/MM/yyyy") : "-",
        nomorReferensi: item.nomorReferensi,
        supplierNama: item.supplierNama,
        supplierTipe: item.supplierTipe,
        materialNama: item.materialNama,
        beratNetto: item.beratNetto,
        hargaPerKg: item.hargaPerKg,
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

    exportToExcel(dataToExport, columns, "Hutang_Supplier");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hutang Supplier</h1>
          <p className="text-muted-foreground">
            Data diambil langsung dari penerimaan TBS yang sudah selesai dan menampilkan rekening pembayaran supplier.
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
              <CardDescription>Total Tagihan Supplier</CardDescription>
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
              <CardDescription>Sisa Hutang</CardDescription>
              <CardTitle className="text-xl text-red-600">{formatCurrency(summary.sisaHutang)}</CardTitle>
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
          <CardDescription>Gunakan status dan periode untuk melihat hutang supplier yang masih berjalan.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="w-full md:max-w-[220px]">
            <SearchableSelect
              options={supplierOptions}
              value={partyName || "__all__"}
              onValueChange={(value) => setPartyName(value === "__all__" ? "" : value)}
              placeholder="Pilih nama supplier"
              searchPlaceholder="Cari nama supplier..."
              emptyMessage="Nama supplier tidak ditemukan"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status bayar" />
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
          <CardTitle>Daftar Hutang Supplier</CardTitle>
          <CardDescription>
            Nilai hutang memakai `jumlahBayarFinal` dari penerimaan TBS, bukan tabel sinkronisasi total lama.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={allSelectableChecked}
                onCheckedChange={(checked) => {
                  setSelectedIds(checked ? selectableIds : []);
                }}
                disabled={selectableIds.length === 0}
              />
              <span>Pilih semua data aktif</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedIds.length} dipilih</span>
              <Button
                size="sm"
                onClick={() => void handleBatchMarkPaid()}
                disabled={selectedIds.length === 0}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Lunasi Terpilih
              </Button>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">Pilih</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Penerimaan</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Netto</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Rekening</TableHead>
                  <TableHead className="text-right">Dibayar</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                      Tidak ada data hutang supplier.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => {
                    const latestPayment = getLatestPayment(item.pembayaranHutang);

                    return (
                    <TableRow key={item.id}>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds((current) =>
                              checked
                                ? [...current, item.id]
                                : current.filter((id) => id !== item.id),
                            );
                          }}
                          disabled={item.status === "PAID"}
                        />
                      </TableCell>
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
                        <div>{item.supplierNama}</div>
                        <div className="text-xs text-muted-foreground">{item.supplierTipe}</div>
                      </TableCell>
                      <TableCell>{item.materialNama}</TableCell>
                      <TableCell className="text-right">{item.beratNetto.toLocaleString("id-ID")} kg</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalNilai)}</TableCell>
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
                        <div className="flex flex-wrap justify-center gap-2">
                          {item.status !== "PAID" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openPaymentDialog(item)}>
                                <Wallet className="mr-1 h-4 w-4" />
                                Bayar
                              </Button>
                              <Button size="sm" onClick={() => void handleMarkPaid(item)}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {latestPayment && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => void handleCancelPayment(latestPayment.id)}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Batalkan
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
            <DialogTitle>Catat Pembayaran Supplier</DialogTitle>
            <DialogDescription>
              {selectedItem ? `${selectedItem.nomorReferensi} - ${selectedItem.supplierNama}` : "Pilih data hutang"}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Tagihan</span>
                  <span className="font-medium">{formatCurrency(selectedItem.totalNilai)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sudah Dibayar</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedItem.totalDibayar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa</span>
                  <span className="font-medium text-red-600">{formatCurrency(selectedItem.sisaHutang)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier-payment-date">Tanggal Pembayaran</Label>
                <Input
                  id="supplier-payment-date"
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
                  placeholder="Opsional"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-note">Keterangan</Label>
                <Textarea
                  id="payment-note"
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                />
              </div>

              {selectedItem.pembayaranHutang.length > 0 && (
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="text-sm font-medium">Riwayat Pembayaran</div>
                  <div className="space-y-2">
                    {selectedItem.pembayaranHutang.map((payment) => (
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
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => void handleCancelPayment(payment.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Batalkan
                        </Button>
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
