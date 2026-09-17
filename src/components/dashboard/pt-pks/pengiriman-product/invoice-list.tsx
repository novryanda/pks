"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  FileText,
  Eye,
  Send,
  XCircle,
  CreditCard,
  Building2,
  Calendar,
  Banknote,
  CheckCircle2,
  Clock,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { NumericInput } from "@/components/ui/numeric-input";

type Invoice = {
  id: string;
  nomorInvoice: string;
  tanggalInvoice: string;
  tanggalJatuhTempo: string | null;
  status: string;
  totalBerat: number;
  hargaPerKg: number;
  subtotalBruto: number;
  klaimMutuPersen: number;
  klaimMutuNilai: number;
  klaimSusutPersen: number;
  klaimSusutNilai: number;
  totalPotongan: number;
  subtotalNetto: number;
  ppnPersen: number;
  ppnNilai: number;
  pphPersen: number;
  pphNilai: number;
  totalNilai: number;
  totalDibayar: number;
  sisaPembayaran: number;
  buyer: {
    id: string;
    name: string;
    code: string;
  };
  contract: {
    id: string;
    contractNumber: string;
  };
  invoiceItems: {
    id: string;
    nomorPengiriman: string;
    beratNetto: number;
  }[];
  pembayaranInvoice: {
    id: string;
    tanggalBayar: string;
    jumlahBayar: number;
    metodePembayaran: string | null;
  }[];
};

type InvoiceListProps = {
  onRefresh?: () => void;
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ISSUED: "bg-blue-100 text-blue-700",
  PARTIAL_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Terbit",
  PARTIAL_PAID: "Sebagian Dibayar",
  PAID: "Lunas",
  CANCELLED: "Batal",
};

