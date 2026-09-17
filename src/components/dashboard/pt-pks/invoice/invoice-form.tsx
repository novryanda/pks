"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Calculator, Save, Building2, FileText, Loader2, Package, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { NumericInput } from "@/components/ui/numeric-input";
import { DecimalNumericInput } from "@/components/ui/decimal-numeric-input";

type Buyer = {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  taxStatus: string;
};

type ContractItem = {
  id: string;
  quantity: number;
  deliveredQuantity: number;
  unitPrice: number;
  material: {
    id: string;
    name: string;
    code: string;
  };
};

type Contract = {
  id: string;
  contractNumber: string;
  contractDate: string;
  deliveryDate: string;
  status: string;
  paymentStatus?: "UNPAID" | "PARTIAL" | "PAID";
  paymentMethod: "LUNAS_AWAL" | "SEBAGIAN" | "SETELAH_PENGIRIMAN";
  buyer: Buyer;
  contractItems: ContractItem[];
  hasActiveInvoice?: boolean;
  isFullyInvoiced?: boolean;
  remainingInvoiceQuantity?: number;
  totalInvoicedQuantity?: number;
};

const paymentMethodLabels: Record<string, string> = {
  LUNAS_AWAL: "Lunas Awal",
  SEBAGIAN: "Sebagian",
  SETELAH_PENGIRIMAN: "Setelah Pengiriman",
};

const paymentMethodDescriptions: Record<string, string> = {
  LUNAS_AWAL: "Pembayaran otomatis tercatat saat invoice diterbitkan (cetak 1x)",
  SEBAGIAN: "Pembayaran manual per tahap hingga lunas (cetak 2x)",
  SETELAH_PENGIRIMAN: "Pembayaran manual setelah pengiriman (cetak 2x)",
};

type ContractInvoiceSummary = {
  totalContractQuantity: number;
  totalInvoicedQuantity: number;
  remainingQuantity: number;
  invoicePercentage: number;
  isFullyInvoiced: boolean;
  canCreateInvoice: boolean;
};

type InvoiceFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function InvoiceForm({ onSuccess, onCancel }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [loadingContractSummary, setLoadingContractSummary] = useState(false);

  // Selection state
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [selectedContractId, setSelectedContractId] = useState("");

  // Contract invoice summary
  const [contractSummary, setContractSummary] = useState<ContractInvoiceSummary | null>(null);

  // Form state
  const [nomorInvoice, setNomorInvoice] = useState("");
  const [tanggalInvoice, setTanggalInvoice] = useState(format(new Date(), "yyyy-MM-dd"));
  const [namaPenandatangan, setNamaPenandatangan] = useState("TARA MIFTAHUR");
  const [jabatanPenandatangan, setJabatanPenandatangan] = useState("Direktur");
  const [catatan, setCatatan] = useState("");

  // Custom quantity (tidak pakai pengiriman)
  const [customQuantity, setCustomQuantity] = useState<number>(0);

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

  // Fetch buyers & next invoice number on mount
  useEffect(() => {
    void fetchBuyers();
    void fetchNextInvoiceNumber();
  }, []);

  const fetchNextInvoiceNumber = async () => {
    try {
      const res = await fetch("/api/pt-pks/invoice/next-number");
      if (res.ok) {
        const data = (await res.json()) as { nextNomorInvoice?: string };
        if (data.nextNomorInvoice) {
          setNomorInvoice(data.nextNomorInvoice);
        }
      }
    } catch (error) {
      console.error("Error fetching next invoice number:", error);
    }
  };

  // Fetch contracts when buyer changes
  useEffect(() => {
    if (selectedBuyerId) {
      fetchContracts(selectedBuyerId);
    } else {
      setContracts([]);
      setSelectedContractId("");
      setContractSummary(null);
    }
  }, [selectedBuyerId]);

  // Fetch contract invoice summary when contract changes
  useEffect(() => {
    if (selectedContractId) {
      fetchContractSummary(selectedContractId);
    } else {
      setContractSummary(null);
    }
  }, [selectedContractId]);

  // Auto-fill quantity when contract summary is loaded (use remaining quantity)
  useEffect(() => {
    if (contractSummary) {
      // Default to remaining quantity instead of total contract quantity
      setCustomQuantity(contractSummary.remainingQuantity);
    } else {
      setCustomQuantity(0);
    }
  }, [contractSummary]);

  // Update PPN when buyer changes
  useEffect(() => {
    const buyer = buyers.find(b => b.id === selectedBuyerId);
    if (buyer) {
      if (buyer.taxStatus === "PKP_11") {
        setPpnPersen(11);
      } else if (buyer.taxStatus === "PKP_1_1") {
        setPpnPersen(1.1);
      } else {
        setPpnPersen(0);
      }
    }
  }, [selectedBuyerId, buyers]);

  const fetchBuyers = async () => {
    setLoadingBuyers(true);
    try {
      const res = await fetch("/api/pt-pks/buyer?limit=100");
      if (res.ok) {
        const result = await res.json();
        setBuyers(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching buyers:", error);
    } finally {
      setLoadingBuyers(false);
    }
  };

  const fetchContracts = async (buyerId: string) => {
    setLoadingContracts(true);
    try {
      const res = await fetch(`/api/pt-pks/contract?buyerId=${buyerId}&statuses=ACTIVE,COMPLETED&excludeInvoiced=true&limit=200`);
      if (res.ok) {
        const result = await res.json();
        const contractList: Contract[] = result.data || [];
        // Filter out contracts that are already fully invoiced or paid
        const availableContracts = contractList.filter((c) => {
          if (c.paymentStatus === "PAID") return false;
          if (c.isFullyInvoiced) return false;
          if (c.remainingInvoiceQuantity !== undefined && c.remainingInvoiceQuantity <= 0) return false;
          if (c.hasActiveInvoice && c.paymentMethod !== "SEBAGIAN") return false;
          if (c.status === "COMPLETED" && c.paymentMethod === "LUNAS_AWAL") return false;
          return true;
        });
        setContracts(availableContracts);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoadingContracts(false);
    }
  };

  const fetchContractSummary = async (contractId: string) => {
    setLoadingContractSummary(true);
    try {
      const res = await fetch(`/api/pt-pks/contract/${contractId}/invoice-summary`);
      if (res.ok) {
        const data = await res.json();
        setContractSummary(data);
      }
    } catch (error) {
      console.error("Error fetching contract summary:", error);
    } finally {
      setLoadingContractSummary(false);
    }
  };

  // Get selected data
  const selectedBuyer = buyers.find(b => b.id === selectedBuyerId);
  const selectedContract = contracts.find(c => c.id === selectedContractId);

  // Calculate totals
  const calculations = useMemo(() => {
    if (!selectedContract) {
      return {
        totalBerat: 0,
        hargaPerKg: 0,
        subtotalBruto: 0,
        klaimMutuNilai: 0,
        klaimSusutNilai: 0,
        totalPotongan: 0,
        subtotalNetto: 0,
        ppnNilai: 0,
        pphNilai: 0,
        totalNilai: 0,
      };
    }

    const hargaPerKg = selectedContract.contractItems[0]?.unitPrice || 0;
    const totalBerat = customQuantity;
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

    return {
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
    };
  }, [
    selectedContract,
    customQuantity,
    klaimMutuKg,
    klaimSusutKg,
    ppnPersen,
    pphPersen,
  ]);

  const handleSubmit = async () => {
    if (!selectedBuyerId) {
      toast.error("Pilih buyer terlebih dahulu");
      return;
    }
    if (!selectedContractId) {
      toast.error("Pilih kontrak terlebih dahulu");
      return;
    }
    if (customQuantity <= 0) {
      toast.error("Kuantitas harus lebih dari 0");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nomorInvoice: nomorInvoice.trim() || undefined,
        tanggalInvoice,
        tanggalJatuhTempo: null,
        contractId: selectedContractId,
        buyerId: selectedBuyerId,
        totalBerat: calculations.totalBerat,
        hargaPerKg: calculations.hargaPerKg,
        subtotalBruto: calculations.subtotalBruto,
        klaimMutuPersen: 0, // Using kg instead of percent
        klaimMutuNilai: calculations.klaimMutuNilai,
        klaimMutuKeterangan: klaimMutuKeterangan || null,
        klaimSusutPersen: 0, // Using kg instead of percent
        klaimSusutNilai: calculations.klaimSusutNilai,
        klaimSusutKeterangan: klaimSusutKeterangan || null,
        ppnPersen,
        pphPersen,
        catatan: catatan || null,
        showPpnDisclaimer,
        namaPenandatangan: namaPenandatangan.trim() || "TARA MIFTAHUR",
        jabatanPenandatangan: jabatanPenandatangan.trim() || "Direktur",
        items: [], // No pengiriman items linked
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

      // Reset form
      setSelectedBuyerId("");
      setSelectedContractId("");
      setCustomQuantity(0);
      setKlaimMutuKg(0);
      setKlaimMutuKeterangan("");
      setKlaimSusutKg(0);
      setKlaimSusutKeterangan("");
      setCatatan("");
      setShowPpnDisclaimer(false);
      fetchNextInvoiceNumber();

      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal membuat invoice";
      console.error("Error creating invoice:", error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingBuyers) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Pilih Buyer */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
          <h3 className="font-semibold">Pilih Buyer</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="buyer">Buyer</Label>
            <SearchableSelect
              value={selectedBuyerId}
              onValueChange={setSelectedBuyerId}
              options={buyers.map((buyer) => ({
                value: buyer.id,
                label: `${buyer.code} - ${buyer.name}`,
                sublabel: buyer.address
              }))}
              placeholder="Pilih buyer..."
              searchPlaceholder="Cari buyer..."
            />
          </div>

          {selectedBuyer && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{selectedBuyer.name}</span>
              </div>
              <div className="text-muted-foreground space-y-1">
                <div>Kontak: {selectedBuyer.contactPerson}</div>
                <div>Telepon: {selectedBuyer.phone}</div>
                <div>
                  Status Pajak:{" "}
                  <Badge variant="outline">
                    {selectedBuyer.taxStatus === "NON_PKP"
                      ? "Non PKP"
                      : selectedBuyer.taxStatus === "PKP_11"
                        ? "PKP 11%"
                        : "PKP 1.1%"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Pilih Kontrak */}
      {selectedBuyerId && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="font-semibold">Pilih Kontrak</h3>
          </div>

          {loadingContracts ? (
            <div className="flex items-center gap-2 p-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Memuat kontrak...</span>
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
              Tidak ada kontrak yang tersedia untuk dibuatkan invoice (semua kontrak aktif untuk buyer ini sudah dibuatkan invoice atau belum ada kontrak).
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contract">Kontrak</Label>
                  <SearchableSelect
                    value={selectedContractId}
                    onValueChange={setSelectedContractId}
                    options={contracts.map((contract) => {
                      const remainingKg =
                        contract.remainingInvoiceQuantity !== undefined
                          ? contract.remainingInvoiceQuantity
                          : contract.contractItems.reduce((acc, item) => acc + item.quantity, 0);
                      const methodLabel = paymentMethodLabels[contract.paymentMethod] || contract.paymentMethod;
                      return {
                        value: contract.id,
                        label: contract.contractNumber,
                        sublabel: `Tgl: ${format(new Date(contract.contractDate), "d MMM yyyy")} | ${methodLabel} | Sisa: ${remainingKg.toLocaleString("id-ID")} kg`,
                      };
                    })}
                    placeholder="Pilih kontrak..."
                    searchPlaceholder="Cari nomor kontrak..."
                  />
                </div>

                {selectedContract && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{selectedContract.contractNumber}</span>
                    </div>
                    <div className="text-muted-foreground space-y-1">
                      <div>Tanggal: {format(new Date(selectedContract.contractDate), "d MMM yyyy")}</div>
                      <div>
                        Produk: {selectedContract.contractItems.map(item => item.material.name).join(", ")}
                      </div>
                      <div>
                        Harga: Rp {(selectedContract.contractItems[0]?.unitPrice || 0).toLocaleString("id-ID")}/kg
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <span className="font-medium text-foreground">Metode Pembayaran: </span>
                        <Badge variant={selectedContract.paymentMethod === "LUNAS_AWAL" ? "default" : "secondary"}>
                          {paymentMethodLabels[selectedContract.paymentMethod]}
                        </Badge>
                      </div>
                      <div className="text-xs text-blue-600">
                        {paymentMethodDescriptions[selectedContract.paymentMethod]}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contract Invoice Summary */}
              {selectedContractId && (
                <div className="mt-4">
                  {loadingContractSummary ? (
                    <div className="flex items-center gap-2 p-4 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memuat ringkasan invoice...</span>
                    </div>
                  ) : contractSummary ? (
                    <Card className={contractSummary.isFullyInvoiced ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Ringkasan Invoice Kontrak
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress Invoice</span>
                            <span className="font-medium">{contractSummary.invoicePercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={contractSummary.invoicePercentage} className="h-2" />
                        </div>

                        {/* Quantity Stats */}
                        <div className="grid grid-cols-3 gap-3 text-center text-xs">
                          <div className="p-2 bg-background rounded">
                            <p className="font-bold text-lg text-primary">
                              {contractSummary.totalContractQuantity.toLocaleString("id-ID")}
                            </p>
                            <p className="text-muted-foreground">Total Kontrak (kg)</p>
                          </div>
                          <div className="p-2 bg-background rounded">
                            <p className="font-bold text-lg text-green-600">
                              {contractSummary.totalInvoicedQuantity.toLocaleString("id-ID")}
                            </p>
                            <p className="text-muted-foreground">Sudah Invoice (kg)</p>
                          </div>
                          <div className="p-2 bg-background rounded">
                            <p className="font-bold text-lg text-orange-600">
                              {contractSummary.remainingQuantity.toLocaleString("id-ID")}
                            </p>
                            <p className="text-muted-foreground">Sisa (kg)</p>
                          </div>
                        </div>

                        {/* Status */}
                        {contractSummary.isFullyInvoiced ? (
                          <div className="p-2 bg-red-100 border border-red-300 rounded text-center text-sm text-red-700">
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            Kontrak sudah diinvoice penuh. Tidak dapat membuat invoice baru.
                          </div>
                        ) : (
                          <div className="p-2 bg-green-100 border border-green-300 rounded text-center text-sm text-green-700">
                            Dapat membuat invoice maksimal {contractSummary.remainingQuantity.toLocaleString("id-ID")} kg
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 3: Detail Invoice */}
      {selectedContractId && contractSummary?.canCreateInvoice && (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
              <h3 className="font-semibold">Detail Invoice</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="nomorInvoice">Nomor Invoice *</Label>
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
              <div className="space-y-2">
                <Label htmlFor="customQuantity">Kuantitas (kg) *</Label>
                <DecimalNumericInput
                  id="customQuantity"
                  placeholder="Masukkan kuantitas"
                  value={customQuantity}
                  onValueChange={setCustomQuantity}
                />
                <div className="text-xs space-y-1">
                  <p className="text-muted-foreground">
                    Sisa kuantitas kontrak: <span className="font-medium text-orange-600">{(contractSummary?.remainingQuantity || 0).toLocaleString("id-ID", { maximumFractionDigits: 2 })} kg</span>
                  </p>
                  {customQuantity > (contractSummary?.remainingQuantity || 0) && (
                    <p className="text-red-600">
                      ⚠️ Kuantitas melebihi sisa kontrak!
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 pt-2">
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
          </div>

          {/* Step 4: Klaim */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">4</div>
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Potongan Klaim
              </h3>
            </div>

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
          </div>

          {/* Step 5: Pajak */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">5</div>
              <h3 className="font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Pajak
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Textarea
              id="catatan"
              placeholder="Catatan tambahan untuk invoice (opsional)..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
            />
          </div>

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
                  <span>Kuantitas</span>
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
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={loading}>
                Batal
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={
                loading ||
                customQuantity <= 0 ||
                customQuantity > (contractSummary?.remainingQuantity || 0)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
        </>
      )}
    </div>
  );
}
