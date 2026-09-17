"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, ShoppingCart } from "lucide-react";

interface StoreRequest {
  id: string;
  nomorSR: string;
  tanggalRequest: string;
  divisi: string;
  requestedBy: string;
  approvedBy: string;
  tanggalApproval: string;
  keterangan?: string;
  items: Array<{
    id: string;
    jumlahRequest: number;
    keterangan?: string;
    material: {
      id: string;
      namaMaterial: string;
      partNumber: string;
      hargaSatuan: number;
      stockOnHand: number;
      kategoriMaterial: {
        nama: string;
      };
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

interface PengeluaranBarangFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const getCurrentLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
};

export function PengeluaranBarangForm({ onSuccess, onCancel }: PengeluaranBarangFormProps) {
  const [approvedSRs, setApprovedSRs] = useState<StoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSR, setSelectedSR] = useState<StoreRequest | null>(null);
  const [tanggalPengeluaran, setTanggalPengeluaran] = useState(getCurrentLocalDateTime);

  useEffect(() => {
    fetchApprovedSRs();
  }, []);

  const fetchApprovedSRs = async () => {
    try {
      const response = await fetch("/api/pt-pks/pengeluaran-barang/approved-sr");
      if (response.ok) {
        const data = await response.json();
        setApprovedSRs(data);
      } else {
        toast.error("Gagal mengambil data SR yang sudah approved");
      }
    } catch (error) {
      console.error("Error fetching approved SRs:", error);
      toast.error("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const calculateItemTotal = (item: StoreRequest['items'][0]) => {
    return item.jumlahRequest * item.material.hargaSatuan;
  };

  const calculateSRTotal = (sr: StoreRequest) => {
    return sr.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const handleSubmit = async (srId: string) => {
    if (!tanggalPengeluaran) {
      toast.error("Tanggal dan waktu pengeluaran wajib diisi");
      return;
    }

    const parsedTanggalPengeluaran = new Date(tanggalPengeluaran);
    if (Number.isNaN(parsedTanggalPengeluaran.getTime())) {
      toast.error("Tanggal dan waktu pengeluaran tidak valid");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/pt-pks/pengeluaran-barang/create-from-sr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeRequestId: srId,
          tanggalPengeluaran: parsedTanggalPengeluaran.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Pengeluaran barang berhasil dibuat dan stok telah diperbarui");
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || "Gagal membuat pengeluaran barang");
      }
    } catch (error) {
      console.error("Error creating pengeluaran barang:", error);
      toast.error("Terjadi kesalahan saat membuat pengeluaran barang");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (approvedSRs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tambah Pengeluaran Barang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Tidak ada Store Request yang sudah approved dan belum diproses.
            </p>
            <Button onClick={onCancel} className="mt-4">
              Kembali
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pilih Store Request untuk Pengeluaran Barang</CardTitle>
            <Button variant="outline" onClick={onCancel}>
              Batal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {approvedSRs.map((sr) => (
            <Card key={sr.id} className="border-2">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{sr.nomorSR}</h3>
                      <Badge>Approved</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Divisi: <span className="font-medium text-foreground">{sr.divisi}</span></p>
                      <p>Diminta oleh: <span className="font-medium text-foreground">{sr.requestedBy}</span></p>
                      <p>Disetujui oleh: <span className="font-medium text-foreground">{sr.approvedBy}</span></p>
                      <p>Tanggal Request: {format(new Date(sr.tanggalRequest), "dd MMM yyyy", { locale: id })}</p>
                      <p>Tanggal Approval: {format(new Date(sr.tanggalApproval), "dd MMM yyyy HH:mm", { locale: id })}</p>
                      {sr.keterangan && <p>Keterangan: {sr.keterangan}</p>}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (selectedSR?.id === sr.id) {
                        setSelectedSR(null);
                        return;
                      }

                      setSelectedSR(sr);
                      setTanggalPengeluaran(getCurrentLocalDateTime());
                    }}
                    variant={selectedSR?.id === sr.id ? "default" : "outline"}
                  >
                    {selectedSR?.id === sr.id ? "Sembunyikan Detail" : "Lihat Detail"}
                  </Button>
                </div>

                {selectedSR?.id === sr.id && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid gap-2 md:max-w-sm">
                      <Label htmlFor={`tanggalPengeluaran-${sr.id}`}>Tanggal & Waktu Pengeluaran</Label>
                      <Input
                        id={`tanggalPengeluaran-${sr.id}`}
                        type="datetime-local"
                        value={tanggalPengeluaran}
                        onChange={(e) => setTanggalPengeluaran(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Nilai ini akan dipakai sebagai tanggal dan jam pengeluaran barang.
                      </p>
                    </div>

                    <h4 className="font-semibold">Detail Material:</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part Number</TableHead>
                          <TableHead>Nama Material</TableHead>
                          
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead className="text-right">Harga Satuan</TableHead>
                          <TableHead className="text-right">Total Harga</TableHead>
                          <TableHead className="text-right">Stok Tersedia</TableHead>
                          <TableHead>Keterangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sr.items.map((item) => {
                          const isStockSufficient = item.material.stockOnHand >= item.jumlahRequest;
                          return (
                            <TableRow key={item.id} className={!isStockSufficient ? "bg-red-50" : ""}>
                              <TableCell className="font-mono text-sm">{item.material.partNumber}</TableCell>
                              <TableCell>{item.material.namaMaterial}</TableCell>

                              <TableCell className="text-right">
                                {item.jumlahRequest.toLocaleString("id-ID")} {item.material.satuanMaterial.symbol}
                              </TableCell>
                              <TableCell className="text-right">
                                Rp {item.material.hargaSatuan.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                Rp {calculateItemTotal(item).toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={!isStockSufficient ? "text-red-600 font-semibold" : ""}>
                                  {item.material.stockOnHand.toLocaleString("id-ID")} {item.material.satuanMaterial.symbol}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {item.keterangan || "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">
                          Total: Rp {calculateSRTotal(sr).toLocaleString("id-ID")}
                        </p>
                        {sr.items.some(item => item.material.stockOnHand < item.jumlahRequest) && (
                          <p className="text-sm text-red-600 font-semibold">
                            ⚠️ Beberapa material stok tidak mencukupi
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleSubmit(sr.id)}
                        disabled={submitting || sr.items.some(item => item.material.stockOnHand < item.jumlahRequest)}
                        size="lg"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Proses Pengeluaran Barang
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
