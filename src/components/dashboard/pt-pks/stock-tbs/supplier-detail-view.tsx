"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Package, TrendingUp, Calendar } from "lucide-react";

type SupplierData = {
  id: string;
  ownerName: string;
  type: string;
  totalBerat: number;
  jumlahPenerimaan: number;
};

type PenerimaanDetail = {
  id: string;
  nomorPenerimaan: string;
  tanggalTerima: string;
  lokasiKebun?: string | null;
  jenisBuah?: string | null;
  beratBruto: number;
  beratTarra: number;
  beratNetto2: number;
  hargaPerKg: number;
  totalBayar: number;
  transporter: {
    nomorKendaraan: string;
    namaSupir: string;
  };
};

type Props = {
  supplier: SupplierData;
  materialId: string;
  materialName: string;
  month: string;
  onBack: () => void;
};

export function SupplierDetailView({
  supplier,
  materialId,
  materialName,
  month,
  onBack
}: Props) {
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<PenerimaanDetail[]>([]);

  useEffect(() => {
    fetchDeliveries();
  }, [month]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/pt-pks/penerimaan-tbs?supplierId=${supplier.id}&materialId=${materialId}&month=${month}&status=COMPLETED`
      );
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (deliveries.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    const rows = [
      ["LAPORAN PENGIRIMAN TBS PER SUPPLIER"],
      ["Supplier:", supplier.ownerName],
      ["Material:", materialName],
      ["Bulan:", month],
      ["Tanggal Export:", new Date().toLocaleString("id-ID")],
      [""],
      [
        "No. Penerimaan",
        "Tanggal",
        "Lokasi Kebun",
        "Jenis Buah",
        "Kendaraan",
        "Supir",
        "Berat Bruto (kg)",
        "Berat Tarra (kg)",
        "Berat Netto (kg)",
        "Harga/kg",
        "Total Bayar",
      ],
    ];

    deliveries.forEach((item) => {
      rows.push([
        item.nomorPenerimaan,
        new Date(item.tanggalTerima).toLocaleDateString("id-ID"),
        item.lokasiKebun || "-",
        item.jenisBuah || "-",
        item.transporter.nomorKendaraan,
        item.transporter.namaSupir,
        item.beratBruto.toFixed(2),
        item.beratTarra.toFixed(2),
        item.beratNetto2.toFixed(2),
        item.hargaPerKg.toFixed(0),
        item.totalBayar.toFixed(0),
      ]);
    });

    // Add totals
    const totalBerat = deliveries.reduce((sum, d) => sum + d.beratNetto2, 0);
    const totalPembayaran = deliveries.reduce((sum, d) => sum + d.totalBayar, 0);

    rows.push(
      [""],
      ["TOTAL", "", "", "", "", "", "", "", totalBerat.toFixed(2), "", totalPembayaran.toFixed(0)]
    );

    // Convert to CSV
    const csvContent = rows.map((row) => row.join(",")).join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `Pengiriman_${supplier.ownerName}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalBerat = deliveries.reduce((sum, d) => sum + d.beratNetto2, 0);
  const totalPembayaran = deliveries.reduce((sum, d) => sum + d.totalBayar, 0);
  const averagePerDelivery = deliveries.length > 0 ? totalBerat / deliveries.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
        <Button onClick={exportToExcel} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Supplier</div>
            <div className="text-2xl font-bold">{supplier.ownerName}</div>
            <div className="text-xs text-muted-foreground mt-1">{supplier.type}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Total Pengiriman</span>
            </div>
            <div className="text-3xl font-bold text-blue-900">{deliveries.length}</div>
            <div className="text-xs text-blue-700 mt-1">transaksi</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Package className="h-4 w-4" />
              <span className="text-sm">Total Berat</span>
            </div>
            <div className="text-3xl font-bold text-green-900">
              {totalBerat.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-green-700 mt-1">kg</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-primary mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Rata-rata</span>
            </div>
            <div className="text-3xl font-bold text-primary">
              {averagePerDelivery.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-primary/70 mt-1">kg per pengiriman</div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengiriman TBS</CardTitle>
          <CardDescription>
            Daftar lengkap pengiriman TBS dari {supplier.ownerName} untuk material {materialName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Memuat data...</div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Belum ada data pengiriman
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Penerimaan</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Lokasi Kebun</TableHead>
                        <TableHead>Jenis Buah</TableHead>
                        <TableHead>Kendaraan</TableHead>
                        <TableHead>Supir</TableHead>
                        <TableHead className="text-right">Bruto (kg)</TableHead>
                        <TableHead className="text-right">Tarra (kg)</TableHead>
                        <TableHead className="text-right">Netto (kg)</TableHead>
                        <TableHead className="text-right">Harga/kg</TableHead>
                        <TableHead className="text-right">Total Bayar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveries.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">
                            {item.nomorPenerimaan}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(item.tanggalTerima).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.lokasiKebun || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.jenisBuah ? (
                              <Badge variant="outline" className="text-xs">
                                {item.jenisBuah === "TBS-BB" && "Buah Besar"}
                                {item.jenisBuah === "TBS-BS" && "Buah Biasa"}
                                {item.jenisBuah === "TBS-BK" && "Buah Kecil"}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {item.transporter.nomorKendaraan}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.transporter.namaSupir}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {item.beratBruto.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {item.beratTarra.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {item.beratNetto2.toLocaleString("id-ID", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {item.hargaPerKg.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            }).format(item.totalBayar)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Summary Footer */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Total Pengiriman</div>
                    <div className="text-2xl font-bold">{deliveries.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Total Berat Netto</div>
                    <div className="text-2xl font-bold text-primary">
                      {totalBerat.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Rata-rata per Pengiriman</div>
                    <div className="text-2xl font-bold">
                      {averagePerDelivery.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Total Pembayaran</div>
                    <div className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(totalPembayaran)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
