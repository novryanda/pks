"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ArrowLeft, Save, Search, User, Truck, Building2, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
};

type Supplier = {
  id: string;
  ownerName: string;
  type: string;
  address: string;
  companyName?: string | null;
  bankAccounts?: BankAccount[] | null;
};

type Transporter = {
  id: string;
  nomorKendaraan: string;
  namaSupir: string;
  telepon?: string | null;
};

type VendorBongkar = {
  id: string;
  code: string;
  name: string;
  tipe: "SPSI" | "SPLO";
  bankAccounts: BankAccount[] | null;
};

type PenerimaanData = {
  id: string;
  nomorPenerimaan: string;
  tanggalTerima: string;
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
  selectedVendorBongkarBank?: BankAccount | null;
  selectedBankAccount?: BankAccount | null;
  supplier: Supplier;
  material: {
    id: string;
    name: string;
    satuan: {
      symbol: string;
    };
  };
  transporter: Transporter;
  vendorBongkar?: VendorBongkar | null;
};

type Props = {
  data: PenerimaanData;
  onCancel: () => void;
  onSuccess: () => void;
  mode?: "full" | "timbangan";
};

type SupplierResponse = Supplier[];
type TransporterResponse = Transporter[];
type VendorResponse = VendorBongkar[];
type ApiErrorResponse = {
  error?: string;
};

