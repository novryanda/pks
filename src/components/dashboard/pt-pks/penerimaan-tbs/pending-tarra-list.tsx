"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Scale, Calculator, TrendingDown, ArrowLeft, Save, Printer, Search, X, Calendar, Ban, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { NumericInput } from "@/components/ui/numeric-input";
import { useWeighingScale } from "@/hooks/use-weighing-scale";
import { buildPaginationItems } from "@/lib/pagination";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PenerimaanTBS = {
  id: string;
  nomorPenerimaan: string;
  tanggalTerima: string;
  operatorPenimbang?: string | null;
  beratBruto: number;
  waktuTimbangBruto: string;
  beratTarra: number;
  beratNetto1: number;
  potonganPersen: number;
  potonganKg: number;
  beratNetto2: number;
  lokasiKebun?: string;
  jenisBuah?: string;
  status: string;
  material: {
    nama: string;
    kategori: { nama: string };
    satuan: { nama: string };
  };
  supplier: {
    ownerName: string;
    companyName?: string | null;
    nik: string;
  };
  transporter: {
    nomorKendaraan: string;
    namaSupir: string;
  };
};

const JENIS_BUAH_OPTIONS = ["TBS-BB", "TBS-BS", "TBS-BK"] as const;
type JenisBuah = (typeof JENIS_BUAH_OPTIONS)[number];

function isJenisBuah(value: unknown): value is JenisBuah {
  return typeof value === "string" && JENIS_BUAH_OPTIONS.includes(value as JenisBuah);
}

function getSupplierDisplayName(supplier: PenerimaanTBS["supplier"]) {
  const companyName = supplier.companyName?.trim();
  return companyName && companyName.length > 0 ? companyName : supplier.ownerName;
}

type PendingTarraListProps = {
  onRefresh?: () => void;
};

const ITEMS_PER_PAGE = 25;

