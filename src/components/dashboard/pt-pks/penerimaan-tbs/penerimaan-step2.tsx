"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Save, ArrowRight, Loader2 } from "lucide-react";
import { NumericInput } from "@/components/ui/numeric-input";
import { useWeighingScale } from "@/hooks/use-weighing-scale";
import type { PenerimaanFormData } from "./penerimaan-wizard";

type Step2Props = {
  data: Partial<PenerimaanFormData>;
  onUpdate: (data: Partial<PenerimaanFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveBrutoOnly?: () => void;
  loading?: boolean;
};

type Supplier = {
  id: string;
  ownerName: string;
};

type Material = {
  id: string;
  name: string;
};

export function PenerimaanStep2({ data, onUpdate, onNext, onBack, onSaveBrutoOnly, loading }: Step2Props) {
  const [formData, setFormData] = useState({
    metodeBruto: data.metodeBruto || "MANUAL" as "MANUAL" | "SISTEM_TIMBANGAN",
    beratBruto: data.beratBruto || 0,
    waktuTimbangBruto: data.waktuTimbangBruto || new Date(),
  });

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [transporter, setTransporter] = useState<string>("");
  const [nomorPenerimaan, setNomorPenerimaan] = useState("TBS-" + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, "0") + "-XXXXX");

  useEffect(() => {
    // Fetch supplier and material details for summary
    const fetchDetails = async () => {
      if (data.supplierId) {
        try {
          const res = await fetch("/api/pt-pks/penerimaan-tbs/suppliers");
          if (res.ok) {
            const suppliers = await res.json();
            const supplierData = Array.isArray(suppliers)
              ? suppliers.find((s: any) => s.id === data.supplierId)
              : null;
            if (supplierData) {
              setSupplier(supplierData);
            }
          }
        } catch (error) {
          console.error("Error fetching supplier:", error);
        }
      }

      if (data.materialId) {
        try {
          const res = await fetch("/api/pt-pks/material");
          if (res.ok) {
            const materials = await res.json();
            const mat = materials.find((m: Material) => m.id === data.materialId);
            setMaterial(mat || null);
          }
        } catch (error) {
          console.error("Error fetching material:", error);
        }
      }

      // Set transporter info
      if (data.transporterType === "existing" && data.transporterId) {
        try {
          const res = await fetch(`/api/pt-pks/transporter?id=${data.transporterId}`);
          if (res.ok) {
            const transporterData = await res.json();
            setTransporter(transporterData.nomorKendaraan);
          }
        } catch (error) {
          console.error("Error fetching transporter:", error);
        }
      } else if (data.transporterType === "new" && data.nomorKendaraan) {
        setTransporter(data.nomorKendaraan);
      }
    };

    fetchDetails();
  }, [data]);

  const { loading: weighingLoading, fetchWeight } = useWeighingScale();

  const handleMetodeChange = (metode: "MANUAL" | "SISTEM_TIMBANGAN") => {
    setFormData({ ...formData, metodeBruto: metode });
  };

  const handleReadFromScale = async () => {
    const data = await fetchWeight();
    if (data) {
      setFormData({
        ...formData,
        beratBruto: data.weight,
        waktuTimbangBruto: new Date(data.timestamp),
      });
    }
  };

  const handleNext = () => {
    if (formData.beratBruto <= 0) {
      alert("Berat bruto harus lebih dari 0");
      return;
    }

    // Save as draft
    const draftData = {
      ...data,
      ...formData,
      status: "DRAFT" as const,
    };

    // In real implementation, you might want to save to backend here
    onUpdate(formData);
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Summary from Step 1 */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Ringkasan Data</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">No. Penerimaan</div>
              <div className="font-mono font-medium">{nomorPenerimaan}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Supplier</div>
              <div className="font-medium">{supplier?.ownerName || "Loading..."}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Kendaraan</div>
              <div className="font-medium">{transporter || "Loading..."}</div>
            </div>
            {data.lokasiKebun && (
              <div>
                <div className="text-sm text-muted-foreground">Lokasi Kebun</div>
                <div className="font-medium">{data.lokasiKebun}</div>
              </div>
            )}
            {data.jenisBuah && (
              <div>
                <div className="text-sm text-muted-foreground">Jenis Buah</div>
                <div className="font-medium">
                  {data.jenisBuah === "TBS-BB" && "Buah Besar (TBS-BB)"}
                  {data.jenisBuah === "TBS-BS" && "Buah Biasa (TBS-BS)"}
                  {data.jenisBuah === "TBS-BK" && "Buah Kecil (TBS-BK)"}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metode Input Section */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Metode Input Timbangan</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Pilih metode untuk memasukkan data berat bruto
          </p>
        </div>

        <RadioGroup
          value={formData.metodeBruto}
          onValueChange={(value) => handleMetodeChange(value as "MANUAL" | "SISTEM_TIMBANGAN")}
          className="space-y-4"
        >
          <Card className={formData.metodeBruto === "MANUAL" ? "border-primary" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="MANUAL" id="manual-bruto" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="manual-bruto" className="text-base font-medium cursor-pointer">
                    Input Manual
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Masukkan data berat secara manual dari operator
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={formData.metodeBruto === "SISTEM_TIMBANGAN" ? "border-primary" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="SISTEM_TIMBANGAN" id="sistem-bruto" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="sistem-bruto" className="text-base font-medium cursor-pointer">
                    Ambil dari Sistem Timbangan
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data berat akan diambil otomatis dari sistem timbangan
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
            <h3 className="font-semibold text-lg">Data Timbangan Bruto</h3>
          </div>

          {formData.metodeBruto === "SISTEM_TIMBANGAN" && (
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
            <Label htmlFor="beratBruto">Berat Bruto (kg) *</Label>
            <div className="relative">
              <NumericInput
                id="beratBruto"
                placeholder="0"
                value={formData.beratBruto}
                onValueChange={(val) => setFormData({ ...formData, beratBruto: val })}
                disabled={formData.metodeBruto === "SISTEM_TIMBANGAN"}
                className="text-right text-lg font-semibold pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                kg
              </div>
            </div>
            {formData.beratBruto > 0 && (
              <p className="text-sm text-muted-foreground">
                {formData.beratBruto.toLocaleString("id-ID")} kilogram
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="waktuTimbang">Waktu Timbangan</Label>
            <Input
              id="waktuTimbang"
              type="datetime-local"
              value={(() => { const d = formData.waktuTimbangBruto; const offset = d.getTimezoneOffset(); const local = new Date(d.getTime() - offset * 60000); return local.toISOString().slice(0, 16); })()}
              onChange={(e) =>
                setFormData({ ...formData, waktuTimbangBruto: new Date(e.target.value) })
              }
              disabled={formData.metodeBruto === "SISTEM_TIMBANGAN"}
            />
            <p className="text-sm text-muted-foreground">
              {formData.metodeBruto === "SISTEM_TIMBANGAN"
                ? "Waktu akan diambil otomatis dari sistem"
                : "Atau biarkan kosong untuk menggunakan waktu saat ini"}
            </p>
          </div>

          {/* Visual Indicator */}
          {formData.beratBruto > 0 && (
            <div className="pt-4">
              <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Berat Bruto</div>
                    <div className="text-3xl font-bold text-primary">
                      {formData.beratBruto.toLocaleString("id-ID")}
                    </div>
                    <div className="text-sm text-muted-foreground">kilogram</div>
                  </div>
                  <Scale className="h-16 w-16 text-primary/20" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Box */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-yellow-900 mb-2">Catatan Penting</h4>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>Pastikan kendaraan berada di posisi timbangan dengan benar</li>
            <li>Berat bruto adalah berat total kendaraan beserta muatan TBS</li>
            <li>Data akan disimpan sebagai draft dan dapat dilanjutkan ke step berikutnya</li>
            <li>Verifikasi kembali data sebelum melanjutkan</li>
          </ul>
        </CardContent>
      </Card>

      {/* Save Bruto Only Info Box */}
      {onSaveBrutoOnly && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Simpan Bruto Saja</h4>
            <p className="text-sm text-blue-800">
              Jika kendaraan perlu <strong>menunggu antrian</strong> untuk timbang tarra, Anda dapat menyimpan data bruto terlebih dahulu.
              Kendaraan dapat kembali nanti untuk timbang tarra di halaman "Input Harga TBS".
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Kembali
        </Button>
        <div className="flex gap-2">
          {onSaveBrutoOnly && (
            <Button
              variant="secondary"
              onClick={() => {
                onUpdate(formData);
                onSaveBrutoOnly();
              }}
              disabled={formData.beratBruto <= 0 || loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Bruto & Tarra Nanti
            </Button>
          )}
          <Button onClick={handleNext} disabled={formData.beratBruto <= 0 || loading} className="flex-1 sm:flex-none">
            <ArrowRight className="h-4 w-4 mr-2" />
            Lanjut ke Timbangan Tarra
          </Button>
        </div>
      </div>
    </div>
  );
}
