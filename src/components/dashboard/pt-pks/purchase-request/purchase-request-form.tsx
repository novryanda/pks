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
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NumericInput } from "@/components/ui/numeric-input";

interface Material {
  id: string;
  partNumber: string;
  namaMaterial: string;
  stockOnHand: number;
  satuanMaterial: {
    symbol: string;
  };
}

interface VendorMaterial {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
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

interface PRItem {
  materialId: string;
  jumlahRequest: number;
  estimasiHarga: number;
  keterangan?: string;
}

export function PurchaseRequestForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [vendors, setVendors] = useState<VendorMaterial[]>([]);
  const [divisions, setDivisions] = useState<Divisi[]>([]);
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [vendorInputMode, setVendorInputMode] = useState<"select" | "manual">("select");

  const [formData, setFormData] = useState({
    tanggalRequest: new Date().toISOString().split("T")[0],
    tipePembelian: "PENGAJUAN_PO" as "PEMBELIAN_LANGSUNG" | "PENGAJUAN_PO",
    divisi: "",
    requestedBy: "",
    vendorNameDirect: "",
    vendorAddressDirect: "",
    vendorPhoneDirect: "",
    keterangan: "",
  });

  // Filtered employees based on selected division
  const filteredEmployees = useMemo(() => {
    if (!formData.divisi) return [];
    return employees.filter(e => e.divisi?.nama === formData.divisi);
  }, [employees, formData.divisi]);

  const [items, setItems] = useState<PRItem[]>([
    {
      materialId: "",
      jumlahRequest: 0,
      estimasiHarga: 0,
      keterangan: "",
    },
  ]);

