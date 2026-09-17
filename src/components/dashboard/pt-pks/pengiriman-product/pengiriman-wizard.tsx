"use client";

import { useState } from "react";

import { PengirimanStep1 } from "./pengiriman-step1";
import { PengirimanStep2 } from "./pengiriman-step2";

export type PengirimanFormData = {
  tanggalPengiriman: Date;
  operatorPenimbang: string;
  vendorId: string;
  vendorVehicleId: string;
  materialId: string;
  metodeTarra: "MANUAL" | "SISTEM_TIMBANGAN";
  beratTarra: number;
  waktuTimbangTarra: Date;
};

type PengirimanWizardProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

type CreatePengirimanResponse = {
  nomorPengiriman: string;
};

type PengirimanErrorResponse = {
  message?: string;
  error?: string;
};

export function PengirimanWizard({ onSuccess, onCancel }: PengirimanWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PengirimanFormData>>({
    tanggalPengiriman: new Date(),
    metodeTarra: "MANUAL",
    beratTarra: 0,
    waktuTimbangTarra: new Date(),
  });
  const [loading, setLoading] = useState(false);

  const updateFormData = (data: Partial<PengirimanFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      onCancel?.();
      return;
    }

    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmitTarra = async (finalData?: Partial<PengirimanFormData>) => {
    setLoading(true);

    try {
      const mergedData = { ...formData, ...finalData };
      const submitData = {
        tanggalPengiriman: mergedData.tanggalPengiriman,
        operatorPenimbang: mergedData.operatorPenimbang,
        vendorVehicleId: mergedData.vendorVehicleId,
        materialId: mergedData.materialId,
        metodeTarra: mergedData.metodeTarra,
        beratTarra: mergedData.beratTarra,
        waktuTimbangTarra: mergedData.waktuTimbangTarra,
      };

      const res = await fetch("/api/pt-pks/pengiriman-product/timbang-tarra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const error = (await res.json()) as PengirimanErrorResponse;
        alert(error.message ?? error.error ?? "Gagal menyimpan data tarra");
        return;
      }

      const result = (await res.json()) as CreatePengirimanResponse;
      alert(
        `Pengiriman ${result.nomorPengiriman} berhasil disimpan.\n` +
          "Kendaraan dapat melakukan loading produk.\n" +
          "Setelah loading selesai, lanjutkan ke timbang gross."
      );
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting tarra:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Vendor & Kendaraan" },
    { number: 2, title: "Timbang Tarra" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                currentStep >= step.number
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.number ? "✓" : step.number}
            </div>
            <div className="ml-2 mr-4">
              <div
                className={`text-sm font-medium ${
                  currentStep >= step.number ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-2 h-1 w-12 ${currentStep > step.number ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-6">
        {currentStep === 1 && (
          <PengirimanStep1 data={formData} onUpdate={updateFormData} onNext={handleNext} />
        )}
        {currentStep === 2 && (
          <PengirimanStep2
            data={formData}
            onUpdate={updateFormData}
            onNext={handleSubmitTarra}
            onBack={handleBack}
          />
        )}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-semibold text-blue-900">Informasi Alur</h4>
        <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800">
          <li className={currentStep >= 1 ? "font-medium" : ""}>Pilih vendor transportir dan kendaraan</li>
          <li className={currentStep >= 2 ? "font-medium" : ""}>Timbang tarra dan simpan data awal pengiriman</li>
          <li className="text-muted-foreground">Kendaraan loading produk</li>
          <li className="text-muted-foreground">Timbang gross dari tab &quot;Timbang Gross&quot;</li>
          <li className="text-muted-foreground">Input mutu dan pilih kontrak buyer</li>
          <li className="text-muted-foreground">Harga vendor transportir diinput dari menu keuangan</li>
        </ol>
      </div>

      {loading && <div className="text-center text-sm text-muted-foreground">Menyimpan pengiriman...</div>}
    </div>
  );
}
