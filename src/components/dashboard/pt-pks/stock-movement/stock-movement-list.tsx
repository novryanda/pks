"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TablePagination } from "@/components/ui/table-pagination";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  RefreshCw,
  Filter,
  Download,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Search,
} from "lucide-react";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";
import { downloadStockMovementReportPDF } from "@/lib/pdf/pt-pks/stock-movement-report-pdf";

type Material = {
  id: string;
  code: string;
  name: string;
  satuan: {
    symbol: string;
  };
};

type StockMovement = {
  id: string;
  materialId: string;
  tipeMovement: "IN" | "OUT" | "ADJUSTMENT";
  jumlah: number;
  stockSebelum: number;
  stockSesudah: number;
  referensi: string | null;
  keterangan: string | null;
  operator: string;
  tanggalTransaksi: string;
  material: Material;
};

type StockMovementResponse = {
  data: StockMovement[];
  pagination?: {
    total?: number;
    totalPages?: number;
  };
};

type PaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AppliedFilters = {
  material: string;
  type: string;
  startDate: string;
  endDate: string;
  search: string;
};

export function StockMovementList() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    material: "all",
    type: "all",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch("/api/pt-pks/material");
      if (res.ok) {
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (appliedFilters.material !== "all") params.append("materialId", appliedFilters.material);
      if (appliedFilters.type !== "all") params.append("tipeMovement", appliedFilters.type);
      if (appliedFilters.startDate) params.append("startDate", appliedFilters.startDate);
      if (appliedFilters.endDate) params.append("endDate", appliedFilters.endDate);
      if (appliedFilters.search) params.append("search", appliedFilters.search);

      const movementsRes = await fetch(`/api/pt-pks/stock-movement?${params.toString()}`);

      if (movementsRes.ok) {
        const data = (await movementsRes.json()) as StockMovementResponse;
        setMovements(Array.isArray(data.data) ? data.data : []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total ?? 0,
          totalPages: data.pagination?.totalPages ?? 1,
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Gagal memuat data stock movement");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, pagination.limit, pagination.page]);

  const buildQueryParams = useCallback(
    (page: number, limit: number) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (appliedFilters.material !== "all") params.append("materialId", appliedFilters.material);
      if (appliedFilters.type !== "all") params.append("tipeMovement", appliedFilters.type);
      if (appliedFilters.startDate) params.append("startDate", appliedFilters.startDate);
      if (appliedFilters.endDate) params.append("endDate", appliedFilters.endDate);
      if (appliedFilters.search) params.append("search", appliedFilters.search);

      return params;
    },
    [appliedFilters]
  );

  const fetchAllMovementsForExport = useCallback(async () => {
    const exportLimit = Math.max(pagination.total || movements.length || 0, 1000);
    const response = await fetch(`/api/pt-pks/stock-movement?${buildQueryParams(1, exportLimit).toString()}`);
    if (!response.ok) {
      throw new Error("Gagal memuat data export stock movement");
    }

    const result = (await response.json()) as StockMovementResponse;
    return Array.isArray(result.data) ? result.data : [];
  }, [buildQueryParams, movements.length, pagination.total]);

  useEffect(() => {
    void fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleFilter = () => {
    setAppliedFilters({
      material: selectedMaterial,
      type: selectedType,
      startDate,
      endDate,
      search: search.trim(),
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setSelectedMaterial("all");
    setSelectedType("all");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setAppliedFilters({
      material: "all",
      type: "all",
      startDate: "",
      endDate: "",
      search: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getTipeIcon = (tipe: string) => {
    switch (tipe) {
      case "IN":
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case "OUT":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTipeBadge = (tipe: string) => {
    switch (tipe) {
      case "IN":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Masuk</Badge>;
      case "OUT":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Keluar</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Adjustment</Badge>;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const handleExportExcel = async () => {
    const dataToExportRaw = await fetchAllMovementsForExport();
    if (dataToExportRaw.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Tanggal", key: "tanggal", width: 20 },
      { header: "Kode Material", key: "materialCode", width: 15 },
      { header: "Nama Material", key: "materialName", width: 30 },
      { header: "Tipe", key: "tipe", width: 15 },
      { header: "Jumlah", key: "jumlah", width: 15 },
      { header: "Satuan", key: "satuan", width: 10 },
      { header: "Stock Sebelum", key: "stockSebelum", width: 15 },
      { header: "Stock Sesudah", key: "stockSesudah", width: 15 },
      { header: "Referensi", key: "referensi", width: 20 },
      { header: "Operator", key: "operator", width: 20 },
      { header: "Keterangan", key: "keterangan", width: 30 },
    ];

    const dataToExport = dataToExportRaw.map(m => ({
      tanggal: format(new Date(m.tanggalTransaksi), "dd/MM/yyyy HH:mm"),
      materialCode: m.material.code,
      materialName: m.material.name,
      tipe: m.tipeMovement,
      jumlah: m.jumlah,
      satuan: m.material.satuan.symbol,
      stockSebelum: m.stockSebelum,
      stockSesudah: m.stockSesudah,
      referensi: m.referensi || "-",
      operator: m.operator,
      keterangan: m.keterangan || "-"
    }));

    exportToExcel(
      dataToExport,
      columns,
      `Stock_Movement_${appliedFilters.startDate || "all"}_${appliedFilters.endDate || "all"}`,
      "Stock Movement"
    );
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const dataToExport = await fetchAllMovementsForExport();

      if (dataToExport.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }

      const materialLabel =
        appliedFilters.material !== "all"
          ? materials.find((material) => material.id === appliedFilters.material)?.name || "Material Terpilih"
          : "Semua Material";

      const typeLabel =
        appliedFilters.type === "all"
          ? "Semua Tipe"
          : appliedFilters.type === "IN"
            ? "Masuk (IN)"
            : appliedFilters.type === "OUT"
              ? "Keluar (OUT)"
              : "Adjustment";

      await downloadStockMovementReportPDF({
        data: dataToExport,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
        materialLabel,
        typeLabel,
        search: appliedFilters.search,
      });
    } catch (error) {
      console.error("Error exporting stock movement PDF:", error);
      alert("Gagal mengexport PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const pageStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const pageEnd = pagination.total === 0 ? 0 : Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Riwayat Stock Movement</h1>
          <p className="text-muted-foreground mt-1">
            Tracking pergerakan stock material (masuk/keluar/adjustment)
          </p>
        </div>
        <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
        </Button>
      </div>


      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari material, referensi, operator, keterangan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFilter();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFilter}>
                <Search className="mr-2 h-4 w-4" />
                Cari
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
            <CardDescription>
              Filter riwayat pergerakan stock berdasarkan kriteria tertentu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Material</SelectItem>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.code} - {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipe Movement</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="IN">Masuk (IN)</SelectItem>
                    <SelectItem value="OUT">Keluar (OUT)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleFilter} className="flex-1">
                  <Filter className="mr-2 h-4 w-4" />
                  Terapkan Filter
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movement History Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Riwayat Pergerakan Stock</CardTitle>
              <CardDescription>
                Daftar transaksi pergerakan stock material dengan pencarian dan pagination
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void handleExportExcel()}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleExportPdf()} disabled={exportingPdf}>
                <FileText className="mr-2 h-4 w-4" />
                {exportingPdf ? "Menyiapkan PDF..." : "Export PDF"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Belum ada riwayat stock movement</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Stock Sebelum</TableHead>
                    <TableHead className="text-right">Stock Sesudah</TableHead>
                    <TableHead>Referensi</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">
                        {format(new Date(movement.tanggalTransaksi), "dd MMM yyyy HH:mm", {
                          locale: idLocale,
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{movement.material.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {movement.material.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTipeIcon(movement.tipeMovement)}
                          {getTipeBadge(movement.tipeMovement)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            movement.tipeMovement === "IN"
                              ? "text-green-600"
                              : movement.tipeMovement === "OUT"
                                ? "text-red-600"
                                : "text-blue-600"
                          }
                        >
                          {movement.tipeMovement === "IN" ? "+" : movement.tipeMovement === "OUT" ? "-" : ""}
                          {formatNumber(movement.jumlah)} {movement.material.satuan.symbol}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(movement.stockSebelum)} {movement.material.satuan.symbol}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(movement.stockSesudah)} {movement.material.satuan.symbol}
                      </TableCell>
                      <TableCell>
                        {movement.referensi ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {movement.referensi}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{movement.operator}</TableCell>
                      <TableCell>
                        {movement.keterangan ? (
                          <span className="text-sm">{movement.keterangan}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageStart={pageStart}
                pageEnd={pageEnd}
                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
