"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, Edit, Trash2, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { DateFilterMode, type DateFilterModeType } from "@/components/ui/date-filter-mode";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw } from "lucide-react";

interface ProsesProduksi {
  id: string;
  nomorProduksi: string;
  tanggalProduksi: string;
  materialInput: {
    name: string;
    kategori: { name: string };
    satuan: { name: string };
  };
  jumlahInput: number;
  operatorProduksi: string;
  status: string;
  hasilProduksi: Array<{
    materialOutput: {
      name: string;
    };
    jumlahOutput: number;
    rendemen: number;
  }>;
}

interface Material {
  id: string;
  name: string;
  code: string;
}

interface ProsesProduksiListProps {
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
  onViewClick: (id: string) => void;
  onRefresh?: () => void;
  filters: {
    tanggalMulai: string;
    tanggalAkhir: string;
    materialOutputId: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function ProsesProduksiList({
  onCreateClick,
  onEditClick,
  onViewClick,
  onRefresh,
  filters,
  onFiltersChange,
}: ProsesProduksiListProps) {
  const [data, setData] = useState<ProsesProduksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [materials, setMaterials] = useState<Material[]>([]);

  const fetchData = async (currentPage: number = page, currentFilters: any = filters) => {
    if (!currentFilters.materialOutputId) return;

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (currentFilters.status) params.append("status", currentFilters.status);
      if (currentFilters.materialOutputId) params.append("materialOutputId", currentFilters.materialOutputId);
      if (currentFilters.tanggalMulai && currentFilters.tanggalAkhir) {
        params.append("tanggalMulai", currentFilters.tanggalMulai);
        params.append("tanggalAkhir", currentFilters.tanggalAkhir);
      }

      const response = await fetch(`/api/pt-pks/proses-produksi?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error("Error fetching proses produksi:", error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pt-pks/material");
      if (!response.ok) return;
      const data = await response.json();

      // Filter for materials that are in "Production" categories and not "TBS"
      // or simply filter all materials that typically result from production
      const productionMaterials = data.filter((m: any) =>
        m.kategori?.name?.toUpperCase().includes("PRODUCTION") ||
        ["CPO", "KERNEL", "CANGKANG", "FIBER"].some(name => m.name.toUpperCase().includes(name))
      ).filter((m: any) => !m.name.toUpperCase().includes("TBS"));

      setMaterials(productionMaterials);

      // Auto-select first material immediately if none selected to trigger fetchData
      if (productionMaterials.length > 0 && !filters.materialOutputId) {
        onFiltersChange({ ...filters, materialOutputId: productionMaterials[0].id });
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      // Don't set loading false here because fetchData will set it
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // fetchData is now triggered by onFiltersChange in fetchMaterials for initial load

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    debouncedFetchData(page, filters);

    return () => {
      debouncedFetchData.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [page, filters]);

  const debouncedFetchData = useMemo(
    () => debounce((page: number, filters: any) => {
      fetchData(page, filters);
    }, 800),
    []
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus proses produksi ini?"))
      return;

    try {
      const response = await fetch(`/api/pt-pks/proses-produksi/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      alert("Proses produksi berhasil dihapus");
      fetchData();
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting proses produksi:", error);
      alert("Gagal menghapus proses produksi");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      DRAFT: "secondary",
      IN_PROGRESS: "default",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };

    const labels: Record<string, string> = {
      DRAFT: "Draft",
      IN_PROGRESS: "Proses",
      COMPLETED: "Selesai",
      CANCELLED: "Batal",
    };

    return (
      <Badge variant={variants[status] || "default"}>{labels[status]}</Badge>
    );
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();

      if (filters.status) params.append("status", filters.status);
      if (filters.tanggalMulai && filters.tanggalAkhir) {
        params.append("tanggalMulai", filters.tanggalMulai);
        params.append("tanggalAkhir", filters.tanggalAkhir);
      }
      if (filters.materialOutputId) params.append("materialOutputId", filters.materialOutputId);

      const response = await fetch(`/api/pt-pks/proses-produksi/export-pdf?${params}`);
      if (!response.ok) throw new Error("Failed to export PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan-Proses-Produksi-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Gagal mengekspor PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();

      if (filters.status) params.append("status", filters.status);
      if (filters.tanggalMulai && filters.tanggalAkhir) {
        params.append("tanggalMulai", filters.tanggalMulai);
        params.append("tanggalAkhir", filters.tanggalAkhir);
      }
      if (filters.materialOutputId) params.append("materialOutputId", filters.materialOutputId);

      const response = await fetch(`/api/pt-pks/proses-produksi/export-excel?${params}`);
      if (!response.ok) throw new Error("Failed to export Excel");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan-Proses-Produksi-${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Gagal mengekspor Excel");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Proses Produksi</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exporting}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={exporting}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button onClick={onCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
            <div className="lg:col-span-5">
              <DateFilterMode
                mode={(filters as any).filterMode || "single"}
                singleDate={filters.tanggalMulai}
                startDate={filters.tanggalMulai}
                endDate={filters.tanggalAkhir}
                onModeChange={(mode) => onFiltersChange({ ...filters, filterMode: mode })}
                onSingleDateChange={(date) => onFiltersChange({ ...filters, tanggalMulai: date, tanggalAkhir: date })}
                onStartDateChange={(date) => onFiltersChange({ ...filters, tanggalMulai: date })}
                onEndDateChange={(date) => onFiltersChange({ ...filters, tanggalAkhir: date })}
                onReset={() => {
                  const today = new Date().toISOString().split("T")[0] || "";
                  onFiltersChange({ ...filters, tanggalMulai: today, tanggalAkhir: today, filterMode: "single" });
                }}
                allowedModes={["single"]}
              />
            </div>

            <div className="lg:col-span-3">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Produk Output
              </label>
              <Select
                value={filters.materialOutputId}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    materialOutputId: value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Produk" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Status
              </label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    status: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_PROGRESS">Proses</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                  <SelectItem value="CANCELLED">Batal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0] || "";
                  onFiltersChange({
                    status: "",
                    tanggalMulai: today,
                    tanggalAkhir: today,
                    materialOutputId: materials[0]?.id || "",
                    filterMode: "single",
                  });
                }}
              >
                <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Produksi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Material Input</TableHead>
                <TableHead>Jumlah Input</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.nomorProduksi}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.tanggalProduksi), "dd MMM yyyy", {
                        locale: idLocale,
                      })}
                    </TableCell>
                    <TableCell>
                      {item.materialInput.name}
                      <div className="text-xs text-muted-foreground">
                        {item.materialInput.kategori.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.jumlahInput.toLocaleString("id-ID")}{" "}
                      {item.materialInput.satuan.name}
                    </TableCell>
                    <TableCell>{item.operatorProduksi}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewClick(item.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {item.status === "DRAFT" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditClick(item.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}