"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { NumericInput } from "@/components/ui/numeric-input";
import {
  ArrowLeft,
  CheckCircle,
  FileDown,
  Pencil,
  Plus,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useUserPermissions } from "@/hooks/use-user-permissions";

const handlePrintPDF = async (id: string, nomorPR: string) => {
  try {
    const response = await fetch(`/api/pt-pks/purchase-request/${id}/pdf`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PR-${nomorPR}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF berhasil diunduh");
    } else {
      toast.error("Gagal mengunduh PDF");
    }
  } catch {
    toast.error("Terjadi kesalahan saat mengunduh PDF");
  }
};

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  tipePembelian: string;
  divisi?: string;
  requestedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  vendorNameDirect?: string;
  vendorAddressDirect?: string;
  vendorPhoneDirect?: string;
  status: string;
  keterangan?: string;
  items: Array<{
    id: string;
    jumlahRequest: number;
    estimasiHarga: number;
    keterangan?: string;
    material: {
      id: string;
      partNumber: string;
      namaMaterial: string;
      spesifikasi?: string | null;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

interface PurchaseRequestDetailProps {
  purchaseRequest: PurchaseRequest;
  onClose: () => void;
  onSuccess: () => void;
}

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

interface MaterialOption {
  id: string;
  partNumber: string;
  namaMaterial: string;
  satuanMaterial: {
    symbol: string;
  };
}

export function PurchaseRequestDetail({
  purchaseRequest,
  onClose,
  onSuccess,
}: PurchaseRequestDetailProps) {
  const { hasActionAccess } = useUserPermissions();
  const [loading, setLoading] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approverName, setApproverName] = useState("");
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({
    tipePembelian: purchaseRequest.tipePembelian as "PEMBELIAN_LANGSUNG" | "PENGAJUAN_PO",
    divisi: purchaseRequest.divisi ?? "",
    requestedBy: purchaseRequest.requestedBy,
    vendorNameDirect: purchaseRequest.vendorNameDirect ?? "",
    vendorAddressDirect: purchaseRequest.vendorAddressDirect ?? "",
    vendorPhoneDirect: purchaseRequest.vendorPhoneDirect ?? "",
    keterangan: purchaseRequest.keterangan ?? "",
    items: purchaseRequest.items.map((item) => ({
      materialId: item.material.id,
      jumlahRequest: item.jumlahRequest,
      estimasiHarga: item.estimasiHarga ?? 0,
      keterangan: item.keterangan ?? "",
    })),
  });

  useEffect(() => {
    setEditData({
      tipePembelian: purchaseRequest.tipePembelian as "PEMBELIAN_LANGSUNG" | "PENGAJUAN_PO",
      divisi: purchaseRequest.divisi ?? "",
      requestedBy: purchaseRequest.requestedBy,
      vendorNameDirect: purchaseRequest.vendorNameDirect ?? "",
      vendorAddressDirect: purchaseRequest.vendorAddressDirect ?? "",
      vendorPhoneDirect: purchaseRequest.vendorPhoneDirect ?? "",
      keterangan: purchaseRequest.keterangan ?? "",
      items: purchaseRequest.items.map((item) => ({
        materialId: item.material.id,
        jumlahRequest: item.jumlahRequest,
        estimasiHarga: item.estimasiHarga ?? 0,
        keterangan: item.keterangan ?? "",
      })),
    });
  }, [purchaseRequest]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch("/api/pt-pks/material-inventaris");
        if (!response.ok) {
          throw new Error("Gagal memuat material");
        }

        const data = (await response.json()) as MaterialOption[];
        setMaterials(data);
      } catch (error) {
        console.error("Error fetching materials:", error);
      }
    };

    void fetchMaterials();
  }, []);

  const canEdit =
    hasActionAccess("gudang.purchaseRequest", "edit") &&
    ["DRAFT", "PENDING", "APPROVED"].includes(purchaseRequest.status);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      PENDING: "default",
      APPROVED: "default",
      COMPLETED: "default",
      REJECTED: "destructive",
      CANCELLED: "secondary",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const totalEstimasi = purchaseRequest.items.reduce(
    (sum, item) => sum + item.estimasiHarga * item.jumlahRequest,
    0
  );

  const totalEstimasiEdit = editData.items.reduce((sum, item) => {
    return sum + item.jumlahRequest * item.estimasiHarga;
  }, 0);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/purchase-request/${purchaseRequest.id}/submit`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Purchase Request berhasil disubmit untuk approval");
        onSuccess();
      } else {
        const error = (await response.json()) as ApiErrorResponse;
        toast.error(error.error ?? error.message ?? "Gagal submit Purchase Request");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approverName.trim()) {
      toast.error("Nama approver wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/purchase-request/${purchaseRequest.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedBy: approverName }),
        }
      );

      if (response.ok) {
        toast.success("Purchase Request berhasil diapprove");
        setShowApprovalDialog(false);
        onSuccess();
      } else {
        const error = (await response.json()) as ApiErrorResponse;
        toast.error(error.error ?? error.message ?? "Gagal approve Purchase Request");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Apakah Anda yakin ingin menolak Purchase Request ini?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/purchase-request/${purchaseRequest.id}/reject`,
        { method: "POST" }
      );

      if (response.ok) {
        toast.success("Purchase Request berhasil ditolak");
        onSuccess();
      } else {
        const error = (await response.json()) as ApiErrorResponse;
        toast.error(error.error ?? error.message ?? "Gagal reject Purchase Request");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleEditItemChange = (
    index: number,
    field: "materialId" | "jumlahRequest" | "estimasiHarga" | "keterangan",
    value: string | number
  ) => {
    setEditData((prev) => {
      const nextItems = [...prev.items];
      const targetItem = nextItems[index];

      if (!targetItem) {
        return prev;
      }

      nextItems[index] = {
        ...targetItem,
        [field]: value,
      };

      return {
        ...prev,
        items: nextItems,
      };
    });
  };

  const handleSaveEdit = async () => {
    if (!editData.requestedBy.trim()) {
      toast.error("Pemohon wajib diisi");
      return;
    }

    if (editData.items.length === 0 || editData.items.some((item) => !item.materialId)) {
      toast.error("Minimal 1 material wajib diisi");
      return;
    }

    if (
      editData.tipePembelian === "PEMBELIAN_LANGSUNG" &&
      !editData.vendorNameDirect.trim()
    ) {
      toast.error("Nama vendor wajib diisi untuk pembelian langsung");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/pt-pks/purchase-request/${purchaseRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipePembelian: editData.tipePembelian,
          divisi: editData.divisi || undefined,
          requestedBy: editData.requestedBy,
          vendorNameDirect:
            editData.tipePembelian === "PEMBELIAN_LANGSUNG"
              ? editData.vendorNameDirect
              : undefined,
          vendorAddressDirect:
            editData.tipePembelian === "PEMBELIAN_LANGSUNG"
              ? editData.vendorAddressDirect || undefined
              : undefined,
          vendorPhoneDirect:
            editData.tipePembelian === "PEMBELIAN_LANGSUNG"
              ? editData.vendorPhoneDirect || undefined
              : undefined,
          keterangan: editData.keterangan || undefined,
          items: editData.items.map((item) => ({
            materialId: item.materialId,
            jumlahRequest: Number(item.jumlahRequest),
            estimasiHarga: Number(item.estimasiHarga),
            keterangan: item.keterangan || undefined,
          })),
        }),
      });

      if (response.ok) {
        toast.success("Purchase Request berhasil diperbarui");
        setIsEditMode(false);
        onSuccess();
      } else {
        const error = (await response.json()) as ApiErrorResponse;
        toast.error(error.error ?? error.message ?? "Gagal memperbarui Purchase Request");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan perubahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detail Purchase Request</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {purchaseRequest.nomorPR}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Tanggal Request</Label>
              <p className="font-medium">
                {format(new Date(purchaseRequest.tanggalRequest), "dd MMMM yyyy")}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">{getStatusBadge(purchaseRequest.status)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Tipe Pembelian</Label>
              <div className="mt-1">
                <Badge variant={purchaseRequest.tipePembelian === "PEMBELIAN_LANGSUNG" ? "default" : "outline"}>
                  {purchaseRequest.tipePembelian === "PEMBELIAN_LANGSUNG" ? "Pembelian Langsung" : "Pengajuan PO"}
                </Badge>
              </div>
            </div>
            {purchaseRequest.divisi && (
              <div>
                <Label className="text-muted-foreground">Divisi</Label>
                <p className="font-medium">{purchaseRequest.divisi}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Pemohon</Label>
              <p className="font-medium">{purchaseRequest.requestedBy}</p>
            </div>
            
            {/* Vendor information for direct purchase */}
            {purchaseRequest.tipePembelian === "PEMBELIAN_LANGSUNG" && purchaseRequest.vendorNameDirect && (
              <>
                <div>
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p className="font-medium">{purchaseRequest.vendorNameDirect}</p>
                </div>
                {purchaseRequest.vendorPhoneDirect && (
                  <div>
                    <Label className="text-muted-foreground">Telepon Vendor</Label>
                    <p className="font-medium">{purchaseRequest.vendorPhoneDirect}</p>
                  </div>
                )}
                {purchaseRequest.vendorAddressDirect && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Alamat Vendor</Label>
                    <p className="font-medium">{purchaseRequest.vendorAddressDirect}</p>
                  </div>
                )}
              </>
            )}
            
            {purchaseRequest.approvedBy && (
              <>
                <div>
                  <Label className="text-muted-foreground">Approver</Label>
                  <p className="font-medium">{purchaseRequest.approvedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tanggal Approval</Label>
                  <p className="font-medium">
                    {purchaseRequest.tanggalApproval
                      ? format(
                          new Date(purchaseRequest.tanggalApproval),
                          "dd MMMM yyyy"
                        )
                      : "-"}
                  </p>
                </div>
              </>
            )}
            {purchaseRequest.keterangan && (
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Keterangan</Label>
                <p className="font-medium">{purchaseRequest.keterangan}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <Label className="text-lg font-semibold">Daftar Material</Label>
            <div className="mt-2 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Nama Material</TableHead>
                    <TableHead>Spesifikasi</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Estimasi Harga</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseRequest.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.material.partNumber}
                      </TableCell>
                      <TableCell>{item.material.namaMaterial}</TableCell>
                      <TableCell>{item.material.spesifikasi ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        {item.jumlahRequest} {item.material.satuanMaterial.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.estimasiHarga.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp{" "}
                        {(item.estimasiHarga * item.jumlahRequest).toLocaleString(
                          "id-ID"
                        )}
                      </TableCell>
                      <TableCell>{item.keterangan ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-bold">
                      Total Estimasi:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      Rp {totalEstimasi.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => handlePrintPDF(purchaseRequest.id, purchaseRequest.nomorPR)}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Cetak PDF
            </Button>
            <div className="flex gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode((prev) => !prev)}
                  disabled={loading}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {isEditMode ? "Tutup Edit" : "Edit PR"}
                </Button>
              )}
              {purchaseRequest.status === "DRAFT" && (
                hasActionAccess("gudang.purchaseRequest", "create") && (
                  <Button onClick={handleSubmit} disabled={loading}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit untuk Approval
                  </Button>
                )
              )}

              {purchaseRequest.status === "PENDING" && (
                hasActionAccess("gudang.purchaseRequest", "approve") && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={loading}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Tolak
                    </Button>
                    <Button
                      onClick={() => setShowApprovalDialog(true)}
                      disabled={loading}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </>
                )
              )}
            </div>
          </div>

          {isEditMode && (
            <div className="rounded-md border bg-muted/40 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Purchase Request</h3>
                <Badge variant="outline">Perubahan mengikuti permission edit</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipe Pembelian</Label>
                  <Select
                    value={editData.tipePembelian}
                    onValueChange={(value: "PEMBELIAN_LANGSUNG" | "PENGAJUAN_PO") =>
                      setEditData((prev) => ({
                        ...prev,
                        tipePembelian: value,
                        ...(value === "PENGAJUAN_PO"
                          ? {
                              vendorNameDirect: "",
                              vendorAddressDirect: "",
                              vendorPhoneDirect: "",
                            }
                          : {}),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe pembelian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENGAJUAN_PO">Pengajuan PO</SelectItem>
                      <SelectItem value="PEMBELIAN_LANGSUNG">Pembelian Langsung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Divisi</Label>
                  <Input
                    value={editData.divisi}
                    onChange={(event) =>
                      setEditData((prev) => ({ ...prev, divisi: event.target.value }))
                    }
                    placeholder="Nama divisi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pemohon</Label>
                  <Input
                    value={editData.requestedBy}
                    onChange={(event) =>
                      setEditData((prev) => ({ ...prev, requestedBy: event.target.value }))
                    }
                    placeholder="Nama pemohon"
                  />
                </div>

                {editData.tipePembelian === "PEMBELIAN_LANGSUNG" && (
                  <>
                    <div className="space-y-2">
                      <Label>Nama Vendor</Label>
                      <Input
                        value={editData.vendorNameDirect}
                        onChange={(event) =>
                          setEditData((prev) => ({
                            ...prev,
                            vendorNameDirect: event.target.value,
                          }))
                        }
                        placeholder="Nama vendor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telepon Vendor</Label>
                      <Input
                        value={editData.vendorPhoneDirect}
                        onChange={(event) =>
                          setEditData((prev) => ({
                            ...prev,
                            vendorPhoneDirect: event.target.value,
                          }))
                        }
                        placeholder="Nomor telepon vendor"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Alamat Vendor</Label>
                      <Textarea
                        value={editData.vendorAddressDirect}
                        onChange={(event) =>
                          setEditData((prev) => ({
                            ...prev,
                            vendorAddressDirect: event.target.value,
                          }))
                        }
                        placeholder="Alamat vendor"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label>Keterangan</Label>
                  <Textarea
                    value={editData.keterangan}
                    onChange={(event) =>
                      setEditData((prev) => ({ ...prev, keterangan: event.target.value }))
                    }
                    placeholder="Keterangan tambahan"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Daftar Material</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditData((prev) => ({
                        ...prev,
                        items: [
                          ...prev.items,
                          {
                            materialId: "",
                            jumlahRequest: 0,
                            estimasiHarga: 0,
                            keterangan: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Item
                  </Button>
                </div>

                <div className="rounded-md border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">Estimasi Harga</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editData.items.map((item, index) => (
                        <TableRow key={`${item.materialId}-${index}`}>
                          <TableCell>
                            <Select
                              value={item.materialId}
                              onValueChange={(value) =>
                                handleEditItemChange(index, "materialId", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih material" />
                              </SelectTrigger>
                              <SelectContent>
                                {materials.map((material) => (
                                  <SelectItem key={material.id} value={material.id}>
                                    {material.partNumber} - {material.namaMaterial}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <NumericInput
                              value={item.jumlahRequest}
                              onValueChange={(value) =>
                                handleEditItemChange(index, "jumlahRequest", value)
                              }
                              min={0}
                              step={0.01}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <NumericInput
                              value={item.estimasiHarga}
                              onValueChange={(value) =>
                                handleEditItemChange(index, "estimasiHarga", value)
                              }
                              min={0}
                              step={0.01}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.keterangan}
                              onChange={(event) =>
                                handleEditItemChange(index, "keterangan", event.target.value)
                              }
                              placeholder="Keterangan"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditData((prev) => ({
                                  ...prev,
                                  items: prev.items.filter((_, itemIndex) => itemIndex !== index),
                                }))
                              }
                              disabled={editData.items.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} className="text-right font-semibold">
                          Total Estimasi Baru
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          Rp {totalEstimasiEdit.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={loading}>
                  Batal
                </Button>
                <Button onClick={handleSaveEdit} disabled={loading}>
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Purchase Request</DialogTitle>
            <DialogDescription>
              Masukkan nama Anda sebagai approver untuk Purchase Request ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approver">Nama Approver *</Label>
              <Input
                id="approver"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="Masukkan nama Anda"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
