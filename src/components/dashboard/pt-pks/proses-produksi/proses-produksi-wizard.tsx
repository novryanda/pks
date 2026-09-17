"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, CheckCircle } from "lucide-react";

interface Material {
  id: string;
  name: string;
  code: string;
  kategori: { name: string; id: string };
  satuan: { name: string };
  stock?: number;
}

interface Kategori {
  id: string;
  name: string;
}

interface HasilProduksi {
  materialOutputId: string;
  materialName?: string;
  materialCode?: string;
  materialKategori?: string;
  materialSatuan?: string;
  stockSaatIni?: number;
  jumlahOutput: number;
  rendemen: number;
}

interface ProsesProduksiWizardProps {
  id?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4;

export function ProsesProduksiWizard({
  id,
  onSuccess,
  onCancel,
}: ProsesProduksiWizardProps) {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Data sources
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [kategoriOutput, setKategoriOutput] = useState<Kategori[]>([]);
  const [materialsByKategori, setMaterialsByKategori] = useState<Material[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    tanggalProduksi: new Date().toISOString().split("T")[0],
    operatorProduksi: session?.user?.name || "",
    materialInputId: "",
    materialInputName: "",
    materialInputSatuan: "",
    jumlahInput: 0,
    stockTersedia: 0,
    selectedKategoriId: "",
    selectedKategoriName: "",
    hasilProduksi: [] as HasilProduksi[],
    status: "DRAFT",
  });

  const formatNumber = (value: number) => value.toLocaleString("id-ID");

  const totalOutput = formData.hasilProduksi.reduce(
    (sum, hasil) => sum + hasil.jumlahOutput,
    0
  );

  const getStockSetelahInput = () =>
    Math.max(formData.stockTersedia - formData.jumlahInput, 0);

  const getStockProdukSaatIni = (materialId: string) =>
    materialsByKategori.find((material) => material.id === materialId)?.stock || 0;

  useEffect(() => {
    fetchAllMaterials();
    fetchKategoriOutput();
  }, []);

