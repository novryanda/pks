"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface ProsesProduksiDetail {
  id: string;
  nomorProduksi: string;
  tanggalProduksi: string;
  materialInput: {
    name: string;
    code: string;
    kategori: { name: string };
    satuan: { name: string };
  };
  jumlahInput: number;
  operatorProduksi: string;
  status: string;
  hasilProduksi: Array<{
    id: string;
    materialOutput: {
      name: string;
      code: string;
      kategori: { name: string };
      satuan: { name: string };
    };
    jumlahOutput: number;
    rendemen: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ProsesProduksiDetailProps {
  id: string;
  onBack: () => void;
  onRefresh?: () => void;
}

export function ProsesProduksiDetail({
  id,
  onBack,
  onRefresh,
}: ProsesProduksiDetailProps) {
  const [data, setData] = useState<ProsesProduksiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pt-pks/proses-produksi/${id}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching proses produksi:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin mengubah status menjadi "${getStatusLabel(status)}"?`
      )
    )
      return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/pt-pks/proses-produksi/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      alert("Status berhasil diupdate");
      await fetchData();
      onRefresh?.();
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert(error.message || "Gagal mengubah status");
    } finally {
      setUpdating(false);
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Draft",
      IN_PROGRESS: "Proses",
      COMPLETED: "Selesai",
      CANCELLED: "Batal",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-24 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center">Data tidak ditemukan</p>
        </CardContent>
      </Card>
    );
  }

  const totalOutput = data.hasilProduksi.reduce(
    (sum, h) => sum + h.jumlahOutput,
    0
  );
  const averageRendemen =
    data.hasilProduksi.reduce((sum, h) => sum + h.rendemen, 0) /
    data.hasilProduksi.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <CardTitle>Detail Proses Produksi</CardTitle>
              <p className="text-sm text-muted-foreground">
                {data.nomorProduksi}
              </p>
            </div>
            <div>{getStatusBadge(data.status)}</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Produksi</p>
              <p className="font-medium">
                {format(new Date(data.tanggalProduksi), "dd MMMM yyyy", {
                  locale: idLocale,
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Operator Produksi</p>
              <p className="font-medium">{data.operatorProduksi}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Dibuat Pada</p>
              <p className="font-medium">
                {format(
                  new Date(data.createdAt),
                  "dd MMM yyyy HH:mm",
                  { locale: idLocale }
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Terakhir Diupdate
              </p>
              <p className="font-medium">
                {format(
                  new Date(data.updatedAt),
                  "dd MMM yyyy HH:mm",
                  { locale: idLocale }
                )}
              </p>
            </div>
          </div>

          {/* Status Actions */}
          {data.status !== "COMPLETED" && data.status !== "CANCELLED" && (
            <div className="flex gap-2 border-t pt-4">
              {data.status === "DRAFT" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => updateStatus("IN_PROGRESS")}
                    disabled={updating}
                  >
                    Mulai Proses
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateStatus("COMPLETED")}
                    disabled={updating}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Selesaikan
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus("CANCELLED")}
                    disabled={updating}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Batalkan
                  </Button>
                </>
              )}

              {data.status === "IN_PROGRESS" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => updateStatus("COMPLETED")}
                    disabled={updating}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Selesaikan
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus("CANCELLED")}
                    disabled={updating}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Batalkan
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Material Input */}
      <Card>
        <CardHeader>
          <CardTitle>Material Input (TBS)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Material:</span>
              <span className="font-medium">{data.materialInput.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kode:</span>
              <span className="font-medium">{data.materialInput.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kategori:</span>
              <span className="font-medium">
                {data.materialInput.kategori.name}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Jumlah Input:</span>
              <span className="text-lg font-bold">
                {data.jumlahInput.toLocaleString("id-ID")}{" "}
                {data.materialInput.satuan.name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hasil Produksi */}
      <Card>
        <CardHeader>
          <CardTitle>Hasil Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Output</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Jumlah Output</TableHead>
                <TableHead className="text-right">Rendemen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.hasilProduksi.map((hasil) => (
                <TableRow key={hasil.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{hasil.materialOutput.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {hasil.materialOutput.code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{hasil.materialOutput.kategori.name}</TableCell>
                  <TableCell className="text-right">
                    {hasil.jumlahOutput.toLocaleString("id-ID")}{" "}
                    {hasil.materialOutput.satuan.name}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {hasil.rendemen.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </CardContent>
      </Card>
    </div>
  );
}
