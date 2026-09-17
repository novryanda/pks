"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Download, Eye } from "lucide-react";
import Link from "next/link";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";
import { toast } from "sonner";
import { buildPaginationItems } from "@/lib/pagination";

interface MaterialInventaris {
  id: string;
  partNumber: string;
  namaMaterial: string;
  spesifikasi?: string;
  kategoriMaterial: {
    name: string;
  };
  satuanMaterial: {
    name: string;
    symbol: string;
  };
  lokasiDigunakan?: string;
  hargaSatuan?: number;
  stockOnHand: number;
  minStock: number;
  maxStock: number;
}

const ITEMS_PER_PAGE = 25;

export function MaterialInventarisList() {
  const [materials, setMaterials] = useState<MaterialInventaris[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await fetch("/api/pt-pks/material-inventaris");
      if (response.ok) {
        const data: unknown = await response.json();
        setMaterials(Array.isArray(data) ? (data as MaterialInventaris[]) : []);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, materials.length]);

  const filteredMaterials = materials.filter(
    (m) =>
      m.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.namaMaterial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.kategoriMaterial.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / ITEMS_PER_PAGE));
  const paginationItems = buildPaginationItems(currentPage, totalPages);
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const pageStart = filteredMaterials.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredMaterials.length);

  const getStockBadge = (material: MaterialInventaris) => {
    if (material.stockOnHand <= material.minStock) {
      return <Badge variant="destructive">Low Stock</Badge>;
    }
    if (material.stockOnHand >= material.maxStock) {
      return <Badge variant="secondary">Overstock</Badge>;
    }
    return <Badge variant="default">Normal</Badge>;
  };

  const getStockStatus = (material: MaterialInventaris): string => {
    if (material.stockOnHand <= material.minStock) return "Low Stock";
    if (material.stockOnHand >= material.maxStock) return "Overstock";
    return "Normal";
  };

  const handleExport = () => {
    if (filteredMaterials.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Part Number", key: "partNumber", width: 15 },
      { header: "Nama Material", key: "namaMaterial", width: 35 },
      { header: "Spesifikasi", key: "spesifikasi", width: 40 },
      { header: "Kategori", key: "kategoriMaterial.name", width: 20 },
      { header: "Satuan", key: "satuanMaterial.symbol", width: 10 },
      { header: "Lokasi", key: "lokasiDigunakan", width: 20 },
      { header: "Harga Satuan", key: "hargaSatuan", width: 15 },
      { header: "Stock On Hand", key: "stockOnHand", width: 15 },
      { header: "Min Stock", key: "minStock", width: 12 },
      { header: "Max Stock", key: "maxStock", width: 12 },
    ];

    // Add status column by transforming data
    const dataWithStatus = filteredMaterials.map((material) => ({
      ...material,
      status: getStockStatus(material),
    }));

    const columnsWithStatus: ExportColumn[] = [
      ...columns,
      { header: "Status", key: "status", width: 12 },
    ];

    try {
      exportToExcel(dataWithStatus, columnsWithStatus, "Material_Inventaris", "Material");
      toast.success(`Berhasil export ${filteredMaterials.length} data material`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal export data");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Master Material Inventaris</CardTitle>
            <Link href="/dashboard/pt-pks/gudang/material-inventaris/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Material
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari part number, nama material, atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Nama Material</TableHead>
                  <TableHead>Spesifikasi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      Tidak ada data material
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">
                        {material.partNumber}
                      </TableCell>
                      <TableCell>{material.namaMaterial}</TableCell>
                      <TableCell className="max-w-[320px] whitespace-pre-wrap text-sm text-muted-foreground">
                        {material.spesifikasi ?? "-"}
                      </TableCell>
                      <TableCell>{material.kategoriMaterial.name}</TableCell>
                      <TableCell>{material.satuanMaterial.symbol}</TableCell>
                      <TableCell>{material.lokasiDigunakan ?? "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {material.stockOnHand}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {material.minStock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {material.maxStock}
                      </TableCell>
                      <TableCell>{getStockBadge(material)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/pt-pks/gudang/material-inventaris/${material.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredMaterials.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted-foreground">
                Menampilkan <span className="font-semibold text-foreground">{pageStart}</span> -{" "}
                <span className="font-semibold text-foreground">{pageEnd}</span> dari{" "}
                <span className="font-semibold text-foreground">{filteredMaterials.length}</span> data
              </div>
              {totalPages > 1 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  {paginationItems.map((item) =>
                    typeof item === "number" ? (
                      <Button
                        key={item}
                        variant={item === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(item)}
                      >
                        {item}
                      </Button>
                    ) : (
                      <div
                        key={item}
                        className="flex items-center px-2 text-muted-foreground"
                      >
                        ...
                      </div>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
