"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FileText, Download, Filter, Eye, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PenerimaanDetailView } from "./penerimaan-detail-view";
import { PenerimaanEditForm } from "./penerimaan-edit-form";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";
import { formatDateInJakarta, formatTimeInJakarta } from "@/lib/date-time";

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
};

type SupplierOption = {
  id: string;
  ownerName: string;
};

type PembayaranData = {
  id: string;
  nomorPenerimaan: string;
  tanggalTerima: string;
  waktuTimbangBruto?: string | null;
  waktuTimbangTarra?: string | null;
  operatorPenimbang: string;
  lokasiKebun?: string | null;
  jenisBuah?: string | null;
  beratBruto: number;
  beratTarra: number;
  beratNetto1: number;
  potonganPersen: number;
  potonganKg: number;
  beratNetto2: number;
  hargaPerKg: number;
  totalBayar: number;
  ppnPersen: number;
  pphPersen: number;
  nilaiPpn: number;
  nilaiPph: number;
  jumlahBayarFinal: number;
  upahBongkar: number;
  totalUpahBongkar: number;
  status: string;
  supplierId: string;
  transporterId: string;
  vendorBongkarId?: string | null;
  selectedVendorBongkarBank?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null;
  selectedBankAccount?: BankAccount | null;
  supplier: {
    id: string;
    ownerName: string;
    type: string;
    address: string;
    bankAccounts?: BankAccount[] | null;
  };
  material: {
    id: string;
    name: string;
    satuan: {
      symbol: string;
    };
  };
  transporter: {
    id: string;
    nomorKendaraan: string;
    namaSupir: string;
  };
  vendorBongkar?: {
    id: string;
    name: string;
    code: string;
    tipe: "SPSI" | "SPLO";
    bankAccounts: BankAccount[] | null;
  } | null;
};

const formatDate = (value: string) => formatDateInJakarta(value, { year: "2-digit" });
const formatTime = (value?: string | null) => formatTimeInJakarta(value);
const formatJenisBuah = (value?: string | null) => value?.replace("TBS-", "") ?? "-";