export function PendingTarraList({ onRefresh }: PendingTarraListProps) {
  const [data, setData] = useState<PenerimaanTBS[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PenerimaanTBS | null>(null);

  // Filter state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Form state for tarra input
  const [metodeTarra, setMetodeTarra] = useState<"MANUAL" | "SISTEM_TIMBANGAN">("MANUAL");
  const [beratTarra, setBeratTarra] = useState<number>(0);
  const [waktuTimbangTarra, setWaktuTimbangTarra] = useState<Date>(new Date());
  const [potonganPersen, setPotonganPersen] = useState<number>(0);
  const [jenisBuah, setJenisBuah] = useState<JenisBuah | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelItem, setCancelItem] = useState<PenerimaanTBS | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { loading: weighingLoading, fetchWeight } = useWeighingScale();
  const { hasActionAccess } = useUserPermissions();
  const canCancelTicket = hasActionAccess("supplyChain.penerimaanTbs", "delete");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Build query params for date filter
      const params = new URLSearchParams();
      if (startDate) {
        params.append("startDate", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
      }

      const queryString = params.toString();
      const url = `/api/pt-pks/penerimaan-tbs/tarra-list${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(url);
      if (res.ok) {
        const result: unknown = await res.json();
        setData(Array.isArray(result) ? (result as PenerimaanTBS[]) : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate]);

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleSetToday = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setStartDate(today);
    setEndDate(today);
  };

  const handlePrintSlip = async (id: string) => {
    try {
      window.open(`/api/pt-pks/penerimaan-tbs/${id}/slip-tiket`, "_blank");
    } catch {
      toast.error("Gagal mencetak slip tiket");
    }
  };

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, data.length]);

  const handleSelectItem = (item: PenerimaanTBS) => {
    setSelectedItem(item);
    setMetodeTarra("MANUAL");
    // Use existing beratTarra if available, otherwise 0
    setBeratTarra(item.beratTarra || 0);
    setWaktuTimbangTarra(new Date());
    setPotonganPersen(item.potonganPersen || 0);
    setJenisBuah(isJenisBuah(item.jenisBuah) ? item.jenisBuah : "");
  };

  const handleBack = () => {
    setSelectedItem(null);
  };

  const handleMetodeChange = (metode: "MANUAL" | "SISTEM_TIMBANGAN") => {
    setMetodeTarra(metode);
  };

  const handleReadFromScale = async () => {
    const data = await fetchWeight();
    if (data) {
      setBeratTarra(data.weight);
      setWaktuTimbangTarra(new Date(data.timestamp));
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    if (beratTarra <= 0) {
      alert("Berat tarra harus lebih dari 0");
      return;
    }

    if (beratTarra >= selectedItem.beratBruto) {
      alert("Berat tarra tidak boleh lebih besar atau sama dengan berat bruto");
      return;
    }

    if (!jenisBuah) {
      alert("Jenis buah harus dipilih");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pt-pks/penerimaan-tbs/update-tarra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          metodeTarra,
          beratTarra,
          waktuTimbangTarra: waktuTimbangTarra.toISOString(),
          potonganPersen,
          jenisBuah,
        }),
      });

      if (res.ok) {
        toast.success("Data tarra berhasil disimpan!");
        setSelectedItem(null);
        await fetchData();
        onRefresh?.();
      } else {
        const errorData = (await res.json()) as { error?: string };
        toast.error(`Gagal menyimpan: ${errorData.error ?? "Terjadi kesalahan"}`);
      }
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelItem) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/pt-pks/penerimaan-tbs/${cancelItem.id}/cancel`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success(`Tiket ${cancelItem.nomorPenerimaan} berhasil dibatalkan`);
        setSelectedItem((current) => (current?.id === cancelItem.id ? null : current));
        await fetchData();
        onRefresh?.();
      } else {
        const errorData = (await res.json()) as { error?: string };
        toast.error(`Gagal membatalkan tiket: ${errorData.error ?? "Terjadi kesalahan"}`);
      }
    } catch (error) {
      console.error("Error cancelling penerimaan:", error);
      toast.error("Terjadi kesalahan saat membatalkan tiket");
    } finally {
      setIsCancelling(false);
      setCancelItem(null);
    }
  };

  // Calculated values for preview
  const beratBruto = selectedItem?.beratBruto ?? 0;
  const beratNetto1 = beratBruto - beratTarra;
  const potonganKg = (beratNetto1 * potonganPersen) / 100;
  const beratNetto2 = beratNetto1 - potonganKg;

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
        {/* Summary from Previous Steps */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Ringkasan Data</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">No. Penerimaan</div>
                <div className="font-mono font-medium text-sm">{selectedItem.nomorPenerimaan}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Supplier</div>
                <div className="font-medium text-sm">{selectedItem.supplier.ownerName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Operator</div>
                <div className="font-medium text-sm">{selectedItem.operatorPenimbang || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Kendaraan</div>
                <div className="font-medium text-sm">{selectedItem.transporter.nomorKendaraan}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Berat Bruto</div>
                <div className="font-bold text-primary">{beratBruto.toLocaleString("id-ID")} kg</div>
              </div>
              {selectedItem.lokasiKebun && (
                <div>
                  <div className="text-sm text-muted-foreground">Lokasi Kebun</div>
                  <div className="font-medium text-sm">{selectedItem.lokasiKebun}</div>
                </div>
              )}
              {selectedItem.jenisBuah && (
                <div>
                  <div className="text-sm text-muted-foreground">Jenis Buah</div>
                  <div className="font-medium text-sm">
                    {selectedItem.jenisBuah === "TBS-BB" && "Buah Besar (TBS-BB)"}
                    {selectedItem.jenisBuah === "TBS-BS" && "Buah Biasa (TBS-BS)"}
                    {selectedItem.jenisBuah === "TBS-BK" && "Buah Kecil (TBS-BK)"}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metode Input Section */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Metode Input Timbangan Tarra</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Pilih metode untuk memasukkan data berat tarra (berat kendaraan kosong)
            </p>
          </div>

          <RadioGroup
            value={metodeTarra}
            onValueChange={(value) => handleMetodeChange(value as "MANUAL" | "SISTEM_TIMBANGAN")}
            className="space-y-4"
          >
            <Card className={metodeTarra === "MANUAL" ? "border-primary" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="MANUAL" id="manual-tarra" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="manual-tarra" className="text-base font-medium cursor-pointer">
                      Input Manual
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Masukkan data berat tarra secara manual
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={metodeTarra === "SISTEM_TIMBANGAN" ? "border-primary" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="SISTEM_TIMBANGAN" id="sistem-tarra" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="sistem-tarra" className="text-base font-medium cursor-pointer">
                      Ambil dari Sistem Timbangan
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Data berat tarra akan diambil otomatis dari sistem timbangan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RadioGroup>
        </div>

        {/* Form Input Section */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Scale className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Data Timbangan Tarra</h3>
            </div>

            {metodeTarra === "SISTEM_TIMBANGAN" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md space-y-3">
                <p className="text-sm text-green-800">
                  Tekan tombol untuk membaca berat dari timbangan otomatis
                </p>
                <Button
                  type="button"
                  onClick={handleReadFromScale}
                  variant="outline"
                  className="w-full"
                  disabled={weighingLoading}
                >
                  {weighingLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Scale className="h-4 w-4 mr-2" />
                  )}
                  Baca dari Timbangan
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="beratTarra">Berat Tarra (kg) *</Label>
              <div className="relative">
                <NumericInput
                  id="beratTarra"
                  placeholder="0"
                  value={beratTarra}
                  onValueChange={(val) => setBeratTarra(val)}
                  disabled={metodeTarra === "SISTEM_TIMBANGAN"}
                  className="text-right text-lg font-semibold pr-12"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  kg
                </div>
              </div>
              {beratTarra > 0 && (
                <p className="text-sm text-muted-foreground">
                  {beratTarra.toLocaleString("id-ID")} kilogram (berat kendaraan kosong)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="waktuTimbangTarra">Waktu Timbangan</Label>
              <Input
                id="waktuTimbangTarra"
                type="datetime-local"
                value={(() => { const d = waktuTimbangTarra; const offset = d.getTimezoneOffset(); const local = new Date(d.getTime() - offset * 60000); return local.toISOString().slice(0, 16); })()}
                onChange={(e) => setWaktuTimbangTarra(new Date(e.target.value))}
                disabled={metodeTarra === "SISTEM_TIMBANGAN"}
              />
              <p className="text-sm text-muted-foreground">
                {metodeTarra === "SISTEM_TIMBANGAN"
                  ? "Waktu akan diambil otomatis dari sistem"
                  : "Waktu penimbangan kendaraan kosong"}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <Label className="text-base font-semibold">Jenis Buah *</Label>
              <RadioGroup
                value={jenisBuah}
                onValueChange={(value) => setJenisBuah(isJenisBuah(value) ? value : "")}
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer bg-card">
                    <RadioGroupItem value="TBS-BB" id="tbs-bb" />
                    <Label htmlFor="tbs-bb" className="font-normal cursor-pointer flex-1">
                      <div className="font-medium">Buah Besar</div>
                      <div className="text-xs text-muted-foreground">TBS-BB</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer bg-card">
                    <RadioGroupItem value="TBS-BS" id="tbs-bs" />
                    <Label htmlFor="tbs-bs" className="font-normal cursor-pointer flex-1">
                      <div className="font-medium">Buah Biasa</div>
                      <div className="text-xs text-muted-foreground">TBS-BS</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer bg-card">
                    <RadioGroupItem value="TBS-BK" id="tbs-bk" />
                    <Label htmlFor="tbs-bk" className="font-normal cursor-pointer flex-1">
                      <div className="font-medium">Buah Kecil</div>
                      <div className="text-xs text-muted-foreground">TBS-BK</div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Section */}
        {beratTarra > 0 && beratNetto1 > 0 && (
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-2 pb-2">
                <Calculator className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Perhitungan Otomatis</h3>
              </div>

              {/* Berat Netto 1 */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-blue-900">Berat Netto 1</div>
                  <div className="text-xs text-blue-700">Bruto - Tarra</div>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {beratNetto1.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {beratBruto.toLocaleString("id-ID")} kg - {beratTarra.toLocaleString("id-ID")} kg
                </div>
              </div>

              {/* Potongan Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  <Label className="text-base font-semibold">Potongan</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="potonganPersen">Potongan (%)</Label>
                    <div className="relative">
                      <Input
                        id="potonganPersen"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0.0"
                        value={potonganPersen || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value >= 0 && value <= 100) {
                            setPotonganPersen(value);
                          }
                        }}
                        className="text-right pr-8"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Persentase potongan dari berat netto 1
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Potongan (kg)</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={potonganKg.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                        disabled
                        className="text-right pr-8 bg-muted font-semibold"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        kg
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Auto kalkulasi: {potonganPersen}% × {beratNetto1.toLocaleString("id-ID")} kg
                    </p>
                  </div>
                </div>

                {potonganPersen > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <div className="text-sm text-orange-900">
                      <strong>Catatan:</strong> Potongan {potonganPersen}% akan mengurangi berat sebesar{" "}
                      <strong>{potonganKg.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Berat Netto 2 (Final) */}
              <div className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm opacity-90">Berat Netto 2 (Final)</div>
                    <div className="text-xs opacity-75 mt-1">Netto 1 - Potongan</div>
                  </div>
                  <Scale className="h-8 w-8 opacity-50" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm opacity-90">kilogram</div>
                <div className="mt-4 pt-4 border-t border-primary-foreground/20 text-xs opacity-75">
                  {beratNetto1.toLocaleString("id-ID")} kg - {potonganKg.toLocaleString("id-ID")} kg = {beratNetto2.toLocaleString("id-ID")} kg
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Box */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-yellow-900 mb-2">Catatan Penting</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Tarra adalah berat kendaraan kosong setelah TBS dibongkar</li>
              <li>Berat Netto 1 = Berat Bruto - Berat Tarra</li>
              <li>Potongan dihitung dari persentase terhadap Berat Netto 1</li>
              <li>Berat Netto 2 (Final) adalah berat yang akan digunakan untuk perhitungan pembayaran</li>
              <li>Pastikan semua data sudah benar sebelum menyimpan</li>
            </ul>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleBack} disabled={submitting}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke List
          </Button>
          <Button onClick={handleSubmit} size="lg" disabled={beratTarra <= 0 || submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Data Tarra
          </Button>
        </div>
      </div>
    );
  }

  // Show list when no item is selected
  const getStatusBadge = (status: string) => {
    if (status === "TIMBANG_BRUTO") {
      return <Badge variant="destructive">Belum Tarra</Badge>;
    }
    if (status === "PENDING_HARGA" || status === "TIMBANG_TARRA") {
      return <Badge variant="secondary">Sudah Tarra</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredData = data.filter((item) => {
    if (!normalizedSearch) return true;

    const searchableText = [
      item.nomorPenerimaan,
      item.transporter.nomorKendaraan,
      item.transporter.namaSupir,
      getSupplierDisplayName(item.supplier),
      item.operatorPenimbang ?? "",
      item.lokasiKebun ?? "",
      item.jenisBuah ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginationItems = buildPaginationItems(currentPage, totalPages);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const pageStart = filteredData.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length);

  return (
    <div className="space-y-4">
      {/* Date Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-end">
              <div className="space-y-1 lg:min-w-[280px]">
                <Label htmlFor="searchTarra" className="text-xs text-muted-foreground">Cari Data</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="searchTarra"
                    placeholder="No. penerimaan, supplier, operator, kendaraan, supir..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {searchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div className="flex items-center gap-2 pb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter Tanggal:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="startDate" className="text-xs text-muted-foreground">Dari</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">-</span>
                  <div className="space-y-1">
                    <Label htmlFor="endDate" className="text-xs text-muted-foreground">Sampai</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSetToday}>
                    Hari Ini
                  </Button>
                  {(startDate || endDate) && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilter}>
                      <X className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground xl:text-right">
              Ditemukan: <span className="font-semibold">{filteredData.length}</span> dari{" "}
              <span className="font-semibold">{data.length}</span> data
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table or Empty State */}
      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Tidak ada data yang menunggu input tarra{startDate || endDate ? " untuk periode yang dipilih" : ""}</p>
          {(startDate || endDate) && (
            <Button variant="link" onClick={handleClearFilter} className="mt-2">
              Reset Filter
            </Button>
          )}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Tidak ada data yang sesuai dengan pencarian</p>
          <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2">
            Reset Pencarian
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Penerimaan</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead className="text-right">Bruto (kg)</TableHead>
                <TableHead className="text-right">Tarra (kg)</TableHead>
                <TableHead className="text-right">Netto (kg)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">
                    {format(new Date(item.tanggalTerima), "dd/MM/yyyy", { locale: idLocale })}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {item.nomorPenerimaan}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.transporter.nomorKendaraan}</div>
                      <div className="text-xs text-muted-foreground">{item.transporter.namaSupir}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getSupplierDisplayName(item.supplier)}</div>
                    </div>
                  </TableCell>
                  <TableCell>{item.operatorPenimbang || "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {item.beratBruto.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.beratTarra > 0 ? (
                      <span className="font-medium">{item.beratTarra.toLocaleString("id-ID")}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {item.beratNetto2 > 0 ? item.beratNetto2.toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSelectItem(item)}
                        title="Input Tarra"
                      >
                        <Scale className="h-4 w-4 mr-1" />
                        Input Tarra
                      </Button>
                      {item.beratTarra > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintSlip(item.id)}
                          title="Cetak Slip Tiket"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      )}
                      {canCancelTicket && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setCancelItem(item)}
                          title="Batalkan Tiket"
                          disabled={isCancelling}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground">
              Menampilkan <span className="font-semibold text-foreground">{pageStart}</span> -{" "}
              <span className="font-semibold text-foreground">{pageEnd}</span> dari{" "}
              <span className="font-semibold text-foreground">{filteredData.length}</span> data
            </div>
            {totalPages > 1 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                {paginationItems.map((item) =>
                  typeof item === "number" ? (
                    <Button
                      key={item}
                      variant={item === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </Button>
                  ) : (
                    <div
                      key={item}
                      className="flex items-center px-2 text-muted-foreground"
                    >
                      ...
                    </div>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={canCancelTicket && !!cancelItem} onOpenChange={() => !isCancelling && setCancelItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Batalkan Tiket Timbangan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tiket <strong>{cancelItem?.nomorPenerimaan}</strong> akan diubah menjadi status dibatalkan dan tidak
              akan muncul lagi di daftar Input Tarra. Gunakan aksi ini untuk tiket yang salah input atau tidak jadi
              dilanjutkan ke proses tara.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleCancel();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
            >
              {isCancelling ? "Memproses..." : "Ya, Batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
