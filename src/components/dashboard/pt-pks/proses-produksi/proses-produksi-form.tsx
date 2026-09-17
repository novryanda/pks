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
import { Plus, Trash2, Save } from "lucide-react";

interface Material {
  id: string;
  name: string;
  code: string;
  kategori: { name: string };
  satuan: { name: string };
  stock?: number;
}

interface Kategori {
  id: string;
  name: string;
}

interface HasilProduksi {
  materialOutputId: string;
  jumlahOutput: number;
  rendemen: number;
}

interface ProsesProduksiFormProps {
  id?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProsesProduksiForm({
  id,
  onSuccess,
  onCancel,
}: ProsesProduksiFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [stockTBS, setStockTBS] = useState<Material[]>([]);
  const [kategoriOutput, setKategoriOutput] = useState<Kategori[]>([]);
  const [materialsByKategori, setMaterialsByKategori] = useState<
    Record<string, Material[]>
  >({});

  const [formData, setFormData] = useState({
    tanggalProduksi: new Date().toISOString().split("T")[0],
    materialInputId: "",
    jumlahInput: 0,
    operatorProduksi: session?.user?.name || "",
    status: "DRAFT",
    hasilProduksi: [] as HasilProduksi[],
  });

  const [selectedKategoris, setSelectedKategoris] = useState<string[]>([]);

  useEffect(() => {
    fetchStockTBS();
    fetchKategoriOutput();

    if (id) {
      fetchProsesProduksi(id);
    }
  }, [id]);

  const fetchStockTBS = async () => {
    try {
      const response = await fetch("/api/pt-pks/proses-produksi/stock-tbs");
      if (!response.ok) throw new Error("Failed to fetch stock TBS");
      const data = await response.json();
      setStockTBS(data);
    } catch (error) {
      console.error("Error fetching stock TBS:", error);
    }
  };

  const fetchKategoriOutput = async () => {
    try {
      const response = await fetch(
        "/api/pt-pks/proses-produksi/kategori-output"
      );
      if (!response.ok) throw new Error("Failed to fetch kategori");
      const data = await response.json();
      setKategoriOutput(data);
    } catch (error) {
      console.error("Error fetching kategori:", error);
    }
  };

  const fetchMaterialByKategori = async (kategoriId: string) => {
    if (materialsByKategori[kategoriId]) return;

    try {
      const response = await fetch(
        `/api/pt-pks/proses-produksi/material-by-kategori?kategoriId=${kategoriId}`
      );
      if (!response.ok) throw new Error("Failed to fetch materials");
      const data = await response.json();
      setMaterialsByKategori((prev) => ({
        ...prev,
        [kategoriId]: data,
      }));
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchProsesProduksi = async (produksiId: string) => {
    try {
      const response = await fetch(`/api/pt-pks/proses-produksi/${produksiId}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();

      setFormData({
        tanggalProduksi: new Date(data.tanggalProduksi)
          .toISOString()
          .split("T")[0],
        materialInputId: data.materialInputId,
        jumlahInput: data.jumlahInput,
        operatorProduksi: data.operatorProduksi,
        status: data.status,
        hasilProduksi: data.hasilProduksi.map((h: any) => ({
          materialOutputId: h.materialOutputId,
          jumlahOutput: h.jumlahOutput,
          rendemen: h.rendemen,
        })),
      });

      // Pre-load material data for existing hasil produksi
      const kategoriIds = new Set<string>();
      for (const hasil of data.hasilProduksi) {
        kategoriIds.add(hasil.materialOutput.kategoriId);
      }
      for (const kategoriId of kategoriIds) {
        await fetchMaterialByKategori(kategoriId);
      }
    } catch (error) {
      console.error("Error fetching proses produksi:", error);
    }
  };

  const addHasilProduksi = () => {
    setFormData({
      ...formData,
      hasilProduksi: [
        ...formData.hasilProduksi,
        {
          materialOutputId: "",
          jumlahOutput: 0,
          rendemen: 0,
        },
      ],
    });
    setSelectedKategoris([...selectedKategoris, "none"]);
  };

  const removeHasilProduksi = (index: number) => {
    const newHasilProduksi = formData.hasilProduksi.filter(
      (_, i) => i !== index
    );
    const newSelectedKategoris = selectedKategoris.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      hasilProduksi: newHasilProduksi,
    });
    setSelectedKategoris(newSelectedKategoris);
  };

  const updateHasilProduksi = (
    index: number,
    field: keyof HasilProduksi,
    value: any
  ) => {
    const newHasilProduksi = [...formData.hasilProduksi];
    newHasilProduksi[index] = {
      ...newHasilProduksi[index]!,
      [field]: value,
    };

    // Auto calculate rendemen when jumlahOutput changes
    if (field === "jumlahOutput" && formData.jumlahInput > 0) {
      const rendemen = (value / formData.jumlahInput) * 100;
      newHasilProduksi[index]!.rendemen = Number(rendemen.toFixed(2));
    }

    setFormData({
      ...formData,
      hasilProduksi: newHasilProduksi,
    });
  };

  const updateKategori = async (index: number, kategoriId: string) => {
    const newSelectedKategoris = [...selectedKategoris];
    newSelectedKategoris[index] = kategoriId;
    setSelectedKategoris(newSelectedKategoris);

    // Reset material selection for this hasil
    const newHasilProduksi = [...formData.hasilProduksi];
    newHasilProduksi[index] = {
      ...newHasilProduksi[index]!,
      materialOutputId: "",
    };
    setFormData({
      ...formData,
      hasilProduksi: newHasilProduksi,
    });

    // Fetch materials for this kategori
    await fetchMaterialByKategori(kategoriId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.materialInputId) {
      alert("Material input (TBS) harus dipilih");
      return;
    }

    if (formData.jumlahInput <= 0) {
      alert("Jumlah input harus lebih dari 0");
      return;
    }

    if (formData.hasilProduksi.length === 0) {
      alert("Minimal harus ada 1 hasil produksi");
      return;
    }

    for (const hasil of formData.hasilProduksi) {
      if (!hasil.materialOutputId || hasil.materialOutputId === "none") {
        alert("Semua material output harus dipilih");
        return;
      }
      if (hasil.jumlahOutput <= 0) {
        alert("Jumlah output harus lebih dari 0");
        return;
      }
    }

    try {
      setLoading(true);

      const url = id
        ? `/api/pt-pks/proses-produksi/${id}`
        : "/api/pt-pks/proses-produksi";

      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      alert(
        id
          ? "Proses produksi berhasil diupdate"
          : "Proses produksi berhasil ditambahkan"
      );
      onSuccess();
    } catch (error: any) {
      console.error("Error saving proses produksi:", error);
      alert(error.message || "Gagal menyimpan proses produksi");
    } finally {
      setLoading(false);
    }
  };

  const selectedStockTBS = stockTBS.find(
    (s) => s.id === formData.materialInputId
  );

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {id ? "Edit Proses Produksi" : "Tambah Proses Produksi"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
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
                required
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
                required
              />
            </div>
          </div>

          {/* Material Input (TBS) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Material Input (TBS)</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="materialInputId">Pilih Material TBS</Label>
                <Select
                  value={formData.materialInputId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, materialInputId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Material TBS" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockTBS.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} - Stock: {material.stock}{" "}
                        {material.satuan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStockTBS && (
                  <p className="text-sm text-muted-foreground">
                    Stock tersedia: {selectedStockTBS.stock}{" "}
                    {selectedStockTBS.satuan.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jumlahInput">Jumlah Input</Label>
                <Input
                  id="jumlahInput"
                  type="text"
                  value={formData.jumlahInput > 0 ? formData.jumlahInput.toLocaleString('id-ID') : ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                    const numValue = parseInt(value) || 0;
                    setFormData({ ...formData, jumlahInput: numValue });

                    // Recalculate all rendemen
                    if (numValue > 0) {
                      const newHasilProduksi = formData.hasilProduksi.map(
                        (h) => ({
                          ...h,
                          rendemen: Number(
                            ((h.jumlahOutput / numValue) * 100).toFixed(2)
                          ),
                        })
                      );
                      setFormData((prev) => ({
                        ...prev,
                        hasilProduksi: newHasilProduksi,
                      }));
                    }
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Hasil Produksi */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Hasil Produksi</h3>
              <Button type="button" onClick={addHasilProduksi} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Hasil
              </Button>
            </div>

            {formData.hasilProduksi.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Belum ada hasil produksi. Klik tombol "Tambah Hasil" untuk
                menambahkan.
              </p>
            ) : (
              <div className="space-y-4">
                {formData.hasilProduksi.map((hasil, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            Hasil Produksi #{index + 1}
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHasilProduksi(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Kategori Material</Label>
                            <Select
                              value={selectedKategoris[index] || "none"}
                              onValueChange={(value) => {
                                if (value !== "none") {
                                  updateKategori(index, value);
                                }
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

                          <div className="space-y-2">
                            <Label>Material Output</Label>
                            <Select
                              value={hasil.materialOutputId || "none"}
                              onValueChange={(value) => {
                                if (value !== "none") {
                                  updateHasilProduksi(
                                    index,
                                    "materialOutputId",
                                    value
                                  );
                                }
                              }}
                              disabled={!selectedKategoris[index] || selectedKategoris[index] === "none"}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Material" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none" disabled>
                                  Pilih Material
                                </SelectItem>
                                {selectedKategoris[index] &&
                                  selectedKategoris[index] !== "none" &&
                                  materialsByKategori[
                                    selectedKategoris[index]!
                                  ]?.map((mat) => (
                                    <SelectItem key={mat.id} value={mat.id}>
                                      {mat.name} ({mat.satuan.name})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Jumlah Output</Label>
                            <Input
                              type="text"
                              value={hasil.jumlahOutput > 0 ? hasil.jumlahOutput.toLocaleString('id-ID') : ""}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                updateHasilProduksi(
                                  index,
                                  "jumlahOutput",
                                  parseInt(value) || 0
                                );
                              }}
                              required
                            />
                          </div>
                        </div>

                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-sm">
                            <span className="font-medium">Rendemen:</span>{" "}
                            {hasil.rendemen.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                ⚠️ Status "Selesai" akan mengurangi stock TBS dan menambah stock
                hasil produksi
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
