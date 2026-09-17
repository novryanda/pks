"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  DollarSign,
  CheckCircle2,
  ArrowLeft,
  FileText,
  BadgeDollarSign,
  CreditCard,
  Building2,
  Truck,
  Search,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { NumericInput } from "@/components/ui/numeric-input";
import { TablePagination } from "@/components/ui/table-pagination";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
};

type PenerimaanTBS = {
  id: string;
  nomorPenerimaan: string;
  tanggalTerima: string;
  beratBruto: number;
  beratTarra: number;
  beratNetto1: number;
  potonganPersen: number;
  potonganKg: number;
  beratNetto2: number;
  hargaPerKg: number;
  totalBayar: number;
  ppnPersen?: number;
  pphPersen?: number;
  nilaiPpn?: number;
  nilaiPph?: number;
  jumlahBayarFinal?: number;
  upahBongkar: number;
  totalUpahBongkar: number;
  lokasiKebun?: string;
  jenisBuah?: string;
  metodeBruto?: string;
  metodeTarra?: string;
  waktuTimbangBruto?: string;
  waktuTimbangTarra?: string;
  status: string;
  material: {
    name?: string;
    nama?: string;
    kategori: { name?: string; nama?: string };
    satuan: { name?: string; nama?: string; symbol?: string };
  };
  supplier: {
    ownerName: string;
    companyName?: string | null;
    nik: string;
    type?: string;
    address?: string;
    bankAccounts?: BankAccount[] | null;
  };
  transporter: {
    nomorKendaraan: string;
    namaSupir: string;
  };
  // Vendor Bongkar (from previous step)
  vendorBongkar?: {
    id: string;
    code: string;
    name: string;
    tipe: "SPSI" | "SPLO";
    bankAccounts?: BankAccount[] | null;
  } | null;
  selectedVendorBongkarBank?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null;
};

type InputHargaListProps = {
  onRefresh?: () => void;
};

