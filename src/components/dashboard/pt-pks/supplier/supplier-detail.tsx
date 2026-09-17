"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { X, MapPin, Phone, Building2, FileText, Truck, CreditCard } from "lucide-react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
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

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
};

type Supplier = {
  id: string;
  type: string;
  ownerName: string;
  address: string;
  companyPhone?: string;
  personalPhone: string;
  companyName?: string;
  rampPeronAddress?: string;
  gardenProfiles: Array<{
    tahunTanam: number;
    luasKebun: number;
    estimasiSupplyTBS: number;
  }>;
  longitude: number;
  latitude: number;
  swadaya: boolean;
  kelompok: boolean;
  perusahaan: boolean;
  jenisBibit?: string;
  certificationISPO: boolean;
  certificationRSPO: boolean;
  aktePendirian?: string;
  aktePerubahan?: string;
  nib?: string;
  siup?: string;
  npwp?: string;
  salesChannel?: string;
  salesChannelDetails?: string;
  transportation?: string;
  transportationUnits?: number;
  bankAccounts?: BankAccount[] | null;
  taxStatus?: string;
  createdAt: string;
  updatedAt: string;
};

const supplierTypeLabels: Record<string, string> = {
  RAMP_PERON: "Ramp/Peron",
  KUD: "KUD",
  KELOMPOK_TANI: "Kelompok Tani",
};

const salesChannelLabels: Record<string, string> = {
  LANGSUNG_PKS: "Langsung PKS",
  AGEN: "Agen",
};

const transportationLabels: Record<string, string> = {
  MILIK_SENDIRI: "Milik Sendiri",
  JASA_PIHAK_KE_3: "Jasa Pihak Ke-3",
};

const taxStatusLabels: Record<string, string> = {
  NON_PKP: "Non PKP",
  PKP_11: "PKP 11%",
  PKP_1_1: "PKP 1.1%",
};

