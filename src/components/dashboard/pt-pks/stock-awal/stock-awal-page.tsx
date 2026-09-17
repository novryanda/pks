"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { RefreshCw, Save, Search, FileSpreadsheet } from "lucide-react";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

type OpeningStockRow = {
  materialId: string;
  code: string;
  name: string;
  kategoriName: string;
  satuan: string;
  currentStock: number;
  stockBeforeDate: number;
  openingQuantity: number | null;
  openingMovementId: string | null;
  openingUpdatedAt: string | null;
};

type OpeningStockResponse = {
  date: string;
  rows?: OpeningStockRow[];
  error?: string;
};

type SaveOpeningStockResponse = {
  success?: boolean;
  message?: string;
  rows?: OpeningStockRow[];
  error?: string;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

export function StockAwalPage() {
  const today = new Date().toISOString().split("T")[0]!;
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState<OpeningStockRow[]>([]);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { hasActionAccess } = useUserPermissions();

  const canManage = hasActionAccess("gudang.stockAwal", "create") || hasActionAccess("gudang.stockAwal", "edit");

  const loadData = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pt-pks/opening-stock?date=${date}`);
      const result = (await response.json()) as OpeningStockResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "Gagal memuat stock awal");
      }

      const fetchedRows = Array.isArray(result.rows) ? result.rows : [];
      setRows(fetchedRows);
      setDraftValues(
        Object.fromEntries(
          fetchedRows.map((row) => [
            row.materialId,
            row.openingQuantity !== null ? String(row.openingQuantity) : "",
          ])
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat stock awal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(selectedDate);
  }, [loadData, selectedDate]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) {
      return rows;
    }

    const query = searchTerm.toLowerCase();
    return rows.filter((row) =>
      row.code.toLowerCase().includes(query) ||
      row.name.toLowerCase().includes(query) ||
      row.kategoriName.toLowerCase().includes(query)
    );
  }, [rows, searchTerm]);

  const totalOpeningMaterials = filteredRows.filter((row) => {
    const value = draftValues[row.materialId];
    return value !== undefined && value !== "";
  }).length;

  const totalOpeningQuantity = filteredRows.reduce((sum, row) => {
    const value = draftValues[row.materialId];
    const parsed = value !== undefined && value !== "" ? Number(value) : 0;
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);

  const handleSave = async () => {
    const entries = rows
      .map((row) => {
        const rawValue = draftValues[row.materialId] ?? "";
        if (rawValue === "") {
          return {
            materialId: row.materialId,
            quantity: null,
          };
        }

        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error(`Nilai stock awal untuk ${row.name} tidak valid`);
        }

        return {
          materialId: row.materialId,
          quantity: parsed,
        };
      })
      .filter((entry, index) => {
        const row = rows[index]!;
        return entry.quantity !== null || row.openingQuantity !== null;
      });

    if (entries.length === 0) {
      toast.error("Belum ada stock awal yang diisi");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/pt-pks/opening-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          entries,
        }),
      });

      const result = (await response.json()) as SaveOpeningStockResponse;
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menyimpan stock awal");
      }

      toast.success("Stock awal berhasil disimpan");
      await loadData(selectedDate);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan stock awal");
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Kode Material", key: "code", width: 15 },
      { header: "Nama Material", key: "name", width: 30 },
      { header: "Kategori", key: "kategoriName", width: 20 },
      { header: "Satuan", key: "satuan", width: 10 },
      { header: "Stok Sebelum Tanggal", key: "stockBeforeDateFormatted", width: 22 },
      { header: "Stok Awal Terinput", key: "openingQuantityFormatted", width: 20 },
      { header: "Stok Berjalan Saat Ini", key: "currentStockFormatted", width: 22 },
      { header: "Terakhir Diupdate", key: "updatedAtFormatted", width: 20 },
    ];

    const dataToExport = filteredRows.map((row) => ({
      code: row.code,
      name: row.name,
      kategoriName: row.kategoriName,
      satuan: row.satuan,
      stockBeforeDateFormatted: formatNumber(row.stockBeforeDate),
      openingQuantityFormatted: row.openingQuantity !== null ? formatNumber(row.openingQuantity) : "-",
      currentStockFormatted: formatNumber(row.currentStock),
      updatedAtFormatted: row.openingUpdatedAt ? new Date(row.openingUpdatedAt).toLocaleDateString("id-ID") : "-",
    }));

    exportToExcel(
      dataToExport,
      columns,
      `Stock_Awal_${selectedDate}`,
      "Stock_Awal"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Awal</h1>
        <p className="text-muted-foreground">
          Input saldo awal material per tanggal tanpa perlu inject langsung ke database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameter Stock Awal</CardTitle>
          <CardDescription>
            Nilai yang disimpan dianggap sebagai saldo stok pada akhir tanggal yang dipilih.
            Sistem akan menyesuaikan ledger stock movement otomatis setelah disimpan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[220px_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="opening-date">Tanggal Stock Awal</Label>
            <Input
              id="opening-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-material">Cari Material</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search-material"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
                placeholder="Kode, nama material, kategori..."
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportExcel}
              disabled={loading || filteredRows.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
              Export Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadData(selectedDate)}
              disabled={loading || saving}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canManage || loading || saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Tanggal Aktif</div>
            <div className="text-2xl font-bold">{selectedDate}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Material Terisi</div>
            <div className="text-2xl font-bold">{totalOpeningMaterials}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Qty Draft</div>
            <div className="text-2xl font-bold">{formatNumber(totalOpeningQuantity)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Material</CardTitle>
          <CardDescription>
            Kosongkan nilai yang sudah ada jika ingin menghapus opening stock untuk material tersebut.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Saldo Sebelum Tanggal</TableHead>
                  <TableHead className="text-right">Stok Saat Ini</TableHead>
                  <TableHead className="w-[180px]">Stock Awal</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Memuat data stock awal...
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Tidak ada material yang cocok.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.materialId}>
                      <TableCell className="font-mono">{row.code}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.kategoriName}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.stockBeforeDate)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.currentStock)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draftValues[row.materialId] ?? ""}
                          onChange={(event) =>
                            setDraftValues((current) => ({
                              ...current,
                              [row.materialId]: event.target.value,
                            }))
                          }
                          disabled={!canManage}
                          placeholder="Isi stock awal"
                        />
                      </TableCell>
                      <TableCell>{row.satuan}</TableCell>
                      <TableCell>
                        {row.openingQuantity !== null ? (
                          <Badge variant="default">Sudah Diset</Badge>
                        ) : (
                          <Badge variant="secondary">Belum Ada</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
