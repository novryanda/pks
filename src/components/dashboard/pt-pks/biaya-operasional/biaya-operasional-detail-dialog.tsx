"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  Send,
  Pencil,
  Trash2,
  Clock,
  Building2,
  DollarSign,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { useUserPermissions } from "@/hooks/use-user-permissions";

export interface DetailPengajuanBiaya {
  id: string;
  nomorPengajuan: string;
  tanggalPengajuan: string;
  divisi: string;
  kategoriBiaya: string;
  keperluan: string;
  totalBiaya: number;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";
  requestedBy: string;
  approvedBy?: string | null;
  tanggalApproval?: string | null;
  alasanReject?: string | null;
  catatan?: string | null;
  biayaPengeluaran?: {
    id: string;
    nomorBiaya: string;
    status: string;
    tanggalBiaya: string;
  } | null;
  items: Array<{
    id: string;
    deskripsi: string;
    jumlah: number;
    satuan: string;
    estimasiHarga: number;
    subtotal: number;
    keterangan?: string | null;
  }>;
}

interface BiayaOperasionalDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DetailPengajuanBiaya | null;
  onRefresh: () => void;
  onEdit?: (data: DetailPengajuanBiaya) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: any }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
    icon: Clock,
  },
  PENDING: {
    label: "Menunggu Persetujuan",
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300",
    icon: Clock,
  },
  APPROVED: {
    label: "Disetujui (Siap Dibayar)",
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Ditolak",
    className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300",
    icon: XCircle,
  },
  PAID: {
    label: "Lunas Dibayar",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Dibatalkan",
    className: "bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-900 dark:text-gray-400",
    icon: XCircle,
  },
};

const KATEGORI_LABELS: Record<string, string> = {
  OPERASIONAL_KEUANGAN: "Biaya Operasional Umum / Pabrik",
  PLN: "Biaya PLN / Listrik",
  BPJS: "BPJS / Jamsostek",
  PPN: "PPN",
  PPH_21: "PPH 21 (Karyawan)",
  PPH_22: "PPH 22 (Barang)",
  PPH_23: "PPH 23 (Jasa)",
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);

