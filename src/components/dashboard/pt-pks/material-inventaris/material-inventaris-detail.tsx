"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit, Trash2, TrendingUp, TrendingDown, Activity, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";
import { downloadMaterialInventarisDetailPDF } from "@/lib/pdf/pt-pks/material-inventaris-detail-pdf";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MaterialInventaris {
  id: string;
  partNumber: string;
  namaMaterial: string;
  kategoriMaterial: {
    name: string;
    description?: string;
  };
  satuanMaterial: {
    name: string;
    symbol: string;
  };
  spesifikasi?: string;
  lokasiDigunakan?: string;
  stockOnHand: number;
  minStock: number;
  maxStock: number;
  hargaSatuan: number;
  createdAt: string;
  updatedAt: string;
}

interface InventoryTransaction {
  id: string;
  tanggalTransaksi: string;
  tipeTransaksi: "IN" | "OUT" | "ADJUSTMENT";
  referensi?: string;
  jumlahMasuk: number;
  jumlahKeluar: number;
  stockOnHand: number;
  hargaSatuan: number;
  totalHarga: number;
  keterangan?: string;
  operator: string;
  requestedBy?: string | null;
}

interface MaterialInventarisDetailProps {
  materialId: string;
}

export function MaterialInventarisDetail({ materialId }: MaterialInventarisDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<MaterialInventaris | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    fetchMaterial();
  }, [materialId]);

  useEffect(() => {
    fetchTransactions();
  }, [materialId, startDate, endDate]);

  const fetchMaterial = async () => {
    try {
      const response = await fetch(`/api/pt-pks/material-inventaris/${materialId}`);
      if (response.ok) {
        const data = await response.json();
        setMaterial(data);
      } else {
        toast.error("Material tidak ditemukan");
        router.push("/dashboard/pt-pks/gudang/material-inventaris");
      }
    } catch (error) {
      console.error("Error fetching material:", error);
      toast.error("Gagal memuat data material");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({ materialId });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(`/api/pt-pks/inventory-transaction?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/pt-pks/material-inventaris/${materialId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Material berhasil dihapus");
        router.push("/dashboard/pt-pks/gudang/inventaris");
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal menghapus material");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStockBadge = (material: MaterialInventaris) => {
    if (material.stockOnHand <= material.minStock) {
      return <Badge variant="destructive">Low Stock</Badge>;
    }
    if (material.stockOnHand >= material.maxStock) {
      return <Badge variant="secondary">Overstock</Badge>;
    }
    return <Badge variant="default">Normal</Badge>;
  };

  const handleResetPeriod = () => {
    setStartDate("");
    setEndDate("");
  };

  const getTransactionPerson = (txn: InventoryTransaction) =>
    txn.tipeTransaksi === "OUT" ? txn.requestedBy || txn.operator : txn.operator;

  const handleExportExcel = () => {
    if (!material) {
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Tanggal", key: "tanggal", width: 22 },
      { header: "Tipe", key: "tipe", width: 14 },
      { header: "Referensi", key: "referensi", width: 20 },
      { header: "Masuk", key: "jumlahMasuk", width: 12 },
      { header: "Keluar", key: "jumlahKeluar", width: 12 },
      { header: "Stock On Hand", key: "stockOnHand", width: 14 },
      { header: "Harga Satuan", key: "hargaSatuan", width: 16 },
      { header: "Total Harga", key: "totalHarga", width: 16 },
      { header: "Pemohon/Operator", key: "operator", width: 18 },
      { header: "Keterangan", key: "keterangan", width: 28 },
    ];

    const rows = transactions.map((txn) => ({
      tanggal: new Date(txn.tanggalTransaksi).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      tipe: txn.tipeTransaksi,
      referensi: txn.referensi || "-",
      jumlahMasuk: txn.jumlahMasuk,
      jumlahKeluar: txn.jumlahKeluar,
      stockOnHand: txn.stockOnHand,
      hargaSatuan: txn.hargaSatuan,
      totalHarga: txn.totalHarga,
      operator: getTransactionPerson(txn),
      keterangan: txn.keterangan || "-",
    }));

    exportToExcel(
      rows,
      columns,
      `material-inventaris-${material.partNumber}-${startDate || "all"}-${endDate || "all"}`,
      "Riwayat Material"
    );
    toast.success(
      transactions.length === 0
        ? "Excel berhasil diunduh tanpa data transaksi"
        : "Excel berhasil diunduh"
    );
  };

  const handleExportPdf = async () => {
    if (!material) {
      return;
    }

    try {
      setExportingPdf(true);
      await downloadMaterialInventarisDetailPDF({
        material,
        transactions,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      toast.success(
        transactions.length === 0
          ? "PDF berhasil diunduh tanpa data transaksi"
          : "PDF berhasil diunduh"
      );
    } catch (error) {
      console.error("Error exporting material detail PDF:", error);
      toast.error("Gagal mengunduh PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Material tidak ditemukan</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detail Material Inventaris</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {material.partNumber}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/pt-pks/gudang/material-inventaris/${materialId}/edit`)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard/pt-pks/gudang/inventaris")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Informasi Dasar</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Part Number</Label>
                <p className="font-medium text-lg">{material.partNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nama Material</Label>
                <p className="font-medium text-lg">{material.namaMaterial}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Kategori Material</Label>
                <p className="font-medium">{material.kategoriMaterial.name}</p>
                {material.kategoriMaterial.description && (
                  <p className="text-sm text-muted-foreground">
                    {material.kategoriMaterial.description}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Satuan Material</Label>
                <p className="font-medium">
                  {material.satuanMaterial.name} ({material.satuanMaterial.symbol})
                </p>
              </div>
              {material.spesifikasi && (
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Spesifikasi</Label>
                  <p className="font-medium whitespace-pre-wrap">{material.spesifikasi}</p>
                </div>
              )}
              {material.lokasiDigunakan && (
                <div>
                  <Label className="text-muted-foreground">Lokasi Digunakan</Label>
                  <p className="font-medium">{material.lokasiDigunakan}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Harga Satuan</Label>
                <p className="font-medium text-lg">
                  Rp {(material.hargaSatuan || 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Informasi Stock</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <Label className="text-muted-foreground text-xs">Stock Tersedia</Label>
                <p className="font-bold text-2xl mt-1">
                  {(material.stockOnHand || 0).toLocaleString("id-ID")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {material.satuanMaterial.symbol}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <Label className="text-muted-foreground text-xs">Minimum Stock</Label>
                <p className="font-bold text-2xl mt-1">
                  {(material.minStock || 0).toLocaleString("id-ID")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {material.satuanMaterial.symbol}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <Label className="text-muted-foreground text-xs">Maximum Stock</Label>
                <p className="font-bold text-2xl mt-1">
                  {(material.maxStock || 0).toLocaleString("id-ID")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {material.satuanMaterial.symbol}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <Label className="text-muted-foreground text-xs">Status Stock</Label>
                <div className="mt-2">{getStockBadge(material)}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {material.stockOnHand <= material.minStock
                    ? "Segera lakukan pembelian"
                    : material.stockOnHand >= material.maxStock
                    ? "Stock berlebih"
                    : "Stock dalam kondisi normal"}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Value */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Nilai Inventaris</h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
              <Label className="text-muted-foreground">Total Nilai Stock</Label>
              <p className="font-bold text-3xl mt-2">
                Rp{" "}
                {((material.stockOnHand || 0) * (material.hargaSatuan || 0)).toLocaleString("id-ID")}
              </p>
              <p className="text-sm text-muted-foreground mt-2"> 
                {(material.stockOnHand || 0).toLocaleString("id-ID")} {material.satuanMaterial.symbol} × Rp{" "}
                {(material.hargaSatuan || 0).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Transaction Log */}
          <div>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Riwayat Transaksi
              </h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-[160px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tanggal Akhir</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-[160px]"
                  />
                </div>
                <Button variant="outline" onClick={handleResetPeriod}>
                  Reset
                </Button>
                <Button variant="outline" onClick={handleExportExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button onClick={() => void handleExportPdf()} disabled={exportingPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  {exportingPdf ? "Menyiapkan PDF..." : "PDF"}
                </Button>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada transaksi untuk material ini</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Referensi</TableHead>
                      <TableHead className="text-right">Masuk</TableHead>
                      <TableHead className="text-right">Keluar</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead>Pemohon/Operator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {new Date(txn.tanggalTransaksi).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              txn.tipeTransaksi === "IN"
                                ? "default"
                                : txn.tipeTransaksi === "OUT"
                                ? "destructive"
                                : "secondary"
                            }
                            className="flex items-center gap-1 w-fit"
                          >
                            {txn.tipeTransaksi === "IN" && <TrendingUp className="h-3 w-3" />}
                            {txn.tipeTransaksi === "OUT" && <TrendingDown className="h-3 w-3" />}
                            {txn.tipeTransaksi === "ADJUSTMENT" && <Activity className="h-3 w-3" />}
                            {txn.tipeTransaksi}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {txn.referensi || "-"}
                          {txn.keterangan && (
                            <p className="text-xs text-muted-foreground">{txn.keterangan}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {txn.jumlahMasuk > 0 ? `+${txn.jumlahMasuk.toLocaleString("id-ID")}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {txn.jumlahKeluar > 0 ? `-${txn.jumlahKeluar.toLocaleString("id-ID")}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {txn.stockOnHand.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          Rp {txn.hargaSatuan.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-sm">{getTransactionPerson(txn)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Informasi Sistem</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Dibuat Pada</Label>
                <p className="font-medium">
                  {new Date(material.createdAt).toLocaleString("id-ID", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Terakhir Diupdate</Label>
                <p className="font-medium">
                  {new Date(material.updatedAt).toLocaleString("id-ID", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Material?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus material{" "}
              <span className="font-semibold">{material.partNumber} - {material.namaMaterial}</span>?
              <br />
              <br />
              Tindakan ini tidak dapat dibatalkan. Semua data terkait material ini akan
              dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
