"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarClock, History, Loader2, PencilLine, FileSpreadsheet } from "lucide-react";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type LogProduksiItem = {
  id: string;
  nomorProduksi: string;
  tanggalProduksi: string;
  jumlahInput: number;
  operatorProduksi: string;
  status: "COMPLETED" | "CANCELLED";
  updatedAt: string;
  materialInput: {
    name: string;
    code: string;
    satuan: {
      name: string;
      symbol?: string;
    };
  };
  hasilProduksi: Array<{
    jumlahOutput: number;
    materialOutput: {
      name: string;
      code: string;
      satuan: {
        name: string;
        symbol?: string;
      };
    };
  }>;
};

type LogProduksiResponse = {
  data: LogProduksiItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiErrorResponse = {
  error?: string;
};

const getStatusBadge = (status: LogProduksiItem["status"]) => {
  const variants = {
    COMPLETED: "default",
    CANCELLED: "destructive",
  } as const;

  const labels = {
    COMPLETED: "Selesai",
    CANCELLED: "Batal",
  } as const;

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0] ?? "";
};

export function LogProduksiPage() {
  const [data, setData] = useState<LogProduksiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<"" | "COMPLETED" | "CANCELLED">("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [selectedItem, setSelectedItem] = useState<LogProduksiItem | null>(null);
  const [tanggalProduksiBaru, setTanggalProduksiBaru] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLogProduksi = useCallback(
    async (
      targetPage = 1,
      overrides?: {
        status?: "" | "COMPLETED" | "CANCELLED";
        tanggalMulai?: string;
        tanggalAkhir?: string;
      }
    ) => {
      const effectiveStatus = overrides?.status ?? status;
      const effectiveTanggalMulai = overrides?.tanggalMulai ?? tanggalMulai;
      const effectiveTanggalAkhir = overrides?.tanggalAkhir ?? tanggalAkhir;

      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: "10",
        });

        if (effectiveStatus) {
          params.append("status", effectiveStatus);
        }

        if (effectiveTanggalMulai) {
          params.append("tanggalMulai", effectiveTanggalMulai);
        }

        if (effectiveTanggalAkhir) {
          params.append("tanggalAkhir", effectiveTanggalAkhir);
        }

        const response = await fetch(`/api/pt-pks/proses-produksi/log?${params}`);
        if (!response.ok) {
          const errorResponse = (await response.json()) as ApiErrorResponse;
          throw new Error(errorResponse.error ?? "Gagal memuat log produksi");
        }

        const result = (await response.json()) as LogProduksiResponse;
        setData(result.data);
        setTotalPages(result.pagination.totalPages);
        setPage(result.pagination.page);
      } catch (error) {
        console.error("Error fetching log produksi:", error);
        toast.error(
          error instanceof Error ? error.message : "Gagal memuat log produksi"
        );
      } finally {
        setLoading(false);
      }
    },
    [status, tanggalMulai, tanggalAkhir]
  );

  useEffect(() => {
    void fetchLogProduksi(page);
  }, [fetchLogProduksi, page]);

  const handleApplyFilter = async () => {
    await fetchLogProduksi(1);
  };

  const handleResetFilter = async () => {
    setTanggalMulai("");
    setTanggalAkhir("");
    setStatus("");
    await fetchLogProduksi(1, {
      status: "",
      tanggalMulai: "",
      tanggalAkhir: "",
    });
  };

  const openCorrectionDialog = (item: LogProduksiItem) => {
    setSelectedItem(item);
    setTanggalProduksiBaru(toDateInputValue(item.tanggalProduksi));
  };

  const closeCorrectionDialog = () => {
    if (submitting) return;
    setSelectedItem(null);
    setTanggalProduksiBaru("");
  };

  const handleSubmitCorrection = async () => {
    if (!selectedItem) return;

    if (!tanggalProduksiBaru) {
      toast.error("Tanggal produksi baru harus diisi");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/pt-pks/proses-produksi/${selectedItem.id}/correct-date`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tanggalProduksiBaru }),
        }
      );

      if (!response.ok) {
        const errorResponse = (await response.json()) as ApiErrorResponse;
        throw new Error(
          errorResponse.error ?? "Gagal mengoreksi tanggal produksi"
        );
      }

      toast.success(
        `Tanggal produksi ${selectedItem.nomorProduksi} berhasil dikoreksi`
      );
      closeCorrectionDialog();
      await fetchLogProduksi(page);
    } catch (error) {
      console.error("Error correcting production date:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengoreksi tanggal produksi"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const correctionSummary = useMemo(() => {
    if (!selectedItem) return null;

    const totalOutput = selectedItem.hasilProduksi.reduce(
      (sum, hasil) => sum + hasil.jumlahOutput,
      0
    );

    return {
      totalOutput,
      satuanOutput:
        selectedItem.hasilProduksi[0]?.materialOutput.satuan.symbol ??
        selectedItem.hasilProduksi[0]?.materialOutput.satuan.name ??
        "kg",
    };
  }, [selectedItem]);

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "2000",
      });

      if (status) params.append("status", status);
      if (tanggalMulai) params.append("tanggalMulai", tanggalMulai);
      if (tanggalAkhir) params.append("tanggalAkhir", tanggalAkhir);

      let exportList = data;
      const res = await fetch(`/api/pt-pks/proses-produksi/log?${params}`);
      if (res.ok) {
        const result = (await res.json()) as LogProduksiResponse;
        if (Array.isArray(result.data) && result.data.length > 0) {
          exportList = result.data;
        }
      }

      if (exportList.length === 0) {
        toast.error("Tidak ada data log produksi untuk diexport");
        return;
      }

      const columns: ExportColumn[] = [
        { header: "Nomor Produksi", key: "nomorProduksi", width: 20 },
        { header: "Tanggal Produksi", key: "tanggalProduksiFormatted", width: 16 },
        { header: "Material Input", key: "materialInput", width: 20 },
        { header: "Jumlah Input", key: "jumlahInputFormatted", width: 18 },
        { header: "Rincian Output", key: "rincianOutput", width: 35 },
        { header: "Total Output", key: "totalOutputFormatted", width: 18 },
        { header: "Operator", key: "operatorProduksi", width: 20 },
        { header: "Status", key: "statusLabel", width: 15 },
        { header: "Terakhir Diupdate", key: "updatedAtFormatted", width: 18 },
      ];

      const dataToExport = exportList.map((item) => {
        const totalOutput = item.hasilProduksi.reduce((sum, h) => sum + h.jumlahOutput, 0);
        const rincianOutput = item.hasilProduksi
          .map((h) => `${h.materialOutput?.name || "Output"}: ${h.jumlahOutput.toLocaleString("id-ID")} ${h.materialOutput?.satuan?.symbol || "kg"}`)
          .join("; ");

        return {
          nomorProduksi: item.nomorProduksi,
          tanggalProduksiFormatted: format(new Date(item.tanggalProduksi), "dd/MM/yyyy"),
          materialInput: item.materialInput?.name || "-",
          jumlahInputFormatted: `${item.jumlahInput.toLocaleString("id-ID")} ${item.materialInput?.satuan?.symbol || "kg"}`,
          rincianOutput,
          totalOutputFormatted: `${totalOutput.toLocaleString("id-ID")} kg`,
          operatorProduksi: item.operatorProduksi || "-",
          statusLabel: item.status === "COMPLETED" ? "Selesai" : "Batal",
          updatedAtFormatted: format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm"),
        };
      });

      exportToExcel(
        dataToExport,
        columns,
        `Log_Produksi_${format(new Date(), "yyyyMMdd")}`,
        "Log_Produksi"
      );
      toast.success("Log produksi berhasil diexport");
    } catch (err) {
      console.error("Error exporting log produksi:", err);
      toast.error("Gagal mengekspor log produksi");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Riwayat Log Produksi
          </CardTitle>
          <CardDescription>
            Riwayat produksi selesai dan batal. Gunakan koreksi tanggal agar efek
            stok berpindah ke tanggal efektif yang benar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="status-log">Status</Label>
              <Select
                value={status || "all"}
                onValueChange={(value) =>
                  setStatus(value === "all" ? "" : (value as "COMPLETED" | "CANCELLED"))
                }
              >
                <SelectTrigger id="status-log">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                  <SelectItem value="CANCELLED">Batal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggal-mulai-log">Tanggal Mulai</Label>
              <Input
                id="tanggal-mulai-log"
                type="date"
                value={tanggalMulai}
                onChange={(event) => setTanggalMulai(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggal-akhir-log">Tanggal Akhir</Label>
              <Input
                id="tanggal-akhir-log"
                type="date"
                value={tanggalAkhir}
                onChange={(event) => setTanggalAkhir(event.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button className="flex-1" onClick={() => void handleApplyFilter()}>
                Terapkan
              </Button>
              <Button variant="outline" onClick={() => void handleResetFilter()}>
                Reset
              </Button>
              <Button variant="outline" onClick={handleExportExcel} disabled={data.length === 0}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Export Excel
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Produksi</TableHead>
                  <TableHead>Tanggal Produksi</TableHead>
                  <TableHead>Material Input</TableHead>
                  <TableHead className="text-right">Input</TableHead>
                  <TableHead className="text-right">Output</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diupdate</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Memuat log produksi...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Belum ada log produksi yang sesuai filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => {
                    const totalOutput = item.hasilProduksi.reduce(
                      (sum, hasil) => sum + hasil.jumlahOutput,
                      0
                    );

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nomorProduksi}</TableCell>
                        <TableCell>
                          {format(new Date(item.tanggalProduksi), "dd MMM yyyy", {
                            locale: idLocale,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.materialInput.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.materialInput.code}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.jumlahInput.toLocaleString("id-ID")}{" "}
                          {item.materialInput.satuan.symbol ??
                            item.materialInput.satuan.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalOutput.toLocaleString("id-ID")}{" "}
                          {item.hasilProduksi[0]?.materialOutput.satuan.symbol ??
                            item.hasilProduksi[0]?.materialOutput.satuan.name ??
                            "kg"}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          {format(new Date(item.updatedAt), "dd MMM yyyy HH:mm", {
                            locale: idLocale,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status === "COMPLETED" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCorrectionDialog(item)}
                            >
                              <PencilLine className="mr-2 h-4 w-4" />
                              Koreksi Tanggal
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">Tidak ada aksi</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => void fetchLogProduksi(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages || loading}
                onClick={() => void fetchLogProduksi(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) {
            closeCorrectionDialog();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Koreksi Tanggal Produksi</DialogTitle>
            <DialogDescription>
              Sistem akan memindahkan efek stok proses produksi ini ke tanggal
              baru, lalu menghitung ulang ledger stok material terkait.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <Card className="bg-muted/40">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nomor Produksi</span>
                    <span className="font-medium">{selectedItem.nomorProduksi}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tanggal Saat Ini</span>
                    <span className="font-medium">
                      {format(new Date(selectedItem.tanggalProduksi), "dd MMMM yyyy", {
                        locale: idLocale,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">TBS Diolah</span>
                    <span className="font-medium">
                      {selectedItem.jumlahInput.toLocaleString("id-ID")}{" "}
                      {selectedItem.materialInput.satuan.symbol ??
                        selectedItem.materialInput.satuan.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Output</span>
                    <span className="font-medium">
                      {correctionSummary?.totalOutput.toLocaleString("id-ID")}{" "}
                      {correctionSummary?.satuanOutput}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="tanggal-produksi-baru">Tanggal Produksi Baru</Label>
                <Input
                  id="tanggal-produksi-baru"
                  type="date"
                  value={tanggalProduksiBaru}
                  onChange={(event) => setTanggalProduksiBaru(event.target.value)}
                />
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Gunakan aksi ini jika produksi tercatat di tanggal yang salah.
                    Jika tanggal baru membuat stok historis menjadi negatif, sistem
                    akan menolak koreksi.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeCorrectionDialog} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={() => void handleSubmitCorrection()} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Koreksi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