// Helper function to convert number to Indonesian words
function numberToWords(num: number): string {
  if (num === 0) return "nol";

  const ones = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
  const tens = ["", "sepuluh", "dua puluh", "tiga puluh", "empat puluh", "lima puluh", "enam puluh", "tujuh puluh", "delapan puluh", "sembilan puluh"];
  const teens = ["sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "delapan belas", "sembilan belas"];

  if (num < 10) return ones[num] || "";
  if (num >= 10 && num < 20) return teens[num - 10] || "";
  if (num >= 20 && num < 100) {
    return (tens[Math.floor(num / 10)] || "") + (num % 10 !== 0 ? " " + (ones[num % 10] || "") : "");
  }
  if (num >= 100 && num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    return (hundreds === 1 ? "seratus" : (ones[hundreds] || "") + " ratus") + (remainder !== 0 ? " " + numberToWords(remainder) : "");
  }
  if (num >= 1000 && num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return (thousands === 1 ? "seribu" : numberToWords(thousands) + " ribu") + (remainder !== 0 ? " " + numberToWords(remainder) : "");
  }
  if (num >= 1000000 && num < 1000000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    return numberToWords(millions) + " juta" + (remainder !== 0 ? " " + numberToWords(remainder) : "");
  }

  return num.toLocaleString("id-ID");
}

export function InputHargaList({ onRefresh }: InputHargaListProps) {
  const [data, setData] = useState<PenerimaanTBS[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<PenerimaanTBS | null>(null);
  const [hargaPerKg, setHargaPerKg] = useState<number>(0);
  const [ppnPersen, setPpnPersen] = useState<number>(0);
  const [pphPersen, setPphPersen] = useState<number>(0);
  const [selectedBankIndex, setSelectedBankIndex] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pt-pks/penerimaan-tbs/pending-harga");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, data.length]);

  const handleSelectItem = (item: PenerimaanTBS) => {
    setSelectedItem(item);
    setHargaPerKg(item.hargaPerKg || 0);
    setPpnPersen(item.ppnPersen || 0);
    setPphPersen(item.pphPersen || 0);
    // Auto-select default bank account if available
    const bankAccounts = item.supplier.bankAccounts as BankAccount[] | null;
    if (bankAccounts && bankAccounts.length > 0) {
      const defaultIndex = bankAccounts.findIndex(b => b.isDefault);
      setSelectedBankIndex(defaultIndex >= 0 ? defaultIndex.toString() : "0");
    } else {
      setSelectedBankIndex("");
    }
  };

  const handleBack = () => {
    setSelectedItem(null);
    setHargaPerKg(0);
    setPpnPersen(0);
    setPphPersen(0);
    setSelectedBankIndex("");
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    if (hargaPerKg <= 0) {
      alert("Harga per kg harus lebih dari 0");
      return;
    }

    if (ppnPersen < 0 || ppnPersen > 100 || pphPersen < 0 || pphPersen > 100) {
      alert("PPN dan PPH harus di antara 0 sampai 100 persen");
      return;
    }

    // Get selected bank account if any
    const bankAccounts = selectedItem.supplier.bankAccounts as BankAccount[] | null;
    let selectedBankAccount: BankAccount | null = null;
    if (bankAccounts && bankAccounts.length > 0 && selectedBankIndex !== "") {
      selectedBankAccount = bankAccounts[parseInt(selectedBankIndex)] || null;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pt-pks/penerimaan-tbs/input-harga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          hargaPerKg,
          ppnPersen,
          pphPersen,
          upahBongkar: selectedItem.upahBongkar || 0,
          selectedBankAccount: selectedBankAccount ? {
            bankName: selectedBankAccount.bankName,
            accountNumber: selectedBankAccount.accountNumber,
            accountName: selectedBankAccount.accountName,
          } : null,
        }),
      });

      if (res.ok) {
        setSelectedItem(null);
        setHargaPerKg(0);
        setPpnPersen(0);
        setPphPersen(0);
        setSelectedBankIndex("");
        fetchData();
        onRefresh?.();
      } else {
        const errorData = await res.json();
        alert(`Gagal menyimpan: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculated values
  const totalBayarPreview = selectedItem ? Math.round(selectedItem.beratNetto2 * hargaPerKg) : 0;
  const nilaiPpnPreview = Math.round((totalBayarPreview * ppnPersen) / 100);
  const nilaiPphPreview = Math.round((totalBayarPreview * pphPersen) / 100);
  const jumlahBayarFinalPreview = totalBayarPreview + nilaiPpnPreview - nilaiPphPreview;
  const totalUpahPreview = selectedItem ? Math.round(selectedItem.beratNetto2 * (selectedItem.upahBongkar || 0)) : 0;

  // Bank accounts from selected item's supplier
  const bankAccounts = selectedItem?.supplier.bankAccounts as BankAccount[] | null;
  const selectedBank = bankAccounts && selectedBankIndex !== ""
    ? bankAccounts[parseInt(selectedBankIndex)]
    : null;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredData = data.filter((item) => {
    if (!normalizedSearch) return true;

    const materialName = item.material.name || item.material.nama || "";
    const materialCategory = item.material.kategori.name || item.material.kategori.nama || "";
    const supplierName = item.supplier.companyName?.trim() || item.supplier.ownerName;

    return (
      item.nomorPenerimaan.toLowerCase().includes(normalizedSearch) ||
      supplierName.toLowerCase().includes(normalizedSearch) ||
      item.supplier.ownerName.toLowerCase().includes(normalizedSearch) ||
      item.supplier.nik.toLowerCase().includes(normalizedSearch) ||
      materialName.toLowerCase().includes(normalizedSearch) ||
      materialCategory.toLowerCase().includes(normalizedSearch) ||
      item.transporter.nomorKendaraan.toLowerCase().includes(normalizedSearch) ||
      item.transporter.namaSupir.toLowerCase().includes(normalizedSearch) ||
      (item.lokasiKebun || "").toLowerCase().includes(normalizedSearch)
    );
  });

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  const pageStart = totalItems === 0 ? 0 : startIndex + 1;
  const pageEnd = totalItems === 0 ? 0 : Math.min(startIndex + itemsPerPage, totalItems);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show form when item is selected
  if (selectedItem) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar
        </Button>

        {/* Preview Data Lengkap */}
        <Card className="border-2 border-primary">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Preview Data Lengkap</h3>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">No. Penerimaan</div>
                  <div className="font-mono font-semibold">{selectedItem.nomorPenerimaan}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Tanggal/Jam</div>
                  <div className="font-medium">
                    {format(new Date(selectedItem.tanggalTerima), "EEEE, dd MMMM yyyy HH:mm", { locale: idLocale })}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Produk</div>
                  <div className="font-medium">
                    {(selectedItem.material.name || selectedItem.material.nama || "-")} ({selectedItem.material.kategori.name || selectedItem.material.kategori.nama || "-"})
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Satuan</div>
                  <div className="font-medium">{selectedItem.material.satuan.symbol || selectedItem.material.satuan.name || selectedItem.material.satuan.nama || "-"}</div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Supplier</div>
                <div>
                  <div className="font-semibold">{selectedItem.supplier.companyName?.trim() || selectedItem.supplier.ownerName}</div>
                  <div className="text-sm text-muted-foreground">
                    NIK: {selectedItem.supplier.nik}
                    {selectedItem.supplier.type && ` - ${selectedItem.supplier.type}`}
                  </div>
                  {selectedItem.supplier.address && (
                    <div className="text-sm text-muted-foreground">{selectedItem.supplier.address}</div>
                  )}
                </div>
              </div>

              {(selectedItem.lokasiKebun || selectedItem.jenisBuah) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {selectedItem.lokasiKebun && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Lokasi Kebun</div>
                        <div className="font-medium">{selectedItem.lokasiKebun}</div>
                      </div>
                    )}
                    {selectedItem.jenisBuah && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Jenis Buah</div>
                        <div className="font-medium">
                          {selectedItem.jenisBuah === "TBS-BB" && "Buah Besar (TBS-BB)"}
                          {selectedItem.jenisBuah === "TBS-BS" && "Buah Biasa (TBS-BS)"}
                          {selectedItem.jenisBuah === "TBS-BK" && "Buah Kecil (TBS-BK)"}
                          {!["TBS-BB", "TBS-BS", "TBS-BK"].includes(selectedItem.jenisBuah || "") && selectedItem.jenisBuah}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Kendaraan & Supir</div>
                <div>
                  <div className="font-semibold">{selectedItem.transporter.nomorKendaraan}</div>
                  <div className="text-sm text-muted-foreground">Supir: {selectedItem.transporter.namaSupir}</div>
                </div>
              </div>

              {/* Vendor Bongkar Info */}
              {selectedItem.vendorBongkar && (
                <>
                  <Separator />
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-orange-700 uppercase tracking-wide font-medium">Vendor Bongkar</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-semibold text-orange-900">{selectedItem.vendorBongkar.name}</div>
                        <div className="text-xs text-orange-700">
                          <Badge variant="outline" className="text-xs bg-orange-100 border-orange-300 text-orange-700">
                            {selectedItem.vendorBongkar.tipe}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-orange-700 mb-1">Upah Bongkar</div>
                        <div className="font-bold text-orange-900">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(selectedItem.upahBongkar)} / kg
                        </div>
                        <div className="text-sm text-orange-700">
                          Total: {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(selectedItem.totalUpahBongkar)}
                        </div>
                      </div>
                    </div>
                    {selectedItem.selectedVendorBongkarBank && (
                      <div className="mt-2 pt-2 border-t border-orange-200">
                        <div className="flex items-center gap-2 text-sm text-orange-700">
                          <Building2 className="h-3 w-3" />
                          <span>{selectedItem.selectedVendorBongkarBank.bankName} - {selectedItem.selectedVendorBongkarBank.accountNumber}</span>
                        </div>
                        <div className="text-xs text-orange-600 ml-5">
                          a/n {selectedItem.selectedVendorBongkarBank.accountName}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Berat Bruto</div>
                  <div className="font-bold text-lg">{selectedItem.beratBruto.toLocaleString("id-ID")} kg</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedItem.metodeBruto === "SISTEM_TIMBANGAN" ? "Sistem Timbangan" : "Input Manual"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Berat Tarra</div>
                  <div className="font-bold text-lg">{selectedItem.beratTarra.toLocaleString("id-ID")} kg</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedItem.metodeTarra === "SISTEM_TIMBANGAN" ? "Sistem Timbangan" : "Input Manual"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Berat Netto 1</div>
                  <div className="font-bold text-lg text-blue-600">
                    {selectedItem.beratNetto1.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                  <div className="text-xs text-muted-foreground">Bruto - Tarra</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Potongan</div>
                  <div className="font-bold text-lg text-orange-600">
                    {selectedItem.potonganPersen}% ({selectedItem.potonganKg.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Berat Netto 2 (Final)</div>
                  <div className="font-bold text-xl text-primary">
                    {selectedItem.beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Harga per kg</div>
                  <div className="font-bold text-lg">
                    {hargaPerKg > 0 ? new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(hargaPerKg) : "-"}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Upah Bongkar per kg</div>
                  <div className="font-bold text-lg">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(selectedItem.upahBongkar || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Upah Bongkar</div>
                  <div className="font-bold text-lg text-orange-600">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(totalUpahPreview)}
                  </div>
                </div>
              </div>

              <Separator className="border-primary/30" />

              <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Subtotal Harga</div>
                <div className="text-3xl font-bold text-primary">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(totalBayarPreview)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">PPN ({ppnPersen}%)</div>
                    <div className="font-semibold text-green-600">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(nilaiPpnPreview)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">PPH ({pphPersen}%)</div>
                    <div className="font-semibold text-red-600">
                      - {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(nilaiPphPreview)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Jumlah Dibayarkan</div>
                    <div className="font-bold text-primary">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(jumlahBayarFinalPreview)}
                    </div>
                  </div>
                </div>
                {jumlahBayarFinalPreview > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Terbilang: <span className="font-medium">{numberToWords(Math.round(jumlahBayarFinalPreview))} rupiah</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Harga Input Section */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <BadgeDollarSign className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Harga & Pembayaran</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hargaPerKg">Harga per Kilogram *</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  Rp
                </div>
                <NumericInput
                  id="hargaPerKg"
                  placeholder="0"
                  value={hargaPerKg}
                  onValueChange={(val) => setHargaPerKg(val)}
                  className="text-right text-lg font-semibold pl-12 pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  / kg
                </div>
              </div>
              {hargaPerKg > 0 && (
                <p className="text-sm text-muted-foreground">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(hargaPerKg)} per kilogram
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ppnPersen">PPN (%)</Label>
                <div className="relative">
                  <Input
                    id="ppnPersen"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={ppnPersen}
                    onChange={(e) => setPpnPersen(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="pr-10 text-right"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Menambah pembayaran sebesar{" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(nilaiPpnPreview)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pphPersen">PPH (%)</Label>
                <div className="relative">
                  <Input
                    id="pphPersen"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={pphPersen}
                    onChange={(e) => setPphPersen(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="pr-10 text-right"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mengurangi pembayaran sebesar{" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(nilaiPphPreview)}
                </p>
              </div>
            </div>

            {/* Upah Bongkar info already displayed in the preview card above */}

            {/* Rekening Pembayaran */}
            {bankAccounts && bankAccounts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="selectedBank">Rekening Pembayaran Supplier</Label>
                <Select
                  value={selectedBankIndex}
                  onValueChange={setSelectedBankIndex}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rekening pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((bank, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{bank.bankName} - {bank.accountNumber}</span>
                          {bank.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedBank && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-semibold text-blue-900">{selectedBank.bankName}</div>
                        <div className="text-blue-700">No. Rekening: {selectedBank.accountNumber}</div>
                        <div className="text-blue-700">A/N: {selectedBank.accountName}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notice jika tidak ada rekening */}
            {(!bankAccounts || bankAccounts.length === 0) && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <div className="font-semibold">Rekening Belum Terdaftar</div>
                    <div>Supplier ini belum memiliki rekening bank terdaftar. Pembayaran dapat dilakukan secara tunai.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Total Bayar */}
            {hargaPerKg > 0 && selectedItem.beratNetto2 > 0 && (
              <div className="p-6 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg mt-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm opacity-90">Jumlah yang Harus Dibayarkan</div>
                    <div className="text-xs opacity-75 mt-1">
                      {selectedItem.beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg × {" "}
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(hargaPerKg)}
                    </div>
                  </div>
                  <BadgeDollarSign className="h-8 w-8 opacity-50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-4">
                  <div className="rounded-md bg-white/10 p-3">
                    <div className="opacity-80">Subtotal</div>
                    <div className="font-semibold">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(totalBayarPreview)}
                    </div>
                  </div>
                  <div className="rounded-md bg-white/10 p-3">
                    <div className="opacity-80">PPN ({ppnPersen}%)</div>
                    <div className="font-semibold">
                      + {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(nilaiPpnPreview)}
                    </div>
                  </div>
                  <div className="rounded-md bg-white/10 p-3">
                    <div className="opacity-80">PPH ({pphPersen}%)</div>
                    <div className="font-semibold">
                      - {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(nilaiPphPreview)}
                    </div>
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(jumlahBayarFinalPreview)}
                </div>
                <div className="text-sm opacity-90">
                  {new Intl.NumberFormat("id-ID", {
                    notation: "compact",
                    compactDisplay: "long",
                  }).format(jumlahBayarFinalPreview)} rupiah
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Notice */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Konfirmasi Data</h4>
                <p className="text-sm text-green-800 mb-3">
                  Pastikan semua data yang ditampilkan sudah benar dan sesuai. Setelah data disimpan,
                  transaksi ini akan tercatat dalam sistem dan stock TBS akan bertambah secara otomatis.
                </p>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>Data penerimaan akan tersimpan dengan status <strong>COMPLETED</strong></li>
                  <li>Stock material akan bertambah sebesar {selectedItem.beratNetto2.toLocaleString("id-ID")} kg</li>
                  <li>Jumlah dibayarkan tersimpan sebesar {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(jumlahBayarFinalPreview)}</li>
                  <li>Data dapat dilihat di laporan pembayaran supplier</li>
                  <li>Nota/dokumen penerimaan dapat dicetak setelah penyimpanan</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleBack} disabled={submitting}>
            Kembali
          </Button>
          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={submitting || hargaPerKg <= 0}
            className="min-w-[200px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Menyimpan Data...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Simpan & Selesai
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Show list when no item selected
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Tidak ada penerimaan yang menunggu input harga</p>
      </div>
    );
  }

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "No. Penerimaan", key: "nomorPenerimaan", width: 22 },
      { header: "Tanggal Terima", key: "tanggalTerimaFormatted", width: 16 },
      { header: "Supplier", key: "supplierNama", width: 25 },
      { header: "No. Kendaraan", key: "nomorKendaraan", width: 16 },
      { header: "Nama Supir", key: "namaSupir", width: 20 },
      { header: "Material", key: "materialNama", width: 20 },
      { header: "Bruto (kg)", key: "beratBrutoFormatted", width: 15 },
      { header: "Tarra (kg)", key: "beratTarraFormatted", width: 15 },
      { header: "Netto 1 (kg)", key: "beratNetto1Formatted", width: 15 },
      { header: "Potongan (kg)", key: "potonganKgFormatted", width: 15 },
      { header: "Netto 2 (kg)", key: "beratNetto2Formatted", width: 15 },
      { header: "Status", key: "statusLabel", width: 18 },
    ];

    const dataToExport = filteredData.map((item) => ({
      nomorPenerimaan: item.nomorPenerimaan,
      tanggalTerimaFormatted: format(new Date(item.tanggalTerima), "dd/MM/yyyy"),
      supplierNama: item.supplier?.companyName || item.supplier?.ownerName || "-",
      nomorKendaraan: item.transporter?.nomorKendaraan || "-",
      namaSupir: item.transporter?.namaSupir || "-",
      materialNama: item.material.name || item.material.nama || "-",
      beratBrutoFormatted: (item.beratBruto || 0).toLocaleString("id-ID"),
      beratTarraFormatted: (item.beratTarra || 0).toLocaleString("id-ID"),
      beratNetto1Formatted: (item.beratNetto1 || 0).toLocaleString("id-ID"),
      potonganKgFormatted: (item.potonganKg || 0).toLocaleString("id-ID"),
      beratNetto2Formatted: (item.beratNetto2 || 0).toLocaleString("id-ID"),
      statusLabel: item.status === "PENDING_PRICE" ? "Menunggu Harga" : item.status,
    }));

    exportToExcel(
      dataToExport,
      columns,
      `Penerimaan_TBS_Menunggu_Harga_${format(new Date(), "yyyyMMdd")}`,
      "Menunggu_Harga"
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-lg">Daftar Menunggu Input Harga</h3>
              <p className="text-sm text-muted-foreground">
                Cari nomor penerimaan, supplier, material, plat kendaraan, atau nama supir.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Cari nomor, supplier, plat, atau material"
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={filteredData.length === 0}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Penerimaan</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Kendaraan</TableHead>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Berat Netto (kg)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  {searchTerm
                    ? "Tidak ada data yang cocok dengan pencarian."
                    : "Tidak ada penerimaan yang menunggu input harga."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-medium">
                    {item.nomorPenerimaan}
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.tanggalTerima), "dd MMM yyyy", { locale: idLocale })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.supplier.companyName?.trim() || item.supplier.ownerName}</div>
                      <div className="text-xs text-muted-foreground">{item.supplier.nik}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.transporter.nomorKendaraan}</div>
                      <div className="text-xs text-muted-foreground">{item.transporter.namaSupir}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.material.name || item.material.nama || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.material.kategori.name || item.material.kategori.nama || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {item.beratNetto2.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Menunggu Harga
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleSelectItem(item)}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Input Harga
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageStart={pageStart}
        pageEnd={pageEnd}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