  const fetchAllMaterials = async () => {
    try {
      const response = await fetch("/api/pt-pks/material");
      if (!response.ok) throw new Error("Failed to fetch materials");
      const data = await response.json();
      // Filter for TBS only (case insensitive)
      const tbsMaterials = data.filter((m: Material) =>
        m.name.toUpperCase().includes("TBS") ||
        m.code.toUpperCase().includes("TBS")
      );
      setAllMaterials(tbsMaterials);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchKategoriOutput = async () => {
    try {
      const response = await fetch("/api/pt-pks/proses-produksi/kategori-output");
      if (!response.ok) throw new Error("Failed to fetch kategori");
      const data = await response.json();
      // Filter for Production category only (case insensitive)
      const productionKategori = data.filter((k: Kategori) =>
        k.name.toUpperCase().includes("PRODUCTION")
      );
      setKategoriOutput(productionKategori);
    } catch (error) {
      console.error("Error fetching kategori:", error);
    }
  };

  const fetchMaterialByKategori = async (kategoriId: string) => {
    try {
      const response = await fetch(
        `/api/pt-pks/proses-produksi/material-by-kategori?kategoriId=${kategoriId}`
      );
      if (!response.ok) throw new Error("Failed to fetch materials");
      const data = await response.json();
      setMaterialsByKategori(data);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const handleMaterialSelect = (materialId: string) => {
    const material = allMaterials.find((m) => m.id === materialId);
    if (material) {
      // Fetch stock
      fetchStockMaterial(materialId).then((stock) => {
        setFormData({
          ...formData,
          materialInputId: material.id,
          materialInputName: material.name,
          materialInputSatuan: material.satuan.name,
          stockTersedia: stock,
        });
      });
    }
  };

  const fetchStockMaterial = async (materialId: string): Promise<number> => {
    try {
      const response = await fetch(`/api/pt-pks/stock-material?materialId=${materialId}`);
      if (!response.ok) return 0;
      const data = await response.json();
      return data.jumlah || 0;
    } catch (error) {
      return 0;
    }
  };

  const handleKategoriSelect = async (kategoriId: string) => {
    const kategori = kategoriOutput.find((k) => k.id === kategoriId);
    if (kategori) {
      setFormData({
        ...formData,
        selectedKategoriId: kategori.id,
        selectedKategoriName: kategori.name,
      });
      await fetchMaterialByKategori(kategoriId);
    }
  };

  const addHasilProduksi = (material: Material) => {
    // Check if already added
    if (formData.hasilProduksi.some((h) => h.materialOutputId === material.id)) {
      alert("Material ini sudah ditambahkan");
      return;
    }

    const newHasil: HasilProduksi = {
      materialOutputId: material.id,
      materialName: material.name,
      materialCode: material.code,
      materialKategori: material.kategori.name,
      materialSatuan: material.satuan.name,
      stockSaatIni: material.stock || 0,
      jumlahOutput: 0,
      rendemen: 0,
    };

    setFormData({
      ...formData,
      hasilProduksi: [...formData.hasilProduksi, newHasil],
    });
  };

  const removeHasilProduksi = (materialId: string) => {
    setFormData({
      ...formData,
      hasilProduksi: formData.hasilProduksi.filter(
        (h) => h.materialOutputId !== materialId
      ),
    });
  };

  const updateHasilProduksi = (materialId: string, jumlahOutput: number) => {
    const rendemen = formData.jumlahInput > 0
      ? (jumlahOutput / formData.jumlahInput) * 100
      : 0;

    setFormData({
      ...formData,
      hasilProduksi: formData.hasilProduksi.map((h) =>
        h.materialOutputId === materialId
          ? { ...h, jumlahOutput, rendemen: Number(rendemen.toFixed(2)) }
          : h
      ),
    });
  };

  const canProceedStep1 = () => {
    return formData.materialInputId !== "";
  };

  const canProceedStep2 = () => {
    return formData.jumlahInput > 0 && formData.jumlahInput <= formData.stockTersedia;
  };

  const canProceedStep3 = () => {
    return (
      formData.hasilProduksi.length > 0 &&
      formData.hasilProduksi.every((h) => h.jumlahOutput > 0)
    );
  };

  const handleNext = () => {
    if (currentStep === 1 && !canProceedStep1()) {
      alert("Pilih material input terlebih dahulu");
      return;
    }
    if (currentStep === 2 && !canProceedStep2()) {
      alert("Jumlah input tidak valid atau melebihi stock tersedia");
      return;
    }
    if (currentStep === 3 && !canProceedStep3()) {
      alert("Tambahkan minimal 1 hasil produksi dengan jumlah output > 0");
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4) as Step);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = {
        tanggalProduksi: formData.tanggalProduksi,
        operatorProduksi: formData.operatorProduksi,
        materialInputId: formData.materialInputId,
        jumlahInput: formData.jumlahInput,
        status: formData.status,
        hasilProduksi: formData.hasilProduksi.map((h) => ({
          materialOutputId: h.materialOutputId,
          jumlahOutput: h.jumlahOutput,
          rendemen: h.rendemen,
        })),
      };

      const url = id
        ? `/api/pt-pks/proses-produksi/${id}`
        : "/api/pt-pks/proses-produksi";
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      alert("Proses produksi berhasil disimpan");
      onSuccess();
    } catch (error: any) {
      console.error("Error saving proses produksi:", error);
      alert(error.message || "Gagal menyimpan proses produksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Pilih Material" },
              { num: 2, label: "Input Jumlah" },
              { num: 3, label: "Hasil Produksi" },
              { num: 4, label: "Review & Submit" },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${currentStep >= step.num
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-muted text-muted-foreground"
                      }`}
                  >
                    {currentStep > step.num ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium">{step.label}</p>
                </div>
                {idx < 3 && (
                  <div
                    className={`mx-4 h-0.5 w-16 ${currentStep > step.num ? "bg-primary" : "bg-muted"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Pilih Material Input</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pilih material yang akan diolah dalam proses produksi
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="materialInput">Material Input</Label>
              <Select
                value={formData.materialInputId || "none"}
                onValueChange={(value) => {
                  if (value !== "none") handleMaterialSelect(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Pilih Material
                  </SelectItem>
                  {allMaterials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} - {material.kategori.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.materialInputId && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Material:
                      </span>
                      <span className="text-sm font-medium">
                        {formData.materialInputName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Stock Tersedia:
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(formData.stockTersedia)}{" "}
                        {formData.materialInputSatuan}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Input Jumlah yang Akan Diolah</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tentukan berapa jumlah material yang akan diolah
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Material:
                    </span>
                    <span className="text-sm font-medium">
                      {formData.materialInputName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Stock Tersedia:
                    </span>
                      <span className="text-sm font-bold text-primary">
                      {formatNumber(formData.stockTersedia)}{" "}
                      {formData.materialInputSatuan}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Estimasi Sisa Stok:
                    </span>
                    <span className="text-sm font-medium">
                      {formatNumber(getStockSetelahInput())}{" "}
                      {formData.materialInputSatuan}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tanggalProduksi">Tanggal Produksi</Label>
                <Input
                  id="tanggalProduksi"
                  type="date"
                  value={formData.tanggalProduksi}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggalProduksi: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operatorProduksi">Operator Produksi</Label>
                <Input
                  id="operatorProduksi"
                  value={formData.operatorProduksi}
                  onChange={(e) =>
                    setFormData({ ...formData, operatorProduksi: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jumlahInput">
                Jumlah yang Akan Diolah ({formData.materialInputSatuan})
              </Label>
              <Input
                id="jumlahInput"
                type="text"
                placeholder="Masukkan jumlah"
                value={formData.jumlahInput > 0 ? formData.jumlahInput.toLocaleString('id-ID') : ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                  setFormData({ ...formData, jumlahInput: parseInt(value) || 0 });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Stock TBS saat ini: {formatNumber(formData.stockTersedia)}{" "}
                {formData.materialInputSatuan}
              </p>
              {formData.jumlahInput > formData.stockTersedia && (
                <p className="text-sm text-red-500">
                  ⚠️ Jumlah melebihi stock tersedia
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Hasil Produksi</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pilih kategori dan tambahkan material hasil produksi
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info Input */}
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Material Input:
                    </span>
                    <span className="text-sm font-medium">
                      {formData.materialInputName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Jumlah Diolah:
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {formatNumber(formData.jumlahInput)}{" "}
                      {formData.materialInputSatuan}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Sisa Stock TBS:
                    </span>
                    <span className="text-sm font-medium">
                      {formatNumber(getStockSetelahInput())}{" "}
                      {formData.materialInputSatuan}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kategori Selection */}
            <div className="space-y-2">
              <Label htmlFor="kategoriOutput">Pilih Kategori Material Output</Label>
              <Select
                value={formData.selectedKategoriId || "none"}
                onValueChange={(value) => {
                  if (value !== "none") handleKategoriSelect(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Pilih Kategori
                  </SelectItem>
                  {kategoriOutput.map((kat) => (
                    <SelectItem key={kat.id} value={kat.id}>
                      {kat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Materials List */}
            {formData.selectedKategoriId && (
              <div className="space-y-2">
                <Label>Material yang Tersedia</Label>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {materialsByKategori.map((material) => (
                    <Card
                      key={material.id}
                      className="cursor-pointer transition-colors hover:bg-muted"
                      onClick={() => addHasilProduksi(material)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {material.code} - {material.satuan.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Stock produk: {formatNumber(material.stock || 0)}{" "}
                              {material.satuan.name}
                            </p>
                          </div>
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Added Results */}
            {formData.hasilProduksi.length > 0 && (
              <div className="space-y-2">
                <Label>Hasil Produksi yang Ditambahkan</Label>
                <div className="space-y-2">
                  {formData.hasilProduksi.map((hasil) => (
                    <Card key={hasil.materialOutputId}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{hasil.materialName}</p>
                              <p className="text-xs text-muted-foreground">
                                {hasil.materialCode} - {hasil.materialKategori}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Stock saat ini:{" "}
                                {formatNumber(
                                  hasil.stockSaatIni ??
                                    getStockProdukSaatIni(hasil.materialOutputId)
                                )}{" "}
                                {hasil.materialSatuan}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                removeHasilProduksi(hasil.materialOutputId)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs">
                                Jumlah Output ({hasil.materialSatuan})
                              </Label>
                              <Input
                                type="text"
                                value={hasil.jumlahOutput > 0 ? hasil.jumlahOutput.toLocaleString('id-ID') : ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                  updateHasilProduksi(
                                    hasil.materialOutputId,
                                    parseInt(value) || 0
                                  );
                                }}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Rendemen</Label>
                              <div className="flex h-10 items-center rounded-md border bg-muted px-3">
                                <span className="text-sm font-medium">
                                  {hasil.rendemen.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-md border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                            Estimasi stock setelah produksi:{" "}
                            <span className="font-medium text-foreground">
                              {formatNumber(
                                (hasil.stockSaatIni ??
                                  getStockProdukSaatIni(hasil.materialOutputId)) +
                                  hasil.jumlahOutput
                              )}{" "}
                              {hasil.materialSatuan}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Review & Submit</CardTitle>
            <p className="text-sm text-muted-foreground">
              Periksa kembali data sebelum menyimpan
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Info */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <h4 className="mb-3 font-semibold">Informasi Umum</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tanggal:</span>
                      <span className="font-medium">
                        {formData.tanggalProduksi}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operator:</span>
                      <span className="font-medium">
                        {formData.operatorProduksi}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <h4 className="mb-3 font-semibold">Material Input</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Material:</span>
                      <span className="font-medium">
                        {formData.materialInputName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jumlah:</span>
                      <span className="font-bold text-primary">
                        {formatNumber(formData.jumlahInput)}{" "}
                        {formData.materialInputSatuan}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock TBS:</span>
                      <span className="font-medium">
                        {formatNumber(formData.stockTersedia)}{" "}
                        {formData.materialInputSatuan}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sisa Stock:</span>
                      <span className="font-medium">
                        {formatNumber(getStockSetelahInput())}{" "}
                        {formData.materialInputSatuan}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hasil Produksi Table */}
            <div>
              <h4 className="mb-3 font-semibold">Hasil Produksi</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Output</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Stock Saat Ini</TableHead>
                    <TableHead className="text-right">Jumlah Output</TableHead>
                    <TableHead className="text-right">Stock Setelah</TableHead>
                    <TableHead className="text-right">Rendemen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.hasilProduksi.map((hasil) => (
                    <TableRow key={hasil.materialOutputId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{hasil.materialName}</p>
                          <p className="text-xs text-muted-foreground">
                            {hasil.materialCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{hasil.materialKategori}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(
                          hasil.stockSaatIni ??
                            getStockProdukSaatIni(hasil.materialOutputId)
                        )}{" "}
                        {hasil.materialSatuan}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(hasil.jumlahOutput)}{" "}
                        {hasil.materialSatuan}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(
                          (hasil.stockSaatIni ??
                            getStockProdukSaatIni(hasil.materialOutputId)) +
                            hasil.jumlahOutput
                        )}{" "}
                        {hasil.materialSatuan}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default">{hasil.rendemen.toFixed(2)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Card className="mt-4 bg-muted">
                <CardContent className="pt-6">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Total Output:</span>
                    <span className="font-bold">
                      {formatNumber(totalOutput)}{" "}
                      kg
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="font-semibold">Rata-rata Rendemen:</span>
                    <span className="font-bold">
                      {(
                        formData.hasilProduksi.reduce(
                          (sum, h) => sum + h.rendemen,
                          0
                        ) / formData.hasilProduksi.length
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_PROGRESS">Proses</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                </SelectContent>
              </Select>
              {formData.status === "COMPLETED" && (
                <p className="text-sm text-amber-600">
                  ⚠️ Status "Selesai" akan mengurangi stock material input dan
                  menambah stock hasil produksi
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <div>
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali
                </Button>
              ) : (
                <Button variant="outline" onClick={onCancel}>
                  Batal
                </Button>
              )}
            </div>

            <div>
              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Selanjutnya
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
