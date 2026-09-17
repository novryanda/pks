"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NumericInput } from "@/components/ui/numeric-input";

interface PurchaseOrder {
  id: string;
  nomorPO: string;
  vendorName: string;
  items: Array<{
    id: string;
    jumlahOrder: number;
    jumlahDiterima: number;
    hargaSatuan: number;
    material: {
      id: string;
      partNumber: string;
      namaMaterial: string;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  judulPermintaan: string;
  vendorNameDirect?: string;
  items: Array<{
    id: string;
    materialId: string;
    jumlahRequest: number;
    estimasiHarga?: number;
    material: {
      id: string;
      partNumber: string;
      namaMaterial: string;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

interface PenerimaanItem {
  materialId?: string;
  purchaseOrderItemId?: string;
  jumlahDiterima: number;
  hargaSatuan: number;
  lokasiPenyimpanan?: string;
  keterangan?: string;
}

export function PenerimaanBarangForm({ onSuccess }: { onSuccess: () => void }) {
  const searchParams = useSearchParams();
  const poIdParam = searchParams.get("poId");

  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<"PO" | "PR">("PO");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);

  const [formData, setFormData] = useState({
    purchaseOrderId: "",
    purchaseRequestId: "",
    vendorId: "",
    vendorName: "",
    tanggalPenerimaan: new Date().toISOString().split("T")[0],
    receivedBy: "",
    nomorSuratJalan: "",
    tanggalSuratJalan: "",
    nomorInvoice: "",
    tanggalInvoice: "",
    keterangan: "",
  });

  const [items, setItems] = useState<PenerimaanItem[]>([]);

  useEffect(() => {
    if (sourceType === "PO") {
      fetchPurchaseOrders();
    } else {
      fetchApprovedPRs();
    }
  }, [sourceType]);

  const applyPOSelection = useCallback((poId: string, poList: PurchaseOrder[]) => {
    const po = poList.find((p) => p.id === poId);
    setSelectedPO(po || null);
    if (po) {
      setFormData((prev) => ({
        ...prev,
        purchaseOrderId: po.id,
        purchaseRequestId: "",
        vendorId: "vendor-po",
        vendorName: po.vendorName || "",
      }));

      const initialItems = po.items.map((item) => {
        const sisa = Math.max(0, item.jumlahOrder - item.jumlahDiterima);
        return {
          materialId: item.material.id,
          purchaseOrderItemId: item.id,
          jumlahDiterima: sisa,
          hargaSatuan: item.hargaSatuan,
          lokasiPenyimpanan: "",
          keterangan: "",
        };
      });
      setItems(initialItems);
    } else {
      setItems([]);
    }
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      // Fetch PO dengan status ISSUED atau PARTIAL_RECEIVED
      const [issuedResponse, partialResponse] = await Promise.all([
        fetch("/api/pt-pks/purchase-order?status=ISSUED"),
        fetch("/api/pt-pks/purchase-order?status=PARTIAL_RECEIVED"),
      ]);

      const allPOs: PurchaseOrder[] = [];

      if (issuedResponse.ok) {
        const issuedData = await issuedResponse.json();
        allPOs.push(...issuedData);
      }

      if (partialResponse.ok) {
        const partialData = await partialResponse.json();
        allPOs.push(...partialData);
      }

      setPurchaseOrders(allPOs);

      if (poIdParam) {
        const found = allPOs.find((p) => p.id === poIdParam);
        if (found) {
          applyPOSelection(found.id, allPOs);
        }
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    }
  };

  const fetchApprovedPRs = async () => {
    try {
      const response = await fetch("/api/pt-pks/purchase-request/approved-direct");
      if (response.ok) {
        const data = await response.json();
        setPurchaseRequests(data);
      }
    } catch (error) {
      console.error("Error fetching approved PRs:", error);
    }
  };

  const handlePOChange = (poId: string) => {
    applyPOSelection(poId, purchaseOrders);
  };

  const handlePRChange = (prId: string) => {
    const pr = purchaseRequests.find((p) => p.id === prId);
    setSelectedPR(pr || null);

    if (pr) {
      // Isi form otomatis dari data PR
      setFormData({
        ...formData,
        purchaseRequestId: prId,
        purchaseOrderId: "",
        vendorId: "vendor-pr",
        vendorName: pr.vendorNameDirect || "",
        // Tanggal penerimaan tetap hari ini, bisa diedit user
        // receivedBy dan nomorSuratJalan dibiarkan kosong untuk diisi user
      });

      // Isi daftar material otomatis dari PR
      const initialItems = pr.items.map((item) => ({
        materialId: item.materialId,
        jumlahDiterima: item.jumlahRequest, // Sama dengan jumlah diminta
        hargaSatuan: item.estimasiHarga || 0, // Dari estimasi harga PR
        lokasiPenyimpanan: "",
        keterangan: "",
      }));
      setItems(initialItems);
    } else {
      setItems([]);
    }
  };

  const updateItem = (index: number, field: keyof PenerimaanItem, value: any) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceType === "PO" && !formData.purchaseOrderId) {
      toast.error("Purchase Order wajib dipilih");
      return;
    }

    if (sourceType === "PR" && !formData.purchaseRequestId) {
      toast.error("Purchase Request wajib dipilih");
      return;
    }

    if (!formData.receivedBy) {
      toast.error("Penerima wajib diisi");
      return;
    }

    setLoading(true);
    try {
      let response;

      if (sourceType === "PR") {
        // Untuk PR, gunakan endpoint khusus yang otomatis membuat penerimaan dari PR
        response = await fetch("/api/pt-pks/penerimaan-barang/from-pr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purchaseRequestId: formData.purchaseRequestId,
            receivedBy: formData.receivedBy,
            nomorSuratJalan: formData.nomorSuratJalan || undefined,
            tanggalSuratJalan: formData.tanggalSuratJalan || undefined,
            tanggalPenerimaan: formData.tanggalPenerimaan,
            keterangan: formData.keterangan || undefined,
          }),
        });
      } else {
        // Untuk PO, gunakan endpoint from-po yang langsung complete dan update stock
        if (!formData.vendorName) {
          toast.error("Vendor wajib diisi");
          setLoading(false);
          return;
        }

        // Filter item yang benar-benar diterima pada pengiriman ini (jumlahDiterima > 0)
        const itemsToSubmit = items.filter((item) => Number(item.jumlahDiterima) > 0);

        if (itemsToSubmit.length === 0) {
          toast.error("Minimal harus terdapat 1 barang dengan jumlah diterima lebih dari 0");
          setLoading(false);
          return;
        }

        // Validasi tidak melebihi sisa PO
        if (selectedPO) {
          for (const item of itemsToSubmit) {
            const poItem = selectedPO.items.find((i) => i.id === item.purchaseOrderItemId);
            if (poItem) {
              const sisa = poItem.jumlahOrder - poItem.jumlahDiterima;
              if (item.jumlahDiterima > sisa) {
                toast.error(
                  `Jumlah terima untuk "${poItem.material.namaMaterial}" (${item.jumlahDiterima}) melebihi sisa PO (${sisa})`
                );
                setLoading(false);
                return;
              }
            }
          }
        }

        if (itemsToSubmit.some((item) => item.hargaSatuan <= 0)) {
          toast.error("Harga satuan harus lebih dari 0 untuk semua item yang diterima");
          setLoading(false);
          return;
        }

        // Use from-po endpoint for automatic completion and stock update
        response = await fetch("/api/pt-pks/penerimaan-barang/from-po", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purchaseOrderId: formData.purchaseOrderId,
            vendorId: formData.vendorId,
            vendorName: formData.vendorName,
            tanggalPenerimaan: formData.tanggalPenerimaan,
            nomorSuratJalan: formData.nomorSuratJalan || undefined,
            tanggalSuratJalan: formData.tanggalSuratJalan || undefined,
            nomorInvoice: formData.nomorInvoice || undefined,
            tanggalInvoice: formData.tanggalInvoice || undefined,
            receivedBy: formData.receivedBy,
            keterangan: formData.keterangan || undefined,
            items: itemsToSubmit.map((item) => ({
              materialId: item.materialId,
              purchaseOrderItemId: item.purchaseOrderItemId,
              jumlahDiterima: Number(item.jumlahDiterima),
              hargaSatuan: Number(item.hargaSatuan),
              lokasiPenyimpanan: item.lokasiPenyimpanan || undefined,
              keterangan: item.keterangan || undefined,
            })),
          }),
        });
      }

      if (response.ok) {
        toast.success("Penerimaan Barang berhasil dibuat dan stock material telah diperbarui");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal membuat Penerimaan Barang");
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
        <CardTitle>Terima Barang Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Source Type Selection */}
          <div className="space-y-2">
            <Label>Sumber Barang *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="sourceType"
                  value="PO"
                  checked={sourceType === "PO"}
                  onChange={(e) => {
                    setSourceType(e.target.value as "PO" | "PR");
                    setFormData({
                      ...formData,
                      purchaseOrderId: "",
                      purchaseRequestId: "",
                    });
                    setSelectedPO(null);
                    setSelectedPR(null);
                    setItems([]);
                  }}
                  className="h-4 w-4"
                />
                <span>Purchase Order (PO)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="sourceType"
                  value="PR"
                  checked={sourceType === "PR"}
                  onChange={(e) => {
                    setSourceType(e.target.value as "PO" | "PR");
                    setFormData({
                      ...formData,
                      purchaseOrderId: "",
                      purchaseRequestId: "",
                    });
                    setSelectedPO(null);
                    setSelectedPR(null);
                    setItems([]);
                  }}
                  className="h-4 w-4"
                />
                <span>Purchase Request (PR)</span>
              </label>
            </div>
          </div>

          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            {sourceType === "PO" ? (
              <div className="space-y-2">
                <Label htmlFor="purchaseOrderId">Purchase Order *</Label>
                <Select
                  value={formData.purchaseOrderId}
                  onValueChange={handlePOChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih PO" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.nomorPO} - {po.vendorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="purchaseRequestId">Purchase Request *</Label>
                <Select
                  value={formData.purchaseRequestId}
                  onValueChange={handlePRChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih PR" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseRequests.map((pr) => (
                      <SelectItem key={pr.id} value={pr.id}>
                        {pr.nomorPR} - {pr.judulPermintaan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Display Vendor Info when PR is selected */}
            {sourceType === "PR" && selectedPR && (
              <div className="space-y-2 md:col-span-2">
                <Label>Informasi Vendor</Label>
                <div className="p-3 bg-muted rounded-md">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Nama Vendor:</span>
                      <p className="font-medium">{selectedPR.vendorNameDirect || "-"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Judul Permintaan:</span>
                      <p className="font-medium">{selectedPR.judulPermintaan}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tanggalPenerimaan">Tanggal Penerimaan *</Label>
              <Input
                id="tanggalPenerimaan"
                type="date"
                value={formData.tanggalPenerimaan}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalPenerimaan: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivedBy">Penerima *</Label>
              <Input
                id="receivedBy"
                value={formData.receivedBy}
                onChange={(e) =>
                  setFormData({ ...formData, receivedBy: e.target.value })
                }
                placeholder="Nama penerima"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomorSuratJalan">Nomor Surat Jalan</Label>
              <Input
                id="nomorSuratJalan"
                value={formData.nomorSuratJalan}
                onChange={(e) =>
                  setFormData({ ...formData, nomorSuratJalan: e.target.value })
                }
                placeholder="No. surat jalan"
              />
            </div>
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
          {(selectedPO || selectedPR) && items.length > 0 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Daftar Material</Label>
              {sourceType === "PR" && (
                <p className="text-sm text-muted-foreground">
                  Material akan diterima sesuai dengan data Purchase Request
                </p>
              )}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Nama Material</TableHead>
                      {sourceType === "PO" && (
                        <>
                          <TableHead className="text-right">Jumlah Order</TableHead>
                          <TableHead className="text-right">Sudah Diterima</TableHead>
                          <TableHead className="text-right">Sisa</TableHead>
                        </>
                      )}
                      {sourceType === "PR" && (
                        <TableHead className="text-right">Jumlah Diminta</TableHead>
                      )}
                      <TableHead className="text-right">Terima Sekarang</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      if (sourceType === "PO" && selectedPO) {
                        const poItem = selectedPO.items.find(
                          (i) => i.id === item.purchaseOrderItemId
                        );
                        if (!poItem) return null;

                        const sisa = Math.max(0, poItem.jumlahOrder - poItem.jumlahDiterima);
                        const isFullyReceived = sisa <= 0;
                        const subtotal = (Number(item.jumlahDiterima) || 0) * (Number(item.hargaSatuan) || 0);

                        return (
                          <TableRow key={item.purchaseOrderItemId} className={isFullyReceived ? "bg-muted/30 opacity-70" : ""}>
                            <TableCell className="font-medium">
                              {poItem.material.partNumber}
                            </TableCell>
                            <TableCell>
                              <div>{poItem.material.namaMaterial}</div>
                              {isFullyReceived && (
                                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500 mt-1">
                                  Sudah Lengkap di Penerimaan Sebelumnya
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {poItem.jumlahOrder} {poItem.material.satuanMaterial.symbol}
                            </TableCell>
                            <TableCell className="text-right">
                              {poItem.jumlahDiterima} {poItem.material.satuanMaterial.symbol}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <Badge variant={isFullyReceived ? "outline" : "secondary"}>
                                {sisa} {poItem.material.satuanMaterial.symbol}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <NumericInput
                                value={item.jumlahDiterima}
                                onValueChange={(val) =>
                                  updateItem(
                                    index,
                                    "jumlahDiterima",
                                    val
                                  )
                                }
                                min={0}
                                max={sisa}
                                step={0.01}
                                disabled={isFullyReceived}
                              />
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
                                placeholder="Harga"
                                disabled={isFullyReceived}
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              Rp {subtotal.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.lokasiPenyimpanan || ""}
                                onChange={(e) =>
                                  updateItem(index, "lokasiPenyimpanan", e.target.value)
                                }
                                placeholder="Lokasi"
                                disabled={isFullyReceived}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.keterangan || ""}
                                onChange={(e) =>
                                  updateItem(index, "keterangan", e.target.value)
                                }
                                placeholder="Keterangan"
                                disabled={isFullyReceived}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      } else if (sourceType === "PR" && selectedPR) {
                        const prItem = selectedPR.items.find(
                          (i) => i.materialId === item.materialId
                        );
                        if (!prItem) return null;

                        const total = item.jumlahDiterima * item.hargaSatuan;

                        return (
                          <TableRow key={item.materialId}>
                            <TableCell className="font-medium">
                              {prItem.material.partNumber}
                            </TableCell>
                            <TableCell>{prItem.material.namaMaterial}</TableCell>
                            <TableCell className="text-right">
                              {prItem.jumlahRequest} {prItem.material.satuanMaterial.symbol}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.jumlahDiterima} {prItem.material.satuanMaterial.symbol}
                            </TableCell>
                            <TableCell className="text-right">
                              Rp {item.hargaSatuan.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              Rp {total.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">-</TableCell>
                            <TableCell className="text-muted-foreground text-xs">-</TableCell>
                          </TableRow>
                        );
                      }
                      return null;
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={loading || (!selectedPO && !selectedPR)}>
              {loading ? "Menyimpan..." : "Simpan Penerimaan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
