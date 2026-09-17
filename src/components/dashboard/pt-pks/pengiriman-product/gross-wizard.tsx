"use client";

import { useState } from "react";
import { Loader2, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useWeighingScale } from "@/hooks/use-weighing-scale";

export type PendingGrossPengiriman = {
  id: string;
  nomorPengiriman: string;
  noSegel: string;
  tanggalPengiriman: string;
  operatorPenimbang: string;
  beratTarra: number;
  waktuTimbangTarra: string;
  metodeTarra: string;
  status: string;
  vendorVehicle: {
    nomorKendaraan: string;
    namaSupir: string;
    vendor: {
      name: string;
    };
  };
};

type GrossWizardProps = {
  pengiriman: PendingGrossPengiriman;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function GrossWizard({ pengiriman, onSuccess, onCancel }: GrossWizardProps) {
  const [formData, setFormData] = useState({
    metodeGross: "MANUAL" as "MANUAL" | "SISTEM_TIMBANGAN",
    beratGross: 0,
    waktuTimbangGross: new Date(),
  });
  const [loading, setLoading] = useState(false);

  const beratTarra = pengiriman.beratTarra;
  const beratNetto = formData.beratGross - beratTarra;

  const handleSubmitGross = async () => {
    if (formData.beratGross <= 0) {
      alert("Berat gross harus lebih dari 0");
      return;
    }

    if (formData.beratGross <= beratTarra) {
      alert("Berat gross harus lebih besar dari berat tarra");
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        id: pengiriman.id,
        metodeGross: formData.metodeGross,
        beratGross: formData.beratGross,
        waktuTimbangGross: formData.waktuTimbangGross,
      };

      const res = await fetch("/api/pt-pks/pengiriman-product/update-gross", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Gagal menyimpan data gross");
        return;
      }

      alert(
        `Data gross berhasil disimpan.\nBerat Netto: ${beratNetto.toLocaleString()} kg\n\n` +
          'Lanjutkan ke tab "Input Mutu" untuk input data mutu kernel.'
      );
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting gross:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const { loading: weighingLoading, fetchWeight } = useWeighingScale();

  const handleTimbangOtomatis = async () => {
    const data = await fetchWeight();
    if (!data) {
      return;
    }

    setFormData({
      ...formData,
      beratGross: data.weight,
      waktuTimbangGross: new Date(data.timestamp),
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-gradient-to-r from-orange-50 to-yellow-50 p-4">
        <h3 className="mb-2 text-lg font-semibold">Timbang Gross: {pengiriman.nomorPengiriman}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <span className="text-muted-foreground">Kendaraan:</span>
            <p className="font-medium">{pengiriman.vendorVehicle.nomorKendaraan}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Supir:</span>
            <p className="font-medium">{pengiriman.vendorVehicle.namaSupir}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Vendor:</span>
            <p className="font-medium">{pengiriman.vendorVehicle.vendor.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Berat Tarra:</span>
            <p className="font-bold">{pengiriman.beratTarra.toLocaleString()} kg</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 rounded-lg border p-6">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <h3 className="mb-2 font-semibold text-orange-900">Informasi Timbangan Gross</h3>
          <p className="text-sm text-orange-800">
            Timbangan gross adalah penimbangan truck dengan muatan. Berat netto produk dihitung dari gross dikurangi
            tarra.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Metode Input Gross *</Label>
            <RadioGroup
              value={formData.metodeGross}
              onValueChange={(value: "MANUAL" | "SISTEM_TIMBANGAN") =>
                setFormData({ ...formData, metodeGross: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MANUAL" id="manual-gross" />
                <Label htmlFor="manual-gross" className="cursor-pointer font-normal">
                  Input Manual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SISTEM_TIMBANGAN" id="sistem-gross" />
                <Label htmlFor="sistem-gross" className="cursor-pointer font-normal">
                  Sistem Timbangan Otomatis
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.metodeGross === "SISTEM_TIMBANGAN" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="mb-3 text-sm text-green-800">Tekan tombol untuk membaca berat dari timbangan otomatis.</p>
              <Button type="button" onClick={handleTimbangOtomatis} variant="outline" className="w-full" disabled={weighingLoading}>
                {weighingLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Scale className="mr-2 h-4 w-4" />
                )}
                Baca dari Timbangan
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="beratGross">Berat Gross (Truck + Muatan) *</Label>
            <div className="flex gap-2">
              <NumericInput
                id="beratGross"
                placeholder="Masukkan berat dalam kg"
                value={formData.beratGross}
                onValueChange={(val) => setFormData({ ...formData, beratGross: val })}
                className="flex-1"
              />
              <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">kg</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waktuTimbangGross">Waktu Penimbangan Gross</Label>
            <Input
              id="waktuTimbangGross"
              type="datetime-local"
              value={(() => {
                const date = formData.waktuTimbangGross;
                const offset = date.getTimezoneOffset();
                const localDate = new Date(date.getTime() - offset * 60000);
                return localDate.toISOString().slice(0, 16);
              })()}
              onChange={(event) => setFormData({ ...formData, waktuTimbangGross: new Date(event.target.value) })}
            />
          </div>
        </div>

        {formData.beratGross > 0 && (
          <div className="rounded-lg border bg-gradient-to-br from-green-50 to-blue-50 p-4">
            <h4 className="mb-3 text-lg font-semibold">Ringkasan Timbangan</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Berat Tarra:</div>
              <div className="font-medium">{beratTarra.toLocaleString()} kg</div>
              <div className="text-muted-foreground">Berat Gross:</div>
              <div className="font-medium">{formData.beratGross.toLocaleString()} kg</div>
              <div className="col-span-2 my-2 border-t" />
              <div className="font-semibold text-muted-foreground">Berat Netto (Produk):</div>
              <div className={`text-xl font-bold ${beratNetto > 0 ? "text-green-600" : "text-red-600"}`}>
                {beratNetto.toLocaleString()} kg
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Setelah data gross tersimpan, proses akan dilanjutkan ke input mutu.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Kembali
          </Button>
          <Button onClick={handleSubmitGross} disabled={loading || formData.beratGross <= beratTarra}>
            {loading ? "Menyimpan..." : "Simpan & Lanjut Input Mutu"}
          </Button>
        </div>
      </div>
    </div>
  );
}
