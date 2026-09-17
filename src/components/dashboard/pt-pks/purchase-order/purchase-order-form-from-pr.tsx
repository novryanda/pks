"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, ArrowLeft, FileText, Package } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { NumericInput } from "@/components/ui/numeric-input";

interface Material {
  id: string;
  partNumber: string;
  namaMaterial: string;
  hargaSatuan?: number;
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

interface PurchaseRequestItem {
  id: string;
  jumlahRequest: number;
  jumlahPOCreated: number;  // Jumlah yang sudah di-PO
  estimasiHarga: number;
  keterangan?: string;
  material: Material;
}

interface PurchaseOrder {
  id: string;
  nomorPO: string;
  vendorName: string;
  status: string;
}

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  tipePembelian: string;
  divisi?: string;
  requestedBy: string;
  status: string;
  keterangan?: string;
  items: PurchaseRequestItem[];
  purchaseOrders?: PurchaseOrder[];
}

interface POItem {
  materialId: string;
  jumlahOrder: number;
  hargaSatuan: number;
  keterangan?: string;
  // PR Item mapping
  prItemId?: string;
  prItemMaxQty?: number;  // Sisa quantity yang bisa di-PO
}

interface SelectedPRItem {
  prItemId: string;
  materialId: string;
  materialName: string;
  materialPartNumber: string;
  satuanSymbol: string;
  maxQty: number;  // Sisa quantity
  jumlahOrder: number;
  hargaSatuan: number;
  keterangan: string;
  selected: boolean;
}

interface PurchaseOrderFormFromPRProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function PurchaseOrderFormFromPR({ onSuccess, onBack }: PurchaseOrderFormFromPRProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPRs, setLoadingPRs] = useState(true);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [vendors, setVendors] = useState<VendorMaterial[]>([]);
  const [vendorInputMode, setVendorInputMode] = useState<"select" | "manual">("select");
  const [pendingPRs, setPendingPRs] = useState<PurchaseRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  // State untuk item yang dipilih dari PR
  const [prItems, setPrItems] = useState<SelectedPRItem[]>([]);

  const [formData, setFormData] = useState({
    purchaseRequestId: "",
    vendorMaterialId: "",
    vendorName: "",
    vendorPhone: "",
    vendorAddress: "",
    termPembayaran: "",
    tanggalKirimDiharapkan: new Date().toISOString().split("T")[0],
    issuedBy: "",
    taxPercent: 0,
    discountType: "" as "" | "PERCENT" | "AMOUNT",
    discountPercent: 0,
    discountAmount: 0,
    shipping: 0,
    keterangan: "",
  });

  const [items, setItems] = useState<POItem[]>([]);

  useEffect(() => {
    fetchPendingPRs();
    fetchMaterials();
    fetchVendors();
  }, []);

  const fetchPendingPRs = async () => {
    setLoadingPRs(true);
    try {
      const response = await fetch("/api/pt-pks/purchase-order/pending-prs");
      if (response.ok) {
        const data = await response.json();
        setPendingPRs(data);
      }
    } catch (error) {
      console.error("Error fetching pending PRs:", error);
    } finally {
      setLoadingPRs(false);
    }
  };

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

  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    setSelectedVendorId(vendorId);
    if (vendor) {
      setFormData({
        ...formData,
        vendorMaterialId: vendorId,
        vendorName: vendor.name,
        vendorPhone: vendor.phone,
        vendorAddress: vendor.address,
      });
    }
  };

  const handlePRSelect = (prId: string) => {
    if (prId === "none" || !prId) {
      setSelectedPR(null);
      setFormData({ ...formData, purchaseRequestId: "" });
      setPrItems([]);
      setItems([]);
      return;
    }

    const pr = pendingPRs.find((p) => p.id === prId);
    setSelectedPR(pr || null);
    setFormData({ ...formData, purchaseRequestId: prId });

    if (pr) {
      // Populate PR items dengan sisa quantity
      const prItemsList: SelectedPRItem[] = pr.items
        .map((item) => {
          const remaining = item.jumlahRequest - (item.jumlahPOCreated || 0);
          return {
            prItemId: item.id,
            materialId: item.material.id,
            materialName: item.material.namaMaterial,
            materialPartNumber: item.material.partNumber,
            satuanSymbol: item.material.satuanMaterial.symbol,
            maxQty: remaining,
            jumlahOrder: remaining,  // Default to remaining quantity
            hargaSatuan: item.estimasiHarga || item.material.hargaSatuan || 0,
            keterangan: item.keterangan || "",
            selected: remaining > 0,  // Auto-select if has remaining qty
          };
        })
        .filter((item) => item.maxQty > 0);  // Only show items with remaining qty

      setPrItems(prItemsList);
      setItems([]);  // Clear manual items, will use prItems
    } else {
      setPrItems([]);
      setItems([]);
    }
  };

  // Toggle PR item selection
  const togglePRItemSelection = (prItemId: string) => {
    setPrItems(prItems.map(item =>
      item.prItemId === prItemId
        ? { ...item, selected: !item.selected }
        : item
    ));
  };

  // Update PR item quantity
  const updatePRItemQuantity = (prItemId: string, quantity: number) => {
    setPrItems(prItems.map(item =>
      item.prItemId === prItemId
        ? { ...item, jumlahOrder: Math.min(quantity, item.maxQty) }
        : item
    ));
  };

  // Update PR item price
  const updatePRItemPrice = (prItemId: string, price: number) => {
    setPrItems(prItems.map(item =>
      item.prItemId === prItemId
        ? { ...item, hargaSatuan: price }
        : item
    ));
  };

  // Update PR item keterangan
  const updatePRItemKeterangan = (prItemId: string, keterangan: string) => {
    setPrItems(prItems.map(item =>
      item.prItemId === prItemId
        ? { ...item, keterangan }
        : item
    ));
  };

  // Get selected PR items for submission
  const getSelectedPRItems = () => {
    return prItems.filter(item => item.selected && item.jumlahOrder > 0);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        materialId: "",
        jumlahOrder: 0,
        hargaSatuan: 0,
        keterangan: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    if (currentItem) {
      newItems[index] = {
        ...currentItem,
        [field]: value,
      };
      setItems(newItems);
    }
  };

  // Combine PR items and manual items for subtotal calculation
  const allItems = [
    ...getSelectedPRItems().map(item => ({
      jumlahOrder: item.jumlahOrder,
      hargaSatuan: item.hargaSatuan,
    })),
    ...items.filter(item => item.materialId).map(item => ({
      jumlahOrder: item.jumlahOrder,
      hargaSatuan: item.hargaSatuan,
    })),
  ];

  const subtotal = allItems.reduce(
    (sum, item) => sum + item.jumlahOrder * item.hargaSatuan,
    0
  );

  // Calculate discount
  const calculatedDiscountAmount = formData.discountType === "PERCENT"
    ? (subtotal * formData.discountPercent) / 100
    : formData.discountType === "AMOUNT"
      ? formData.discountAmount
      : 0;

  // Subtotal after discount
  const subtotalAfterDiscount = subtotal - calculatedDiscountAmount;

  // Calculate tax
  const taxAmount = (subtotalAfterDiscount * formData.taxPercent) / 100;

  // Total nilai
  const totalNilai = subtotalAfterDiscount + taxAmount + Number(formData.shipping);

  // Check if we have any items to submit
  const hasItems = getSelectedPRItems().length > 0 || items.some(item => item.materialId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorName || !formData.issuedBy) {
      toast.error("Nama vendor dan diterbitkan oleh wajib diisi");
      return;
    }

    const selectedPRItems = getSelectedPRItems();
    const validManualItems = items.filter(item => item.materialId);

    if (selectedPRItems.length === 0 && validManualItems.length === 0) {
      toast.error("Minimal 1 item material harus dipilih");
      return;
    }

    // Validate selected PR items
    for (const item of selectedPRItems) {
      if (item.jumlahOrder <= 0) {
        toast.error(`Jumlah order untuk ${item.materialName} harus lebih dari 0`);
        return;
      }
      if (item.jumlahOrder > item.maxQty) {
        toast.error(`Jumlah order untuk ${item.materialName} melebihi sisa quantity (${item.maxQty})`);
        return;
      }
      if (item.hargaSatuan <= 0) {
        toast.error(`Harga satuan untuk ${item.materialName} harus lebih dari 0`);
        return;
      }
    }

    // Validate manual items
    for (const item of validManualItems) {
      if (item.jumlahOrder <= 0) {
        toast.error("Jumlah order harus lebih dari 0");
        return;
      }
      if (item.hargaSatuan <= 0) {
        toast.error("Harga satuan harus lebih dari 0");
        return;
      }
    }

    setLoading(true);
    try {
      // Build items array with PR mappings
      const submitItems = [
        // Items from PR with mappings
        ...selectedPRItems.map(item => ({
          materialId: item.materialId,
          jumlahOrder: Number(item.jumlahOrder),
          hargaSatuan: Number(item.hargaSatuan),
          keterangan: item.keterangan || undefined,
          prItemMappings: [{
            purchaseRequestItemId: item.prItemId,
            quantity: Number(item.jumlahOrder),
          }],
        })),
        // Manual items without mappings
        ...validManualItems.map(item => ({
          materialId: item.materialId,
          jumlahOrder: Number(item.jumlahOrder),
          hargaSatuan: Number(item.hargaSatuan),
          keterangan: item.keterangan || undefined,
        })),
      ];

      const response = await fetch("/api/pt-pks/purchase-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseRequestId: formData.purchaseRequestId || undefined,
          vendorMaterialId: formData.vendorMaterialId || undefined,
          vendorName: formData.vendorName,
          vendorPhone: formData.vendorPhone || undefined,
          vendorAddress: formData.vendorAddress || undefined,
          termPembayaran: formData.termPembayaran || undefined,
          tanggalKirimDiharapkan: formData.tanggalKirimDiharapkan || undefined,
          issuedBy: formData.issuedBy,
          taxPercent: Number(formData.taxPercent),
          discountType: formData.discountType || undefined,
          discountPercent: Number(formData.discountPercent),
          discountAmount: Number(formData.discountAmount),
          shipping: Number(formData.shipping),
          keterangan: formData.keterangan || undefined,
          items: submitItems,
        }),
      });

      if (response.ok) {
        toast.success("Purchase Order berhasil dibuat");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/pt-pks/gudang/purchase-order");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal membuat Purchase Order");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/pt-pks/gudang/purchase-order");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Buat Purchase Order</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Buat PO baru dengan referensi dari Purchase Request yang sudah diapprove. Satu PR dapat menghasilkan banyak PO.
            </p>
          </div>
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PR Reference Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <Label className="text-lg font-semibold">Referensi Purchase Request (Opsional)</Label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchaseRequestId">Pilih PR yang Sudah Diapprove</Label>
                <Select
                  value={formData.purchaseRequestId}
                  onValueChange={handlePRSelect}
                  disabled={loadingPRs}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingPRs ? "Memuat..." : "Pilih PR (opsional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa Referensi PR</SelectItem>
                    {pendingPRs.map((pr) => (
                      <SelectItem key={pr.id} value={pr.id}>
                        {pr.nomorPR} - {pr.requestedBy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pilih PR untuk mengisi data material secara otomatis
                </p>
              </div>

              {selectedPR && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Detail PR Terpilih</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nomor:</span>
                      <span className="font-medium">{selectedPR.nomorPR}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pemohon:</span>
                      <span>{selectedPR.requestedBy}</span>
                    </div>
                    {selectedPR.divisi && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Divisi:</span>
                        <span>{selectedPR.divisi}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Item:</span>
                      <Badge variant="secondary">{selectedPR.items.length} item</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Item Tersedia:</span>
                      <Badge variant={prItems.length > 0 ? "default" : "destructive"}>
                        {prItems.length} item
                      </Badge>
                    </div>
                    {selectedPR.purchaseOrders && selectedPR.purchaseOrders.length > 0 && (
                      <div className="pt-2 border-t mt-2">
                        <span className="text-muted-foreground text-xs">PO sebelumnya:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedPR.purchaseOrders.map((po) => (
                            <Badge key={po.id} variant="outline" className="text-xs">
                              {po.nomorPO}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Information */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Informasi Vendor *</Label>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Vendor Selection Mode */}
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
                      setSelectedVendorId("");
                      setFormData({
                        ...formData,
                        vendorMaterialId: "",
                        vendorName: "",
                        vendorPhone: "",
                        vendorAddress: "",
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
                    value={selectedVendorId}
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
                <Label htmlFor="vendorName">Nama Vendor *</Label>
                <Input
                  id="vendorName"
                  value={formData.vendorName}
                  onChange={(e) =>
                    setFormData({ ...formData, vendorName: e.target.value })
                  }
                  placeholder="Masukkan nama vendor"
                  required
                  readOnly={vendorInputMode === "select" && !!formData.vendorName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorPhone">Telepon Vendor</Label>
                <Input
                  id="vendorPhone"
                  value={formData.vendorPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, vendorPhone: e.target.value })
                  }
                  placeholder="08xx-xxxx-xxxx"
                  readOnly={vendorInputMode === "select" && !!formData.vendorPhone}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vendorAddress">Alamat Vendor</Label>
                <Textarea
                  id="vendorAddress"
                  value={formData.vendorAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, vendorAddress: e.target.value })
                  }
                  placeholder="Alamat lengkap vendor"
                  readOnly={vendorInputMode === "select" && !!formData.vendorAddress}
                />
              </div>
            </div>
          </div>

          {/* PO Information */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Informasi PO</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issuedBy">Diterbitkan Oleh *</Label>
                <Input
                  id="issuedBy"
                  value={formData.issuedBy}
                  onChange={(e) =>
                    setFormData({ ...formData, issuedBy: e.target.value })
                  }
                  placeholder="Nama penerbit PO"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggalKirimDiharapkan">Tanggal Pengiriman Diharapkan</Label>
                <Input
                  id="tanggalKirimDiharapkan"
                  type="date"
                  value={formData.tanggalKirimDiharapkan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tanggalKirimDiharapkan: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="termPembayaran">Term Pembayaran</Label>
                <Input
                  id="termPembayaran"
                  value={formData.termPembayaran}
                  onChange={(e) =>
                    setFormData({ ...formData, termPembayaran: e.target.value })
                  }
                  placeholder="Net 30, Net 60, dll"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Input
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) =>
                    setFormData({ ...formData, keterangan: e.target.value })
                  }
                  placeholder="Keterangan tambahan"
                />
              </div>
            </div>
          </div>

          {/* PR Items Selection - Show when PR is selected */}
          {selectedPR && prItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-semibold">Pilih Material dari PR</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Centang material yang ingin dimasukkan ke PO ini. Anda dapat membuat beberapa PO dari satu PR.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrItems(prItems.map(item => ({ ...item, selected: true })))}
                  >
                    Pilih Semua
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrItems(prItems.map(item => ({ ...item, selected: false })))}
                  >
                    Hapus Semua
                  </Button>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Pilih</TableHead>
                      <TableHead className="min-w-[250px]">Material</TableHead>
                      <TableHead className="min-w-[100px]">Sisa Qty</TableHead>
                      <TableHead className="min-w-[120px]">Jumlah PO</TableHead>
                      <TableHead className="min-w-[150px]">Harga Satuan</TableHead>
                      <TableHead className="min-w-[150px] text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prItems.map((item) => {
                      const itemTotal = item.selected ? item.jumlahOrder * item.hargaSatuan : 0;
                      return (
                        <TableRow key={item.prItemId} className={!item.selected ? "opacity-50" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={item.selected}
                              onCheckedChange={() => togglePRItemSelection(item.prItemId)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.materialName}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.materialPartNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {item.maxQty} {item.satuanSymbol}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <NumericInput
                                value={item.jumlahOrder}
                                onValueChange={(val) =>
                                  updatePRItemQuantity(item.prItemId, val || 0)
                                }
                                min={0}
                                max={item.maxQty}
                                step={0.01}
                                className="w-24"
                                disabled={!item.selected}
                              />
                              <span className="text-sm text-muted-foreground">
                                {item.satuanSymbol}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <NumericInput
                              value={item.hargaSatuan}
                              onValueChange={(val) =>
                                updatePRItemPrice(item.prItemId, val || 0)
                              }
                              min={0}
                              step={0.01}
                              className="w-32"
                              disabled={!item.selected}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.selected ? `Rp ${itemTotal.toLocaleString("id-ID")}` : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary of selected PR items */}
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{getSelectedPRItems().length}</strong> dari <strong>{prItems.length}</strong> material dipilih
                </span>
                <span className="text-sm text-muted-foreground">
                  Total: Rp {getSelectedPRItems().reduce((sum, item) => sum + item.jumlahOrder * item.hargaSatuan, 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          )}

          {/* Additional Manual Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-lg font-semibold">
                  {selectedPR ? "Material Tambahan (Opsional)" : "Daftar Material"}
                </Label>
                {selectedPR && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Tambah material lain yang tidak ada di PR
                  </p>
                )}
              </div>
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
                    <TableHead className="min-w-[150px]">Keterangan</TableHead>
                    <TableHead className="w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {selectedPR
                          ? "Tidak ada material tambahan. Klik 'Tambah Item' untuk menambah material lain."
                          : "Belum ada item. Pilih PR untuk mengisi otomatis atau tambah item manual."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => {
                      const selectedMaterial = materials.find(
                        (m) => m.id === item.materialId
                      );
                      const itemTotal = item.jumlahOrder * item.hargaSatuan;
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
                                sublabel: material.satuanMaterial.symbol,
                              }))}
                              placeholder="Pilih material"
                              searchPlaceholder="Cari material..."
                              emptyMessage="Material tidak ditemukan"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <NumericInput
                                value={item.jumlahOrder}
                                onValueChange={(val) =>
                                  updateItem(
                                    index,
                                    "jumlahOrder",
                                    val
                                  )
                                }
                                min={0}
                                step={0.01}
                                className="w-24"
                              />
                              {selectedMaterial && (
                                <span className="text-sm text-muted-foreground">
                                  {selectedMaterial.satuanMaterial.symbol}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <NumericInput
                              value={item.hargaSatuan}
                              onValueChange={(val) =>
                                updateItem(
                                  index,
                                  "hargaSatuan",
                                  val
                                )
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
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Summary - Show when there are any items */}
          {hasItems && (
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="discountType" className="text-muted-foreground">Tipe Diskon:</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        discountType: value as "" | "PERCENT" | "AMOUNT",
                        discountPercent: 0,
                        discountAmount: 0,
                      })
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
                  <div className="flex justify-between items-center">
                    <Label htmlFor="discountPercent" className="text-muted-foreground">Diskon (%):</Label>
                    <Input
                      id="discountPercent"
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) =>
                        setFormData({ ...formData, discountPercent: Number(e.target.value) })
                      }
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-32"
                    />
                  </div>
                )}
                {formData.discountType === "AMOUNT" && (
                  <div className="flex justify-between items-center">
                    <Label htmlFor="discountAmount" className="text-muted-foreground">Diskon (Rp):</Label>
                    <NumericInput
                      id="discountAmount"
                      value={formData.discountAmount}
                      onValueChange={(val) =>
                        setFormData({ ...formData, discountAmount: val || 0 })
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
                    <span className="font-medium">- Rp {calculatedDiscountAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <Label htmlFor="taxPercent" className="text-muted-foreground">PPN (%):</Label>
                  <Input
                    id="taxPercent"
                    type="number"
                    value={formData.taxPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, taxPercent: Number(e.target.value) })
                    }
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-32"
                  />
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nilai PPN:</span>
                    <span className="font-medium">Rp {taxAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <Label htmlFor="shipping" className="text-muted-foreground">Biaya Kirim (Rp):</Label>
                  <NumericInput
                    id="shipping"
                    value={formData.shipping}
                    onValueChange={(val) =>
                      setFormData({ ...formData, shipping: val || 0 })
                    }
                    min={0}
                    step={0.01}
                    className="w-32"
                  />
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Total Nilai PO:</span>
                  <span className="font-bold text-lg">Rp {totalNilai.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleBack}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || !hasItems}>
              {loading ? "Menyimpan..." : "Simpan Purchase Order"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
