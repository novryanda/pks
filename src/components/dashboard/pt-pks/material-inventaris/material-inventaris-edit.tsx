"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { NumericInput } from "@/components/ui/numeric-input";

interface KategoriMaterial {
  id: string;
  name: string;
  description?: string;
}

interface SatuanMaterial {
  id: string;
  name: string;
  symbol: string;
}

interface MaterialInventarisEditProps {
  materialId: string;
}

export function MaterialInventarisEdit({ materialId }: MaterialInventarisEditProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [kategoris, setKategoris] = useState<KategoriMaterial[]>([]);
  const [satuans, setSatuans] = useState<SatuanMaterial[]>([]);

  const [formData, setFormData] = useState({
    partNumber: "",
    namaMaterial: "",
    kategoriMaterialId: "",
    satuanMaterialId: "",
    spesifikasi: "",
    lokasiDigunakan: "",
    stockOnHand: 0,
    minStock: 0,
    maxStock: 0,
    hargaSatuan: 0,
  });

  useEffect(() => {
    fetchKategoris();
    fetchSatuans();
    fetchMaterial();
  }, [materialId]);

  const fetchMaterial = async () => {
    try {
      const response = await fetch(`/api/pt-pks/material-inventaris/${materialId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          partNumber: data.partNumber,
          namaMaterial: data.namaMaterial,
          kategoriMaterialId: data.kategoriMaterialId,
          satuanMaterialId: data.satuanMaterialId,
          spesifikasi: data.spesifikasi || "",
          lokasiDigunakan: data.lokasiDigunakan || "",
          stockOnHand: data.stockOnHand || 0,
          minStock: data.minStock || 0,
          maxStock: data.maxStock || 0,
          hargaSatuan: data.hargaSatuan || 0,
        });
      } else {
        toast.error("Material tidak ditemukan");
        router.push("/dashboard/pt-pks/gudang/material-inventaris");
      }
    } catch (error) {
      console.error("Error fetching material:", error);
      toast.error("Gagal memuat data material");
    } finally {
      setFetching(false);
    }
  };

  const fetchKategoris = async () => {
    try {
      const response = await fetch("/api/pt-pks/kategori-material");
      if (response.ok) {
        const data = await response.json();
        setKategoris(data);
      }
    } catch (error) {
      console.error("Error fetching kategoris:", error);
    }
  };

  const fetchSatuans = async () => {
    try {
      const response = await fetch("/api/pt-pks/satuan-material");
      if (response.ok) {
        const data = await response.json();
        setSatuans(data);
      }
    } catch (error) {
      console.error("Error fetching satuans:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.partNumber || !formData.namaMaterial) {
      toast.error("Part Number dan Nama Material wajib diisi");
      return;
    }

    if (!formData.kategoriMaterialId || !formData.satuanMaterialId) {
      toast.error("Kategori dan Satuan Material wajib dipilih");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/pt-pks/material-inventaris/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partNumber: formData.partNumber,
          namaMaterial: formData.namaMaterial,
          kategoriMaterialId: formData.kategoriMaterialId,
          satuanMaterialId: formData.satuanMaterialId,
          spesifikasi: formData.spesifikasi || undefined,
          lokasiDigunakan: formData.lokasiDigunakan || undefined,
          stockOnHand: Number(formData.stockOnHand),
          minStock: Number(formData.minStock),
          maxStock: Number(formData.maxStock),
          hargaSatuan: Number(formData.hargaSatuan),
        }),
      });

      if (response.ok) {
        toast.success("Material berhasil diupdate");
        router.push(`/dashboard/pt-pks/gudang/material-inventaris/${materialId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal mengupdate material");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center items-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edit Material Inventaris</CardTitle>
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/pt-pks/gudang/material-inventaris/${materialId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informasi Dasar</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partNumber">Part Number *</Label>
                <Input
                  id="partNumber"
                  value={formData.partNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, partNumber: e.target.value })
                  }
                  placeholder="Contoh: MAT-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="namaMaterial">Nama Material *</Label>
                <Input
                  id="namaMaterial"
                  value={formData.namaMaterial}
                  onChange={(e) =>
                    setFormData({ ...formData, namaMaterial: e.target.value })
                  }
                  placeholder="Nama material"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kategoriMaterialId">Kategori Material *</Label>
                <Select
                  value={formData.kategoriMaterialId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, kategoriMaterialId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {kategoris.map((kategori) => (
                      <SelectItem key={kategori.id} value={kategori.id}>
                        {kategori.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="satuanMaterialId">Satuan Material *</Label>
                <Select
                  value={formData.satuanMaterialId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, satuanMaterialId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {satuans.map((satuan) => (
                      <SelectItem key={satuan.id} value={satuan.id}>
                        {satuan.name} ({satuan.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="spesifikasi">Spesifikasi</Label>
                <Textarea
                  id="spesifikasi"
                  value={formData.spesifikasi}
                  onChange={(e) =>
                    setFormData({ ...formData, spesifikasi: e.target.value })
                  }
                  placeholder="Spesifikasi teknis material"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lokasiDigunakan">Lokasi Digunakan</Label>
                <Input
                  id="lokasiDigunakan"
                  value={formData.lokasiDigunakan}
                  onChange={(e) =>
                    setFormData({ ...formData, lokasiDigunakan: e.target.value })
                  }
                  placeholder="Contoh: Workshop, Produksi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hargaSatuan">Harga Satuan (Rp)</Label>
                <NumericInput
                  id="hargaSatuan"
                  value={formData.hargaSatuan}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      hargaSatuan: val,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informasi Stock</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="stockOnHand">Stock Saat Ini</Label>
                <NumericInput
                  id="stockOnHand"
                  value={formData.stockOnHand}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      stockOnHand: val,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock</Label>
                <NumericInput
                  id="minStock"
                  value={formData.minStock}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      minStock: val,
                    })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Alert jika stock di bawah nilai ini
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStock">Maximum Stock</Label>
                <NumericInput
                  id="maxStock"
                  value={formData.maxStock}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      maxStock: val,
                    })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Alert jika stock melebihi nilai ini
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/pt-pks/gudang/material-inventaris/${materialId}`)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Update Material"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
