"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NumericInput } from "@/components/ui/numeric-input";
import { Scale, Loader2 } from "lucide-react";
import { useWeighingScale } from "@/hooks/use-weighing-scale";
import type { PengirimanFormData } from "./pengiriman-wizard";

type PengirimanStep2Props = {
  data: Partial<PengirimanFormData>;
  onUpdate: (data: Partial<PengirimanFormData>) => void;
  onNext: (data?: Partial<PengirimanFormData>) => void;
  onBack: () => void;
};

export function PengirimanStep2({ data, onUpdate, onNext, onBack }: PengirimanStep2Props) {
  const [formData, setFormData] = useState({
    metodeTarra: data.metodeTarra || ("MANUAL" as "MANUAL" | "SISTEM_TIMBANGAN"),
    beratTarra: data.beratTarra || 0,
    waktuTimbangTarra: data.waktuTimbangTarra || new Date(),
  });

  const { loading: weighingLoading, fetchWeight } = useWeighingScale();

  const handleNext = () => {
    if (formData.beratTarra <= 0) {
      alert("Berat tarra harus lebih dari 0");
      return;
    }

    onUpdate(formData);
    onNext(formData);
  };

  const handleTimbangOtomatis = async () => {
    const data = await fetchWeight();
    if (data) {
      setFormData({
        ...formData,
        beratTarra: data.weight,
        waktuTimbangTarra: new Date(data.timestamp),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informasi Timbangan Tarra</h3>
        <p className="text-sm text-blue-800">
          Timbangan <strong>Tarra</strong> adalah penimbangan truck dalam kondisi <strong>kosong</strong> (tanpa muatan).
          Berat ini akan dikurangkan dari berat gross untuk mendapatkan berat netto produk.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Metode Input Tarra *</Label>
          <RadioGroup
            value={formData.metodeTarra}
            onValueChange={(value: "MANUAL" | "SISTEM_TIMBANGAN") =>
              setFormData({ ...formData, metodeTarra: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MANUAL" id="manual" />
              <Label htmlFor="manual" className="font-normal cursor-pointer">
                Input Manual
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="SISTEM_TIMBANGAN" id="sistem" />
              <Label htmlFor="sistem" className="font-normal cursor-pointer">
                Sistem Timbangan Otomatis
              </Label>
            </div>
          </RadioGroup>
        </div>

        {formData.metodeTarra === "SISTEM_TIMBANGAN" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 mb-3">
              Tekan tombol untuk membaca berat dari timbangan otomatis
            </p>
            <Button
              type="button"
              onClick={handleTimbangOtomatis}
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
          <Label htmlFor="beratTarra">Berat Tarra (Truck Kosong) *</Label>
          <div className="flex gap-2">
            <NumericInput
              id="beratTarra"
              placeholder="Masukkan berat dalam kg"
              value={formData.beratTarra}
              onValueChange={(val) => setFormData({ ...formData, beratTarra: val })}
              className="flex-1"
            />
            <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
              kg
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Berat kendaraan dalam kondisi kosong (tanpa muatan)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="waktuTimbangTarra">Waktu Penimbangan Tarra</Label>
          <Input
            id="waktuTimbangTarra"
            type="datetime-local"
            value={(() => { const d = formData.waktuTimbangTarra; const offset = d.getTimezoneOffset(); const local = new Date(d.getTime() - offset * 60000); return local.toISOString().slice(0, 16); })()}
            onChange={(e) =>
              setFormData({
                ...formData,
                waktuTimbangTarra: new Date(e.target.value),
              })
            }
          />
        </div>
      </div>

      {formData.beratTarra > 0 && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-semibold mb-2">Ringkasan Timbangan Tarra</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Metode:</div>
            <div className="font-medium">
              {formData.metodeTarra === "MANUAL" ? "Input Manual" : "Sistem Timbangan"}
            </div>
            <div className="text-muted-foreground">Berat Tarra:</div>
            <div className="font-medium text-lg">{formData.beratTarra.toLocaleString()} kg</div>
            <div className="text-muted-foreground">Waktu Timbang:</div>
            <div className="font-medium">
              {new Date(formData.waktuTimbangTarra).toLocaleString("id-ID")}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Kembali
        </Button>
        <Button onClick={handleNext}>
          Lanjut ke Timbang Gross
        </Button>
      </div>
    </div>
  );
}
