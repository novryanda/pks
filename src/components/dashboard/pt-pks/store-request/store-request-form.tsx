"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { NumericInput } from "@/components/ui/numeric-input";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface Material {
  id: string;
  partNumber: string;
  namaMaterial: string;
  stockOnHand: number;
  satuanMaterial: {
    symbol: string;
  };
}

interface SRItem {
  materialId: string;
  jumlahRequest: number;
  keterangan?: string;
}

interface Divisi {
  id: string;
  nama: string;
}

interface Karyawan {
  id: string;
  namaKaryawan: string;
  divisi?: {
    nama: string;
  };
}

interface StoreRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function StoreRequestForm({ onSuccess, onCancel }: StoreRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [divisions, setDivisions] = useState<Divisi[]>([]);
  const [employees, setEmployees] = useState<Karyawan[]>([]);

  const [formData, setFormData] = useState({
    divisi: "",
    requestedBy: "",
    keterangan: "",
  });

  // Filtered employees based on selected division
  const filteredEmployees = useMemo(() => {
    if (!formData.divisi) return [];
    return employees.filter(e => e.divisi?.nama === formData.divisi);
  }, [employees, formData.divisi]);

  const [items, setItems] = useState<SRItem[]>([
    { materialId: "", jumlahRequest: 0, keterangan: "" },
  ]);

  useEffect(() => {
    fetchMaterials();
    fetchDivisions();
    fetchEmployees();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/pt-pks/material-inventaris");
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await fetch("/api/pt-pks/master-divisi?activeList=true");
      if (response.ok) {
        const result = await response.json();
        setDivisions(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/pt-pks/master-karyawan?isActive=true&limit=1000");
      if (response.ok) {
        const result = await response.json();
        setEmployees(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const addItem = () => {
    setItems([...items, { materialId: "", jumlahRequest: 0, keterangan: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof SRItem, value: any) => {
    const newItems = [...items];
    const {
      materialId = "",
      jumlahRequest = 0,
      keterangan = "",
      ...rest
    } = newItems[index] || {};
    newItems[index] = {
      materialId,
      jumlahRequest,
      keterangan,
      ...rest,
      [field]: (field === "materialId" || field === "keterangan") ? (typeof value === "undefined" ? "" : value) : (field === "jumlahRequest" ? (typeof value === "number" ? value : 0) : value),
    };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.divisi || !formData.requestedBy) {
      toast.error("Divisi dan Pemohon wajib diisi");
      return;
    }

    const validItems = items.filter(
      (item) => item.materialId && item.jumlahRequest > 0
    );

    if (validItems.length === 0) {
      toast.error("Minimal harus ada 1 item material");
      return;
    }

    setLoading(true);
    try {
      // SR langsung status PENDING (tersubmit untuk approval)
      const response = await fetch("/api/pt-pks/store-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: validItems,
          status: "PENDING", // pastikan status langsung PENDING
        }),
      });

      if (response.ok) {
        toast.success("Store Request berhasil dibuat dan tersubmit untuk approval");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal membuat Store Request");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Buat Store Request Baru</CardTitle>
            <Button type="button" variant="ghost" onClick={onCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Header */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="divisi">Divisi *</Label>
              <SearchableSelect
                value={formData.divisi}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    divisi: value,
                    requestedBy: "" // Reset pemohon when division changes
                  });
                }}
                options={divisions.map(d => ({
                  value: d.nama, // Store name as requested by schema
                  label: d.nama
                }))}
                placeholder="Pilih divisi"
                searchPlaceholder="Cari divisi..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedBy">Pemohon *</Label>
              <SearchableSelect
                value={formData.requestedBy}
                onValueChange={(value) => setFormData({ ...formData, requestedBy: value })}
                options={filteredEmployees.map(e => ({
                  value: e.namaKaryawan, // Store name as requested by schema
                  label: e.namaKaryawan,
                  sublabel: e.divisi?.nama
                }))}
                placeholder={formData.divisi ? "Pilih pemohon" : "Pilih divisi terlebih dahulu"}
                searchPlaceholder="Cari nama karyawan..."
                disabled={!formData.divisi}
                emptyMessage={formData.divisi ? "Tidak ada karyawan di divisi ini." : "Pilih divisi terlebih dahulu."}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
              placeholder="Keterangan tambahan (optional)"
              rows={3}
            />
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Daftar Material *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Item
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Material</TableHead>
                    <TableHead className="w-[15%]">Jumlah</TableHead>
                    <TableHead className="w-[30%]">Keterangan</TableHead>
                    <TableHead className="w-[15%]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <SearchableSelect
                          value={item.materialId}
                          onValueChange={(value) =>
                            updateItem(index, "materialId", value)
                          }
                          options={materials.map((material) => ({
                            value: material.id,
                            label: `${material.partNumber} - ${material.namaMaterial}`,
                            sublabel: `Sisa: ${material.stockOnHand} ${material.satuanMaterial.symbol}`
                          }))}
                          placeholder="Pilih material"
                          searchPlaceholder="Cari barcode/nama material..."
                        />
                      </TableCell>
                      <TableCell>
                        <NumericInput
                          min={0}
                          step={0.01}
                          value={item.jumlahRequest}
                          onValueChange={(val) =>
                            updateItem(
                              index,
                              "jumlahRequest",
                              val
                            )
                          }
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.keterangan || ""}
                          onChange={(e) =>
                            updateItem(index, "keterangan", e.target.value)
                          }
                          placeholder="Keterangan"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan SR"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
