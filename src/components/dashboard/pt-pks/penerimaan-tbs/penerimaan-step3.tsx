"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, TrendingDown, Calculator, Loader2 } from "lucide-react";
import { NumericInput } from "@/components/ui/numeric-input";
import { useWeighingScale } from "@/hooks/use-weighing-scale";
import type { PenerimaanFormData } from "./penerimaan-wizard";

type Step3Props = {
  data: Partial<PenerimaanFormData>;
  onUpdate: (data: Partial<PenerimaanFormData>) => void;
  onNext: () => void;
  onBack: () => void;
};

type Supplier = {
  id: string;
  ownerName: string;
};

export function PenerimaanStep3({ data, onUpdate, onNext, onBack }: Step3Props) {
  const [formData, setFormData] = useState({
    metodeTarra: data.metodeTarra || "MANUAL" as "MANUAL" | "SISTEM_TIMBANGAN",
    beratTarra: data.beratTarra || 0,
    waktuTimbangTarra: data.waktuTimbangTarra || new Date(),
    potonganPersen: data.potonganPersen || 0,
  });

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [transporter, setTransporter] = useState<string>("");
  const [nomorPenerimaan] = useState("TBS-" + new Date().getFullYear() + new Date().getMonth() + "-XXXXX");

  // Calculated values
  const beratBruto = data.beratBruto || 0;
  const beratNetto1 = beratBruto - formData.beratTarra;
  const potonganKg = (beratNetto1 * formData.potonganPersen) / 100;
  const beratNetto2 = beratNetto1 - potonganKg;

  useEffect(() => {
    // Fetch supplier details
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
    setFormData({ ...formData, metodeTarra: metode });
  };

  const handleReadFromScale = async () => {
    const data = await fetchWeight();
    if (data) {
      setFormData({
        ...formData,
        beratTarra: data.weight,
        waktuTimbangTarra: new Date(data.timestamp),
      });
    }
  };

  const handleNext = () => {
    if (formData.beratTarra <= 0) {
      alert("Berat tarra harus lebih dari 0");
      return;
    }

    if (formData.beratTarra >= beratBruto) {
      alert("Berat tarra tidak boleh lebih besar atau sama dengan berat bruto");
      return;
    }

    if (formData.potonganPersen < 0 || formData.potonganPersen > 100) {
      alert("Potongan harus antara 0% - 100%");
      return;
    }

    onUpdate({
      ...formData,
      beratNetto1,
      potonganKg,
      beratNetto2,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Summary from Previous Steps */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Ringkasan Data</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">No. Penerimaan</div>
              <div className="font-mono font-medium text-sm">{nomorPenerimaan}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Supplier</div>
              <div className="font-medium text-sm">{supplier?.ownerName || "Loading..."}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Kendaraan</div>
              <div className="font-medium text-sm">{transporter || "Loading..."}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Berat Bruto</div>
              <div className="font-bold text-primary">{beratBruto.toLocaleString("id-ID")} kg</div>
            </div>
            {data.lokasiKebun && (
              <div>
                <div className="text-sm text-muted-foreground">Lokasi Kebun</div>
                <div className="font-medium text-sm">{data.lokasiKebun}</div>
              </div>
            )}
            {data.jenisBuah && (
              <div>
                <div className="text-sm text-muted-foreground">Jenis Buah</div>
                <div className="font-medium text-sm">
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
          <Label className="text-base font-semibold">Metode Input Timbangan Tarra</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Pilih metode untuk memasukkan data berat tarra (berat kendaraan kosong)
          </p>
        </div>

        <RadioGroup
          value={formData.metodeTarra}
          onValueChange={(value) => handleMetodeChange(value as "MANUAL" | "SISTEM_TIMBANGAN")}
          className="space-y-4"
        >
          <Card className={formData.metodeTarra === "MANUAL" ? "border-primary" : ""}>
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

          <Card className={formData.metodeTarra === "SISTEM_TIMBANGAN" ? "border-primary" : ""}>
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

          {formData.metodeTarra === "SISTEM_TIMBANGAN" && (
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
                value={formData.beratTarra}
                onValueChange={(val) => setFormData({ ...formData, beratTarra: val })}
                disabled={formData.metodeTarra === "SISTEM_TIMBANGAN"}
                className="text-right text-lg font-semibold pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                kg
              </div>
            </div>
            {formData.beratTarra > 0 && (
              <p className="text-sm text-muted-foreground">
                {formData.beratTarra.toLocaleString("id-ID")} kilogram (berat kendaraan kosong)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="waktuTimbangTarra">Waktu Timbangan</Label>
            <Input
              id="waktuTimbangTarra"
              type="datetime-local"
              value={(() => { const d = formData.waktuTimbangTarra; const offset = d.getTimezoneOffset(); const local = new Date(d.getTime() - offset * 60000); return local.toISOString().slice(0, 16); })()}
              onChange={(e) =>
                setFormData({ ...formData, waktuTimbangTarra: new Date(e.target.value) })
              }
              disabled={formData.metodeTarra === "SISTEM_TIMBANGAN"}
            />
            <p className="text-sm text-muted-foreground">
              {formData.metodeTarra === "SISTEM_TIMBANGAN"
                ? "Waktu akan diambil otomatis dari sistem"
                : "Waktu penimbangan kendaraan kosong"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Section */}
      {formData.beratTarra > 0 && beratNetto1 > 0 && (
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
                {beratBruto.toLocaleString("id-ID")} kg - {formData.beratTarra.toLocaleString("id-ID")} kg
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
                      value={formData.potonganPersen || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (value >= 0 && value <= 100) {
                          setFormData({ ...formData, potonganPersen: value });
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
                    Auto kalkulasi: {formData.potonganPersen}% × {beratNetto1.toLocaleString("id-ID")} kg
                  </p>
                </div>
              </div>

              {formData.potonganPersen > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="text-sm text-orange-900">
                    <strong>Catatan:</strong> Potongan {formData.potonganPersen}% akan mengurangi berat sebesar{" "}
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
            <li>Pastikan semua data sudah benar sebelum melanjutkan</li>
          </ul>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Kembali
        </Button>
        <Button onClick={handleNext} size="lg" disabled={formData.beratTarra <= 0}>
          Lanjut ke Harga & Konfirmasi
        </Button>
      </div>
    </div>
  );
}
