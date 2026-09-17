"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { NumericInput } from "@/components/ui/numeric-input";
import { Zap, Building, FileText, Users, Tag, Info } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ItemRow {
  id?: string;
  deskripsi: string;
  jumlah: number;
  satuan: string;
  estimasiHarga: number;
  keterangan?: string;
}

export interface PengajuanBiayaFormData {
  id?: string;
  nomorPengajuan?: string;
  tanggalPengajuan: string;
  divisi: string;
  kategoriBiaya: string;
  keperluan: string;
  catatan?: string | null;
  status?: string;
  items?: ItemRow[];
}

interface BiayaOperasionalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: PengajuanBiayaFormData | null;
  onSuccess: () => void;
}

const KATEGORI_OPTIONS = [
  { value: "OPERASIONAL_KEUANGAN", label: "Biaya Operasional Umum / Pabrik", icon: Building },
  { value: "PLN", label: "Biaya PLN / Listrik", icon: Zap },
  { value: "BPJS", label: "BPJS / Jamsostek", icon: Users },
  { value: "PPN", label: "PPN", icon: FileText },
  { value: "PPH_21", label: "PPH 21 (Karyawan)", icon: Users },
  { value: "PPH_22", label: "PPH 22 (Barang)", icon: FileText },
  { value: "PPH_23", label: "PPH 23 (Jasa)", icon: FileText },
];

const DIVISI_PRESETS = [
  "Gudang",
  "Pabrik / Mill",
  "Workshop / Maintenance",
  "Kantor Direksi / HO",
  "Laboratorium",
  "Security / Keamanan",
  "Humas / Lapangan",
  "Umum & Operasional",
];