export function InvoiceList({ onRefresh }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Payment form
  const [tanggalBayar, setTanggalBayar] = useState(format(new Date(), "yyyy-MM-dd"));
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [metodePembayaran, setMetodePembayaran] = useState("");
  const [nomorReferensi, setNomorReferensi] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pt-pks/invoice?limit=50");
      if (res.ok) {
        const result = await res.json();
        setInvoices(result.data || []);
      } else {
        console.error("Failed to fetch invoices");
        setInvoices([]);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleRefresh = () => {
    fetchInvoices();
    onRefresh?.();
  };

  const handleIssue = async (invoice: Invoice) => {
    if (!confirm(`Terbitkan invoice ${invoice.nomorInvoice}? Invoice yang sudah diterbitkan tidak dapat diubah.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/pt-pks/invoice/${invoice.id}/issue`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menerbitkan invoice");
      }

      toast.success(`Invoice ${invoice.nomorInvoice} berhasil diterbitkan`);
      handleRefresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal menerbitkan invoice");
    }
  };

  const handleCancel = async (invoice: Invoice) => {
    if (!confirm(`Batalkan invoice ${invoice.nomorInvoice}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/pt-pks/invoice/${invoice.id}/cancel`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membatalkan invoice");
      }

      toast.success(`Invoice ${invoice.nomorInvoice} berhasil dibatalkan`);
      handleRefresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal membatalkan invoice");
    }
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setJumlahBayar(invoice.sisaPembayaran.toString());
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedInvoice) return;

    const amount = parseFloat(jumlahBayar);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Jumlah bayar harus lebih dari 0");
      return;
    }

    if (amount > selectedInvoice.sisaPembayaran) {
      toast.error(`Jumlah bayar melebihi sisa pembayaran (Rp ${selectedInvoice.sisaPembayaran.toLocaleString("id-ID")})`);
      return;
    }

    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/pt-pks/invoice/${selectedInvoice.id}/pembayaran`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggalBayar,
          jumlahBayar: amount,
          metodePembayaran: metodePembayaran || null,
          nomorReferensi: nomorReferensi || null,
          keterangan: keterangan || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menambahkan pembayaran");
      }

      toast.success("Pembayaran berhasil dicatat");
      setShowPaymentDialog(false);
      resetPaymentForm();
      handleRefresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan pembayaran");
    } finally {
      setPaymentLoading(false);
    }
  };

  const resetPaymentForm = () => {
    setTanggalBayar(format(new Date(), "yyyy-MM-dd"));
    setJumlahBayar("");
    setMetodePembayaran("");
    setNomorReferensi("");
    setKeterangan("");
  };

  if (loading) {
    return <div className="flex justify-center p-8">Memuat data...</div>;
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Belum Ada Invoice</h3>
        <p className="text-muted-foreground mb-4">
          Belum ada invoice yang dibuat. Buat invoice dari tab "Buat Invoice".
        </p>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Daftar Invoice</h3>
          <p className="text-sm text-muted-foreground">
            {invoices.length} invoice ditemukan
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Invoice</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Kontrak</TableHead>
              <TableHead className="text-right">Total Nilai</TableHead>
              <TableHead className="text-right">Dibayar</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="font-medium">{invoice.nomorInvoice}</div>
                  <div className="text-xs text-muted-foreground">
                    {invoice.invoiceItems.length} pengiriman
                  </div>
                </TableCell>
                <TableCell>
                  <div>{format(new Date(invoice.tanggalInvoice), "d MMM yyyy", { locale: localeId })}</div>
                  {invoice.tanggalJatuhTempo && (
                    <div className="text-xs text-muted-foreground">
                      JT: {format(new Date(invoice.tanggalJatuhTempo), "d MMM yyyy", { locale: localeId })}
                    </div>
                  )}
                </TableCell>
                <TableCell>{invoice.buyer.name}</TableCell>
                <TableCell>{invoice.contract.contractNumber}</TableCell>
                <TableCell className="text-right">
                  <div className="font-medium">
                    Rp {invoice.totalNilai.toLocaleString("id-ID")}
                  </div>
                  {invoice.totalPotongan > 0 && (
                    <div className="text-xs text-red-500">
                      Pot: Rp {invoice.totalPotongan.toLocaleString("id-ID")}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div>Rp {invoice.totalDibayar.toLocaleString("id-ID")}</div>
                  {invoice.sisaPembayaran > 0 && invoice.status !== "CANCELLED" && (
                    <div className="text-xs text-amber-600">
                      Sisa: Rp {invoice.sisaPembayaran.toLocaleString("id-ID")}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={statusColors[invoice.status]}>
                    {statusLabels[invoice.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-1">
                    {/* Print PDF - available for all except cancelled */}
                    {invoice.status !== "CANCELLED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Cetak PDF"
                        onClick={() => window.open(`/api/pt-pks/invoice/${invoice.id}/pdf`, '_blank')}
                      >
                        <Printer className="h-4 w-4 text-cyan-600" />
                      </Button>
                    )}
                    {invoice.status === "DRAFT" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Terbitkan Invoice"
                        onClick={() => handleIssue(invoice)}
                      >
                        <Send className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    {(invoice.status === "ISSUED" || invoice.status === "PARTIAL_PAID") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Input Pembayaran"
                        onClick={() => openPaymentDialog(invoice)}
                      >
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {(invoice.status === "DRAFT" || invoice.status === "ISSUED") &&
                      invoice.totalDibayar === 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Batalkan Invoice"
                          onClick={() => handleCancel(invoice)}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Input Pembayaran</DialogTitle>
            <DialogDescription>
              Invoice: {selectedInvoice?.nomorInvoice}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              {/* Invoice Info */}
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Invoice</span>
                  <span className="font-medium">
                    Rp {selectedInvoice.totalNilai.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sudah Dibayar</span>
                  <span className="font-medium text-green-600">
                    Rp {selectedInvoice.totalDibayar.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa Pembayaran</span>
                  <span className="font-bold text-amber-600">
                    Rp {selectedInvoice.sisaPembayaran.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tanggalBayar">Tanggal Bayar</Label>
                  <Input
                    id="tanggalBayar"
                    type="date"
                    value={tanggalBayar}
                    onChange={(e) => setTanggalBayar(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jumlahBayar">Jumlah Bayar (Rp)</Label>
                  <NumericInput
                    id="jumlahBayar"
                    min={0}
                    value={parseFloat(jumlahBayar) || 0}
                    onValueChange={(val) => setJumlahBayar(val.toString())}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metodePembayaran">Metode Pembayaran</Label>
                  <Select value={metodePembayaran} onValueChange={setMetodePembayaran}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="GIRO">Giro</SelectItem>
                      <SelectItem value="CEK">Cek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomorReferensi">Nomor Referensi</Label>
                  <Input
                    id="nomorReferensi"
                    value={nomorReferensi}
                    onChange={(e) => setNomorReferensi(e.target.value)}
                    placeholder="Nomor bukti transfer / cek / dll"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Textarea
                    id="keterangan"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Keterangan tambahan (opsional)"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              disabled={paymentLoading}
            >
              Batal
            </Button>
            <Button onClick={handlePayment} disabled={paymentLoading}>
              {paymentLoading ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
