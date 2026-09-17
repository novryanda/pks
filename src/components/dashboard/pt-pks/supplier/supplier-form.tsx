"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

// Dynamic import untuk Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

// Import useMapEvents sebagai react-leaflet hook
import { useMapEvents as useMapEventsOriginal } from "react-leaflet";

type GardenProfile = {
  tahunTanam: number;
  luasKebun: number;
  estimasiSupplyTBS: number;
};

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
};

type FormData = {
  type: string;
  ownerName: string;
  address: string;
  companyPhone: string;
  personalPhone: string;
  companyName: string;
  rampPeronAddress: string;
  gardenProfiles: GardenProfile[];
  longitude: number;
  latitude: number;
  managementType: string;
  jenisBibit: string;
  certificationISPO: boolean;
  certificationRSPO: boolean;
  aktePendirian: string;
  aktePerubahan: string;
  nib: string;
  siup: string;
  npwp: string;
  salesChannel: string;
  salesChannelDetails: string;
  transportation: string;
  transportationUnits: number;
  bankAccounts: BankAccount[];
  taxStatus: string;
};

// Component untuk map click handler
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEventsOriginal({
    click(e: LeafletMouseEvent) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function SupplierForm({
  supplierId,
  onSuccess,
}: {
  supplierId?: string;
  onSuccess?: () => void;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    type: "",
    ownerName: "",
    address: "",
    companyPhone: "",
    personalPhone: "",
    companyName: "",
    rampPeronAddress: "",
    gardenProfiles: [{ tahunTanam: new Date().getFullYear(), luasKebun: 0, estimasiSupplyTBS: 0 }],
    longitude: 0,
    latitude: 0,
    managementType: "",
    jenisBibit: "",
    certificationISPO: false,
    certificationRSPO: false,
    aktePendirian: "",
    aktePerubahan: "",
    nib: "",
    siup: "",
    npwp: "",
    salesChannel: "",
    salesChannelDetails: "",
    transportation: "",
    transportationUnits: 0,
    bankAccounts: [],
    taxStatus: "",
  });

  useState(() => {
    setIsMounted(true);
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch supplier data if editing
  useEffect(() => {
    if (supplierId) {
      fetchSupplierData();
    }
  }, [supplierId]);

  const fetchSupplierData = async () => {
    if (!supplierId) return;

    try {
      setLoadingData(true);
      const response = await fetch(`/api/pt-pks/supplier/${supplierId}`);
      const data = await response.json();

      if (response.ok) {
        // Parse bankAccounts from JSON
        const bankAccounts = data.supplier.bankAccounts as BankAccount[] | null;
        
        setFormData({
          type: data.supplier.type,
          ownerName: data.supplier.ownerName,
          address: data.supplier.address,
          companyPhone: data.supplier.companyPhone || "",
          personalPhone: data.supplier.personalPhone,
          companyName: data.supplier.companyName || "",
          rampPeronAddress: data.supplier.rampPeronAddress || "",
          gardenProfiles: data.supplier.gardenProfiles,
          longitude: data.supplier.longitude,
          latitude: data.supplier.latitude,
          managementType: data.supplier.swadaya ? "swadaya" : data.supplier.kelompok ? "kelompok" : data.supplier.perusahaan ? "perusahaan" : "",
          jenisBibit: data.supplier.jenisBibit || "",
          certificationISPO: data.supplier.certificationISPO,
          certificationRSPO: data.supplier.certificationRSPO,
          aktePendirian: data.supplier.aktePendirian || "",
          aktePerubahan: data.supplier.aktePerubahan || "",
          nib: data.supplier.nib || "",
          siup: data.supplier.siup || "",
          npwp: data.supplier.npwp || "",
          salesChannel: data.supplier.salesChannel || "",
          salesChannelDetails: data.supplier.salesChannelDetails || "",
          transportation: data.supplier.transportation || "",
          transportationUnits: data.supplier.transportationUnits || 0,
          bankAccounts: bankAccounts || [],
          taxStatus: data.supplier.taxStatus || "",
        });
      }
    } catch (error) {
      console.error("Error fetching supplier data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddGardenProfile = () => {
    setFormData((prev) => ({
      ...prev,
      gardenProfiles: [
        ...prev.gardenProfiles,
        { tahunTanam: new Date().getFullYear(), luasKebun: 0, estimasiSupplyTBS: 0 },
      ],
    }));
  };

  const handleRemoveGardenProfile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gardenProfiles: prev.gardenProfiles.filter((_, i) => i !== index),
    }));
  };

  const handleGardenProfileChange = (
    index: number,
    field: keyof GardenProfile,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      gardenProfiles: prev.gardenProfiles.map((profile, i) =>
        i === index ? { ...profile, [field]: value } : profile
      ),
    }));
  };

  // Bank Account handlers
  const handleAddBankAccount = () => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: [
        ...prev.bankAccounts,
        { bankName: "", accountNumber: "", accountName: "", isDefault: prev.bankAccounts.length === 0 },
      ],
    }));
  };

  const handleRemoveBankAccount = (index: number) => {
    setFormData((prev) => {
      const newBankAccounts = prev.bankAccounts.filter((_, i) => i !== index);
      // If we removed the default one, make the first one default
      if (newBankAccounts.length > 0 && !newBankAccounts.some(b => b.isDefault)) {
        const firstAccount = newBankAccounts[0];
        if (firstAccount) {
          firstAccount.isDefault = true;
        }
      }
      return {
        ...prev,
        bankAccounts: newBankAccounts,
      };
    });
  };

  const handleBankAccountChange = (
    index: number,
    field: keyof BankAccount,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((account, i) => {
        if (i === index) {
          // If setting this as default, unset others
          if (field === "isDefault" && value === true) {
            return { ...account, isDefault: true };
          }
          return { ...account, [field]: value };
        }
        // If another account is being set as default, unset this one
        if (field === "isDefault" && value === true) {
          return { ...account, isDefault: false };
        }
        return account;
      }),
    }));
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = supplierId
        ? `/api/pt-pks/supplier/${supplierId}`
        : "/api/pt-pks/supplier";
      const method = supplierId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          supplierId
            ? "Supplier berhasil diupdate!"
            : "Supplier berhasil ditambahkan!"
        );
        // Reset form only if creating new
        if (!supplierId) {
          setFormData({
            type: "",
            ownerName: "",
            address: "",
            companyPhone: "",
            personalPhone: "",
            companyName: "",
            rampPeronAddress: "",
            gardenProfiles: [
              {
                tahunTanam: new Date().getFullYear(),
                luasKebun: 0,
                estimasiSupplyTBS: 0,
              },
            ],
            longitude: 0,
            latitude: 0,
            managementType: "",
            jenisBibit: "",
            certificationISPO: false,
            certificationRSPO: false,
            aktePendirian: "",
            aktePerubahan: "",
            nib: "",
            siup: "",
            npwp: "",
            salesChannel: "",
            salesChannelDetails: "",
            transportation: "",
            transportationUnits: 0,
            bankAccounts: [],
            taxStatus: "",
          });
        }
        onSuccess?.();
      } else {
        alert(data.error || "Gagal menambahkan supplier");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Gagal menambahkan supplier");
    } finally {
      setLoading(false);
    }
  };

  // Fix Leaflet icon
  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      const L = require("leaflet");
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    }
  }, [isMounted]);

  const defaultCenter: LatLngExpression = [-2.5489, 118.0149];
  const markerPosition: LatLngExpression | null =
    formData.latitude !== 0 && formData.longitude !== 0
      ? [formData.latitude, formData.longitude]
      : null;

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading data supplier...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section: Identitas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Identitas Supplier</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipe Supplier *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RAMP_PERON">Ramp/Peron</SelectItem>
                <SelectItem value="KUD">KUD</SelectItem>
                <SelectItem value="KELOMPOK_TANI">Kelompok Tani</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Nama Pemilik *</Label>
            <Input
              id="ownerName"
              value={formData.ownerName}
              onChange={(e) => handleInputChange("ownerName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Alamat *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyPhone">Nomor HP/Telp Perusahaan</Label>
            <Input
              id="companyPhone"
              value={formData.companyPhone}
              onChange={(e) => handleInputChange("companyPhone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personalPhone">No HP/Telp Pribadi *</Label>
            <Input
              id="personalPhone"
              value={formData.personalPhone}
              onChange={(e) => handleInputChange("personalPhone", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Nama Perusahaan</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rampPeronAddress">Alamat Ramp/Peron</Label>
            <Input
              id="rampPeronAddress"
              value={formData.rampPeronAddress}
              onChange={(e) =>
                handleInputChange("rampPeronAddress", e.target.value)
              }
            />
          </div>
        </div>
      </div>

      {/* Section: Profil Kebun */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Profil Kebun</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddGardenProfile}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Profil
          </Button>
        </div>

        {formData.gardenProfiles.map((profile, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Profil Kebun {index + 1}</h4>
              {formData.gardenProfiles.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveGardenProfile(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tahun Tanam *</Label>
                <Input
                  type="number"
                  value={profile.tahunTanam}
                  onChange={(e) =>
                    handleGardenProfileChange(
                      index,
                      "tahunTanam",
                      parseInt(e.target.value) || 0
                    )
                  }
                  min={1900}
                  max={new Date().getFullYear()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Luas Kebun (Ha) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={profile.luasKebun}
                  onChange={(e) =>
                    handleGardenProfileChange(
                      index,
                      "luasKebun",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min={0}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Estimasi Supply TBS (Ton) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={profile.estimasiSupplyTBS}
                  onChange={(e) =>
                    handleGardenProfileChange(
                      index,
                      "estimasiSupplyTBS",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min={0}
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section: Lokasi */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Lokasi Kebun</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Lintang (Latitude) *</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={formData.latitude}
              onChange={(e) =>
                handleInputChange("latitude", parseFloat(e.target.value) || 0)
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Bujur (Longitude) *</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={formData.longitude}
              onChange={(e) =>
                handleInputChange("longitude", parseFloat(e.target.value) || 0)
              }
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Pilih Lokasi di Peta (Klik pada peta)</Label>
          {isMounted && (
            <div className="h-[400px] rounded-md border overflow-hidden">
              <MapContainer
                center={markerPosition || defaultCenter}
                zoom={5}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                {markerPosition && <Marker position={markerPosition} />}
              </MapContainer>
            </div>
          )}
        </div>
      </div>

      {/* Section: Tipe Pengelolaan Kebun */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tipe Pengelolaan Kebun</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="managementType">Jenis Pengelolaan *</Label>
            <Select
              value={formData.managementType}
              onValueChange={(value) =>
                handleInputChange("managementType", value)
              }
            >
              <SelectTrigger id="managementType">
                <SelectValue placeholder="Pilih jenis pengelolaan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="swadaya">Swadaya</SelectItem>
                <SelectItem value="kelompok">Kelompok</SelectItem>
                <SelectItem value="perusahaan">Perusahaan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jenisBibit">Jenis Bibit</Label>
            <Input
              id="jenisBibit"
              value={formData.jenisBibit}
              onChange={(e) => handleInputChange("jenisBibit", e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Sertifikasi Kebun</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certificationISPO"
                  checked={formData.certificationISPO}
                  onCheckedChange={(checked) =>
                    handleInputChange("certificationISPO", checked)
                  }
                />
                <Label htmlFor="certificationISPO" className="cursor-pointer">
                  ISPO
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certificationRSPO"
                  checked={formData.certificationRSPO}
                  onCheckedChange={(checked) =>
                    handleInputChange("certificationRSPO", checked)
                  }
                />
                <Label htmlFor="certificationRSPO" className="cursor-pointer">
                  RSPO
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Profil Izin Usaha */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Profil Izin Usaha</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aktePendirian">Akte Pendirian</Label>
            <Input
              id="aktePendirian"
              value={formData.aktePendirian}
              onChange={(e) =>
                handleInputChange("aktePendirian", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aktePerubahan">Akte Perubahan</Label>
            <Input
              id="aktePerubahan"
              value={formData.aktePerubahan}
              onChange={(e) =>
                handleInputChange("aktePerubahan", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nib">NIB</Label>
            <Input
              id="nib"
              value={formData.nib}
              onChange={(e) => handleInputChange("nib", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siup">SIUP</Label>
            <Input
              id="siup"
              value={formData.siup}
              onChange={(e) => handleInputChange("siup", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="npwp">NPWP</Label>
            <Input
              id="npwp"
              value={formData.npwp}
              onChange={(e) => handleInputChange("npwp", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section: Penjualan TBS */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Penjualan TBS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salesChannel">Saluran Penjualan</Label>
            <Select
              value={formData.salesChannel}
              onValueChange={(value) => handleInputChange("salesChannel", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih saluran penjualan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LANGSUNG_PKS">Langsung PKS</SelectItem>
                <SelectItem value="AGEN">Agen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salesChannelDetails">Keterangan Saluran Penjualan</Label>
            <Input
              id="salesChannelDetails"
              placeholder="Contoh: Nama agen, lokasi penjualan, dll"
              value={formData.salesChannelDetails}
              onChange={(e) =>
                handleInputChange("salesChannelDetails", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transportation">Transportasi</Label>
            <Select
              value={formData.transportation}
              onValueChange={(value) => handleInputChange("transportation", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih transportasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MILIK_SENDIRI">Milik Sendiri</SelectItem>
                <SelectItem value="JASA_PIHAK_KE_3">Jasa Pihak Ke-3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transportationUnits">Jumlah Unit Transportasi</Label>
            <Input
              id="transportationUnits"
              type="number"
              min={0}
              placeholder="Masukkan jumlah unit"
              value={formData.transportationUnits || ""}
              onChange={(e) =>
                handleInputChange(
                  "transportationUnits",
                  parseInt(e.target.value) || 0
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Section: Informasi Rekening & Pajak */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informasi Rekening & Pajak</h3>
        
        {/* Bank Accounts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Rekening Bank</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBankAccount}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Rekening
            </Button>
          </div>
          
          {formData.bankAccounts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
              Belum ada rekening bank. Klik "Tambah Rekening" untuk menambahkan.
            </p>
          )}
          
          {formData.bankAccounts.map((account, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Rekening #{index + 1}</span>
                  {account.isDefault && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!account.isDefault && formData.bankAccounts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBankAccountChange(index, "isDefault", true)}
                    >
                      Jadikan Default
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveBankAccount(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nama Bank *</Label>
                  <Input
                    placeholder="Contoh: BRI, BCA, Mandiri"
                    value={account.bankName}
                    onChange={(e) => handleBankAccountChange(index, "bankName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Rekening *</Label>
                  <Input
                    placeholder="Masukkan nomor rekening"
                    value={account.accountNumber}
                    onChange={(e) => handleBankAccountChange(index, "accountNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Atas Nama *</Label>
                  <Input
                    placeholder="Nama pemilik rekening"
                    value={account.accountName}
                    onChange={(e) => handleBankAccountChange(index, "accountName", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tax Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxStatus">Status Pajak</Label>
            <Select
              value={formData.taxStatus}
              onValueChange={(value) => handleInputChange("taxStatus", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status pajak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NON_PKP">Non PKP</SelectItem>
                <SelectItem value="PKP_11">PKP 11%</SelectItem>
                <SelectItem value="PKP_1_1">PKP 1.1%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={loading || loadingData}>
          {loading
            ? "Menyimpan..."
            : supplierId
              ? "Update Supplier"
              : "Simpan Supplier"}
        </Button>
      </div>
    </form>
  );
}