export function BiayaOperasionalDetailDialog({
  open,
  onOpenChange,
  data,
  onRefresh,
  onEdit,
}: BiayaOperasionalDetailDialogProps) {
  const { hasActionAccess, isAdmin } = useUserPermissions();
  const [loadingAction, setLoadingAction] = useState(false);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [alasanReject, setAlasanReject] = useState("");

  // Delete confirm modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (!data) return null;

  const canEdit =
    data.status !== "PAID" &&
    data.status !== "CANCELLED" &&
    (isAdmin || hasActionAccess("gudang.biayaOperasional", "edit"));
  const canDelete =
    data.status !== "PAID" &&
    (isAdmin || hasActionAccess("gudang.biayaOperasional", "delete"));
  const canSubmit =
    data.status === "DRAFT" &&
    (isAdmin || hasActionAccess("gudang.biayaOperasional", "create"));
  const canApprove =
    data.status === "PENDING" &&
    (isAdmin || hasActionAccess("gudang.biayaOperasional", "approve"));

  const handleAction = async (
    action: "submit" | "approve" | "reject" | "cancel",
    extraBody?: Record<string, any>
  ) => {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/pt-pks/biaya-operasional/${data.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraBody }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memproses aksi");
      }

      if (action === "submit") {
        toast.success("Pengajuan berhasil diajukan untuk persetujuan");
      } else if (action === "approve") {
        toast.success(
          "Pengajuan disetujui & otomatis masuk ke daftar Biaya Pengeluaran (Keuangan)!"
        );
      } else if (action === "reject") {
        toast.success("Pengajuan telah ditolak");
        setRejectModalOpen(false);
        setAlasanReject("");
      } else if (action === "cancel") {
        toast.success("Pengajuan berhasil dibatalkan");
      }

      onRefresh();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/pt-pks/biaya-operasional/${data.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus pengajuan");
      }
      toast.success("Pengajuan berhasil dihapus");
      setDeleteConfirmOpen(false);
      onRefresh();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menghapus");
    } finally {
      setLoadingAction(false);
    }
  };

  const statusConfig = (STATUS_CONFIG[data.status] || STATUS_CONFIG.DRAFT)!;
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <span>{data.nomorPengajuan}</span>
                  <Badge variant="outline" className={statusConfig.className}>
                    <StatusIcon className="h-3.5 w-3.5 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Diajukan pada{" "}
                  {format(new Date(data.tanggalPengajuan), "dd MMMM yyyy", {
                    locale: idLocale,
                  })}{" "}
                  oleh <span className="font-medium text-foreground">{data.requestedBy}</span>
                </DialogDescription>
              </div>

              <div className="text-right sm:self-center">
                <span className="text-xs text-muted-foreground block">Total Pengajuan</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data.totalBiaya)}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Banner Info for Status Transitions */}
          {data.status === "APPROVED" && (
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg p-3 flex items-start gap-3">
              <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-300">
                  Telah Terjadwal di Pembayaran Biaya Pengeluaran
                </p>
                <p className="text-blue-700 dark:text-blue-400 text-xs mt-0.5">
                  Pengajuan ini telah disetujui oleh <b>{data.approvedBy || "HO"}</b>
                  {data.tanggalApproval &&
                    ` pada ${format(new Date(data.tanggalApproval), "dd/MM/yyyy HH:mm")}`}.
                  Data telah dibuat sebagai tagihan aktif di modul Keuangan &gt; Biaya Pengeluaran
                  {data.biayaPengeluaran ? ` (${data.biayaPengeluaran.nomorBiaya})` : ""}.
                </p>
              </div>
            </div>
          )}

          {data.status === "PAID" && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                  Pengeluaran Telah Lunas Dibayar
                </p>
                <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-0.5">
                  Pembayaran untuk pengajuan ini telah diselesaikan oleh Bagian Keuangan.
                </p>
              </div>
            </div>
          )}

          {data.status === "REJECTED" && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-900 dark:text-red-300">
                  Pengajuan Ditolak oleh {data.approvedBy || "Pimpinan"}
                </p>
                <p className="text-red-700 dark:text-red-400 text-xs mt-0.5">
                  <b>Alasan Penolakan:</b> {data.alasanReject || "Tidak ada alasan tertulis"}
                </p>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-3.5 rounded-lg border text-xs">
            <div>
              <span className="text-muted-foreground block">Divisi / Bagian:</span>
              <span className="font-semibold text-foreground text-sm">{data.divisi}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Kategori Biaya:</span>
              <span className="font-medium text-foreground">
                {KATEGORI_LABELS[data.kategoriBiaya] || data.kategoriBiaya}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Total Pengajuan:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrency(data.totalBiaya)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Verifikasi / Approval:</span>
              <span className="font-medium text-foreground">
                {data.approvedBy ? `${data.approvedBy}` : "-"}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-4 border-t pt-2 mt-1">
              <span className="text-muted-foreground block">Deskripsi / Keperluan:</span>
              <p className="font-medium text-foreground text-sm mt-0.5">{data.keperluan}</p>
            </div>
            {data.catatan && (
              <div className="col-span-2 sm:col-span-4 border-t pt-2">
                <span className="text-muted-foreground block">Catatan Tambahan:</span>
                <p className="text-muted-foreground mt-0.5 italic">{data.catatan}</p>
              </div>
            )}
          </div>

          {/* Items Table or Clean Single Item Card */}
          {data.items.length > 1 ? (
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2">Rincian Kebutuhan Item</h4>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 text-xs">
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Deskripsi Kebutuhan</TableHead>
                      <TableHead className="text-center">Jumlah</TableHead>
                      <TableHead className="text-center">Satuan</TableHead>
                      <TableHead className="text-right">Estimasi Harga (Rp)</TableHead>
                      <TableHead className="text-right">Subtotal (Rp)</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((it, idx) => (
                      <TableRow key={it.id || idx} className="text-xs">
                        <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{it.deskripsi}</TableCell>
                        <TableCell className="text-center">{it.jumlah}</TableCell>
                        <TableCell className="text-center">{it.satuan}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(it.estimasiHarga)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(it.subtotal)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {it.keterangan || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          {/* Footer Actions */}
          <DialogFooter className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-2 border-t pt-4">
            <div className="flex gap-2 w-full sm:w-auto">
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={loadingAction}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Hapus
                </Button>
              )}
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(data);
                  }}
                  disabled={loadingAction}
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit Pengajuan
                </Button>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Tutup
              </Button>

              {canSubmit && (
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground"
                  onClick={() => handleAction("submit")}
                  disabled={loadingAction}
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {loadingAction ? "Memproses..." : "Ajukan (Submit)"}
                </Button>
              )}

              {canApprove && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                    onClick={() => setRejectModalOpen(true)}
                    disabled={loadingAction}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Tolak
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleAction("approve")}
                    disabled={loadingAction}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    {loadingAction ? "Menyetujui..." : "Setujui (Approve)"}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Tolak Pengajuan Biaya
            </DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan agar pemohon dapat mengevaluasi dan merevisi pengajuan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="alasan-reject">Alasan Penolakan *</Label>
              <Textarea
                id="alasan-reject"
                placeholder="Tuliskan alasan penolakan di sini..."
                rows={3}
                className="mt-1"
                value={alasanReject}
                onChange={(e) => setAlasanReject(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              disabled={loadingAction}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={loadingAction || !alasanReject.trim()}
              onClick={() => handleAction("reject", { alasanReject: alasanReject.trim() })}
            >
              {loadingAction ? "Memproses..." : "Konfirmasi Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengajuan Biaya?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengajuan nomor <b>{data.nomorPengajuan}</b> akan dihapus secara permanen. Tindakan
              ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={loadingAction}
            >
              {loadingAction ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
