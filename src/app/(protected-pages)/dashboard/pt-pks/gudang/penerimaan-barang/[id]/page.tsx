"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NumericInput } from "@/components/ui/numeric-input";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { ArrowLeft, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface PenerimaanBarangDetail {
  id: string;
  nomorPenerimaan: string;
  tanggalPenerimaan: string;
  receivedBy: string;
  checkedBy?: string;
  status: string;
  vendorId: string;
  nomorSuratJalan?: string;
  tanggalSuratJalan?: string;
  nomorInvoice?: string;
  tanggalInvoice?: string;
  keterangan?: string;
  vendorName: string;
  purchaseOrder?: {
    id: string;
    nomorPO: string;
    vendorName: string;
    items: Array<{
      id: string;
      materialId: string;
      jumlahOrder: number;
      jumlahDiterima: number;
    }>;
  };
  purchaseRequest?: {
    id: string;
    nomorPR: string;
  };
  items: Array<{
    id: string;
    materialId: string;
    purchaseOrderItemId?: string;
    jumlahDiterima: number;
    hargaSatuan: number;
    totalHarga: number;
    lokasiPenyimpanan?: string;
    keterangan?: string;
    material: {
      partNumber: string;
      namaMaterial: string;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

export default function PenerimaanBarangDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasActionAccess } = useUserPermissions();
  const [penerimaan, setPenerimaan] = useState<PenerimaanBarangDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<{
    vendorName: string;
    receivedBy: string;
    checkedBy: string;
    nomorSuratJalan: string;
    tanggalSuratJalan: string;
    nomorInvoice: string;
    tanggalInvoice: string;
    keterangan: string;
    items: Array<{
      id: string;
      materialId: string;
      purchaseOrderItemId?: string;
      jumlahDiterima: number;
      hargaSatuan: number;
      lokasiPenyimpanan: string;
      keterangan: string;
      material: {
        partNumber: string;
        namaMaterial: string;
        satuanMaterial: {
          symbol: string;
        };
      };
    }>;
  }>({
    vendorName: "",
    receivedBy: "",
    checkedBy: "",
    nomorSuratJalan: "",
    tanggalSuratJalan: "",
    nomorInvoice: "",
    tanggalInvoice: "",
    keterangan: "",
    items: [],
  });

  const fetchDetail = useCallback(async () => {
    try {
      const response = await fetch(`/api/pt-pks/penerimaan-barang/${id}`);
      if (response.ok) {
        const data = (await response.json()) as PenerimaanBarangDetail;
        setPenerimaan(data);
        setEditData({
          vendorName: data.vendorName,
          receivedBy: data.receivedBy,
          checkedBy: data.checkedBy ?? "",
          nomorSuratJalan: data.nomorSuratJalan ?? "",
          tanggalSuratJalan: data.tanggalSuratJalan
            ? new Date(data.tanggalSuratJalan).toISOString().split("T")[0] ?? ""
            : "",
          nomorInvoice: data.nomorInvoice ?? "",
          tanggalInvoice: data.tanggalInvoice
            ? new Date(data.tanggalInvoice).toISOString().split("T")[0] ?? ""
            : "",
          keterangan: data.keterangan ?? "",
          items: data.items.map((item) => ({
            id: item.id,
            materialId: item.materialId,
            purchaseOrderItemId: item.purchaseOrderItemId,
            jumlahDiterima: item.jumlahDiterima,
            hargaSatuan: item.hargaSatuan,
            lokasiPenyimpanan: item.lokasiPenyimpanan ?? "",
            keterangan: item.keterangan ?? "",
            material: item.material,
          })),
        });
      } else {
        console.error("Failed to fetch penerimaan barang detail");
      }
    } catch (error) {
      console.error("Error fetching detail:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const canEdit = hasActionAccess("gudang.penerimaanBarang", "edit");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      PENDING: "default",
      COMPLETED: "default",
    };

    return (
      <Badge variant={variants[status] ?? "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (!penerimaan) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">Data tidak ditemukan</div>
      </div>
    );
  }

  const totalKeseluruhan = penerimaan.items.reduce(
    (sum, item) => sum + item.totalHarga,
    0
  );

  const totalKeseluruhanEdit = editData.items.reduce((sum, item) => {
    return sum + item.jumlahDiterima * item.hargaSatuan;
  }, 0);

  const getMaxAllowedForItem = (itemId: string) => {
    if (!penerimaan?.purchaseOrder) {
      return undefined;
    }

    const currentItem = penerimaan.items.find((item) => item.id === itemId);
    if (!currentItem?.purchaseOrderItemId) {
      return undefined;
    }

    const poItem = penerimaan.purchaseOrder.items.find(
      (item) => item.id === currentItem.purchaseOrderItemId
    );
    if (!poItem) {
      return undefined;
    }

    return poItem.jumlahOrder - (poItem.jumlahDiterima - currentItem.jumlahDiterima);
  };

  const handleItemChange = (
    itemId: string,
    field: "jumlahDiterima" | "hargaSatuan" | "lokasiPenyimpanan" | "keterangan",
    value: number | string
  ) => {
    setEditData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const handleSaveEdit = async () => {
    if (!editData.receivedBy.trim()) {
      toast.error("Penerima wajib diisi");
      return;
    }

    if (!editData.vendorName.trim()) {
      toast.error("Nama vendor wajib diisi");
      return;
    }

    if (editData.items.some((item) => item.jumlahDiterima <= 0)) {
      toast.error("Jumlah diterima harus lebih dari 0 untuk semua item");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/pt-pks/penerimaan-barang/${penerimaan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: editData.vendorName,
          receivedBy: editData.receivedBy,
          checkedBy: editData.checkedBy || undefined,
          nomorSuratJalan: editData.nomorSuratJalan || undefined,
          tanggalSuratJalan: editData.tanggalSuratJalan || undefined,
          nomorInvoice: editData.nomorInvoice || undefined,
          tanggalInvoice: editData.tanggalInvoice || undefined,
          keterangan: editData.keterangan || undefined,
          items: editData.items.map((item) => ({
            materialId: item.materialId,
            purchaseOrderItemId: item.purchaseOrderItemId,
            jumlahDiterima: Number(item.jumlahDiterima),
            hargaSatuan: Number(item.hargaSatuan),
            lokasiPenyimpanan: item.lokasiPenyimpanan || undefined,
            keterangan: item.keterangan || undefined,
          })),
        }),
      });

      if (response.ok) {
        toast.success("Penerimaan barang berhasil diperbarui");
        setIsEditMode(false);
        await fetchDetail();
      } else {
        const error = (await response.json()) as ApiErrorResponse;
        toast.error(error.error ?? error.message ?? "Gagal memperbarui penerimaan barang");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/pt-pks/gudang/penerimaan-barang")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Detail Penerimaan Barang</h1>
          <p className="text-muted-foreground">{penerimaan.nomorPenerimaan}</p>
        </div>
        {canEdit && (
          <Button
            variant="outline"
            onClick={() => setIsEditMode((prev) => !prev)}
            disabled={saving}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {isEditMode ? "Tutup Edit" : "Edit Penerimaan"}
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {/* Informasi Umum */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Penerimaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">Nomor Penerimaan</span>
                <p className="font-medium">{penerimaan.nomorPenerimaan}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Tanggal Penerimaan</span>
                <p className="font-medium">
                  {format(new Date(penerimaan.tanggalPenerimaan), "dd MMMM yyyy")}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Penerima</span>
                <p className="font-medium">{penerimaan.receivedBy}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <div>{getStatusBadge(penerimaan.status)}</div>
              </div>
              {penerimaan.nomorSuratJalan && (
                <div>
                  <span className="text-sm text-muted-foreground">Nomor Surat Jalan</span>
                  <p className="font-medium">{penerimaan.nomorSuratJalan}</p>
                </div>
              )}
              {penerimaan.tanggalSuratJalan && (
                <div>
                  <span className="text-sm text-muted-foreground">Tanggal Surat Jalan</span>
                  <p className="font-medium">
                    {format(new Date(penerimaan.tanggalSuratJalan), "dd MMMM yyyy")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informasi Vendor/Supplier */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Vendor/Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">
                  {penerimaan.purchaseOrder ? "Supplier" : "Vendor"}
                </span>
                <p className="font-medium">
                  {penerimaan.purchaseOrder?.vendorName || penerimaan.vendorName}
                </p>
              </div>
              {penerimaan.purchaseOrder && (
                <div>
                  <span className="text-sm text-muted-foreground">Nomor PO</span>
                  <p className="font-medium">{penerimaan.purchaseOrder.nomorPO}</p>
                </div>
              )}
              {penerimaan.purchaseRequest && (
                <div>
                  <span className="text-sm text-muted-foreground">Nomor PR</span>
                  <p className="font-medium">{penerimaan.purchaseRequest.nomorPR}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Penerimaan Barang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Vendor / Supplier</Label>
                  <Input
                    value={editData.vendorName}
                    onChange={(event) =>
                      setEditData((prev) => ({ ...prev, vendorName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Penerima</Label>
                  <Input
                    value={editData.receivedBy}
                    onChange={(event) =>
                      setEditData((prev) => ({ ...prev, receivedBy: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Diperiksa Oleh</Label>
                  <Input
                    value={editData.checkedBy}
                    onChange={(event) =>
                      setEditData((prev) => ({ ...prev, checkedBy: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Surat Jalan</Label>
                  <Input
                    value={editData.nomorSuratJalan}
                    onChange={(event) =>
                      setEditData((prev) => ({ ...prev, nomorSuratJalan: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Surat Jalan</Label>
                  <Input
                    type="date"
                    value={editData.tanggalSuratJalan}
                    onChange={(event) =>
                      setEditData((prev) => ({
                        ...prev,
                        tanggalSuratJalan: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Invoice</Label>
                  <Input
                    value={editData.nomorInvoice}
                    onChange={(event) =>
                      setEditData((prev) => ({ ...prev, nomorInvoice: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Invoice</Label>
                  <Input
                    type="date"
                    value={editData.tanggalInvoice}
                    onChange={(event) =>
                      setEditData((prev) => ({
                        ...prev,
                        tanggalInvoice: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Keterangan</Label>
                  <Textarea
                    value={editData.keterangan}
                    onChange={(event) =>
                      setEditData((prev) => ({ ...prev, keterangan: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Nama Material</TableHead>
                      {penerimaan.purchaseOrder && (
                        <TableHead className="text-right">Maks. Terima</TableHead>
                      )}
                      <TableHead className="text-right">Jumlah Diterima</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editData.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.material.partNumber}</TableCell>
                        <TableCell>{item.material.namaMaterial}</TableCell>
                        {penerimaan.purchaseOrder && (
                          <TableCell className="text-right">
                            {getMaxAllowedForItem(item.id)?.toLocaleString("id-ID")}{" "}
                            {item.material.satuanMaterial.symbol}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <NumericInput
                            value={item.jumlahDiterima}
                            onValueChange={(value) =>
                              handleItemChange(item.id, "jumlahDiterima", value)
                            }
                            min={0}
                            max={getMaxAllowedForItem(item.id)}
                            step={0.01}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <NumericInput
                            value={item.hargaSatuan}
                            onValueChange={(value) =>
                              handleItemChange(item.id, "hargaSatuan", value)
                            }
                            min={0}
                            step={0.01}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.lokasiPenyimpanan}
                            onChange={(event) =>
                              handleItemChange(item.id, "lokasiPenyimpanan", event.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.keterangan}
                            onChange={(event) =>
                              handleItemChange(item.id, "keterangan", event.target.value)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell
                        colSpan={penerimaan.purchaseOrder ? 4 : 3}
                        className="text-right font-semibold"
                      >
                        Total Baru
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rp {totalKeseluruhanEdit.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={saving}>
                  Batal
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  Simpan Perubahan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daftar Material */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Material</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Nama Material</TableHead>
                    <TableHead className="text-right">Jumlah Diterima</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penerimaan.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.material.partNumber}
                      </TableCell>
                      <TableCell>{item.material.namaMaterial}</TableCell>
                      <TableCell className="text-right">
                        {item.jumlahDiterima} {item.material.satuanMaterial.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.hargaSatuan.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.totalHarga.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{item.lokasiPenyimpanan || "-"}</TableCell>
                      <TableCell>{item.keterangan || "-"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-semibold">
                      Total Keseluruhan
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {totalKeseluruhan.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Keterangan */}
        {penerimaan.keterangan && (
          <Card>
            <CardHeader>
              <CardTitle>Keterangan</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{penerimaan.keterangan}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
