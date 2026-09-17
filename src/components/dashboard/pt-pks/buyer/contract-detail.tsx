"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, FileText, Printer, Truck, Package, ArrowRight, Upload, ImageIcon, Download } from "lucide-react";
import { useState, useEffect } from "react";

type Contract = {
  id: string;
  contractNumber: string;
  contractDate: Date;
  startDate: Date | null;
  endDate: Date | null;
  deliveryDate: Date | null;
  deliveryAddress: string;
  notes: string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  buyer: {
    id: string;
    code: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string | null;
    taxStatus: string;
  };
  company: {
    id: string;
    name: string;
  };
  contractItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes: string | null;
    material: {
      id: string;
      code: string;
      name: string;
      satuan: {
        name: string;
        symbol: string;
      };
    };
  }>;
  attachments: Array<{
    fileName: string;
    originalName: string;
    path: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
  }> | null;
};

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ACTIVE: { label: "Aktif", variant: "default" },
  COMPLETED: { label: "Selesai", variant: "outline" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

const taxStatusLabels: Record<string, string> = {
  NON_PKP: "Non PKP (0%)",
  PKP_11: "PKP 11%",
  PKP_1_1: "PKP 1.1%",
};

const deliveryStatusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  COMPLETED: { label: "Selesai", variant: "default" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

type DeliveryData = {
  itemSummaries: Array<{
    contractItemId: string;
    materialId: string;
    materialCode: string;
    materialName: string;
    satuan: { name: string; symbol: string };
    contractQuantity: number;
    deliveredQuantity: number;
    remainingQuantity: number;
    deliveryPercentage: number;
    unitPrice: number;
    deliveryCount: number;
  }>;
  deliveries: Array<{
    id: string;
    nomorPengiriman: string;
    tanggalPengiriman: string;
    status: string;
    beratNetto: number;
    contractItemId: string;
    vendorVehicle: {
      nomorKendaraan: string;
      namaSupir: string;
      vendor: { name: string };
    };
  }>;
  overallSummary: {
    totalDeliveries: number;
    totalDeliveredWeight: number;
    pendingDeliveries: number;
  };
};

type InvoiceSummary = {
  totalContractQuantity: number;
  totalInvoicedQuantity: number;
  remainingQuantity: number;
  invoicePercentage: number;
  totalInvoiceValue: number;
  totalPaid: number;
  invoices: Array<{
    id: string;
    nomorInvoice: string;
    tanggalInvoice: string;
    status: string;
    totalBerat: number;
    totalNilai: number;
    totalDibayar: number;
    sisaPembayaran: number;
  }>;
  isFullyInvoiced: boolean;
  canCreateInvoice: boolean;
};

interface ContractDetailProps {
  contract: Contract;
  basePath?: string;
}

export function ContractDetail({ contract, basePath }: ContractDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const response = await fetch(`/api/pt-pks/contract/${contract.id}/deliveries`);
        if (response.ok) {
          const data = await response.json();
          setDeliveryData(data);
        }
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      } finally {
        setIsLoadingDeliveries(false);
      }
    };

    const fetchInvoiceSummary = async () => {
      try {
        const response = await fetch(`/api/pt-pks/contract/${contract.id}/invoice-summary`);
        if (response.ok) {
          const data = await response.json();
          setInvoiceSummary(data);
        }
      } catch (error) {
        console.error("Error fetching invoice summary:", error);
      } finally {
        setIsLoadingInvoices(false);
      }
    };

    fetchDeliveries();
    fetchInvoiceSummary();
  }, [contract.id]);

  const handlePrintContract = () => {
    window.open(`/api/pt-pks/contract/${contract.id}/pdf`, "_blank");
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus kontrak ini?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pt-pks/contract/${contract.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete contract");
      }

      // Redirect based on basePath or default to buyer contracts
      const redirectUrl = basePath
        ? basePath
        : `/dashboard/pt-pks/master/buyer/${contract.buyer.id}/contracts`;
      router.push(redirectUrl);
      router.refresh();
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("Gagal menghapus kontrak");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/pt-pks/contract/${contract.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Gagal mengubah status kontrak");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{contract.contractNumber}</h2>
          <p className="text-muted-foreground">
            Kontrak dengan {contract.buyer.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/pt-pks/master/buyer/${contract.buyer.id}`)
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Lihat Buyer
          </Button>
          <Button
            variant="outline"
            onClick={handlePrintContract}
          >
            <Printer className="mr-2 h-4 w-4" />
            Cetak Kontrak
          </Button>
          {contract.status === "DRAFT" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  const editUrl = basePath
                    ? `${basePath}/${contract.id}/edit`
                    : `/dashboard/pt-pks/master/contract/${contract.id}/edit`;
                  router.push(editUrl);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Menghapus..." : "Hapus"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Status Kontrak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant={statusLabels[contract.status]?.variant || "default"}>
                {statusLabels[contract.status]?.label || contract.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              {contract.status === "DRAFT" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("ACTIVE")}
                >
                  Aktifkan Kontrak
                </Button>
              )}
              {contract.status === "ACTIVE" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange("COMPLETED")}
                  >
                    Tandai Selesai
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusChange("CANCELLED")}
                  >
                    Batalkan Kontrak
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informasi Buyer */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Buyer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Kode Buyer</p>
              <p className="font-medium">{contract.buyer.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nama Buyer</p>
              <p className="font-medium">{contract.buyer.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium">{contract.buyer.contactPerson}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nomor Telepon</p>
              <p className="font-medium">{contract.buyer.phone}</p>
            </div>
          </div>

          {contract.buyer.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{contract.buyer.email}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Status Pajak</p>
            <Badge variant="outline">
              {taxStatusLabels[contract.buyer.taxStatus] || contract.buyer.taxStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Informasi Kontrak */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Kontrak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nomor Kontrak</p>
              <p className="font-medium">{contract.contractNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Kontrak</p>
              <p className="font-medium">
                {new Date(contract.contractDate).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
              <p className="font-medium">
                {contract.startDate ? new Date(contract.startDate).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Berakhir</p>
              <p className="font-medium">
                {contract.endDate ? new Date(contract.endDate).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }) : "-"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Tanggal Pengiriman</p>
            <p className="font-medium">
              {contract.deliveryDate ? new Date(contract.deliveryDate).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }) : "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Alamat Pengiriman</p>
            <p className="font-medium">{contract.deliveryAddress}</p>
          </div>

          {contract.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Catatan</p>
              <p className="font-medium">{contract.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lampiran File */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Lampiran File
              </CardTitle>
              <CardDescription>
                Dokumen atau gambar terkait kontrak ini
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!contract.attachments || contract.attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              <Upload className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Tidak ada lampiran file untuk kontrak ini</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contract.attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-primary/10 rounded text-primary">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-sm font-medium truncate" title={file.originalName}>
                        {file.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    asChild
                  >
                    <a href={file.path} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Item Produk */}
      <Card>
        <CardHeader>
          <CardTitle>Item Produk</CardTitle>
          <CardDescription>Daftar produk dalam kontrak ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead className="text-right">Kuantitas</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.contractItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.material.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.material.name}</p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity.toLocaleString("id-ID", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {item.material.satuan.symbol}
                    </TableCell>
                    <TableCell className="text-right">
                      Rp{" "}
                      {item.unitPrice.toLocaleString("id-ID", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Rp{" "}
                      {item.totalPrice.toLocaleString("id-ID", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                Rp{" "}
                {contract.subtotal.toLocaleString("id-ID", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Pajak ({taxStatusLabels[contract.buyer.taxStatus]})
              </span>
              <span className="font-medium">
                Rp{" "}
                {contract.taxAmount.toLocaleString("id-ID", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>
                Rp{" "}
                {contract.totalAmount.toLocaleString("id-ID", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Pengiriman */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Progress Pengiriman
          </CardTitle>
          <CardDescription>
            Tracking pengiriman berdasarkan kontrak ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDeliveries ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data pengiriman...
            </div>
          ) : deliveryData ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {deliveryData.overallSummary.totalDeliveries}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pengiriman</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {deliveryData.overallSummary.totalDeliveredWeight.toLocaleString("id-ID", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })} kg
                  </p>
                  <p className="text-sm text-muted-foreground">Total Terkirim</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {deliveryData.overallSummary.pendingDeliveries}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>

              {/* Per Item Progress */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Progress Per Item
                </h4>
                {deliveryData.itemSummaries.map((item) => (
                  <div key={item.contractItemId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{item.materialName}</p>
                        <p className="text-sm text-muted-foreground">{item.materialCode}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {item.deliveryCount} pengiriman
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Kontrak: {item.contractQuantity.toLocaleString("id-ID")} {item.satuan.symbol}
                        </p>
                      </div>
                    </div>
                    <Progress value={item.deliveryPercentage} className="h-2 mb-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">
                        Terkirim: {item.deliveredQuantity.toLocaleString("id-ID")} {item.satuan.symbol}
                      </span>
                      <span className="text-orange-600">
                        Sisa: {item.remainingQuantity.toLocaleString("id-ID")} {item.satuan.symbol}
                      </span>
                      <span className="font-medium">
                        {item.deliveryPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Activity Log */}
              {deliveryData.deliveries.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Riwayat Pengiriman
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/pt-pks/pemasaran/riwayat-pengiriman?contractId=${contract.id}`)}
                    >
                      Lihat Semua
                    </Button>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. DO</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-right">Berat Netto</TableHead>
                          <TableHead>Kendaraan</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deliveryData.deliveries.slice(0, 5).map((delivery) => {
                          const itemInfo = deliveryData.itemSummaries.find(
                            (i) => i.contractItemId === delivery.contractItemId
                          );
                          return (
                            <TableRow key={delivery.id}>
                              <TableCell className="font-medium">
                                {delivery.nomorPengiriman}
                              </TableCell>
                              <TableCell>
                                {new Date(delivery.tanggalPengiriman).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell>{itemInfo?.materialName || "-"}</TableCell>
                              <TableCell className="text-right">
                                {delivery.beratNetto.toLocaleString("id-ID")} kg
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{delivery.vendorVehicle.nomorKendaraan}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {delivery.vendorVehicle.namaSupir}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={deliveryStatusLabels[delivery.status]?.variant || "default"}>
                                  {deliveryStatusLabels[delivery.status]?.label || delivery.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {deliveryData.deliveries.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Menampilkan 5 dari {deliveryData.deliveries.length} pengiriman
                    </p>
                  )}
                </div>
              )}

              {deliveryData.deliveries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada pengiriman untuk kontrak ini</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Gagal memuat data pengiriman
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ringkasan Invoice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ringkasan Invoice
          </CardTitle>
          <CardDescription>
            Progress invoice untuk kontrak ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvoices ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data invoice...
            </div>
          ) : invoiceSummary ? (
            <div className="space-y-6">
              {/* Invoice Progress Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {invoiceSummary.totalContractQuantity.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Kontrak (kg)</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {invoiceSummary.totalInvoicedQuantity.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-muted-foreground">Sudah Diinvoice (kg)</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {invoiceSummary.remainingQuantity.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-muted-foreground">Sisa Invoice (kg)</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress Invoice</span>
                  <span className="font-medium">{invoiceSummary.invoicePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={invoiceSummary.invoicePercentage} className="h-3" />
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                {invoiceSummary.isFullyInvoiced ? (
                  <Badge className="bg-green-100 text-green-700">
                    ✓ Kontrak Sudah Diinvoice Penuh
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700">
                    Masih dapat dibuatkan invoice {invoiceSummary.remainingQuantity.toLocaleString("id-ID")} kg lagi
                  </Badge>
                )}
              </div>

              {/* Invoice List */}
              {invoiceSummary.invoices.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Daftar Invoice</h4>
                  <div className="space-y-2">
                    {invoiceSummary.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 border rounded-lg text-sm"
                      >
                        <div>
                          <p className="font-medium">{invoice.nomorInvoice}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(invoice.tanggalInvoice).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })} • {invoice.totalBerat.toLocaleString("id-ID")} kg
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Rp {invoice.totalNilai.toLocaleString("id-ID")}</p>
                          <Badge variant={
                            invoice.status === "PAID" ? "default" :
                              invoice.status === "CANCELLED" ? "destructive" :
                                "secondary"
                          }>
                            {invoice.status === "DRAFT" ? "Draft" :
                              invoice.status === "ISSUED" ? "Terbit" :
                                invoice.status === "PARTIAL_PAID" ? "Sebagian Dibayar" :
                                  invoice.status === "PAID" ? "Lunas" :
                                    invoice.status === "CANCELLED" ? "Batal" : invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invoiceSummary.invoices.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada invoice untuk kontrak ini</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Gagal memuat data invoice
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informasi Sistem */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Sistem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Dibuat pada</p>
              <p className="font-medium">
                {new Date(contract.createdAt).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Terakhir diubah</p>
              <p className="font-medium">
                {new Date(contract.updatedAt).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
