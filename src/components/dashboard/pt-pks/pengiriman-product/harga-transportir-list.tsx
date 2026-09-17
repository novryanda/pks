"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { RefreshCw, Search, Tag, FileSpreadsheet } from "lucide-react";
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

import { NumericInput } from "@/components/ui/numeric-input";
import { DecimalNumericInput } from "@/components/ui/decimal-numeric-input";

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

  return <Badge variant="destructive">Siap Dibayar</Badge>;
};

export function HargaTransportirList() {
  const [response, setResponse] = useState<TransporterPaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedItem, setSelectedItem] = useState<TransporterPaymentItem | null>(null);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [processingPrice, setProcessingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState<number>(0);
  const [ppnPersen, setPpnPersen] = useState<number>(0);
  const [pphPersen, setPphPersen] = useState<number>(0);

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

      const res = await fetch(`/api/pt-pks/pemasaran/harga-transportir?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal memuat harga transportir");
      }

      const data = (await res.json()) as TransporterPaymentResponse;
      setResponse(data);
    } catch (error) {
      console.error("Error fetching transporter prices:", error);
      toast.error("Gagal memuat harga transportir");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [search, status, startDate, endDate]);

  const openPriceDialog = (item: TransporterPaymentItem) => {
    setSelectedItem(item);
    setPriceValue(item.hargaPerKg || 0);
    setPpnPersen(item.ppnPersen || 0);
    setPphPersen(item.pphPersen || 0);
    setShowPriceDialog(true);
  };

  const handleSavePrice = async () => {
    if (!selectedItem) return;

    if (!priceValue || priceValue <= 0) {
      toast.error("Harga per kilogram wajib diisi");
      return;
    }

    try {
      setProcessingPrice(true);
      const res = await fetch("/api/pt-pks/pemasaran/harga-transportir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pengirimanId: selectedItem.id,
          hargaPerKg: priceValue,
          ppnPersen,
          pphPersen,
        }),
      });

      if (!res.ok) {
        const error = (await res.json()) as ErrorResponse;
        throw new Error(error.error ?? "Gagal menyimpan harga transportir");
      }

      toast.success("Harga vendor transportir berhasil disimpan");
      setShowPriceDialog(false);
      await fetchData(true);
    } catch (error: unknown) {
      console.error("Error saving transporter price:", error);
      toast.error(getErrorMessage(error, "Gagal menyimpan harga transportir"));
    } finally {
      setProcessingPrice(false);
    }
  };

  const summary = response?.summary;
  const items = response?.items ?? [];

  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Tanggal", key: "tanggalFormatted", width: 15 },
      { header: "No. Pengiriman", key: "nomorReferensi", width: 20 },
      { header: "Vendor Transportir", key: "vendorNama", width: 25 },
      { header: "Nama Supir", key: "namaSupir", width: 20 },
      { header: "Buyer", key: "buyerNama", width: 25 },
      { header: "No. Kendaraan", key: "nomorKendaraan", width: 16 },
      { header: "Berat Netto (kg)", key: "beratNettoFormatted", width: 16 },
      { header: "Harga per Kg (Rp)", key: "hargaPerKgFormatted", width: 18 },
      { header: "DPP (Rp)", key: "dppFormatted", width: 18 },
      { header: "PPN (Rp)", key: "ppnFormatted", width: 16 },
      { header: "PPh 23 (Rp)", key: "pphFormatted", width: 16 },
      { header: "Total Tagihan (Rp)", key: "totalNilaiFormatted", width: 20 },
      { header: "Total Dibayar (Rp)", key: "totalDibayarFormatted", width: 20 },
      { header: "Sisa Hutang (Rp)", key: "sisaHutangFormatted", width: 20 },
      { header: "Status", key: "statusLabel", width: 18 },
    ];

    const statusMap: Record<string, string> = {
      PENDING_PRICE: "Belum Input Harga",
      UNPAID: "Siap Dibayar",
      PARTIAL: "Dibayar Sebagian",
      PAID: "Lunas",
    };

    const dataToExport = items.map((item) => ({
      tanggalFormatted: format(new Date(item.tanggal), "dd/MM/yyyy"),
      nomorReferensi: item.nomorReferensi,
      vendorNama: item.vendorNama,
      namaSupir: item.namaSupir || "-",
      buyerNama: item.buyerNama || "-",
      nomorKendaraan: item.nomorKendaraan || "-",
      beratNettoFormatted: formatNumber(item.beratNetto),
      hargaPerKgFormatted: item.hasHarga ? formatNumber(item.hargaPerKg) : "-",
      dppFormatted: item.hasHarga ? formatNumber(item.dpp ?? (item.beratNetto * item.hargaPerKg)) : "-",
      ppnFormatted: item.hasHarga ? formatNumber(item.nilaiPpn ?? 0) : "-",
      pphFormatted: item.hasHarga ? formatNumber(item.nilaiPph ?? 0) : "-",
      totalNilaiFormatted: item.hasHarga ? formatNumber(item.totalNilai) : "-",
      totalDibayarFormatted: formatNumber(item.totalDibayar),
      sisaHutangFormatted: formatNumber(item.sisaHutang),
      statusLabel: statusMap[item.status] || item.status,
    }));

    exportToExcel(
      dataToExport,
      columns,
      `Harga_Transportir_${format(new Date(), "yyyyMMdd")}`,
      "Harga_Transportir"
    );
    toast.success("Data harga transportir berhasil diexport");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Harga Transportir</h1>
          <p className="text-muted-foreground">
            Input harga vendor transportir untuk setiap pengiriman product yang sudah selesai.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} disabled={items.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
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
              <CardDescription>Total Nilai Transportir</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(summary.totalNilai)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Belum Input Harga</CardDescription>
              <CardTitle className="text-xl text-slate-600">{summary.jumlahBelumInputHarga}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Siap Dibayar</CardDescription>
              <CardTitle className="text-xl text-red-600">{summary.jumlahUnpaid + summary.jumlahPartial}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sudah Lunas</CardDescription>
              <CardTitle className="text-xl text-green-600">{summary.jumlahPaid}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Filter pengiriman berdasarkan status harga, status pembayaran, dan tanggal pengiriman.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari no. pengiriman, vendor, buyer, atau kendaraan"
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
              <SelectItem value="UNPAID">Siap Dibayar</SelectItem>
              <SelectItem value="PARTIAL">Dibayar Sebagian</SelectItem>
              <SelectItem value="PAID">Lunas</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Harga Transportir</CardTitle>
          <CardDescription>
            Harga per kilogram diinput di sini, lalu pembayaran diverifikasi pada menu keuangan.
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="py-8 text-center">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="py-8 text-center text-muted-foreground">
                      Tidak ada data pengiriman untuk harga transportir.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{format(new Date(item.tanggal), "dd MMM yyyy", { locale: idLocale })}</TableCell>
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
                        {item.hasHarga ? formatCurrency(item.totalNilai) : <span className="text-muted-foreground">Belum ada harga</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          {item.totalDibayar > 0 ? (
                            <span className="text-center text-xs text-muted-foreground">
                              Harga terkunci karena pembayaran sudah berjalan
                            </span>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => openPriceDialog(item)}>
                              <Tag className="mr-1 h-4 w-4" />
                              {item.hasHarga ? "Edit Harga" : "Input Harga"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Input Harga Vendor Transportir</DialogTitle>
            <DialogDescription>
              {selectedItem ? `${selectedItem.nomorReferensi} - ${selectedItem.vendorNama}` : "Pilih data pengiriman"}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="flex justify-between">
                  <span>Buyer</span>
                  <span className="font-medium">{selectedItem.buyerNama}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kendaraan</span>
                  <span className="font-medium">{selectedItem.nomorKendaraan}</span>
                </div>
                <div className="flex justify-between">
                  <span>Berat Netto</span>
                  <span className="font-medium">{formatNumber(selectedItem.beratNetto)} kg</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transporter-price">Harga per Kilogram (Rp) *</Label>
                <NumericInput
                  id="transporter-price"
                  placeholder="0"
                  value={priceValue}
                  onValueChange={(val) => setPriceValue(val)}
                />
              </div>

              {/* Pajak: PPN & PPh */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ppn-persen" className="text-xs">PPN (%)</Label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPpnPersen(0)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${ppnPersen === 0 ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      >
                        0%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPpnPersen(11)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${ppnPersen === 11 ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      >
                        11%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPpnPersen(12)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${ppnPersen === 12 ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      >
                        12%
                      </button>
                    </div>
                  </div>
                  <DecimalNumericInput
                    id="ppn-persen"
                    value={ppnPersen}
                    onValueChange={(val) => setPpnPersen(val)}
                    placeholder="0"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pph-persen" className="text-xs">PPh 23 (%)</Label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPphPersen(0)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${pphPersen === 0 ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      >
                        0%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPphPersen(2)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${pphPersen === 2 ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      >
                        2%
                      </button>
                    </div>
                  </div>
                  <DecimalNumericInput
                    id="pph-persen"
                    value={pphPersen}
                    onValueChange={(val) => setPphPersen(val)}
                    placeholder="0"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Live Preview Kalkulasi */}
              {priceValue > 0 && (
                <div className="rounded-lg border bg-slate-50 dark:bg-slate-900/50 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>DPP (Netto × Harga/kg)</span>
                    <span>{formatCurrency(selectedItem.beratNetto * priceValue)}</span>
                  </div>
                  {ppnPersen > 0 && (
                    <div className="flex justify-between text-blue-600 dark:text-blue-400">
                      <span>PPN ({ppnPersen}%)</span>
                      <span>+ {formatCurrency((selectedItem.beratNetto * priceValue * ppnPersen) / 100)}</span>
                    </div>
                  )}
                  {pphPersen > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>PPh 23 ({pphPersen}%)</span>
                      <span>- {formatCurrency((selectedItem.beratNetto * priceValue * pphPersen) / 100)}</span>
                    </div>
                  )}
                  <div className="border-t pt-1.5 flex justify-between font-semibold text-sm">
                    <span>Total Estimasi Hutang</span>
                    <span className="text-primary font-bold">
                      {formatCurrency(
                        Math.round(
                          selectedItem.beratNetto * priceValue +
                            (selectedItem.beratNetto * priceValue * ppnPersen) / 100 -
                            (selectedItem.beratNetto * priceValue * pphPersen) / 100
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => void handleSavePrice()} disabled={processingPrice}>
              {processingPrice ? "Menyimpan..." : "Simpan Harga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
