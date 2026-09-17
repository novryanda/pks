"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Truck, Scale, DollarSign, User, MapPin, Apple, FileText } from "lucide-react";
import { PenerimaanEditForm } from "./penerimaan-edit-form";

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
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
  supplier: {
    id: string;
    ownerName: string;
    type: string;
    address: string;
    companyName?: string | null;
    bankAccounts?: BankAccount[] | null;
    bankName?: string | null;
    accountNumber?: string | null;
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
    telepon?: string | null;
  };
  vendorBongkar?: {
    id: string;
    name: string;
    code: string;
    tipe: "SPSI" | "SPLO";
    bankAccounts: BankAccount[] | null;
  } | null;
};

type Props = {
  data: PenerimaanData;
  onBack: () => void;
  onRefresh: () => void;
};

export function PenerimaanDetailView({ data, onBack, onRefresh }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const selectedSupplierBank =
    data.selectedBankAccount ||
    data.supplier.bankAccounts?.find((bank) => bank.isDefault) ||
    data.supplier.bankAccounts?.[0] ||
    null;

  if (showEdit) {
    return (
      <PenerimaanEditForm
        data={data}
        onCancel={() => setShowEdit(false)}
        onSuccess={() => {
          setShowEdit(false);
          onRefresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/api/pt-pks/pembayaran-supplier/export-pdf?id=${data.id}`, "_blank")}>
            <FileText className="mr-2 h-4 w-4" />
            Cetak PDF
          </Button>
          <Button onClick={() => setShowEdit(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Data
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detail Penerimaan TBS</CardTitle>
            <Badge
              variant={
                data.status === "COMPLETED"
                  ? "default"
                  : data.status === "DRAFT"
                    ? "secondary"
                    : "destructive"
              }
              className="text-sm"
            >
              {data.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nomor dan Tanggal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">No. Penerimaan</div>
              <div className="font-mono font-bold text-lg">{data.nomorPenerimaan}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tanggal & Jam Terima</div>
              <div className="font-medium">
                {new Date(data.tanggalTerima).toLocaleString("id-ID", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Supplier Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Informasi Supplier</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Nama Pemilik</div>
                <div className="font-semibold">{data.supplier.ownerName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tipe Supplier</div>
                <div className="font-medium">{data.supplier.type}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bank</div>
                <div className="font-medium">{selectedSupplierBank?.bankName || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">No. Rekening</div>
                <div className="font-mono font-medium">{selectedSupplierBank?.accountNumber || "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Atas Nama</div>
                <div className="font-medium">{selectedSupplierBank?.accountName || "-"}</div>
              </div>
            </div>
          </div>

          {/* Lokasi Kebun & Jenis Buah */}
          {(data.lokasiKebun || data.jenisBuah) && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Informasi Kebun</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                  {data.lokasiKebun && (
                    <div>
                      <div className="text-sm text-muted-foreground">Lokasi Kebun</div>
                      <div className="font-medium">{data.lokasiKebun}</div>
                    </div>
                  )}
                  {data.jenisBuah && (
                    <div>
                      <div className="text-sm text-muted-foreground">Jenis Buah</div>
                      <div className="flex items-center gap-2">
                        <Apple className="h-4 w-4 text-primary" />
                        <Badge variant="outline" className="font-medium">
                          {data.jenisBuah === "TBS-BB" && "Buah Besar (TBS-BB)"}
                          {data.jenisBuah === "TBS-BS" && "Buah Biasa (TBS-BS)"}
                          {data.jenisBuah === "TBS-BK" && "Buah Kecil (TBS-BK)"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Transporter Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Kendaraan & Supir</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Nomor Kendaraan</div>
                <div className="font-bold text-lg">{data.transporter.nomorKendaraan}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Nama Supir</div>
                <div className="font-medium">{data.transporter.namaSupir}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Unloading Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-lg">Informasi Bongkar</h3>
            </div>
            {data.vendorBongkar ? (
              <div className="grid grid-cols-2 gap-4 bg-orange-50/30 p-4 rounded-lg border border-orange-100">
                <div>
                  <div className="text-sm text-muted-foreground">Vendor Bongkar</div>
                  <div className="font-semibold">{data.vendorBongkar.name} ({data.vendorBongkar.code})</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tipe</div>
                  <Badge variant="outline" className="text-orange-700 border-orange-200">
                    {data.vendorBongkar.tipe}
                  </Badge>
                </div>
                {data.selectedVendorBongkarBank && (
                  <div className="col-span-2 mt-2 pt-2 border-t border-orange-100/50">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rekening Pembayaran Bongkar</div>
                    <div className="font-medium">
                      {data.selectedVendorBongkarBank.bankName} - {data.selectedVendorBongkarBank.accountNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">a.n. {data.selectedVendorBongkarBank.accountName}</div>
                  </div>
                )}

                <div className="col-span-2 grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-orange-100/50">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Upah per Kg</div>
                    <div className="font-bold text-orange-900">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(data.upahBongkar)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Upah Bongkar</div>
                    <div className="font-bold text-orange-900 text-lg">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(data.totalUpahBongkar)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/20 rounded-lg text-center text-sm text-muted-foreground italic">
                Data bongkar belum diinput
              </div>
            )}
          </div>

          <Separator />

          {/* Timbangan Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Data Timbangan</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700 font-medium">Berat Bruto</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {data.beratBruto.toLocaleString("id-ID")} kg
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm text-orange-700 font-medium">Berat Tarra</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {data.beratTarra.toLocaleString("id-ID")} kg
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-700 font-medium">Netto 1</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {data.beratNetto1.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                  <div className="text-xs text-purple-600 mt-1">Bruto - Tarra</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-sm text-yellow-700 font-medium">Potongan</div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {data.potonganPersen}%
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">
                    = {data.potonganKg.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-700 font-medium">Berat Netto 2 (Final)</div>
                  <div className="text-3xl font-bold text-green-900">
                    {data.beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                  <div className="text-xs text-green-600 mt-1">Netto 1 - Potongan</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pembayaran Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Informasi Pembayaran</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Material</div>
                  <div className="font-semibold text-lg">{data.material.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{data.material.satuan.symbol}</div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Operator Penimbang</div>
                  <div className="font-medium">{data.operatorPenimbang}</div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Harga per Kilogram</div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(data.hargaPerKg)}
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-700 font-medium">PPN ({data.ppnPersen}%)</div>
                  <div className="text-2xl font-bold text-green-900">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(data.nilaiPpn)}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-sm text-red-700 font-medium">PPH ({data.pphPersen}%)</div>
                  <div className="text-2xl font-bold text-red-900">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(data.nilaiPph)}
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">Subtotal Harga</div>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(data.totalBayar)}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-lg">
                <div className="text-sm opacity-90 mb-2">Jumlah yang Harus Dibayarkan</div>
                <div className="text-4xl font-bold mb-2">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(data.jumlahBayarFinal)}
                </div>
                <div className="text-sm opacity-90">
                  {data.beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg × {" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(data.hargaPerKg)} + PPN - PPH
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