export function PenerimaanEditForm({
  data,
  onCancel,
  onSuccess,
  mode = "full",
}: Props) {
  const [loading, setLoading] = useState(false);
  const isTimbanganMode = mode === "timbangan";

  // Lists for selection
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [vendors, setVendors] = useState<VendorBongkar[]>([]);

  // Search & Loading states
  const [searchSupplier, setSearchSupplier] = useState("");
  const [searchTransporter, setSearchTransporter] = useState("");
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Form state expanded
  const [formData, setFormData] = useState({
    supplierId: data.supplierId,
    transporterId: data.transporterId,
    lokasiKebun: data.lokasiKebun ?? "",
    jenisBuah: data.jenisBuah ?? "",
    beratBruto: data.beratBruto,
    beratTarra: data.beratTarra,
    potonganPersen: data.potonganPersen,
    hargaPerKg: data.hargaPerKg,
    ppnPersen: data.ppnPersen ?? 0,
    pphPersen: data.pphPersen ?? 0,
    upahBongkar: data.upahBongkar ?? 16,

    // Bongkar info
    vendorBongkarTipe: data.vendorBongkar?.tipe ?? "",
    vendorBongkarId: data.vendorBongkarId ?? "",
    selectedBankIndex: "-1", // To track bank account index for vendor bongkar
    selectedSupplierBankIndex: "-1", // To track bank account index for supplier
  });

  // Basic calculations with rounding
  const beratNetto1 = Math.round(formData.beratBruto - formData.beratTarra);
  const potonganKg = Math.round((beratNetto1 * formData.potonganPersen) / 100);
  const beratNetto2 = Math.round(beratNetto1 - potonganKg);
  const totalBayar = Math.round(beratNetto2 * formData.hargaPerKg);
  const nilaiPpn = Math.round((totalBayar * formData.ppnPersen) / 100);
  const nilaiPph = Math.round((totalBayar * formData.pphPersen) / 100);
  const jumlahBayarFinal = totalBayar + nilaiPpn - nilaiPph;
  const totalUpahBongkar = Math.round(beratNetto2 * formData.upahBongkar);

  // Fetch Suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const url = searchSupplier
          ? `/api/pt-pks/penerimaan-tbs/suppliers?search=${encodeURIComponent(searchSupplier)}`
          : "/api/pt-pks/penerimaan-tbs/suppliers";
        const res = await fetch(url);
        if (res.ok) {
          const result = (await res.json()) as SupplierResponse;
          setSuppliers(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    const timeoutId = setTimeout(() => {
      void fetchSuppliers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchSupplier]);

  // Fetch Transporters
  useEffect(() => {
    const fetchTransporters = async () => {
      try {
        const url = searchTransporter
          ? `/api/pt-pks/penerimaan-tbs/transporters?search=${encodeURIComponent(searchTransporter)}`
          : "/api/pt-pks/penerimaan-tbs/transporters";
        const res = await fetch(url);
        if (res.ok) {
          const result = (await res.json()) as TransporterResponse;
          setTransporters(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        console.error("Error fetching transporters:", error);
      }
    };

    const timeoutId = setTimeout(() => {
      void fetchTransporters();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTransporter]);

  // Fetch Vendors by Tipe
  useEffect(() => {
    if (!formData.vendorBongkarTipe) {
      setVendors([]);
      return;
    }

    const fetchVendors = async () => {
      setLoadingVendors(true);
      try {
        const res = await fetch(`/api/pt-pks/vendor-bongkar/by-tipe?tipe=${formData.vendorBongkarTipe}`);
        if (res.ok) {
          const result = (await res.json()) as VendorResponse;
          setVendors(result);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoadingVendors(false);
      }
    };

    void fetchVendors();
  }, [formData.vendorBongkarTipe]);

  // Handle bank selection for vendor bongkar
  useEffect(() => {
    if (formData.vendorBongkarId && vendors.length > 0) {
      const vendor = vendors.find(v => v.id === formData.vendorBongkarId);
      if (vendor?.bankAccounts && vendor.bankAccounts.length > 0) {
        // If it's the initial load from data
        if (data.selectedVendorBongkarBank && formData.selectedBankIndex === "-1") {
          const idx = vendor.bankAccounts.findIndex(
            (bank) => bank.accountNumber === data.selectedVendorBongkarBank?.accountNumber
          );
          setFormData(prev => ({ ...prev, selectedBankIndex: idx >= 0 ? idx.toString() : "0" }));
        } else if (formData.selectedBankIndex === "-1") {
          const defaultIdx = vendor.bankAccounts.findIndex(b => b.isDefault);
          setFormData(prev => ({ ...prev, selectedBankIndex: defaultIdx >= 0 ? defaultIdx.toString() : "0" }));
        }
      }
    }
  }, [
    data.selectedVendorBongkarBank,
    formData.selectedBankIndex,
    formData.vendorBongkarId,
    vendors,
  ]);

  const selectedSupplier =
    suppliers.find((supplier) => supplier.id === formData.supplierId) ||
    (data.supplier.id === formData.supplierId ? data.supplier : null);
  const selectedSupplierBanks = selectedSupplier?.bankAccounts ?? null;
  const supplierBankOptions = selectedSupplierBanks ?? [];
  const selectedSupplierBank =
    supplierBankOptions.length > 0 && formData.selectedSupplierBankIndex !== "-1"
      ? supplierBankOptions[parseInt(formData.selectedSupplierBankIndex)] || null
      : null;

  useEffect(() => {
    if (!formData.supplierId) {
      if (formData.selectedSupplierBankIndex !== "-1") {
        setFormData((prev) => ({ ...prev, selectedSupplierBankIndex: "-1" }));
      }
      return;
    }

    if (!selectedSupplierBanks || selectedSupplierBanks.length === 0) {
      if (formData.selectedSupplierBankIndex !== "-1") {
        setFormData((prev) => ({ ...prev, selectedSupplierBankIndex: "-1" }));
      }
      return;
    }

    if (formData.selectedSupplierBankIndex !== "-1") {
      return;
    }

    const existingIndex = data.selectedBankAccount
      ? selectedSupplierBanks.findIndex(
          (bank) =>
            bank.bankName === data.selectedBankAccount?.bankName &&
            bank.accountNumber === data.selectedBankAccount?.accountNumber &&
            bank.accountName === data.selectedBankAccount?.accountName
        )
      : -1;

    if (existingIndex >= 0) {
      setFormData((prev) => ({ ...prev, selectedSupplierBankIndex: existingIndex.toString() }));
      return;
    }

    const defaultIndex = selectedSupplierBanks.findIndex((bank) => bank.isDefault);
    setFormData((prev) => ({
      ...prev,
      selectedSupplierBankIndex: defaultIndex >= 0 ? defaultIndex.toString() : "0",
    }));
  }, [data.selectedBankAccount, formData.selectedSupplierBankIndex, formData.supplierId, selectedSupplierBanks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let selectedBankAccount = null;
      if (supplierBankOptions.length > 0 && formData.selectedSupplierBankIndex !== "-1") {
        const bank = supplierBankOptions[parseInt(formData.selectedSupplierBankIndex)];
        if (bank) {
          selectedBankAccount = {
            bankName: bank.bankName,
            accountNumber: bank.accountNumber,
            accountName: bank.accountName,
          };
        }
      }

      // Find selected bank object for bongkar
      let selectedVendorBongkarBank = null;
      if (formData.vendorBongkarId && formData.selectedBankIndex !== "-1") {
        const vendor = vendors.find(v => v.id === formData.vendorBongkarId);
        if (vendor?.bankAccounts) {
          const bank = vendor.bankAccounts[parseInt(formData.selectedBankIndex)];
          if (bank) {
            selectedVendorBongkarBank = {
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              accountName: bank.accountName,
            };
          }
        }
      }

      const updateData = {
        id: data.id,
        supplierId: formData.supplierId,
        transporterId: formData.transporterId,
        lokasiKebun: formData.lokasiKebun || null,
        jenisBuah: formData.jenisBuah || null,
        beratBruto: formData.beratBruto,
        beratTarra: formData.beratTarra,
        potonganPersen: formData.potonganPersen,
        ...(isTimbanganMode
          ? {}
          : {
              hargaPerKg: formData.hargaPerKg,
              ppnPersen: formData.ppnPersen,
              pphPersen: formData.pphPersen,
              upahBongkar: formData.upahBongkar,
              selectedBankAccount,
              vendorBongkarId: formData.vendorBongkarId || null,
              selectedVendorBongkarBank,
            }),
      };

      const res = await fetch("/api/pt-pks/penerimaan-tbs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        toast.success("Penerimaan TBS berhasil diperbarui", {
          description: `${data.nomorPenerimaan} untuk ${selectedSupplier?.ownerName ?? "supplier terpilih"}${
            !isTimbanganMode && selectedBankAccount
              ? `, rekening ${selectedBankAccount.bankName} - ${selectedBankAccount.accountNumber}`
              : ""
          }.`,
        });
        onSuccess();
      } else {
        const error = (await res.json()) as ApiErrorResponse;
        toast.error("Gagal memperbarui penerimaan TBS", {
          description: error.error ?? "Periksa kembali data yang diinput.",
        });
      }
    } catch (error) {
      console.error("Error updating penerimaan:", error);
      toast.error("Terjadi kesalahan saat memperbarui data", {
        description: "Silakan coba lagi beberapa saat lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Batal
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              {isTimbanganMode ? "Edit Hasil Timbangan" : "Edit Penerimaan TBS"} - {data.nomorPenerimaan}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pengirim & Produk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supplier Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Data Supplier *</Label>
                  {formData.supplierId && (
                    <Badge variant="outline" className="bg-primary/5 text-primary">Terpilih</Badge>
                  )}
                </div>

                {formData.supplierId ? (
                  <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">
                          {selectedSupplier?.ownerName || "Supplier Terpilih"}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">
                          {selectedSupplier?.companyName || "Personal"}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => setFormData({ ...formData, supplierId: "", selectedSupplierBankIndex: "-1" })}
                    >
                      Ganti
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari supplier..."
                        value={searchSupplier}
                        onChange={(e) => setSearchSupplier(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    <div className="border rounded-md max-h-48 overflow-y-auto bg-card">
                      {suppliers.map((s) => (
                        <div
                          key={s.id}
                          className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${formData.supplierId === s.id ? "bg-accent" : ""
                            }`}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              supplierId: s.id,
                              selectedSupplierBankIndex: "-1",
                            })
                          }
                        >
                          <div className="font-medium text-sm">{s.ownerName}</div>
                          <div className="text-xs text-muted-foreground">{s.companyName || s.type}</div>
                        </div>
                      ))}
                      {suppliers.length === 0 && searchSupplier && (
                        <div className="p-4 text-center text-sm text-muted-foreground">Supplier tidak ditemukan</div>
                      )}
                    </div>
                  </>
                )}

                {formData.supplierId && !isTimbanganMode && (
                  <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-700" />
                      <Label htmlFor="supplierBank" className="text-sm font-semibold text-blue-900">
                        Rekening Supplier
                      </Label>
                    </div>

                    {supplierBankOptions.length > 0 ? (
                      <>
                        <Select
                          value={formData.selectedSupplierBankIndex}
                          onValueChange={(value) => setFormData({ ...formData, selectedSupplierBankIndex: value })}
                        >
                          <SelectTrigger id="supplierBank">
                            <SelectValue placeholder="Pilih rekening supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {supplierBankOptions.map((bank, idx) => (
                              <SelectItem key={`${bank.bankName}-${bank.accountNumber}-${idx}`} value={idx.toString()}>
                                {bank.bankName} - {bank.accountNumber} (a.n. {bank.accountName})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedSupplierBank && (
                          <div className="rounded-lg border border-blue-200 bg-white p-3">
                            <div className="flex items-start gap-3">
                              <CreditCard className="mt-0.5 h-5 w-5 text-blue-600" />
                              <div className="text-sm">
                                <div className="font-semibold text-blue-900">{selectedSupplierBank.bankName}</div>
                                <div className="text-blue-700">No. Rekening: {selectedSupplierBank.accountNumber}</div>
                                <div className="text-blue-700">A/N: {selectedSupplierBank.accountName}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                        Supplier ini belum memiliki rekening bank terdaftar.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Transporter Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Data Kendaraan & Supir *</Label>
                  {formData.transporterId && (
                    <Badge variant="outline" className="bg-primary/5 text-primary">Terpilih</Badge>
                  )}
                </div>

                {formData.transporterId ? (
                  <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">
                          {transporters.find(t => t.id === formData.transporterId)?.nomorKendaraan ||
                            (data.transporter.id === formData.transporterId ? data.transporter.nomorKendaraan : "Kendaraan Terpilih")}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">
                          Supir: {transporters.find(t => t.id === formData.transporterId)?.namaSupir ||
                            (data.transporter.id === formData.transporterId ? data.transporter.namaSupir : "N/A")}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => setFormData({ ...formData, transporterId: "" })}
                    >
                      Ganti
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari plat atau supir..."
                        value={searchTransporter}
                        onChange={(e) => setSearchTransporter(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    <div className="border rounded-md max-h-48 overflow-y-auto bg-card">
                      {transporters.map((t) => (
                        <div
                          key={t.id}
                          className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${formData.transporterId === t.id ? "bg-accent" : ""
                            }`}
                          onClick={() => setFormData({ ...formData, transporterId: t.id })}
                        >
                          <div className="font-medium text-sm">{t.nomorKendaraan}</div>
                          <div className="text-xs text-muted-foreground">Supir: {t.namaSupir}</div>
                        </div>
                      ))}
                      {transporters.length === 0 && searchTransporter && (
                        <div className="p-4 text-center text-sm text-muted-foreground">Transporter tidak ditemukan</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Material:</Label>
                <span className="font-medium text-sm">{data.material.name} ({data.material.satuan.symbol})</span>
              </div>
            </div>

            {/* Informasi Kebun */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informasi Kebun</h3>

              <div className="space-y-2">
                <Label htmlFor="lokasiKebun">Lokasi Kebun (Opsional)</Label>
                <Input
                  id="lokasiKebun"
                  placeholder="Contoh: Kebun Blok A, Desa Suka Maju"
                  value={formData.lokasiKebun}
                  onChange={(e) =>
                    setFormData({ ...formData, lokasiKebun: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis Buah (Opsional)</Label>
                <RadioGroup
                  value={formData.jenisBuah}
                  onValueChange={(value) =>
                    setFormData({ ...formData, jenisBuah: value })
                  }
                >
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="TBS-BB" id="edit-tbs-bb" />
                      <Label htmlFor="edit-tbs-bb" className="font-normal cursor-pointer flex-1">
                        <div className="font-medium">Buah Besar</div>
                        <div className="text-xs text-muted-foreground">TBS-BB</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="TBS-BS" id="edit-tbs-bs" />
                      <Label htmlFor="edit-tbs-bs" className="font-normal cursor-pointer flex-1">
                        <div className="font-medium">Buah Biasa</div>
                        <div className="text-xs text-muted-foreground">TBS-BS</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="TBS-BK" id="edit-tbs-bk" />
                      <Label htmlFor="edit-tbs-bk" className="font-normal cursor-pointer flex-1">
                        <div className="font-medium">Buah Kecil</div>
                        <div className="text-xs text-muted-foreground">TBS-BK</div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Informasi Bongkar */}
            {!isTimbanganMode && (
              <div className="space-y-4 p-4 border rounded-lg bg-orange-50/30 border-orange-200">
                <h3 className="font-semibold text-lg text-orange-900">Informasi Bongkar</h3>

                <div className="space-y-2">
                  <Label>Tipe Bongkar</Label>
                  <RadioGroup
                    value={formData.vendorBongkarTipe}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        vendorBongkarTipe: value as "SPSI" | "SPLO",
                        vendorBongkarId: "",
                        selectedBankIndex: "0"
                      })
                    }
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="SPSI" id="edit-spsi" />
                        <Label htmlFor="edit-spsi" className="cursor-pointer">SPSI</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="SPLO" id="edit-splo" />
                        <Label htmlFor="edit-splo" className="cursor-pointer">SPLO</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {formData.vendorBongkarTipe && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="vendorBongkar">Vendor Bongkar *</Label>
                      <Select
                        value={formData.vendorBongkarId}
                        onValueChange={(value) => setFormData({ ...formData, vendorBongkarId: value, selectedBankIndex: "0" })}
                      >
                        <SelectTrigger id="vendorBongkar">
                          <SelectValue placeholder={loadingVendors ? "Memuat vendor..." : "Pilih vendor bongkar"} />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name} ({v.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.vendorBongkarId && (
                      <div className="space-y-2">
                        <Label htmlFor="bankBongkar">Rekening Bank Vendor *</Label>
                        <Select
                          value={formData.selectedBankIndex}
                          onValueChange={(value) => setFormData({ ...formData, selectedBankIndex: value })}
                        >
                          <SelectTrigger id="bankBongkar">
                            <SelectValue placeholder="Pilih rekening bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              const vendor = vendors.find(v => v.id === formData.vendorBongkarId);
                              return vendor?.bankAccounts?.map((bank, idx) => (
                                <SelectItem key={idx} value={idx.toString()}>
                                  {bank.bankName} - {bank.accountNumber} (a.n. {bank.accountName})
                                </SelectItem>
                              )) || <SelectItem value="0" disabled>Tidak ada rekening tersedia</SelectItem>;
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Data Timbangan */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Data Timbangan</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="beratBruto">Berat Bruto (kg) *</Label>
                  <Input
                    id="beratBruto"
                    type="number"
                    step="0.01"
                    required
                    value={formData.beratBruto}
                    onChange={(e) =>
                      setFormData({ ...formData, beratBruto: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beratTarra">Berat Tarra (kg) *</Label>
                  <Input
                    id="beratTarra"
                    type="number"
                    step="0.01"
                    required
                    value={formData.beratTarra}
                    onChange={(e) =>
                      setFormData({ ...formData, beratTarra: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="potonganPersen">Potongan (%) *</Label>
                  <Input
                    id="potonganPersen"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.potonganPersen}
                    onChange={(e) =>
                      setFormData({ ...formData, potonganPersen: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                {!isTimbanganMode && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hargaPerKg">Harga per Kg (Rp) *</Label>
                      <Input
                        id="hargaPerKg"
                        type="number"
                        step="1"
                        min="0"
                        required
                        value={formData.hargaPerKg}
                        onChange={(e) =>
                          setFormData({ ...formData, hargaPerKg: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upahBongkar">Upah Bongkar per Kg (Rp)</Label>
                      <Input
                        id="upahBongkar"
                        type="number"
                        step="1"
                        min="0"
                        value={formData.upahBongkar}
                        onChange={(e) =>
                          setFormData({ ...formData, upahBongkar: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ppnPersen">PPN (%)</Label>
                      <Input
                        id="ppnPersen"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.ppnPersen}
                        onChange={(e) =>
                          setFormData({ ...formData, ppnPersen: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pphPersen">PPH (%)</Label>
                      <Input
                        id="pphPersen"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.pphPersen}
                        onChange={(e) =>
                          setFormData({ ...formData, pphPersen: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Kalkulasi Otomatis */}
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Kalkulasi Otomatis</h3>
              <div className={`grid grid-cols-2 gap-4 ${isTimbanganMode ? "md:grid-cols-3" : "md:grid-cols-7"}`}>
                <div>
                  <div className="text-sm text-muted-foreground">Berat Netto 1</div>
                  <div className="font-bold text-blue-600">
                    {beratNetto1.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                  <div className="text-xs text-muted-foreground">Bruto - Tarra</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Potongan (kg)</div>
                  <div className="font-bold text-orange-600">
                    {potonganKg.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                  <div className="text-xs text-muted-foreground">{formData.potonganPersen}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Berat Netto 2</div>
                  <div className="font-bold text-green-600 text-lg">
                    {beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                  <div className="text-xs text-muted-foreground">Netto 1 - Potongan</div>
                </div>
                {!isTimbanganMode && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Bayar</div>
                      <div className="font-bold text-green-700 text-lg">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(totalBayar)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Nilai PPN</div>
                      <div className="font-bold text-emerald-600 text-lg">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(nilaiPpn)}
                      </div>
                      <div className="text-xs text-muted-foreground">{formData.ppnPersen}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Nilai PPH</div>
                      <div className="font-bold text-red-600 text-lg">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(nilaiPph)}
                      </div>
                      <div className="text-xs text-muted-foreground">{formData.pphPersen}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Jumlah Dibayar</div>
                      <div className="font-bold text-emerald-700 text-lg">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(jumlahBayarFinal)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Upah Bongkar</div>
                      <div className="font-bold text-orange-600 text-lg">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(totalUpahBongkar)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