export function PembayaranSupplierTable() {
  const [data, setData] = useState<PembayaranData[]>([]);
  const [filteredData, setFilteredData] = useState<PembayaranData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [selectedItem, setSelectedItem] = useState<PembayaranData | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showBongkar, setShowBongkar] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/pt-pks/pembayaran-supplier");
      if (res.ok) {
        const pembayaranData = (await res.json()) as PembayaranData[];
        setData(pembayaranData);

        // Extract unique suppliers
        const uniqueSuppliers = Array.from(
          new Map(
            pembayaranData.map((item: PembayaranData) => [
              item.supplier.id,
              { id: item.supplier.id, ownerName: item.supplier.ownerName },
            ])
          ).values()
        );
        setSuppliers(uniqueSuppliers);
      }
    } catch (error) {
      console.error("Error fetching pembayaran data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterData = useCallback(() => {
    let filtered = [...data];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.nomorPenerimaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.transporter.nomorKendaraan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Supplier filter
    if (filterSupplier !== "all") {
      filtered = filtered.filter((item) => item.supplier.id === filterSupplier);
    }

    // Period filter
    if (startDate || endDate) {
      const startBoundary = startDate ? new Date(`${startDate}T00:00:00`) : null;
      const endBoundary = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.tanggalTerima);
        if (startBoundary && itemDate < startBoundary) return false;
        if (endBoundary && itemDate > endBoundary) return false;
        return true;
      });
    }

    setFilteredData(filtered);
  }, [data, endDate, filterSupplier, searchTerm, startDate]);

  useEffect(() => {
    filterData();
  }, [filterData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const calculateTotals = () => {
    const totalBerat = filteredData.reduce((sum, item) => sum + item.beratNetto2, 0);
    const totalPembayaran = filteredData.reduce((sum, item) => sum + item.totalBayar, 0);
    const totalPembayaranFinal = filteredData.reduce((sum, item) => sum + item.jumlahBayarFinal, 0);
    const totalUpahBongkar = filteredData.reduce((sum, item) => sum + item.totalUpahBongkar, 0);
    return { totalBerat, totalPembayaran, totalPembayaranFinal, totalUpahBongkar };
  };

  const { totalBerat, totalPembayaran, totalPembayaranFinal, totalUpahBongkar } = calculateTotals();

  const exportToExcelData = () => {
    const columns: ExportColumn[] = [
      { header: "No. Penerimaan", key: "nomorPenerimaan", width: 20 },
      { header: "Tanggal", key: "tanggalTerima", width: 15 },
      { header: "Lokasi Kebun", key: "lokasiKebun", width: 24 },
      { header: "Jenis Buah", key: "jenisBuah", width: 14 },
      { header: "Jam Masuk", key: "jamMasuk", width: 12 },
      { header: "Jam Keluar", key: "jamKeluar", width: 12 },
      { header: "No. Kendaraan", key: "transporter.nomorKendaraan", width: 16 },
      { header: "Supir", key: "transporter.namaSupir", width: 22 },
      { header: "Supplier", key: "supplier.ownerName", width: 25 },
      { header: "Tipe", key: "supplier.type", width: 10 },
      { header: "Bank", key: "selectedBankAccount.bankName", width: 15 },
      { header: "No. Rekening", key: "selectedBankAccount.accountNumber", width: 20 },
      { header: "Atas Nama", key: "selectedBankAccount.accountName", width: 25 },
      { header: "Material", key: "material.name", width: 15 },
      { header: "Berat Bruto (kg)", key: "beratBruto", width: 15 },
      { header: "Berat Tarra (kg)", key: "beratTarra", width: 15 },
      { header: "Berat Netto 1 (kg)", key: "beratNetto1", width: 15 },
      { header: "Potongan (%)", key: "potonganPersen", width: 12 },
      { header: "Potongan (kg)", key: "potonganKg", width: 12 },
      { header: "Berat Netto 2 (kg)", key: "beratNetto2", width: 15 },
      { header: "Harga/kg", key: "hargaPerKg", width: 12 },
      { header: "Total Bayar", key: "totalBayar", width: 15 },
      { header: "PPN (%)", key: "ppnPersen", width: 10 },
      { header: "PPH (%)", key: "pphPersen", width: 10 },
      { header: "Nilai PPN", key: "nilaiPpn", width: 14 },
      { header: "Nilai PPH", key: "nilaiPph", width: 14 },
      { header: "Jumlah Dibayar", key: "jumlahBayarFinal", width: 18 },
      { header: "Upah Bongkar/kg", key: "upahBongkar", width: 15 },
      { header: "Total Upah Bongkar", key: "totalUpahBongkar", width: 18 },
    ];

    // Prepare data for export, handling dates and bank accounts
    const formattedData: Record<string, unknown>[] = filteredData.map((item) => {
      const bankAccount = item.selectedBankAccount ?? item.supplier.bankAccounts?.[0] ?? null;
      return {
        ...item,
        tanggalTerima: formatDateInJakarta(item.tanggalTerima),
        lokasiKebun: item.lokasiKebun ?? "-",
        jenisBuah: formatJenisBuah(item.jenisBuah),
        jamMasuk: formatTime(item.waktuTimbangBruto),
        jamKeluar: formatTime(item.waktuTimbangTarra),
        selectedBankAccount: bankAccount,
      };
    });

    const totalRow: Record<string, unknown> = {
      nomorPenerimaan: "",
      tanggalTerima: "",
      lokasiKebun: "",
      jenisBuah: "",
      jamMasuk: "",
      jamKeluar: "",
      transporter: {
        nomorKendaraan: "",
        namaSupir: "",
      },
      supplier: {
        ownerName: `TOTAL (${filteredData.length} Data)`,
        type: "",
      },
      selectedBankAccount: {
        bankName: "",
        accountNumber: "",
        accountName: "",
      },
      material: {
        name: "",
      },
      beratBruto: filteredData.reduce((sum, item) => sum + item.beratBruto, 0),
      beratTarra: filteredData.reduce((sum, item) => sum + item.beratTarra, 0),
      beratNetto1: filteredData.reduce((sum, item) => sum + item.beratNetto1, 0),
      potonganPersen: "",
      potonganKg: filteredData.reduce((sum, item) => sum + item.potonganKg, 0),
      beratNetto2: filteredData.reduce((sum, item) => sum + item.beratNetto2, 0),
      hargaPerKg: "",
      totalBayar: filteredData.reduce((sum, item) => sum + item.totalBayar, 0),
      ppnPersen: "",
      pphPersen: "",
      nilaiPpn: filteredData.reduce((sum, item) => sum + item.nilaiPpn, 0),
      nilaiPph: filteredData.reduce((sum, item) => sum + item.nilaiPph, 0),
      jumlahBayarFinal: filteredData.reduce((sum, item) => sum + item.jumlahBayarFinal, 0),
      upahBongkar: "",
      totalUpahBongkar: filteredData.reduce((sum, item) => sum + item.totalUpahBongkar, 0),
    };

    exportToExcel(
      [...formattedData, totalRow],
      columns,
      `Pembayaran_Supplier_${new Date().toISOString().split("T")[0]}`,
      "Pembayaran Supplier"
    );
  };

  const exportToPDF = () => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (filterSupplier !== "all") params.append("supplierId", filterSupplier);

    window.open(`/api/pt-pks/pembayaran-supplier/export-pdf?${params.toString()}`, "_blank");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Memuat data...</div>
        </CardContent>
      </Card>
    );
  }

  // Show detail view
  if (showDetail && selectedItem) {
    return (
      <PenerimaanDetailView
        data={selectedItem}
        onBack={() => {
          setShowDetail(false);
          setSelectedItem(null);
        }}
        onRefresh={fetchData}
      />
    );
  }

  // Show edit view
  if (showEdit && selectedItem) {
    return (
      <PenerimaanEditForm
        data={selectedItem}
        onCancel={() => {
          setShowEdit(false);
          setSelectedItem(null);
        }}
        onSuccess={() => {
          setShowEdit(false);
          setSelectedItem(null);
          void fetchData();
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Transaksi</div>
            <div className="text-xl font-bold">{filteredData.length}</div>
            <div className="text-[10px] text-muted-foreground">penerimaan TBS</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Berat</div>
            <div className="text-xl font-bold text-primary">
              {totalBerat.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-muted-foreground">kilogram</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Pembayaran</div>
            <div className="text-xl font-bold text-green-600">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(totalPembayaran)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {filteredData.length > 0 ? `dari ${filteredData.length} transaksi` : "tidak ada transaksi"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Jumlah Dibayar</div>
            <div className="text-xl font-bold text-emerald-700">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(totalPembayaranFinal)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              total setelah PPN dan PPH
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Data Pembayaran Supplier TBS</CardTitle>
              <CardDescription className="text-xs">
                Daftar lengkap penerimaan TBS dari supplier beserta informasi pembayaran
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToExcelData} variant="outline" size="sm" className="h-8 border-green-600 text-green-600 hover:bg-green-50">
                <Download className="mr-2 h-3.5 w-3.5" />
                Export Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline" size="sm" className="h-8 border-red-600 text-red-600 hover:bg-red-50">
                <FileText className="mr-2 h-3.5 w-3.5" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs font-semibold">Cari</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="No. pnr, supplier, plat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="filterSupplier" className="text-xs font-semibold">Filter Supplier</Label>
              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger id="filterSupplier" className="h-8 text-sm">
                  <SelectValue placeholder="Semua supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">Semua Supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id} className="text-sm">
                      {supplier.ownerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs font-semibold">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs font-semibold">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1 md:col-span-4">
              <Checkbox
                id="showBongkar"
                checked={showBongkar}
                onCheckedChange={(checked) => setShowBongkar(!!checked)}
              />
              <Label htmlFor="showBongkar" className="text-xs font-semibold cursor-pointer">
                Tampilkan Info Bongkar
              </Label>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || filterSupplier !== "all" || startDate || endDate) && (
            <div className="flex items-center gap-2 flex-wrap pb-1">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Filter aktif:</span>
              {searchTerm && (
                <Badge variant="secondary" className="text-[10px] h-5 py-0 px-2">
                  Cari: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1.5 hover:text-destructive text-sm leading-none"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filterSupplier !== "all" && (
                <Badge variant="secondary" className="text-[10px] h-5 py-0 px-2">
                  Supplier: {suppliers.find((s) => s.id === filterSupplier)?.ownerName}
                  <button
                    onClick={() => setFilterSupplier("all")}
                    className="ml-1.5 hover:text-destructive text-sm leading-none"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {(startDate || endDate) && (
                <Badge variant="secondary" className="text-[10px] h-5 py-0 px-2">
                  Periode:{" "}
                  {startDate ? new Date(`${startDate}T00:00:00`).toLocaleDateString("id-ID") : "..."}
                  {" - "}
                  {endDate ? new Date(`${endDate}T00:00:00`).toLocaleDateString("id-ID") : "..."}
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="ml-1.5 hover:text-destructive text-sm leading-none"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterSupplier("all");
                  setStartDate("");
                  setEndDate("");
                }}
                className="h-5 text-[10px] px-2"
              >
                Reset
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="border rounded-md overflow-hidden bg-background">
            <div className="overflow-x-auto max-h-[50vh]">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px] h-9 text-[11px] uppercase py-1 px-3">No. Pnr</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase py-1 px-2 text-center">Tgl</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase py-1 px-2 text-center">Jam Masuk</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase py-1 px-2 text-center">Jam Keluar</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase py-1 px-2">No. Kendaraan</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase py-1 px-2">Supir</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase py-1 px-2">Supplier</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase py-1 px-2">Lokasi/Jenis</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase py-1 px-2">Rekening</TableHead>
                    <TableHead className="text-right h-9 text-[11px] uppercase py-1 px-2">Netto-2</TableHead>
                    <TableHead className="text-right h-9 text-[11px] uppercase py-1 px-2">Harga</TableHead>
                    <TableHead className="text-right h-9 text-[11px] uppercase py-1 px-2">Total</TableHead>
                    <TableHead className="text-right h-9 text-[11px] uppercase py-1 px-2">PPN</TableHead>
                    <TableHead className="text-right h-9 text-[11px] uppercase py-1 px-2">PPH</TableHead>
                    <TableHead className="text-right h-9 text-[11px] uppercase py-1 px-2">Jml Bayar</TableHead>
                    {showBongkar && (
                      <>
                        <TableHead className="h-9 text-[11px] uppercase py-1 px-2">Vendor</TableHead>
                        <TableHead className="h-9 text-[11px] uppercase py-1 px-2">Tipe</TableHead>
                        <TableHead className="text-right h-9 text-[11px] uppercase py-1 px-2">Upah</TableHead>
                        <TableHead className="text-right h-9 text-[11px] uppercase py-1 px-2">Tot.Upah</TableHead>
                      </>
                    )}
                    <TableHead className="h-9 text-[11px] uppercase py-1 px-2 text-center">Status</TableHead>
                    <TableHead className="text-center h-9 text-[11px] uppercase py-1 px-2">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={showBongkar ? 21 : 17} className="text-center py-6 text-xs text-muted-foreground">
                        {data.length === 0
                          ? "Belum ada data penerimaan TBS"
                          : "Tidak ada data yang sesuai dengan filter"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id} className="h-8 transition-colors hover:bg-muted/30">
                        <TableCell className="font-mono text-[10px] py-1 px-3 whitespace-nowrap">
                          {item.nomorPenerimaan}
                        </TableCell>
                        <TableCell className="text-[11px] py-1 px-2 whitespace-nowrap text-center">
                          {formatDate(item.tanggalTerima)}
                        </TableCell>
                        <TableCell className="text-[11px] py-1 px-2 whitespace-nowrap text-center">
                          {formatTime(item.waktuTimbangBruto)}
                        </TableCell>
                        <TableCell className="text-[11px] py-1 px-2 whitespace-nowrap text-center">
                          {formatTime(item.waktuTimbangTarra)}
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <div className="font-medium text-[11px] leading-tight">{item.transporter.nomorKendaraan}</div>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <div className="text-[10px] text-muted-foreground leading-none">{item.transporter.namaSupir}</div>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <div className="font-semibold text-[11px] leading-tight">{item.supplier.ownerName}</div>
                          <div className="text-[10px] text-muted-foreground leading-none">{item.supplier.type}</div>
                        </TableCell>
                        <TableCell className="text-[11px] py-1 px-2">
                          <div className="truncate max-w-[80px]" title={item.lokasiKebun ?? ""}>{item.lokasiKebun ?? "-"}</div>
                          <div className="text-[10px] font-medium text-muted-foreground">
                            {item.jenisBuah?.replace("TBS-", "") ?? ""}
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          {(() => {
                            const bankAccount = item.selectedBankAccount ?? item.supplier.bankAccounts?.[0] ?? null;
                            return bankAccount ? (
                              <>
                                <div className="text-[10px] truncate max-w-[100px]" title={bankAccount.bankName}>{bankAccount.bankName}</div>
                                <div className="text-[9px] text-muted-foreground font-mono">{bankAccount.accountNumber}</div>
                                <div className="text-[9px] text-muted-foreground truncate max-w-[100px]" title={bankAccount.accountName}>a.n. {bankAccount.accountName}</div>
                              </>
                            ) : (
                              <div className="text-[10px] text-muted-foreground">-</div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary text-[11px] py-1 px-2 whitespace-nowrap">
                          {item.beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 1 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-[10px] py-1 px-2">
                          {new Intl.NumberFormat("id-ID").format(item.hargaPerKg)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600 text-[11px] py-1 px-2 whitespace-nowrap">
                          {new Intl.NumberFormat("id-ID").format(item.totalBayar)}
                        </TableCell>
                        <TableCell className="text-right text-[10px] py-1 px-2 whitespace-nowrap">
                          <div>{item.ppnPersen}%</div>
                          <div className="text-[9px] text-green-600">{new Intl.NumberFormat("id-ID").format(item.nilaiPpn)}</div>
                        </TableCell>
                        <TableCell className="text-right text-[10px] py-1 px-2 whitespace-nowrap">
                          <div>{item.pphPersen}%</div>
                          <div className="text-[9px] text-red-600">{new Intl.NumberFormat("id-ID").format(item.nilaiPph)}</div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-700 text-[11px] py-1 px-2 whitespace-nowrap">
                          {new Intl.NumberFormat("id-ID").format(item.jumlahBayarFinal)}
                        </TableCell>
                        {showBongkar && (
                          <>
                            <TableCell className="text-[10px] py-1 px-2">
                              {item.vendorBongkar?.name ?? "-"}
                            </TableCell>
                            <TableCell className="text-[10px] py-1 px-2">
                              {item.vendorBongkar?.tipe ?? "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-[10px] py-1 px-2">
                              {new Intl.NumberFormat("id-ID").format(item.upahBongkar)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-orange-600 text-[11px] py-1 px-2 whitespace-nowrap">
                              {new Intl.NumberFormat("id-ID").format(item.totalUpahBongkar)}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-center py-1 px-2">
                          <Badge
                            className="text-[9px] h-4 py-0 px-1 font-bold"
                            variant={
                              item.status === "COMPLETED"
                                ? "default"
                                : item.status === "DRAFT"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {item.status.charAt(0)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1 px-2">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowDetail(true);
                              }}
                              className="h-6 w-6"
                              title="Lihat Detail"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowEdit(true);
                              }}
                              className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit Data"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer Summary */}
          {filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center pt-2 border-t gap-3 mt-1">
              <div className="text-[10px] text-muted-foreground italic font-medium">
                Data: {filteredData.length} / {data.length} Transaksi
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-end">
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold leading-none mb-0.5">Total Netto-2</div>
                  <div className="font-bold text-primary text-sm">
                    {totalBerat.toLocaleString("id-ID", { minimumFractionDigits: 1 })} <span className="text-[9px] font-normal">kg</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold leading-none mb-0.5">Total Bayar</div>
                  <div className="font-bold text-green-600 text-sm">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(totalPembayaran)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold leading-none mb-0.5">Jml Dibayar</div>
                  <div className="font-bold text-emerald-700 text-sm">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(totalPembayaranFinal)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold leading-none mb-0.5">Tot.Upah Bongkar</div>
                  <div className="font-bold text-orange-600 text-sm">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(totalUpahBongkar)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
