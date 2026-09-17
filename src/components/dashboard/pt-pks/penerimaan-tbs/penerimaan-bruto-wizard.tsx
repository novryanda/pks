"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenerimaanStep1 } from "./penerimaan-step1";
import { PenerimaanBrutoStep2 } from "./penerimaan-bruto-step2";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle2 } from "lucide-react";

export type PenerimaanBrutoFormData = {
  // Step 1
  tanggalTerima: Date;
  materialId: string;
  operatorPenimbang: string;
  supplierId: string;
  lokasiKebun?: string;
  jenisBuah?: "TBS-BB" | "TBS-BS" | "TBS-BK";
  transporterType: "existing" | "new";
  transporterId?: string;
  nomorKendaraan?: string;
  namaSupir?: string;
  
  // Step 2 - Bruto Only
  metodeBruto: "MANUAL" | "SISTEM_TIMBANGAN";
  beratBruto: number;
  waktuTimbangBruto: Date;
};

type PenerimaanBrutoWizardProps = {
  onSuccess?: () => void;
};

export function PenerimaanBrutoWizard({ onSuccess }: PenerimaanBrutoWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PenerimaanBrutoFormData>>({
    tanggalTerima: new Date(),
    metodeBruto: "MANUAL",
    beratBruto: 0,
  });
  const [loading, setLoading] = useState(false);
  const [savedData, setSavedData] = useState<any>(null);

  const updateFormData = (data: Partial<PenerimaanBrutoFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const resetForm = () => {
    setFormData({
      tanggalTerima: new Date(),
      metodeBruto: "MANUAL",
      beratBruto: 0,
    });
    setCurrentStep(1);
    setSavedData(null);
  };

  // Simpan timbangan bruto
  const handleSaveBruto = async (brutoData: { metodeBruto: "MANUAL" | "SISTEM_TIMBANGAN"; beratBruto: number; waktuTimbangBruto: Date }) => {
    setLoading(true);

    try {
      // Gabungkan formData dari step1 dengan brutoData dari step2
      const submitData = {
        ...formData,
        ...brutoData,
        beratTarra: 0,
        potonganPersen: 0,
        waktuTimbangTarra: undefined,
      };

      console.log("Submitting bruto data:", submitData);

      const res = await fetch("/api/pt-pks/penerimaan-tbs/timbang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        const result = await res.json();
        setSavedData(result);
        setCurrentStep(3); // Go to success step
        onSuccess?.();
      } else {
        const data = await res.json();
        alert(`Gagal menyimpan: ${data.error}`);
      }
    } catch (error) {
      console.error("Error submitting bruto:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Informasi Pengirim" },
    { number: 2, title: "Timbangan Bruto" },
  ];

  // Success step
  if (currentStep === 3 && savedData) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Data Bruto Berhasil Disimpan!
              </h2>
              <p className="text-green-800 mb-4">
                Kendaraan dapat melanjutkan untuk bongkar muatan.
              </p>
              
              <div className="bg-white rounded-lg p-4 w-full max-w-md border border-green-200">
                <div className="text-sm text-muted-foreground">No. Penerimaan</div>
                <div className="text-xl font-mono font-bold text-primary">
                  {savedData.nomorPenerimaan}
                </div>
                <div className="mt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Berat Bruto:</span>
                    <span className="font-semibold">{savedData.beratBruto?.toLocaleString("id-ID")} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kendaraan:</span>
                    <span className="font-semibold">{savedData.transporter?.nomorKendaraan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span className="font-semibold">{savedData.supplier?.ownerName}</span>
                  </div>
                </div>
              </div>

              <Alert className="mt-6 text-left">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Setelah bongkar muatan, kendaraan dapat kembali ke tab <strong>"Menunggu Tarra"</strong> untuk input timbangan tarra.
                </AlertDescription>
              </Alert>

              <button
                onClick={resetForm}
                className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Input Penerimaan Baru
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex justify-center items-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step.number}
              </div>
              <div className="text-xs mt-1 text-center">{step.title}</div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-24 mx-2 ${
                  currentStep > step.number ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Input data pengirim dan timbangan bruto. Setelah disimpan, kendaraan dapat bongkar muatan dan kembali untuk timbang tarra di tab "Menunggu Tarra".
        </AlertDescription>
      </Alert>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>Penerimaan TBS - {steps[currentStep - 1]?.title}</CardTitle>
          <CardDescription>
            Step {currentStep} dari {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <PenerimaanStep1
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <PenerimaanBrutoStep2
              data={formData}
              onUpdate={updateFormData}
              onBack={handleBack}
              onSave={handleSaveBruto}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
