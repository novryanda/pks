"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";

interface Material {
  id: string;
  partNumber: string;
  namaMaterial: string;
  satuanMaterial: {
    symbol: string;
  };
}

interface VendorMaterial {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
}

interface PurchaseOrderEditItem {
  id?: string;
  materialId: string;
  jumlahOrder: number;
  hargaSatuan: number;
  keterangan?: string;
  prItemId?: string;
  prItemMaxQty?: number;
  prLabel?: string;
}

interface PurchaseOrderEditData {
  id: string;
  nomorPO: string;
  status: string;
  purchaseRequestId?: string | null;
  purchaseRequest?: {
    id: string;
    nomorPR: string;
  } | null;
  vendorMaterialId?: string | null;
  vendorName: string;
  vendorPhone?: string | null;
  vendorAddress?: string | null;
  tanggalKirimDiharapkan?: string | null;
  termPembayaran?: string | null;
  issuedBy: string;
  taxPercent: number;
  discountType?: "PERCENT" | "AMOUNT" | null;
  discountPercent: number;
  discountAmount: number;
  shipping: number;
  keterangan?: string | null;
  items: PurchaseOrderEditItem[];
}

export function PurchaseOrderEditForm({
  purchaseOrder,
}: {
  purchaseOrder: PurchaseOrderEditData;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [vendors, setVendors] = useState<VendorMaterial[]>([]);
  const [vendorInputMode, setVendorInputMode] = useState<"select" | "manual">(
    purchaseOrder.vendorMaterialId ? "select" : "manual"
  );
  const [selectedVendorId, setSelectedVendorId] = useState(
    purchaseOrder.vendorMaterialId || ""
  );
  const [formData, setFormData] = useState({
    vendorMaterialId: purchaseOrder.vendorMaterialId || "",
    vendorName: purchaseOrder.vendorName || "",
    vendorPhone: purchaseOrder.vendorPhone || "",
    vendorAddress: purchaseOrder.vendorAddress || "",
    termPembayaran: purchaseOrder.termPembayaran || "",
    tanggalKirimDiharapkan: purchaseOrder.tanggalKirimDiharapkan
      ? new Date(purchaseOrder.tanggalKirimDiharapkan).toISOString().split("T")[0] || ""
      : "",
    issuedBy: purchaseOrder.issuedBy || "",
    taxPercent: purchaseOrder.taxPercent || 0,
    discountType: (purchaseOrder.discountType || "") as "" | "PERCENT" | "AMOUNT",
    discountPercent: purchaseOrder.discountPercent || 0,
    discountAmount: purchaseOrder.discountAmount || 0,
    shipping: purchaseOrder.shipping || 0,
    keterangan: purchaseOrder.keterangan || "",
  });
  const [items, setItems] = useState<PurchaseOrderEditItem[]>(purchaseOrder.items);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, vendorsRes] = await Promise.all([
          fetch("/api/pt-pks/material-inventaris"),
          fetch("/api/pt-pks/vendor-material?dropdown=true"),
        ]);

        if (materialsRes.ok) {
          setMaterials(await materialsRes.json());
        }

        if (vendorsRes.ok) {
          const data = await vendorsRes.json();
          setVendors(data.vendors || []);
        }
      } catch (error) {
        console.error("Error fetching edit PO data:", error);
      }
    };

    void fetchData();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.jumlahOrder * item.hargaSatuan, 0),
    [items]
  );

  const calculatedDiscountAmount = useMemo(() => {
    if (formData.discountType === "PERCENT") {
      return (subtotal * formData.discountPercent) / 100;
    }

    if (formData.discountType === "AMOUNT") {
      return formData.discountAmount;
    }

    return 0;
  }, [formData.discountAmount, formData.discountPercent, formData.discountType, subtotal]);

  const subtotalAfterDiscount = subtotal - calculatedDiscountAmount;
  const taxAmount = (subtotalAfterDiscount * formData.taxPercent) / 100;
  const totalNilai = subtotalAfterDiscount + taxAmount + Number(formData.shipping || 0);

  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find((item) => item.id === vendorId);
    setSelectedVendorId(vendorId);

    if (!vendor) return;

    setFormData((prev) => ({
      ...prev,
      vendorMaterialId: vendor.id,
      vendorName: vendor.name,
      vendorPhone: vendor.phone,
      vendorAddress: vendor.address,
    }));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        materialId: "",
        jumlahOrder: 0,
        hargaSatuan: 0,
        keterangan: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (
    index: number,
    field: keyof PurchaseOrderEditItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.vendorName || !formData.issuedBy) {
      toast.error("Nama vendor dan diterbitkan oleh wajib diisi");
      return;
    }

    if (items.length === 0 || items.some((item) => !item.materialId || item.jumlahOrder <= 0 || item.hargaSatuan <= 0)) {
      toast.error("Semua item wajib memiliki material, jumlah, dan harga satuan yang valid");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/pt-pks/purchase-order/${purchaseOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorMaterialId:
            vendorInputMode === "select" ? formData.vendorMaterialId || undefined : undefined,
          vendorName: formData.vendorName,
          vendorPhone: formData.vendorPhone || undefined,
          vendorAddress: formData.vendorAddress || undefined,
          termPembayaran: formData.termPembayaran || undefined,
          tanggalKirimDiharapkan: formData.tanggalKirimDiharapkan || undefined,
          issuedBy: formData.issuedBy,
          taxPercent: Number(formData.taxPercent),
          discountType: formData.discountType || undefined,
          discountPercent: Number(formData.discountPercent || 0),
          discountAmount: Number(formData.discountAmount || 0),
          shipping: Number(formData.shipping || 0),
          keterangan: formData.keterangan || undefined,
          items: items.map((item) => ({
            materialId: item.materialId,
            jumlahOrder: Number(item.jumlahOrder),
            hargaSatuan: Number(item.hargaSatuan),
            keterangan: item.keterangan || undefined,
            prItemMappings: item.prItemId
              ? [
                  {
                    purchaseRequestItemId: item.prItemId,
                    quantity: Number(item.jumlahOrder),
                  },
                ]
              : undefined,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal memperbarui Purchase Order");
      }

      toast.success("Purchase Order berhasil diperbarui");
      router.push("/dashboard/pt-pks/gudang/purchase-order");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Purchase Order {purchaseOrder.nomorPO}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Hanya PO dengan status draft yang bisa diedit.
            </p>
          </div>
          <Button variant="ghost" onClick={() => router.push("/dashboard/pt-pks/gudang/purchase-order")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {purchaseOrder.purchaseRequest && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Referensi PR</Label>
                <Badge variant="outline">{purchaseOrder.purchaseRequest.nomorPR}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Item yang berasal dari PR tetap mempertahankan alokasi ke PR saat draft PO diedit.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Informasi Vendor</Label>
            <div className="space-y-2">
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
                    setSelectedVendorId("");
                    setFormData((prev) => ({
                      ...prev,
                      vendorMaterialId: "",
                    }));
                  }}
                >
                  Input Manual
                </Button>
              </div>
            </div>

            {vendorInputMode === "select" && vendors.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="vendorSelect">Pilih Vendor Material</Label>
                <SearchableSelect
                  value={selectedVendorId}
                  onValueChange={handleVendorSelect}
                  options={vendors.map((vendor) => ({
                    value: vendor.id,
                    label: `${vendor.code} - ${vendor.name}`,
                    sublabel: vendor.address,
                  }))}
                  placeholder="Pilih vendor"
                  searchPlaceholder="Cari vendor..."
                  emptyMessage="Vendor tidak ditemukan"
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Nama Vendor *</Label>
                <Input
                  id="vendorName"
                  value={formData.vendorName}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, vendorName: event.target.value }))
                  }
                  readOnly={vendorInputMode === "select" && !!formData.vendorName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorPhone">Telepon Vendor</Label>
                <Input
                  id="vendorPhone"
                  value={formData.vendorPhone}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, vendorPhone: event.target.value }))
                  }
                  readOnly={vendorInputMode === "select" && !!formData.vendorPhone}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vendorAddress">Alamat Vendor</Label>
                <Textarea
                  id="vendorAddress"
                  value={formData.vendorAddress}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, vendorAddress: event.target.value }))
                  }
                  readOnly={vendorInputMode === "select" && !!formData.vendorAddress}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-semibold">Informasi PO</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issuedBy">Diterbitkan Oleh *</Label>
                <Input
                  id="issuedBy"
                  value={formData.issuedBy}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, issuedBy: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggalKirimDiharapkan">Tanggal Pengiriman Diharapkan</Label>
                <Input
                  id="tanggalKirimDiharapkan"
                  type="date"
                  value={formData.tanggalKirimDiharapkan}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      tanggalKirimDiharapkan: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="termPembayaran">Term Pembayaran</Label>
                <Input
                  id="termPembayaran"
                  value={formData.termPembayaran}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, termPembayaran: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Input
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, keterangan: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Daftar Material</Label>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Item
              </Button>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Material</TableHead>
                    <TableHead className="min-w-[120px]">Jumlah</TableHead>
                    <TableHead className="min-w-[150px]">Harga Satuan</TableHead>
                    <TableHead className="min-w-[150px] text-right">Total</TableHead>
                    <TableHead className="min-w-[180px]">Keterangan</TableHead>
                    <TableHead className="w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const selectedMaterial = materials.find((material) => material.id === item.materialId);
                    const itemTotal = item.jumlahOrder * item.hargaSatuan;
                    const itemMaxQty = item.prItemMaxQty;

                    return (
                      <TableRow key={item.id || index}>
                        <TableCell>
                          {item.prItemId ? (
                            <div className="space-y-1">
                              <div className="font-medium">
                                {selectedMaterial
                                  ? `${selectedMaterial.partNumber} - ${selectedMaterial.namaMaterial}`
                                  : item.prLabel || "Item dari PR"}
                              </div>
                              <Badge variant="outline">Terhubung ke PR</Badge>
                            </div>
                          ) : (
                            <SearchableSelect
                              value={item.materialId}
                              onValueChange={(value) => updateItem(index, "materialId", value)}
                              options={materials.map((material) => ({
                                value: material.id,
                                label: `${material.partNumber} - ${material.namaMaterial}`,
                                sublabel: material.satuanMaterial.symbol,
                              }))}
                              placeholder="Pilih material"
                              searchPlaceholder="Cari material..."
                              emptyMessage="Material tidak ditemukan"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <NumericInput
                                value={item.jumlahOrder}
                                onValueChange={(value) =>
                                  updateItem(
                                    index,
                                    "jumlahOrder",
                                    itemMaxQty ? Math.min(value || 0, itemMaxQty) : value || 0
                                  )
                                }
                                min={0}
                                max={itemMaxQty}
                                step={0.01}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">
                                {selectedMaterial?.satuanMaterial.symbol || ""}
                              </span>
                            </div>
                            {itemMaxQty ? (
                              <p className="text-xs text-muted-foreground">
                                Maksimal dari PR: {itemMaxQty.toLocaleString("id-ID")}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <NumericInput
                            value={item.hargaSatuan}
                            onValueChange={(value) =>
                              updateItem(index, "hargaSatuan", value || 0)
                            }
                            min={0}
                            step={0.01}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rp {itemTotal.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.keterangan || ""}
                            onChange={(event) =>
                              updateItem(index, "keterangan", event.target.value)
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
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 rounded-lg bg-muted p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center">
                <Label htmlFor="discountType" className="text-muted-foreground">
                  Tipe Diskon:
                </Label>
                <Select
                  value={formData.discountType || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      discountType: value === "none" ? "" : (value as "PERCENT" | "AMOUNT"),
                      discountPercent: 0,
                      discountAmount: 0,
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tanpa Diskon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Diskon</SelectItem>
                    <SelectItem value="PERCENT">Persen (%)</SelectItem>
                    <SelectItem value="AMOUNT">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.discountType === "PERCENT" && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="discountPercent" className="text-muted-foreground">
                    Diskon (%):
                  </Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    value={formData.discountPercent}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountPercent: Number(event.target.value),
                      }))
                    }
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-32"
                  />
                </div>
              )}
              {formData.discountType === "AMOUNT" && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="discountAmount" className="text-muted-foreground">
                    Diskon (Rp):
                  </Label>
                  <NumericInput
                    id="discountAmount"
                    value={formData.discountAmount}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        discountAmount: value || 0,
                      }))
                    }
                    min={0}
                    step={0.01}
                    className="w-32"
                  />
                </div>
              )}
              {calculatedDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Potongan Diskon:</span>
                  <span className="font-medium">
                    - Rp {calculatedDiscountAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="taxPercent" className="text-muted-foreground">
                  PPN (%):
                </Label>
                <Input
                  id="taxPercent"
                  type="number"
                  value={formData.taxPercent}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      taxPercent: Number(event.target.value),
                    }))
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-32"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="shipping" className="text-muted-foreground">
                  Biaya Kirim (Rp):
                </Label>
                <NumericInput
                  id="shipping"
                  value={formData.shipping}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, shipping: value || 0 }))
                  }
                  min={0}
                  step={0.01}
                  className="w-32"
                />
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Total Nilai PO:</span>
                <span className="font-bold text-lg">Rp {totalNilai.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/pt-pks/gudang/purchase-order")}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
