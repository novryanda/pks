"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, Search, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

interface LaporanHarianData {
  id: string;
  nomorProduksi: string;
  tanggalProduksi: string;
  materialInput: {
    name: string;
    satuan: { name: string };
  };
  jumlahInput: number;
  operatorProduksi: string;
  hasilProduksi: Array<{
    materialOutput: {
      name: string;
      satuan: { name: string };
    };
    jumlahOutput: number;
    rendemen: number;
  }>;
}

interface LaporanHarianSummary {
  totalInput: number;
  totalProses: number;
  byMaterialInput: Record<
    string,
    {
      materialName: string;
      totalInput: number;
      totalProses: number;
    }
  >;
  byMaterialOutput: Record<
    string,
    {
      materialName: string;
      totalOutput: number;
      averageRendemen: number;
      count: number;
    }
  >;
}

export function LaporanHarianProduksi() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LaporanHarianData[]>([]);
  const [summary, setSummary] = useState<LaporanHarianSummary | null>(null);
  const [filters, setFilters] = useState({
    tanggalMulai: "",
    tanggalAkhir: "",
  });

  const fetchLaporan = async () => {
    if (!filters.tanggalMulai || !filters.tanggalAkhir) {
      alert("Tanggal mulai dan tanggal akhir harus diisi");
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        tanggalMulai: filters.tanggalMulai,
        tanggalAkhir: filters.tanggalAkhir,
      });

      const response = await fetch(
        `/api/pt-pks/proses-produksi/laporan-harian?${params}`
      );

      if (!response.ok) throw new Error("Failed to fetch laporan");

      const result = await response.json();
      setData(result.data);
      setSummary(result.summary);
    } catch (error) {
      console.error("Error fetching laporan:", error);
      alert("Gagal mengambil data laporan");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    // Prepare CSV content
    const headers = [
      "Tanggal",
      "Nomor Produksi",
      "Material Input",
      "Jumlah Input",
      "Material Output",
      "Jumlah Output",
      "Rendemen (%)",
      "Operator",
    ];

    const rows = data.flatMap((item) =>
      item.hasilProduksi.map((hasil) => [
        format(new Date(item.tanggalProduksi), "dd/MM/yyyy"),
        item.nomorProduksi,
        item.materialInput.name,
        item.jumlahInput,
        hasil.materialOutput.name,
        hasil.jumlahOutput,
        hasil.rendemen.toFixed(2),
        item.operatorProduksi,
      ])
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `laporan-harian-produksi-${filters.tanggalMulai}-${filters.tanggalAkhir}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Tanggal", key: "tanggalFormatted", width: 15 },
      { header: "Nomor Produksi", key: "nomorProduksi", width: 20 },
      { header: "Material Input", key: "materialInput", width: 20 },
      { header: "Jumlah Input (kg)", key: "jumlahInputFormatted", width: 18 },
      { header: "Material Output", key: "materialOutput", width: 20 },
      { header: "Jumlah Output (kg)", key: "jumlahOutputFormatted", width: 18 },
      { header: "Rendemen (%)", key: "rendemenFormatted", width: 15 },
      { header: "Operator", key: "operatorProduksi", width: 20 },
    ];

    const rows = data.flatMap((item) =>
      item.hasilProduksi.map((hasil) => ({
        tanggalFormatted: format(new Date(item.tanggalProduksi), "dd/MM/yyyy"),
        nomorProduksi: item.nomorProduksi,
        materialInput: item.materialInput?.name || "-",
        jumlahInputFormatted: (item.jumlahInput || 0).toLocaleString("id-ID"),
        materialOutput: hasil.materialOutput?.name || "-",
        jumlahOutputFormatted: (hasil.jumlahOutput || 0).toLocaleString("id-ID"),
        rendemenFormatted: hasil.rendemen ? hasil.rendemen.toFixed(2) + "%" : "0.00%",
        operatorProduksi: item.operatorProduksi || "-",
      }))
    );

    exportToExcel(
      rows,
      columns,
      `Laporan_Harian_Produksi_${filters.tanggalMulai}_sd_${filters.tanggalAkhir}`,
      "Laporan_Produksi"
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Laporan Harian Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
              <Input
                id="tanggalMulai"
                type="date"
                value={filters.tanggalMulai}
                onChange={(e) =>
                  setFilters({ ...filters, tanggalMulai: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggalAkhir">Tanggal Akhir</Label>
              <Input
                id="tanggalAkhir"
                type="date"
                value={filters.tanggalAkhir}
                onChange={(e) =>
                  setFilters({ ...filters, tanggalAkhir: e.target.value })
                }
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={fetchLaporan} disabled={loading} className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                {loading ? "Loading..." : "Tampilkan"}
              </Button>
              {data.length > 0 && (
                <>
                  <Button variant="outline" onClick={handleExportExcel}>
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                    Export Excel
                  </Button>
                  <Button variant="outline" onClick={exportToCSV} title="Export CSV">
                    <FileDown className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Proses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.totalProses}</p>
              <p className="text-sm text-muted-foreground">proses produksi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Input</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {summary.totalInput.toLocaleString("id-ID")}
              </p>
              <p className="text-sm text-muted-foreground">kg TBS diolah</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jenis Output</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {Object.keys(summary.byMaterialOutput).length}
              </p>
              <p className="text-sm text-muted-foreground">jenis produk</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary by Material Input */}
      {summary && Object.keys(summary.byMaterialInput).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Material Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Total Input</TableHead>
                  <TableHead className="text-right">Jumlah Proses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(summary.byMaterialInput).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.materialName}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalInput.toLocaleString("id-ID")} kg
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalProses}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary by Material Output */}
      {summary && Object.keys(summary.byMaterialOutput).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Hasil Produksi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Output</TableHead>
                  <TableHead className="text-right">Total Output</TableHead>
                  <TableHead className="text-right">Rata-rata Rendemen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(summary.byMaterialOutput).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.materialName}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalOutput.toLocaleString("id-ID")} kg
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.averageRendemen.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail Data */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Produksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No. Produksi</TableHead>
                    <TableHead>Material Input</TableHead>
                    <TableHead className="text-right">Jumlah Input</TableHead>
                    <TableHead>Hasil Produksi</TableHead>
                    <TableHead>Operator</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(new Date(item.tanggalProduksi), "dd MMM yyyy", {
                          locale: idLocale,
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.nomorProduksi}
                      </TableCell>
                      <TableCell>{item.materialInput.name}</TableCell>
                      <TableCell className="text-right">
                        {item.jumlahInput.toLocaleString("id-ID")}{" "}
                        {item.materialInput.satuan.name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {item.hasilProduksi.map((hasil, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">
                                {hasil.materialOutput.name}:
                              </span>{" "}
                              {hasil.jumlahOutput.toLocaleString("id-ID")}{" "}
                              {hasil.materialOutput.satuan.name} (
                              {hasil.rendemen.toFixed(2)}%)
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{item.operatorProduksi}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && data.length === 0 && filters.tanggalMulai && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Tidak ada data untuk periode yang dipilih
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