  useEffect(() => {
    fetchMaterials();
    fetchVendors();
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

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/pt-pks/vendor-material?dropdown=true");
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
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

  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor) {
      setFormData({
        ...formData,
        vendorNameDirect: vendor.name,
        vendorPhoneDirect: vendor.phone,
        vendorAddressDirect: vendor.address,
      });
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        materialId: "",
        jumlahRequest: 0,
        estimasiHarga: 0,
        keterangan: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PRItem, value: any) => {
    const newItems = [...items];
    const {
      materialId = "",
      jumlahRequest = 0,
      estimasiHarga = 0,
      keterangan = "",
      ...rest
    } = newItems[index] || {};
    newItems[index] = {
      materialId,
      jumlahRequest,
      estimasiHarga,
      keterangan,
      ...rest,
      [field]: (field === "materialId" || field === "keterangan") ? (typeof value === "undefined" ? "" : value) : (field === "jumlahRequest" || field === "estimasiHarga" ? (typeof value === "number" ? value : 0) : value),
    };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.divisi || !formData.requestedBy) {
      toast.error("Divisi dan Pemohon wajib diisi");
      return;
    }

    if (formData.tipePembelian === "PEMBELIAN_LANGSUNG" && !formData.vendorNameDirect) {
      toast.error("Nama vendor wajib diisi untuk pembelian langsung");
      return;
    }

    if (items.length === 0 || items.some((item) => !item.materialId)) {
      toast.error("Minimal 1 item material harus diisi");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/pt-pks/purchase-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipePembelian: formData.tipePembelian,
          divisi: formData.divisi || undefined,
          requestedBy: formData.requestedBy,
          vendorNameDirect: formData.tipePembelian === "PEMBELIAN_LANGSUNG" ? formData.vendorNameDirect : undefined,
          vendorAddressDirect: formData.tipePembelian === "PEMBELIAN_LANGSUNG" ? formData.vendorAddressDirect : undefined,
          vendorPhoneDirect: formData.tipePembelian === "PEMBELIAN_LANGSUNG" ? formData.vendorPhoneDirect : undefined,
          keterangan: formData.keterangan || undefined,
          items: items.map((item) => ({
            materialId: item.materialId,
            jumlahRequest: Number(item.jumlahRequest),
            estimasiHarga: Number(item.estimasiHarga),
            keterangan: item.keterangan || undefined,
          })),
        }),
      });

      if (response.ok) {
        toast.success("Purchase Request berhasil dibuat");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal membuat Purchase Request");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat Purchase Request Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tanggalRequest">Tanggal Request *</Label>
              <Input
                id="tanggalRequest"
                type="date"
                value={formData.tanggalRequest}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalRequest: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipePembelian">Tipe Pembelian *</Label>
              <Select
                value={formData.tipePembelian}
                onValueChange={(value: "PEMBELIAN_LANGSUNG" | "PENGAJUAN_PO") =>
                  setFormData({ ...formData, tipePembelian: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe pembelian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEMBELIAN_LANGSUNG">Pembelian Langsung</SelectItem>
                  <SelectItem value="PENGAJUAN_PO">Pengajuan PO</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.tipePembelian === "PEMBELIAN_LANGSUNG"
                  ? "Setelah approved, langsung ke penerimaan barang"
                  : "Setelah approved, akan masuk ke daftar PO"}
              </p>
            </div>

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

            {/* Vendor fields - only for direct purchase */}
            {formData.tipePembelian === "PEMBELIAN_LANGSUNG" && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>Mode Input Vendor</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={vendorInputMode === "select" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVendorInputMode("select")}
                    >
                      Pilih dari Daftar
                    </Button>
                    <Button
                      type="button"
                      variant={vendorInputMode === "manual" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setVendorInputMode("manual");
                        setFormData({
                          ...formData,
                          vendorNameDirect: "",
                          vendorPhoneDirect: "",
                          vendorAddressDirect: "",
                        });
                      }}
                    >
                      Input Manual
                    </Button>
                  </div>
                </div>

                {vendorInputMode === "select" && vendors.length > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vendorSelect">Pilih Vendor Material *</Label>
                    <SearchableSelect
                      options={vendors.map((vendor) => ({
                        value: vendor.id,
                        label: `${vendor.code} - ${vendor.name}`,
                        sublabel: vendor.address,
                      }))}
                      onValueChange={handleVendorSelect}
                      placeholder="Pilih vendor dari daftar"
                      searchPlaceholder="Cari vendor..."
                      emptyMessage="Vendor tidak ditemukan"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="vendorNameDirect">Nama Vendor *</Label>
                  <Input
                    id="vendorNameDirect"
                    value={formData.vendorNameDirect}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorNameDirect: e.target.value })
                    }
                    placeholder="Nama vendor"
                    required
                    readOnly={vendorInputMode === "select" && !!formData.vendorNameDirect}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendorPhoneDirect">Telepon Vendor</Label>
                  <Input
                    id="vendorPhoneDirect"
                    value={formData.vendorPhoneDirect}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorPhoneDirect: e.target.value })
                    }
                    placeholder="Nomor telepon vendor"
                    readOnly={vendorInputMode === "select" && !!formData.vendorPhoneDirect}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="vendorAddressDirect">Alamat Vendor</Label>
                  <Textarea
                    id="vendorAddressDirect"
                    value={formData.vendorAddressDirect}
                    onChange={(e) =>
                      setFormData({ ...formData, vendorAddressDirect: e.target.value })
                    }
                    placeholder="Alamat lengkap vendor"
                    readOnly={vendorInputMode === "select" && !!formData.vendorAddressDirect}
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
                placeholder="Keterangan tambahan"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Daftar Material</Label>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Item
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Material</TableHead>
                    <TableHead className="w-[120px]">Jumlah</TableHead>
                    <TableHead className="w-[150px]">Estimasi Harga</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const selectedMaterial = materials.find(
                      (m) => m.id === item.materialId
                    );
                    return (
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
                              sublabel: `Stock: ${material.stockOnHand} ${material.satuanMaterial.symbol}`,
                            }))}
                            placeholder="Pilih material"
                            searchPlaceholder="Cari material..."
                            emptyMessage="Material tidak ditemukan"
                          />
                        </TableCell>
                        <TableCell>
                          <NumericInput
                            value={item.jumlahRequest}
                            onValueChange={(val) =>
                              updateItem(
                                index,
                                "jumlahRequest",
                                val
                              )
                            }
                            min={0}
                            step={0.01}
                          />
                          {selectedMaterial && (
                            <span className="text-xs text-muted-foreground">
                              {selectedMaterial.satuanMaterial.symbol}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <NumericInput
                            value={item.estimasiHarga}
                            onValueChange={(val) =>
                              updateItem(
                                index,
                                "estimasiHarga",
                                val
                              )
                            }
                            min={0}
                            step={0.01}
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan PR"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