export function BiayaOperasionalFormDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: BiayaOperasionalFormDialogProps) {
  const isEditing = !!initialData?.id;
  const [submitting, setSubmitting] = useState(false);

  const [tanggalPengajuan, setTanggalPengajuan] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [divisi, setDivisi] = useState("Gudang");
  const [kategoriBiaya, setKategoriBiaya] = useState<string>(
    "OPERASIONAL_KEUANGAN"
  );
  const [customKategori, setCustomKategori] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [jumlahBiaya, setJumlahBiaya] = useState<number>(0);
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    if (initialData) {
      setTanggalPengajuan(
        initialData.tanggalPengajuan
          ? format(new Date(initialData.tanggalPengajuan), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd")
      );
      setDivisi(initialData.divisi || "Gudang");
      
      const isCustomKat = initialData.kategoriBiaya && !KATEGORI_OPTIONS.some(k => k.value === initialData.kategoriBiaya);
      if (isCustomKat) {
        setKategoriBiaya("CUSTOM");
        setCustomKategori(initialData.kategoriBiaya);
      } else {
        setKategoriBiaya(initialData.kategoriBiaya || "OPERASIONAL_KEUANGAN");
        setCustomKategori("");
      }
      setDeskripsi(initialData.keperluan || "");
      setCatatan(initialData.catatan || "");
      
      // Calculate total amount from items or default to 0
      if (initialData.items && initialData.items.length > 0) {
        const total = initialData.items.reduce(
          (acc, it) => acc + (it.jumlah || 1) * (it.estimasiHarga || 0),
          0
        );
        setJumlahBiaya(total);
      } else {
        setJumlahBiaya(0);
      }
    } else {
      setTanggalPengajuan(format(new Date(), "yyyy-MM-dd"));
      setDivisi("Gudang");
      setKategoriBiaya("OPERASIONAL_KEUANGAN");
      setCustomKategori("");
      setDeskripsi("");
      setJumlahBiaya(0);
      setCatatan("");
    }
  }, [initialData, open]);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  const handleSubmit = async (submitNow: boolean = false) => {
    const finalDivisi = divisi.trim();
    if (!finalDivisi) {
      toast.error("Divisi pengaju wajib dipilih / diisi");
      return;
    }
    const finalKategori = kategoriBiaya === "CUSTOM" ? customKategori.trim() : kategoriBiaya;
    if (!finalKategori) {
      toast.error("Kategori biaya pengeluaran wajib dipilih / diisi");
      return;
    }
    if (!deskripsi.trim()) {
      toast.error("Deskripsi biaya / keperluan pengajuan wajib diisi");
      return;
    }
    if (!jumlahBiaya || jumlahBiaya <= 0) {
      toast.error("Jumlah biaya harus lebih besar dari Rp 0");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tanggalPengajuan,
        divisi: finalDivisi,
        kategoriBiaya: finalKategori,
        keperluan: deskripsi.trim(),
        catatan: catatan.trim() || undefined,
        items: [
          {
            deskripsi: deskripsi.trim(),
            jumlah: 1,
            satuan: "Biaya",
            estimasiHarga: Number(jumlahBiaya),
            keterangan: catatan.trim() || undefined,
          },
        ],
      };

      const url = isEditing
        ? `/api/pt-pks/biaya-operasional/${initialData!.id}`
        : `/api/pt-pks/biaya-operasional`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyimpan pengajuan biaya");
      }

      const created = await res.json();

      // If user clicked "Simpan & Ajukan", trigger the submit action
      if (submitNow) {
        const idToSubmit = isEditing ? initialData!.id : created.data?.id || created.id;
        if (idToSubmit) {
          const submitRes = await fetch(
            `/api/pt-pks/biaya-operasional/${idToSubmit}/submit`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }
          );
          if (!submitRes.ok) {
            toast.warning(
              "Pengajuan tersimpan sebagai Draft, namun gagal langsung diajukan."
            );
          } else {
            toast.success(
              "Pengajuan biaya operasional berhasil disimpan & langsung diajukan ke Pimpinan!"
            );
          }
        }
      } else {
        toast.success(
          isEditing
            ? "Pengajuan biaya operasional berhasil diperbarui"
            : "Pengajuan biaya operasional berhasil disimpan sebagai Draft"
        );
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error submitting pengajuan biaya:", err);
      toast.error(err.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Edit Pengajuan: ${initialData?.nomorPengajuan || ""}`
              : "Buat Pengajuan Biaya Operasional"}
          </DialogTitle>
          <DialogDescription>
            Input rincian biaya operasional untuk diajukan dan diproses ke pembayaran biaya pengeluaran.
          </DialogDescription>
        </DialogHeader>

        {isEditing && initialData?.status === "APPROVED" && (
          <div className="rounded-md border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 flex items-start gap-2 mt-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Pengajuan ini berstatus Disetujui (APPROVED)</p>
              <p className="mt-0.5 text-blue-700 dark:text-blue-400">
                Perubahan pada tanggal, divisi, keperluan, atau nominal biaya akan otomatis menyinkronkan data Biaya Pengeluaran di modul Keuangan.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Tanggal & Divisi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tanggal">Tanggal Pengajuan</Label>
              <Input
                id="tanggal"
                type="date"
                value={tanggalPengajuan}
                onChange={(e) => setTanggalPengajuan(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="divisi">Divisi / Bagian</Label>
              <Select
                value={divisi}
                onValueChange={(val) => setDivisi(val)}
              >
                <SelectTrigger id="divisi" className="mt-1">
                  <SelectValue placeholder="Pilih Divisi" />
                </SelectTrigger>
                <SelectContent>
                  {DIVISI_PRESETS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Kategori Biaya */}
          <div>
            <Label htmlFor="kategori">Kategori Biaya Pengeluaran</Label>
            <Select
              value={kategoriBiaya}
              onValueChange={(val) => {
                setKategoriBiaya(val);
                if (val !== "CUSTOM") setCustomKategori("");
              }}
            >
              <SelectTrigger id="kategori" className="mt-1">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                {KATEGORI_OPTIONS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    <div className="flex items-center gap-2">
                      <k.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{k.label}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="CUSTOM">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Tag className="h-4 w-4" />
                    <span>Lainnya (Ketik Manual)...</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {kategoriBiaya === "CUSTOM" && (
              <Input
                placeholder="Ketik kategori biaya kustom..."
                value={customKategori}
                onChange={(e) => setCustomKategori(e.target.value)}
                className="mt-2 text-sm"
                autoFocus
              />
            )}
          </div>

          {/* Deskripsi Keperluan */}
          <div>
            <Label htmlFor="deskripsi">Keperluan / Keterangan Kebutuhan *</Label>
            <Textarea
              id="deskripsi"
              placeholder="Contoh: Pembelian token listrik pabrik bulan September, Pembayaran retribusi, dll..."
              className="mt-1"
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
            />
          </div>

          {/* Jumlah Biaya (Nominal) */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="jumlahBiaya">Jumlah Biaya / Nominal (Rp) *</Label>
              {jumlahBiaya > 0 && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatIDR(jumlahBiaya)}
                </span>
              )}
            </div>
            <NumericInput
              id="jumlahBiaya"
              placeholder="0"
              className="mt-1 text-base font-semibold"
              value={jumlahBiaya}
              onValueChange={(val) => setJumlahBiaya(val)}
            />
          </div>

          {/* Catatan Tambahan (Opsional) */}
          <div>
            <Label htmlFor="catatan">Catatan Tambahan (Opsional)</Label>
            <Textarea
              id="catatan"
              placeholder="Informasi pendukung, nomor faktur/tagihan, atau catatan tambahan..."
              rows={2}
              className="mt-1"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Batal
          </Button>

          {isEditing && (initialData?.status === "PENDING" || initialData?.status === "APPROVED") ? (
            <Button
              type="button"
              className="bg-primary text-primary-foreground"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                {submitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Simpan sebagai Draft"}
              </Button>
              <Button
                type="button"
                className="bg-primary text-primary-foreground"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
              >
                {submitting ? "Memproses..." : "Simpan & Ajukan (Submit)"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