export function SupplierDetail({
  supplierId,
  onClose,
}: {
  supplierId: string;
  onClose: () => void;
}) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchSupplier();
  }, [supplierId]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pt-pks/supplier/${supplierId}`);
      const data = await response.json();

      if (response.ok) {
        setSupplier(data.supplier);
      } else {
        console.error("Error fetching supplier:", data.error);
      }
    } catch (error) {
      console.error("Error fetching supplier:", error);
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Supplier tidak ditemukan</p>
      </div>
    );
  }

  const markerPosition: LatLngExpression = [supplier.latitude, supplier.longitude];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{supplier.ownerName}</h2>
          <p className="text-muted-foreground">
            {supplierTypeLabels[supplier.type] || supplier.type}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Identitas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Identitas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nama Pemilik</p>
              <p className="font-medium">{supplier.ownerName}</p>
            </div>
            {supplier.companyName && (
              <div>
                <p className="text-sm text-muted-foreground">Nama Perusahaan</p>
                <p className="font-medium">{supplier.companyName}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Alamat</p>
              <p className="font-medium">{supplier.address}</p>
            </div>
            {supplier.rampPeronAddress && (
              <div>
                <p className="text-sm text-muted-foreground">Alamat Ramp/Peron</p>
                <p className="font-medium">{supplier.rampPeronAddress}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">No. HP/Telp Pribadi</p>
              <p className="font-medium">{supplier.personalPhone}</p>
            </div>
            {supplier.companyPhone && (
              <div>
                <p className="text-sm text-muted-foreground">No. HP/Telp Perusahaan</p>
                <p className="font-medium">{supplier.companyPhone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profil Kebun */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Kebun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {supplier.gardenProfiles.map((profile, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 grid grid-cols-3 gap-4"
            >
              <div>
                <p className="text-sm text-muted-foreground">Tahun Tanam</p>
                <p className="font-medium">{profile.tahunTanam}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Luas Kebun</p>
                <p className="font-medium">{profile.luasKebun} Ha</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimasi Supply TBS</p>
                <p className="font-medium">{profile.estimasiSupplyTBS} Ton</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Lokasi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lokasi Kebun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Latitude</p>
              <p className="font-medium">{supplier.latitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Longitude</p>
              <p className="font-medium">{supplier.longitude.toFixed(6)}</p>
            </div>
          </div>
          {isMounted && (
            <div className="h-[300px] rounded-md border overflow-hidden">
              <MapContainer
                center={markerPosition}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={markerPosition} />
              </MapContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipe Pengelolaan */}
      <Card>
        <CardHeader>
          <CardTitle>Tipe Pengelolaan Kebun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Jenis Pengelolaan</p>
            <div className="flex gap-2">
              {supplier.swadaya && <Badge>Swadaya</Badge>}
              {supplier.kelompok && <Badge>Kelompok</Badge>}
              {supplier.perusahaan && <Badge>Perusahaan</Badge>}
            </div>
          </div>
          {supplier.jenisBibit && (
            <div>
              <p className="text-sm text-muted-foreground">Jenis Bibit</p>
              <p className="font-medium">{supplier.jenisBibit}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Sertifikasi</p>
            <div className="flex gap-2">
              {supplier.certificationISPO && <Badge variant="outline">ISPO</Badge>}
              {supplier.certificationRSPO && <Badge variant="outline">RSPO</Badge>}
              {!supplier.certificationISPO && !supplier.certificationRSPO && (
                <span className="text-sm text-muted-foreground">Tidak ada sertifikasi</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profil Izin Usaha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Profil Izin Usaha
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {supplier.aktePendirian && (
            <div>
              <p className="text-sm text-muted-foreground">Akte Pendirian</p>
              <p className="font-medium">{supplier.aktePendirian}</p>
            </div>
          )}
          {supplier.aktePerubahan && (
            <div>
              <p className="text-sm text-muted-foreground">Akte Perubahan</p>
              <p className="font-medium">{supplier.aktePerubahan}</p>
            </div>
          )}
          {supplier.nib && (
            <div>
              <p className="text-sm text-muted-foreground">NIB</p>
              <p className="font-medium">{supplier.nib}</p>
            </div>
          )}
          {supplier.siup && (
            <div>
              <p className="text-sm text-muted-foreground">SIUP</p>
              <p className="font-medium">{supplier.siup}</p>
            </div>
          )}
          {supplier.npwp && (
            <div>
              <p className="text-sm text-muted-foreground">NPWP</p>
              <p className="font-medium">{supplier.npwp}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Penjualan & Transportasi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Penjualan & Transportasi
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {supplier.salesChannel && (
            <div>
              <p className="text-sm text-muted-foreground">Saluran Penjualan</p>
              <p className="font-medium">
                {salesChannelLabels[supplier.salesChannel] || supplier.salesChannel}
              </p>
            </div>
          )}
          {supplier.salesChannelDetails && (
            <div>
              <p className="text-sm text-muted-foreground">Keterangan Penjualan</p>
              <p className="font-medium">{supplier.salesChannelDetails}</p>
            </div>
          )}
          {supplier.transportation && (
            <div>
              <p className="text-sm text-muted-foreground">Transportasi</p>
              <p className="font-medium">
                {transportationLabels[supplier.transportation] || supplier.transportation}
              </p>
            </div>
          )}
          {supplier.transportationUnits && (
            <div>
              <p className="text-sm text-muted-foreground">Jumlah Unit</p>
              <p className="font-medium">{supplier.transportationUnits} Unit</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rekening & Pajak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Rekening & Pajak
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bank Accounts */}
          {supplier.bankAccounts && supplier.bankAccounts.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Rekening Bank</p>
              {supplier.bankAccounts.map((account, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{account.bankName}</span>
                    {account.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nomor Rekening</p>
                      <p className="font-mono">{account.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Atas Nama</p>
                      <p>{account.accountName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada rekening bank terdaftar</p>
          )}
          
          {/* Tax Status */}
          {supplier.taxStatus && (
            <div>
              <p className="text-sm text-muted-foreground">Status Pajak</p>
              <p className="font-medium">
                {taxStatusLabels[supplier.taxStatus] || supplier.taxStatus}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
