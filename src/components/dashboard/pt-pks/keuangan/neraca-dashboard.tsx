"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Database, Landmark, RefreshCw, Scale, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type NeracaResponse = {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  summary: {
    asetLancar: number;
    kewajibanLancar: number;
    modalKerja: number;
    piutangCustomer: number;
    inventaris: number;
    klaimSusut: number;
    hutangSupplier: number;
    upahBongkar: number;
    pembayaranTransportir: number;
    pembayaranPR: number;
    pembayaranPO: number;
    biayaPengeluaran: number;
    klaimMutu: number;
  };
  aset: {
    piutangCustomer: {
      items: {
        id: string;
        nomorReferensi: string;
        buyerNama: string;
        contractNumber: string | null;
        sisaPiutang: number;
        status: string;
      }[];
    };
    inventaris: {
      items: {
        id: string;
        nama: string;
        kode: string;
        jumlah: number;
        hargaSatuan: number;
        nilai: number;
      }[];
    };
    klaimSusut: {
      total: number;
      items: {
        id: string;
        nomorInvoice: string;
        buyer: { name: string } | null;
        klaimSusutNilai: number;
      }[];
    };
    stockProduct: {
      items: {
        id: string;
        namaTangki: string;
        material: string;
        isiSaatIni: number;
      }[];
    };
    stockTBS: {
      items: {
        id: string;
        material: string;
        jumlah: number;
      }[];
    };
  };
  kewajiban: {
    hutangSupplier: {
      items: {
        id: string;
        nomorReferensi: string;
        supplierNama: string;
        sisaHutang: number;
        status: string;
      }[];
    };
    upahBongkar: {
      items: {
        id: string;
        nomorReferensi: string;
        vendorBongkarNama: string;
        counterpart: string;
        sisaHutang: number;
        status: string;
      }[];
    };
    pembayaranTransportir: {
      items: {
        id: string;
        nomorReferensi: string;
        vendorNama: string;
        sisaHutang: number;
        status: string;
      }[];
    };
    pembayaranPR: {
      items: {
        id: string;
        nomorReferensi: string;
        vendorNama: string;
        sisaHutang: number;
        status: string;
      }[];
    };
    pembayaranPO: {
      items: {
        id: string;
        nomorReferensi: string;
        vendorNama: string;
        sisaHutang: number;
        status: string;
      }[];
    };
    biayaPengeluaran: {
      items: {
        id: string;
        nomorBiaya: string;
        kategoriBiaya: string;
        deskripsi: string;
        jumlahBiaya: number;
      }[];
    };
    klaimMutu: {
      total: number;
      items: {
        id: string;
        nomorInvoice: string;
        buyer: { name: string } | null;
        klaimMutuNilai: number;
      }[];
    };
  };
  notes: string[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

const formatQuantity = (value: number) => new Intl.NumberFormat("id-ID").format(value);

export function NeracaDashboard() {
  const [data, setData] = useState<NeracaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/pt-pks/keuangan/neraca?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Gagal memuat neraca");
      }

      const result = (await res.json()) as NeracaResponse;
      setData(result);
    } catch (error) {
      console.error("Error fetching neraca:", error);
      toast.error("Gagal memuat neraca");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const handleExportExcel = () => {
    if (!data) {
      toast.error("Tidak ada data neraca untuk diexport");
      return;
    }

    const columns: ExportColumn[] = [
      { header: "Kategori", key: "kategori", width: 22 },
      { header: "Pos Akun / Keterangan", key: "namaPos", width: 35 },
      { header: "Jumlah (Rp)", key: "jumlahFormatted", width: 25 },
    ];

    const rows = [
      // Ringkasan Utama
      { kategori: "RINGKASAN", namaPos: "Total Aset Lancar", jumlahFormatted: formatCurrency(data.summary.asetLancar) },
      { kategori: "RINGKASAN", namaPos: "Total Kewajiban Lancar", jumlahFormatted: formatCurrency(data.summary.kewajibanLancar) },
      { kategori: "RINGKASAN", namaPos: "Modal Kerja Bersih (Net)", jumlahFormatted: formatCurrency(data.summary.modalKerja) },
      
      // Rincian Aset
      { kategori: "ASET LANCAR", namaPos: "Piutang Customer", jumlahFormatted: formatCurrency(data.summary.piutangCustomer) },
      { kategori: "ASET LANCAR", namaPos: "Nilai Inventaris", jumlahFormatted: formatCurrency(data.summary.inventaris) },
      { kategori: "ASET LANCAR", namaPos: "Klaim Susut", jumlahFormatted: formatCurrency(data.summary.klaimSusut) },
      
      // Rincian Kewajiban
      { kategori: "KEWAJIBAN LANCAR", namaPos: "Hutang Supplier TBS", jumlahFormatted: formatCurrency(data.summary.hutangSupplier) },
      { kategori: "KEWAJIBAN LANCAR", namaPos: "Hutang Upah Bongkar TBS", jumlahFormatted: formatCurrency(data.summary.upahBongkar) },
      { kategori: "KEWAJIBAN LANCAR", namaPos: "Hutang Pembayaran Transportir", jumlahFormatted: formatCurrency(data.summary.pembayaranTransportir) },
      { kategori: "KEWAJIBAN LANCAR", namaPos: "Hutang Pembayaran PR", jumlahFormatted: formatCurrency(data.summary.pembayaranPR) },
      { kategori: "KEWAJIBAN LANCAR", namaPos: "Hutang Pembayaran PO", jumlahFormatted: formatCurrency(data.summary.pembayaranPO) },
      { kategori: "KEWAJIBAN LANCAR", namaPos: "Biaya Pengeluaran", jumlahFormatted: formatCurrency(data.summary.biayaPengeluaran) },
      { kategori: "KEWAJIBAN LANCAR", namaPos: "Klaim Mutu", jumlahFormatted: formatCurrency(data.summary.klaimMutu) },
    ];

    const periodStr = startDate && endDate ? `${startDate}_sd_${endDate}` : format(new Date(), "yyyyMMdd");
    exportToExcel(rows, columns, `Neraca_Keuangan_${periodStr}`, "Neraca");
    toast.success("Neraca keuangan berhasil diexport");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Neraca Operasional</h1>
          <p className="text-muted-foreground">
            Posisi aset dan kewajiban dihitung dari saldo sisa transaksi yang masih terbuka.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <Button variant="outline" onClick={handleExportExcel} disabled={!data}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => void fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aset Lancar</CardDescription>
            <CardTitle className="text-xl">{formatCurrency(data.summary.asetLancar)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kewajiban Lancar</CardDescription>
            <CardTitle className="text-xl text-red-600">{formatCurrency(data.summary.kewajibanLancar)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modal Kerja</CardDescription>
            <CardTitle className={`text-xl ${data.summary.modalKerja >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(data.summary.modalKerja)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Ringkasan Aset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Piutang Customer</span>
              <span className="font-medium">{formatCurrency(data.summary.piutangCustomer)}</span>
            </div>
            <div className="flex justify-between">
              <span>Inventaris</span>
              <span className="font-medium">{formatCurrency(data.summary.inventaris)}</span>
            </div>
            <div className="flex justify-between">
              <span>Klaim Susut</span>
              <span className="font-medium">{formatCurrency(data.summary.klaimSusut)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Ringkasan Kewajiban
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Hutang Supplier</span>
              <span className="font-medium">{formatCurrency(data.summary.hutangSupplier)}</span>
            </div>
            <div className="flex justify-between">
              <span>Upah Bongkar</span>
              <span className="font-medium">{formatCurrency(data.summary.upahBongkar)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pembayaran Transportir</span>
              <span className="font-medium">{formatCurrency(data.summary.pembayaranTransportir)}</span>
            </div>
            <div className="flex justify-between">
              <span>PR Langsung</span>
              <span className="font-medium">{formatCurrency(data.summary.pembayaranPR)}</span>
            </div>
            <div className="flex justify-between">
              <span>PO</span>
              <span className="font-medium">{formatCurrency(data.summary.pembayaranPO)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Pengeluaran</span>
              <span className="font-medium">{formatCurrency(data.summary.biayaPengeluaran)}</span>
            </div>
            <div className="flex justify-between">
              <span>Klaim Mutu</span>
              <span className="font-medium">{formatCurrency(data.summary.klaimMutu)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Piutang Customer</CardTitle>
            <CardDescription>Saldo invoice customer yang belum lunas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[360px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Invoice</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Kontrak</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.aset.piutangCustomer.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        Tidak ada piutang customer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.aset.piutangCustomer.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nomorReferensi}</TableCell>
                        <TableCell>{item.buyerNama}</TableCell>
                        <TableCell>{item.contractNumber || "-"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.sisaPiutang)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hutang Supplier</CardTitle>
            <CardDescription>Saldo supplier dari penerimaan TBS yang belum dibayar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[360px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Penerimaan</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.kewajiban.hutangSupplier.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        Tidak ada hutang supplier.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.kewajiban.hutangSupplier.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nomorReferensi}</TableCell>
                        <TableCell>{item.supplierNama}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.sisaHutang)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upah Bongkar</CardTitle>
            <CardDescription>Saldo upah bongkar dari penerimaan TBS yang belum dibayar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[360px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referensi</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.kewajiban.upahBongkar.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        Tidak ada saldo upah bongkar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.kewajiban.upahBongkar.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nomorReferensi}</TableCell>
                        <TableCell>{item.vendorBongkarNama}</TableCell>
                        <TableCell>{item.counterpart}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.sisaHutang)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pembayaran Transportir</CardTitle>
            <CardDescription>Saldo tagihan vendor transportir dari pengiriman product yang sudah selesai.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[360px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referensi</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.kewajiban.pembayaranTransportir.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                        Tidak ada saldo pembayaran transportir.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.kewajiban.pembayaranTransportir.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nomorReferensi}</TableCell>
                        <TableCell>{item.vendorNama}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.sisaHutang)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PR dan PO Terbuka</CardTitle>
            <CardDescription>Saldo PR langsung dan PO yang belum lunas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[180px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referensi</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.kewajiban.pembayaranPR.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nomorReferensi}</TableCell>
                      <TableCell>{item.vendorNama}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.sisaHutang)}</TableCell>
                    </TableRow>
                  ))}
                  {data.kewajiban.pembayaranPR.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-4 text-center text-muted-foreground">
                        Tidak ada PR terbuka.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            <ScrollArea className="h-[180px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referensi</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.kewajiban.pembayaranPO.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nomorReferensi}</TableCell>
                      <TableCell>{item.vendorNama}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.sisaHutang)}</TableCell>
                    </TableRow>
                  ))}
                  {data.kewajiban.pembayaranPO.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-4 text-center text-muted-foreground">
                        Tidak ada PO terbuka.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Informasi Stok Product
            </CardTitle>
            <CardDescription>Ditampilkan dalam kuantitas operasional karena nilai persediaan belum tersedia.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tangki</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Isi Saat Ini</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.aset.stockProduct.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                        Tidak ada stok product.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.aset.stockProduct.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.namaTangki}</TableCell>
                        <TableCell>{item.material}</TableCell>
                        <TableCell className="text-right">{formatQuantity(item.isiSaatIni)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Informasi Stock TBS
            </CardTitle>
            <CardDescription>Stok bahan baku ditampilkan dalam kuantitas untuk kebutuhan operasional.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.aset.stockTBS.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                        Tidak ada stock TBS.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.aset.stockTBS.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.material}</TableCell>
                        <TableCell className="text-right">{formatQuantity(item.jumlah)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catatan Neraca</CardTitle>
          <CardDescription>Asumsi yang dipakai pada dashboard ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {data.notes.map((note) => (
            <div key={note}>{note}</div>
          ))}
          {data.period.startDate && data.period.endDate && (
            <div>
              Periode aktif:{" "}
              {format(new Date(data.period.startDate), "dd MMM yyyy", { locale: idLocale })} sampai{" "}
              {format(new Date(data.period.endDate), "dd MMM yyyy", { locale: idLocale })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
