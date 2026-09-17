"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Truck, Save, AlertTriangle, Calculator, Search } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { NumericInput } from "@/components/ui/numeric-input";
import { DecimalNumericInput } from "@/components/ui/decimal-numeric-input";

type ContractWithPending = {
  id: string;
  contractNumber: string;
  contractDate: string;
  deliveryAddress: string;
  paymentMethod: "LUNAS_AWAL" | "SEBAGIAN" | "SETELAH_PENGIRIMAN";
  buyer: {
    id: string;
    name: string;
    taxStatus: "NON_PKP" | "PKP_11" | "PKP_1_1";
  };
  contractItems: {
    id: string;
    unitPrice: number;
    quantity: number;
    material: {
      name: string;
      code: string;
    };
  }[];
  pengirimanProduct: {
    id: string;
    nomorPengiriman: string;
    tanggalPengiriman: string;
    beratNetto: number;
    ffa: number | null;
    air: number | null;
    kotoran: number | null;
    status: string;
    vendorVehicle: {
      nomorKendaraan: string;
      namaSupir: string;
    };
  }[];
};

type InvoiceWizardProps = {
  contract: ContractWithPending;
  onSuccess: () => void;
  onCancel: () => void;
};

export function InvoiceWizard({ contract, onSuccess, onCancel }: InvoiceWizardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Form state
  const [nomorInvoice, setNomorInvoice] = useState("");
  const [tanggalInvoice, setTanggalInvoice] = useState(format(new Date(), "yyyy-MM-dd"));
  const [namaPenandatangan, setNamaPenandatangan] = useState("TARA MIFTAHUR");
  const [jabatanPenandatangan, setJabatanPenandatangan] = useState("Direktur");
  const [catatan, setCatatan] = useState("");

  // Klaim Mutu (dalam kg)
  const [klaimMutuKg, setKlaimMutuKg] = useState(0);
  const [klaimMutuKeterangan, setKlaimMutuKeterangan] = useState("");

  // Klaim Susut (dalam kg)
  const [klaimSusutKg, setKlaimSusutKg] = useState(0);
  const [klaimSusutKeterangan, setKlaimSusutKeterangan] = useState("");

  // Pajak
  const [ppnPersen, setPpnPersen] = useState(0);
  const [pphPersen, setPphPersen] = useState(0);

  // PPN Disclaimer
  const [showPpnDisclaimer, setShowPpnDisclaimer] = useState(false);

  // Fetch next invoice number on mount
  useEffect(() => {
    const fetchNextInvoiceNumber = async () => {
      try {
        const res = await fetch("/api/pt-pks/invoice/next-number");
        if (res.ok) {
          const data = (await res.json()) as { nextNomorInvoice?: string };
          if (data.nextNomorInvoice) {
            setNomorInvoice(data.nextNomorInvoice);
          }
        }
      } catch (err) {
        console.error("Failed to fetch next invoice number:", err);
      }
    };
    void fetchNextInvoiceNumber();
  }, []);

  // Initialize ppnPersen based on buyer's tax status
  useEffect(() => {
    if (contract.buyer.taxStatus === "PKP_11") {
      setPpnPersen(11);
    } else if (contract.buyer.taxStatus === "PKP_1_1") {
      setPpnPersen(1.1);
    } else {
      setPpnPersen(0);
    }
  }, [contract.buyer.taxStatus]);

  // Select all by default
  useEffect(() => {
    const allIds = new Set(contract.pengirimanProduct.map((p) => p.id));
    setSelectedItems(allIds);
  }, [contract.pengirimanProduct]);

  // Calculate totals
  const calculations = useMemo(() => {
    const selectedPengiriman = contract.pengirimanProduct.filter((p) =>
      selectedItems.has(p.id)
    );
    const totalBerat = selectedPengiriman.reduce(
      (sum, p) => sum + (p.beratNetto || 0),
      0
    );
    const hargaPerKg = contract.contractItems[0]?.unitPrice || 0;
    const subtotalBruto = totalBerat * hargaPerKg;

    // Calculate claims
    const klaimMutuNilai = klaimMutuKg * hargaPerKg;
    const klaimSusutNilai = klaimSusutKg * hargaPerKg;
    const totalPotongan = klaimMutuNilai + klaimSusutNilai;
    const subtotalNetto = subtotalBruto - totalPotongan;

    // Calculate taxes
    const ppnNilai = (subtotalNetto * ppnPersen) / 100;
    const pphNilai = (subtotalNetto * pphPersen) / 100;
    const totalNilai = subtotalNetto + ppnNilai - pphNilai;

    // Calculate average mutu
    const avgFfa =
      selectedPengiriman.length > 0
        ? selectedPengiriman.reduce((sum, p) => sum + (p.ffa || 0), 0) /
        selectedPengiriman.length
        : 0;
    const avgAir =
      selectedPengiriman.length > 0
        ? selectedPengiriman.reduce((sum, p) => sum + (p.air || 0), 0) /
        selectedPengiriman.length
        : 0;
    const avgKotoran =
      selectedPengiriman.length > 0
        ? selectedPengiriman.reduce((sum, p) => sum + (p.kotoran || 0), 0) /
        selectedPengiriman.length
        : 0;

    return {
      selectedPengiriman,
      totalBerat,
      hargaPerKg,
      subtotalBruto,
      klaimMutuNilai,
      klaimSusutNilai,
      totalPotongan,
      subtotalNetto,
      ppnNilai,
      pphNilai,
      totalNilai,
      avgFfa,
      avgAir,
      avgKotoran,
    };
  }, [
    contract.pengirimanProduct,
    contract.contractItems,
    selectedItems,
    klaimMutuKg,
    klaimSusutKg,
    ppnPersen,
    pphPersen,
  ]);

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === contract.pengirimanProduct.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(contract.pengirimanProduct.map((p) => p.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      toast.error("Pilih minimal 1 pengiriman untuk di-invoice");
      return;
    }

    setLoading(true);
    try {
      const items = calculations.selectedPengiriman.map((p) => ({
        pengirimanProductId: p.id,
        nomorPengiriman: p.nomorPengiriman,
        tanggalPengiriman: p.tanggalPengiriman,
        beratNetto: p.beratNetto || 0,
        ffa: p.ffa,
        air: p.air,
        kotoran: p.kotoran,
        hargaSatuan: calculations.hargaPerKg,
        subtotal: (p.beratNetto || 0) * calculations.hargaPerKg,
        klaimMutuPersen: 0,
        klaimMutuNilai: 0,
        klaimSusutPersen: 0,
        klaimSusutNilai: 0,
        totalPotongan: 0,
        totalBersih: (p.beratNetto || 0) * calculations.hargaPerKg,
      }));

      const payload = {
        nomorInvoice: nomorInvoice.trim() || undefined,
        tanggalInvoice,
        tanggalJatuhTempo: null,
        namaPenandatangan: namaPenandatangan.trim() || "TARA MIFTAHUR",
        jabatanPenandatangan: jabatanPenandatangan.trim() || "Direktur",
        contractId: contract.id,
        buyerId: contract.buyer.id,
        totalBerat: calculations.totalBerat,
        hargaPerKg: calculations.hargaPerKg,
        subtotalBruto: calculations.subtotalBruto,
        klaimMutuPersen: 0, // Using kg instead of percent
        klaimMutuNilai: calculations.klaimMutuNilai,
        klaimMutuKeterangan: klaimMutuKeterangan || null,
        klaimSusutPersen: 0, // Using kg instead of percent
        klaimSusutNilai: calculations.klaimSusutNilai,
        klaimSusutKeterangan: klaimSusutKeterangan || null,
        totalPotongan: calculations.totalPotongan,
        subtotalNetto: calculations.subtotalNetto,
        ppnPersen,
        pphPersen,
        catatan: catatan || null,
        showPpnDisclaimer,
        items,
      };

      const res = await fetch("/api/pt-pks/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat invoice");
      }

      const invoice = await res.json();
      toast.success(`Invoice ${invoice.nomorInvoice} berhasil dibuat`);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error(error.message || "Gagal membuat invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">Buat Invoice</h2>
          <p className="text-sm text-muted-foreground">
            Kontrak: {contract.contractNumber} - {contract.buyer.name}
          </p>
        </div>
      </div>

      {/* Contract & Buyer Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informasi Kontrak & Buyer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Nomor Kontrak</div>
            <div className="font-medium">{contract.contractNumber}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Buyer</div>
            <div className="font-medium">{contract.buyer.name}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Produk</div>
            <div className="font-medium">
              {contract.contractItems.map((item) => item.material.name).join(", ")}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Status Pajak</div>
            <Badge variant="outline">
              {contract.buyer.taxStatus === "NON_PKP"
                ? "Non PKP"
                : contract.buyer.taxStatus === "PKP_11"
                  ? "PKP 11%"
                  : "PKP 1.1%"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detail Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nomorInvoice">Nomor Invoice</Label>
              <Input
                id="nomorInvoice"
                value={nomorInvoice}
                onChange={(e) => setNomorInvoice(e.target.value)}
                placeholder="Contoh: INV/2026/09/0001"
              />
              <p className="text-xs text-muted-foreground">Nomor invoice dapat disesuaikan</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalInvoice">Tanggal Invoice *</Label>
              <Input
                id="tanggalInvoice"
                type="date"
                value={tanggalInvoice}
                onChange={(e) => setTanggalInvoice(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="namaPenandatangan">Nama Penandatangan</Label>
              <Input
                id="namaPenandatangan"
                value={namaPenandatangan}
                onChange={(e) => setNamaPenandatangan(e.target.value)}
                placeholder="Nama yang menandatangani"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jabatanPenandatangan">Jabatan Penandatangan</Label>
              <Input
                id="jabatanPenandatangan"
                value={jabatanPenandatangan}
                onChange={(e) => setJabatanPenandatangan(e.target.value)}
                placeholder="Contoh: Direktur"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pengiriman Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Pilih Pengiriman</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
            >
              {selectedItems.size === contract.pengirimanProduct.length
                ? "Hapus Semua"
                : "Pilih Semua"}
            </Button>
          </div>
          <CardDescription>
            Pilih pengiriman yang akan di-invoice ({selectedItems.size} dari{" "}
            {contract.pengirimanProduct.length} dipilih)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>No. Pengiriman</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kendaraan</TableHead>
                  <TableHead className="text-right">Berat (kg)</TableHead>
                  <TableHead className="text-center">Mutu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.pengirimanProduct.map((p) => (
                  <TableRow
                    key={p.id}
                    className={selectedItems.has(p.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(p.id)}
                        onCheckedChange={() => toggleItem(p.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{p.nomorPengiriman}</TableCell>
                    <TableCell>
                      {format(new Date(p.tanggalPengiriman), "d MMM yyyy", {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{p.vendorVehicle.nomorKendaraan}</div>
                        <div className="text-muted-foreground text-xs">
                          {p.vendorVehicle.namaSupir}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(p.beratNetto || 0).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2 text-xs">
                        <span className="px-1.5 py-0.5 bg-amber-100 rounded">
                          FFA: {(p.ffa || 0).toFixed(1)}%
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-100 rounded">
                          Air: {(p.air || 0).toFixed(1)}%
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                          Kotor: {(p.kotoran || 0).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Klaim Mutu & Susut */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Potongan Klaim
          </CardTitle>
          <CardDescription>
            Input potongan klaim mutu dan susut jika ada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Average Mutu Info */}
          {selectedItems.size > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Rata-rata Mutu dari {selectedItems.size} Pengiriman:</div>
              <div className="flex gap-4 text-sm">
                <span>FFA: <strong>{calculations.avgFfa.toFixed(2)}%</strong></span>
                <span>Air: <strong>{calculations.avgAir.toFixed(2)}%</strong></span>
                <span>Kotoran: <strong>{calculations.avgKotoran.toFixed(2)}%</strong></span>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Klaim Mutu */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Klaim Mutu</h4>
              <div className="space-y-2">
                <Label htmlFor="klaimMutuKg">Potongan Klaim Mutu (kg)</Label>
                <DecimalNumericInput
                  id="klaimMutuKg"
                  value={klaimMutuKg}
                  onValueChange={setKlaimMutuKg}
                  placeholder="0 atau contoh: 12,5"
                />
                <p className="text-xs text-muted-foreground">Bisa angka koma (desimal) atau bulatan</p>
              </div>
              {klaimMutuKg > 0 && (
                <>
                  <div className="text-sm">
                    Nilai Klaim:{" "}
                    <strong className="text-red-600">
                      Rp {calculations.klaimMutuNilai.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="klaimMutuKeterangan">Keterangan Klaim Mutu</Label>
                    <Textarea
                      id="klaimMutuKeterangan"
                      placeholder="Jelaskan alasan klaim mutu..."
                      value={klaimMutuKeterangan}
                      onChange={(e) => setKlaimMutuKeterangan(e.target.value)}
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Klaim Susut */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Klaim Susut (Shrinkage)</h4>
              <div className="space-y-2">
                <Label htmlFor="klaimSusutKg">Potongan Klaim Susut (kg)</Label>
                <DecimalNumericInput
                  id="klaimSusutKg"
                  value={klaimSusutKg}
                  onValueChange={setKlaimSusutKg}
                  placeholder="0 atau contoh: 5,5"
                />
                <p className="text-xs text-muted-foreground">Bisa angka koma (desimal) atau bulatan</p>
              </div>
              {klaimSusutKg > 0 && (
                <>
                  <div className="text-sm">
                    Nilai Klaim:{" "}
                    <strong className="text-red-600">
                      Rp {calculations.klaimSusutNilai.toLocaleString("id-ID")}
                    </strong>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="klaimSusutKeterangan">Keterangan Klaim Susut</Label>
                    <Textarea
                      id="klaimSusutKeterangan"
                      placeholder="Jelaskan alasan klaim susut..."
                      value={klaimSusutKeterangan}
                      onChange={(e) => setKlaimSusutKeterangan(e.target.value)}
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pajak */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Pajak
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ppnPersen">PPN (%)</Label>
            <NumericInput
              id="ppnPersen"
              min={0}
              max={100}
              value={ppnPersen}
              onValueChange={setPpnPersen}
            />
            {ppnPersen > 0 && (
              <div className="text-sm text-muted-foreground">
                Nilai PPN: Rp {calculations.ppnNilai.toLocaleString("id-ID")}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pphPersen">PPh (%)</Label>
            <NumericInput
              id="pphPersen"
              min={0}
              max={100}
              value={pphPersen}
              onValueChange={setPphPersen}
            />
            {pphPersen > 0 && (
              <div className="text-sm text-muted-foreground">
                Nilai PPh: Rp {calculations.pphNilai.toLocaleString("id-ID")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Catatan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Catatan</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Catatan tambahan untuk invoice (opsional)..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* PPN Disclaimer Checkbox */}
      <div className="flex items-center space-x-2 p-4 border rounded-lg bg-amber-50">
        <Checkbox
          id="showPpnDisclaimer"
          checked={showPpnDisclaimer}
          onCheckedChange={(checked) => setShowPpnDisclaimer(checked === true)}
        />
        <Label htmlFor="showPpnDisclaimer" className="text-sm cursor-pointer">
          Tampilkan keterangan <strong>&quot;PPN tidak dipungut sesuai PP tempat Penimbunan Berikat&quot;</strong> di PDF
        </Label>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ringkasan Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Total Berat ({selectedItems.size} Pengiriman)</span>
              <span className="font-medium">
                {calculations.totalBerat.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Harga per kg</span>
              <span className="font-medium">
                Rp {calculations.hargaPerKg.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subtotal Bruto</span>
              <span className="font-medium">
                Rp {calculations.subtotalBruto.toLocaleString("id-ID")}
              </span>
            </div>

            <Separator />

            {calculations.totalPotongan > 0 && (
              <>
                {klaimMutuKg > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Klaim Mutu ({klaimMutuKg.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg)</span>
                    <span>- Rp {calculations.klaimMutuNilai.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {klaimSusutKg > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Klaim Susut ({klaimSusutKg.toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg)</span>
                    <span>- Rp {calculations.klaimSusutNilai.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium text-red-600">
                  <span>Total Potongan</span>
                  <span>- Rp {calculations.totalPotongan.toLocaleString("id-ID")}</span>
                </div>
                <Separator />
              </>
            )}

            <div className="flex justify-between text-sm">
              <span>Subtotal Netto</span>
              <span className="font-medium">
                Rp {calculations.subtotalNetto.toLocaleString("id-ID")}
              </span>
            </div>

            {ppnPersen > 0 && (
              <div className="flex justify-between text-sm">
                <span>PPN ({ppnPersen}%)</span>
                <span>+ Rp {calculations.ppnNilai.toLocaleString("id-ID")}</span>
              </div>
            )}
            {pphPersen > 0 && (
              <div className="flex justify-between text-sm">
                <span>PPh ({pphPersen}%)</span>
                <span>- Rp {calculations.pphNilai.toLocaleString("id-ID")}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL INVOICE</span>
              <span className="text-green-600">
                Rp {calculations.totalNilai.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={loading || selectedItems.size === 0}>
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Invoice
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
