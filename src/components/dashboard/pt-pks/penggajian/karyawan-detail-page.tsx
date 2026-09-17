"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Save, Loader2, User, Calendar, Clock, DollarSign, ChevronDown, Printer, FileText } from "lucide-react";
import { AttendanceCalendar } from "./attendance-calendar";
import { ATTENDANCE_CATEGORIES, LEMBUR_TYPES, calculateTotalMenitDibayar, type LemburType } from "@/server/schema/penggajian";
import { downloadSlipGajiPDF, type SlipGajiPDFData } from "@/lib/pdf/pt-pks/slip-gaji-pdf";
import { downloadSlipLemburPDF } from "@/lib/pdf/pt-pks/slip-lembur-pdf";

// Types
type LemburDetailItem = {
  type?: LemburType;
  hours?: number;
  x15: number;
  x2: number;
  x3: number;
  x4: number;
  keterangan?: string | null;
};

type LemburDetail = Record<string, LemburDetailItem | undefined>;
type TanggalKerja = Record<string, string | undefined>;

type MasterKaryawanRelation = {
  namaKaryawan: string;
  tktk: string | null;
  gol: string | null;
  nomorRekening: string | null;
  noBpjsTk: string | null;
  noBpjsKesehatan: string | null;
  divisi?: { id: string; nama: string } | null;
  jabatan?: { id: string; nama: string } | null;
};

type PenggajianKaryawan = {
  id: string;
  periodeBulan: number;
  periodeTahun: number;
  no: number | null;
  masterKaryawanId: string | null;
  masterKaryawan?: MasterKaryawanRelation | null;
  tanggalKerja: TanggalKerja | null;
  lemburDetail: LemburDetail | null;
  totalMenit: number;
  totalMenitDibayar: number;
  hk: number;
  liburDibayar: number;
  hkTidakDibayar: number;
  hkDibayar: number;
  hariBelumMasuk?: number;
  lemburHari: number;
  gajiPokok: number;
  tunjanganJabatan: number;
  tunjanganPerumahan: number;
  sppd?: number;
  thr?: number;
  tunjanganLainLain?: number;
  overtime: number;
  totalSebelumPotongan: number;
  potKehadiran: number;
  potBpjsTkJht: number;
  potBpjsTkJn: number;
  potBpjsKesehatan: number;
  potPph21: number;
  potPinjaman?: number;
  potLainLain?: number;
  totalPotongan: number;
  upahDiterima: number;
  keteranganDetail?: { sppd?: string; tunjanganLainLain?: string } | null;
};

type KaryawanDetailPageProps = {
  penggajianId: string;
  initialData: PenggajianKaryawan;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID").format(value);
};

const parseCurrency = (value: string): number => {
  return parseInt(value.replace(/\D/g, "")) || 0;
};

// Calculate attendance statistics from tanggalKerja
const calculateAttendanceStats = (tanggalKerja: TanggalKerja | null) => {
  let hk = 0;
  let liburDibayar = 0;
  let hkTidakDibayar = 0;
  let hkDibayar = 0;
  let belumMasuk = 0;

  if (!tanggalKerja) return { hk, liburDibayar, hkTidakDibayar, hkDibayar, belumMasuk };

  Object.values(tanggalKerja).forEach((status) => {
    if (!status) return;

    const category = ATTENDANCE_CATEGORIES.find((c) => c.code === status);
    if (category) {
      if (category.countAsHK) hk++;
      if (category.countAsLiburDibayar) liburDibayar++;
      if (category.countAsHKTidakDibayar) hkTidakDibayar++;
      if (category.countAsBelumMasuk) belumMasuk++;
    }
  });

  // HK Dibayar = HK + Libur Dibayar
  hkDibayar = hk + liburDibayar;

  return { hk, liburDibayar, hkTidakDibayar, hkDibayar, belumMasuk };
};

// Calculate lembur totals
const calculateLemburTotals = (lemburDetail: LemburDetail | null) => {
  let totalMenit = 0;
  let totalMenitDibayar = 0;

  if (!lemburDetail) return { totalMenit, totalMenitDibayar };

  Object.values(lemburDetail).forEach((item) => {
    if (!item) return;

    totalMenit += item.x15 + item.x2 + item.x3 + item.x4;
    totalMenitDibayar += calculateTotalMenitDibayar(item);
  });

  return { totalMenit, totalMenitDibayar: Math.round(totalMenitDibayar) };
};

// Calculate overtime amount: (gajiPokok / 173) * totalMenitDibayar / 60
const calculateOvertime = (gajiPokok: number, totalMenitDibayar: number) => {
  const hourlyRate = gajiPokok / 173;
  const overtimeHours = totalMenitDibayar / 60;
  return Math.round(hourlyRate * overtimeHours);
};

// Get lembur type label
const getLemburTypeLabel = (type?: LemburType) => {
  switch (type) {
    case LEMBUR_TYPES.HARI_BIASA: return "Hari Biasa";
    case LEMBUR_TYPES.HARI_LIBUR: return "Hari Libur";
    case LEMBUR_TYPES.HARI_BESAR: return "Hari Besar";
    default: return "Hari Biasa";
  }
};

export function KaryawanDetailPage({ penggajianId, initialData }: KaryawanDetailPageProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [data, setData] = useState<PenggajianKaryawan>(initialData);
  const [lemburOpen, setLemburOpen] = useState(false);
  const [pdfType, setPdfType] = useState<"slip-gaji" | "slip-lembur">("slip-gaji");

  // Attendance and lembur state
  const [tanggalKerja, setTanggalKerja] = useState<TanggalKerja>(
    (initialData.tanggalKerja as TanggalKerja) || {}
  );
  const [lemburDetail, setLemburDetail] = useState<LemburDetail>(
    (initialData.lemburDetail as LemburDetail) || {}
  );

  // Editable allowance fields
  const [sppd, setSppd] = useState(Number(initialData.sppd) || 0);
  const [thr, setThr] = useState(Number(initialData.thr) || 0);
  const [tunjanganLainLain, setTunjanganLainLain] = useState(Number(initialData.tunjanganLainLain) || 0);

  // Keterangan fields
  const [sppdKeterangan, setSppdKeterangan] = useState(initialData.keteranganDetail?.sppd || "");
  const [lainLainKeterangan, setLainLainKeterangan] = useState(initialData.keteranganDetail?.tunjanganLainLain || "");
  const [showSppdInput, setShowSppdInput] = useState(!!initialData.keteranganDetail?.sppd);
  const [showLainLainInput, setShowLainLainInput] = useState(!!initialData.keteranganDetail?.tunjanganLainLain);

  // Editable deduction fields
  const [potPinjaman, setPotPinjaman] = useState(Number(initialData.potPinjaman) || 0);
  const [potLainLain, setPotLainLain] = useState(Number(initialData.potLainLain) || 0);
  const [potPph21, setPotPph21] = useState(Number(initialData.potPph21) || 0);
  const [potBpjsTkJht, setPotBpjsTkJht] = useState(Number(initialData.potBpjsTkJht) || 0);
  const [potBpjsTkJn, setPotBpjsTkJn] = useState(Number(initialData.potBpjsTkJn) || 0);
  const [potBpjsKesehatan, setPotBpjsKesehatan] = useState(Number(initialData.potBpjsKesehatan) || 0);

  // Calculated values
  const attendanceStats = useMemo(() => calculateAttendanceStats(tanggalKerja), [tanggalKerja]);
  const lemburTotals = useMemo(() => calculateLemburTotals(lemburDetail), [lemburDetail]);
  const overtime = useMemo(() => calculateOvertime(Number(data.gajiPokok), lemburTotals.totalMenitDibayar), [data.gajiPokok, lemburTotals.totalMenitDibayar]);

  // Calculated salary preview
  const calculatedSalary = useMemo(() => {
    const gajiPokok = Number(data.gajiPokok);
    const tunjanganJabatan = Number(data.tunjanganJabatan);
    const tunjanganPerumahan = Number(data.tunjanganPerumahan);

    // Calculate daily rate for deductions
    const dailyRateKehadiran = (gajiPokok + tunjanganJabatan) / 26;

    // Pengurangan untuk hari belum masuk kerja (dari kalender, tidak tampil sebagai potongan di PDF)
    const penguranganBelumMasuk = attendanceStats.belumMasuk > 0 ? Math.round(attendanceStats.belumMasuk * dailyRateKehadiran) : 0;

    const totalSebelumPotongan = gajiPokok + tunjanganJabatan + tunjanganPerumahan + sppd + thr + tunjanganLainLain + overtime - penguranganBelumMasuk;

    // Calculate deductions
    const potKehadiran = attendanceStats.hkTidakDibayar > 0 ? Math.round(attendanceStats.hkTidakDibayar * dailyRateKehadiran) : 0;

    // BPJS values are now taken from manual input state
    const totalPotongan = potKehadiran + potBpjsTkJht + potBpjsTkJn + potBpjsKesehatan + potPph21 + potPinjaman + potLainLain;
    const upahDiterima = totalSebelumPotongan - totalPotongan;

    return {
      overtime,
      penguranganBelumMasuk,
      totalSebelumPotongan,
      potKehadiran,
      potBpjsTkJht,
      potBpjsTkJn,
      potBpjsKesehatan,
      potPph21,
      totalPotongan,
      upahDiterima,
    };
  }, [data.gajiPokok, data.tunjanganJabatan, data.tunjanganPerumahan, sppd, thr, tunjanganLainLain, overtime, attendanceStats, potPph21, potPinjaman, potLainLain, potBpjsTkJht, potBpjsTkJn, potBpjsKesehatan]);

  // Handle attendance change
  const handleAttendanceChange = useCallback((day: string, status: string | null) => {
    setTanggalKerja((prev) => {
      const newData = { ...prev };
      if (status === null) {
        delete newData[day];
      } else {
        newData[day] = status;
      }
      return newData;
    });
  }, []);

  // Handle lembur change
  const handleLemburChange = useCallback((day: string, lembur: LemburDetailItem | null) => {
    setLemburDetail((prev) => {
      const newData = { ...prev };
      if (lembur === null || (lembur.x15 === 0 && lembur.x2 === 0 && lembur.x3 === 0 && lembur.x4 === 0)) {
        delete newData[day];
      } else {
        newData[day] = lembur;
      }
      return newData;
    });
  }, []);

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/pt-pks/penggajian/${penggajianId}/hk`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hk: attendanceStats.hk,
          liburDibayar: attendanceStats.liburDibayar,
          hkTidakDibayar: attendanceStats.hkTidakDibayar,
          hkDibayar: attendanceStats.hkDibayar,
          hariBelumMasuk: attendanceStats.belumMasuk,
          lemburHari: lemburTotals.totalMenit / 60,
          tanggalKerja,
          lemburDetail,
          totalMenit: lemburTotals.totalMenit,
          totalMenitDibayar: lemburTotals.totalMenitDibayar,
          sppd,
          thr,
          tunjanganLainLain,
          keteranganDetail: {
            sppd: sppdKeterangan,
            tunjanganLainLain: lainLainKeterangan,
          },
          potPinjaman,
          potLainLain,
          potPph21,
          potBpjsTkJht,
          potBpjsTkJn,
          potBpjsKesehatan,
        }),
      });

      console.log("Saving data with keteranganDetail:", {
        sppd: sppdKeterangan,
        tunjanganLainLain: lainLainKeterangan,
      });

      console.log("Saving data with keteranganDetail:", {
        sppd: sppdKeterangan,
        tunjanganLainLain: lainLainKeterangan,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menyimpan data");
      }

      // Refresh data
      const refreshResponse = await fetch(`/api/pt-pks/penggajian/${penggajianId}`);
      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        const updatedPenggajian = result.penggajian;
        setData(updatedPenggajian);

        // Sync local states
        if (updatedPenggajian.keteranganDetail) {
          const detail = updatedPenggajian.keteranganDetail as { sppd?: string; tunjanganLainLain?: string };
          setSppdKeterangan(detail.sppd || "");
          setLainLainKeterangan(detail.tunjanganLainLain || "");
          setShowSppdInput(!!detail.sppd);
          setShowLainLainInput(!!detail.tunjanganLainLain);
        }

        console.log("Data refreshed:", updatedPenggajian.keteranganDetail);
      }

      alert("Data berhasil disimpan");
    } catch (error) {
      console.error("Error saving:", error);
      alert(error instanceof Error ? error.message : "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const pdfData: SlipGajiPDFData = {
        periodeBulan: data.periodeBulan,
        periodeTahun: data.periodeTahun,
        namaKaryawan: data.masterKaryawan?.namaKaryawan || "Unknown",
        jabatan: data.masterKaryawan?.jabatan?.nama || null,
        devisi: data.masterKaryawan?.divisi?.nama || null,
        gol: data.masterKaryawan?.gol || null,
        nomorRekening: data.masterKaryawan?.nomorRekening || null,
        tktk: data.masterKaryawan?.tktk || null,
        noBpjsTk: data.masterKaryawan?.noBpjsTk || null,
        noBpjsKesehatan: data.masterKaryawan?.noBpjsKesehatan || null,
        hk: attendanceStats.hk,
        liburDibayar: attendanceStats.liburDibayar,
        hkTidakDibayar: attendanceStats.hkTidakDibayar,
        hkDibayar: attendanceStats.hkDibayar,
        totalMenitDibayar: lemburTotals.totalMenitDibayar,
        lemburDetail: lemburDetail as Record<string, any>,
        gajiPokok: Number(data.gajiPokok),
        tunjanganJabatan: Number(data.tunjanganJabatan),
        tunjanganPerumahan: Number(data.tunjanganPerumahan),
        sppd: sppd,
        thr: thr,
        tunjanganLainLain: tunjanganLainLain,
        overtime: calculatedSalary.overtime,
        totalSebelumPotongan: calculatedSalary.totalSebelumPotongan,
        potKehadiran: calculatedSalary.potKehadiran,
        potBpjsTkJht: potBpjsTkJht,
        potBpjsTkJn: potBpjsTkJn,
        potBpjsKesehatan: potBpjsKesehatan,
        potPph21: potPph21,
        potPinjaman: potPinjaman,
        potLainLain: potLainLain,
        totalPotongan: calculatedSalary.totalPotongan,
        upahDiterima: calculatedSalary.upahDiterima,
        keteranganDetail: {
          sppd: sppdKeterangan,
          tunjanganLainLain: lainLainKeterangan,
        },
      };

      if (pdfType === "slip-gaji") {
        await downloadSlipGajiPDF(pdfData);
      } else {
        await downloadSlipLemburPDF(pdfData);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Gagal download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Get month name
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const monthName = monthNames[data.periodeBulan - 1];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard/pt-pks/payroll/penggajian")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" disabled={downloadingPdf}>
                {downloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                Cetak PDF
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Cetak PDF</h4>
                </div>
                <RadioGroup
                  value={pdfType}
                  onValueChange={(v) => setPdfType(v as "slip-gaji" | "slip-lembur")}
                  className="gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="slip-gaji" id="slip-gaji" />
                    <Label htmlFor="slip-gaji" className="text-xs cursor-pointer">Slip Gaji</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="slip-lembur" id="slip-lembur" />
                    <Label htmlFor="slip-lembur" className="text-xs cursor-pointer">Slip Lembur</Label>
                  </div>
                </RadioGroup>
                <Button
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? "Generating..." : "Download PDF"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{data.masterKaryawan?.namaKaryawan || "Unknown"}</h1>
        <p className="text-muted-foreground">
          {data.masterKaryawan?.jabatan?.nama || "-"} • {data.masterKaryawan?.divisi?.nama || "-"} • Periode {monthName} {data.periodeTahun}
        </p>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Karyawan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status Keluarga:</span>{" "}
              <span className="font-medium">{data.masterKaryawan?.tktk || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Golongan:</span>{" "}
              {data.masterKaryawan?.gol ? <Badge variant="outline">{data.masterKaryawan.gol}</Badge> : "-"}
            </div>
            <div>
              <span className="text-muted-foreground">No. Rekening:</span>{" "}
              <span className="font-medium font-mono">{data.masterKaryawan?.nomorRekening || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Gaji Pokok:</span>{" "}
              <span className="font-medium">Rp {formatCurrency(Number(data.gajiPokok))}</span>
            </div>
            <div>
              <span className="text-muted-foreground">BPJS TK:</span>{" "}
              <span className="font-medium font-mono">{data.masterKaryawan?.noBpjsTk || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">BPJS Kesehatan:</span>{" "}
              <span className="font-medium font-mono">{data.masterKaryawan?.noBpjsKesehatan || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tunj. Jabatan:</span>{" "}
              <span className="font-medium">Rp {formatCurrency(Number(data.tunjanganJabatan))}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tunj. Perumahan:</span>{" "}
              <span className="font-medium">Rp {formatCurrency(Number(data.tunjanganPerumahan))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kalender Kehadiran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar
            year={data.periodeTahun}
            month={data.periodeBulan}
            tanggalKerja={tanggalKerja}
            lemburDetail={lemburDetail}
            onAttendanceChange={handleAttendanceChange}
            onLemburChange={handleLemburChange}
          />
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{attendanceStats.hk}</div>
              <div className="text-xs text-muted-foreground">HK (Hari Kerja)</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{attendanceStats.liburDibayar}</div>
              <div className="text-xs text-muted-foreground">Libur Dibayar</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{attendanceStats.hkTidakDibayar}</div>
              <div className="text-xs text-muted-foreground">HK Tidak Dibayar</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{attendanceStats.belumMasuk}</div>
              <div className="text-xs text-muted-foreground">Belum Masuk</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{attendanceStats.hkDibayar}</div>
              <div className="text-xs text-muted-foreground">HK Dibayar</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{(lemburTotals.totalMenitDibayar / 60).toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Total Jam Dibayar</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lembur Summary with Recap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ringkasan Lembur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori Lembur</TableHead>
                <TableHead className="text-center">×1.5 (jam)</TableHead>
                <TableHead className="text-center">×2 (jam)</TableHead>
                <TableHead className="text-center">×3 (jam)</TableHead>
                <TableHead className="text-center">×4 (jam)</TableHead>
                <TableHead className="text-center">Total Jam</TableHead>
                <TableHead className="text-center">Total Jam Dibayar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-center">
                  {(Object.values(lemburDetail).reduce((acc, item) => acc + (item?.x15 || 0), 0) / 60).toFixed(1)}
                </TableCell>
                <TableCell className="text-center">
                  {(Object.values(lemburDetail).reduce((acc, item) => acc + (item?.x2 || 0), 0) / 60).toFixed(1)}
                </TableCell>
                <TableCell className="text-center">
                  {(Object.values(lemburDetail).reduce((acc, item) => acc + (item?.x3 || 0), 0) / 60).toFixed(1)}
                </TableCell>
                <TableCell className="text-center">
                  {(Object.values(lemburDetail).reduce((acc, item) => acc + (item?.x4 || 0), 0) / 60).toFixed(1)}
                </TableCell>
                <TableCell className="text-center font-semibold">{(lemburTotals.totalMenit / 60).toFixed(1)}</TableCell>
                <TableCell className="text-center font-semibold text-orange-600">{(lemburTotals.totalMenitDibayar / 60).toFixed(1)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Collapsible Lembur Recap */}
          <Collapsible open={lemburOpen} onOpenChange={setLemburOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <ChevronDown className={`mr-2 h-4 w-4 transition-transform ${lemburOpen ? "rotate-180" : ""}`} />
                {lemburOpen ? "Sembunyikan" : "Lihat"} Rekap Lembur Per Hari
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jenis Lembur</TableHead>
                      <TableHead className="text-center">Jam</TableHead>
                      <TableHead className="text-center">×1.5</TableHead>
                      <TableHead className="text-center">×2</TableHead>
                      <TableHead className="text-center">×3</TableHead>
                      <TableHead className="text-center">×4</TableHead>
                      <TableHead className="text-center">Total Dibayar (jam)</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(lemburDetail)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([day, item]) => {
                        if (!item) return null;
                        const totalMinutes = item.x15 + item.x2 + item.x3 + item.x4;
                        const paidMinutes = calculateTotalMenitDibayar(item);
                        return (
                          <TableRow key={day}>
                            <TableCell className="font-medium">{day}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{getLemburTypeLabel(item.type)}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{item.hours || (totalMinutes / 60).toFixed(1)}</TableCell>
                            <TableCell className="text-center">{item.x15 ? (item.x15 / 60).toFixed(1) : "-"}</TableCell>
                            <TableCell className="text-center">{item.x2 ? (item.x2 / 60).toFixed(1) : "-"}</TableCell>
                            <TableCell className="text-center">{item.x3 ? (item.x3 / 60).toFixed(1) : "-"}</TableCell>
                            <TableCell className="text-center">{item.x4 ? (item.x4 / 60).toFixed(1) : "-"}</TableCell>
                            <TableCell className="text-center font-semibold text-orange-600">{(paidMinutes / 60).toFixed(1)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.keterangan || "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    {Object.keys(lemburDetail).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          Belum ada data lembur
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="text-sm text-muted-foreground">
              <strong>Keterangan Perhitungan:</strong>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• <strong>Hari Biasa:</strong> 1 jam pertama ×1.5, sisanya ×2</p>
              <p>• <strong>Hari Libur:</strong> 7 jam pertama ×2, jam ke-8 ×3, jam ke-9+ ×4</p>
              <p>• <strong>Hari Besar:</strong> 1 jam pertama ×3, sisanya ×4</p>
            </div>
            <div className="border-t pt-2 mt-2 text-sm text-muted-foreground">
              Rumus Overtime: (Gaji Pokok / 173) × (Total Menit Dibayar / 60)
            </div>
            <div className="text-lg font-semibold">
              Overtime: <span className="text-orange-600">Rp {formatCurrency(overtime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Preview - Editable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Preview Perhitungan Gaji
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gaji & Tunjangan */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Gaji & Tunjangan</h3>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Gaji Pokok</span>
                <span className="font-mono font-medium">Rp {formatCurrency(Number(data.gajiPokok))}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tunj. Jabatan</span>
                <span className="font-mono font-medium">Rp {formatCurrency(Number(data.tunjanganJabatan))}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tunj. Perumahan</span>
                <span className="font-mono font-medium">Rp {formatCurrency(Number(data.tunjanganPerumahan))}</span>
              </div>

              <Separator />

              {/* Editable fields */}
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-4">
                  <Label htmlFor="sppd" className="text-muted-foreground whitespace-nowrap">SPPD</Label>
                  <NumericInput
                    id="sppd"
                    value={sppd}
                    onValueChange={setSppd}
                    className="max-w-[180px] text-right"
                  />
                </div>

                {showSppdInput ? (
                  <div className="flex flex-col gap-1.5 pl-6">
                    <Label htmlFor="sppdKeterangan" className="text-xs text-muted-foreground italic">Keterangan SPPD</Label>
                    <Input
                      id="sppdKeterangan"
                      value={sppdKeterangan}
                      onChange={(e) => setSppdKeterangan(e.target.value)}
                      placeholder="Masukkan keterangan SPPD..."
                      className="text-sm h-8"
                    />
                  </div>
                ) : (
                  <div className="pl-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-muted-foreground hover:text-primary p-0"
                      onClick={() => setShowSppdInput(true)}
                    >
                      + Tambah keterangan
                    </Button>
                  </div>
                )}

                <div className="flex justify-between items-center gap-4">
                  <Label htmlFor="thr" className="text-muted-foreground whitespace-nowrap">THR</Label>
                  <NumericInput
                    id="thr"
                    value={thr}
                    onValueChange={setThr}
                    className="max-w-[180px] text-right"
                  />
                </div>

                <div className="flex justify-between items-center gap-4">
                  <Label htmlFor="tunjanganLainLain" className="text-muted-foreground whitespace-nowrap">Lain-lain</Label>
                  <NumericInput
                    id="tunjanganLainLain"
                    value={tunjanganLainLain}
                    onValueChange={setTunjanganLainLain}
                    className="max-w-[180px] text-right"
                  />
                </div>

                {showLainLainInput ? (
                  <div className="flex flex-col gap-1.5 pl-6">
                    <Label htmlFor="lainLainKeterangan" className="text-xs text-muted-foreground italic">Keterangan Lain-lain</Label>
                    <Input
                      id="lainLainKeterangan"
                      value={lainLainKeterangan}
                      onChange={(e) => setLainLainKeterangan(e.target.value)}
                      placeholder="Masukkan keterangan lain-lain..."
                      className="text-sm h-8"
                    />
                  </div>
                ) : (
                  <div className="pl-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-muted-foreground hover:text-primary p-0"
                      onClick={() => setShowLainLainInput(true)}
                    >
                      + Tambah keterangan
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Overtime</span>
                <span className="font-mono font-medium text-orange-600">Rp {formatCurrency(calculatedSalary.overtime)}</span>
              </div>

              <Separator />

              {/* Hari Belum Masuk Kerja - dihitung dari kalender */}
              {attendanceStats.belumMasuk > 0 && (
                <div className="space-y-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-amber-700 dark:text-amber-300 font-medium">Belum Masuk Kerja</span>
                      <p className="text-xs text-muted-foreground mt-1">Dihitung dari kalender (pilih BM pada tanggal)</p>
                    </div>
                    <span className="text-2xl font-bold text-amber-600">{attendanceStats.belumMasuk} hari</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-amber-700 dark:text-amber-300">Pengurangan</span>
                    <span className="font-mono font-medium text-amber-700 dark:text-amber-300">-Rp {formatCurrency(calculatedSalary.penguranganBelumMasuk)}</span>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
                <span className="font-semibold">Total Gaji</span>
                <span className="font-mono font-bold text-lg">Rp {formatCurrency(calculatedSalary.totalSebelumPotongan)}</span>
              </div>
            </div>

            {/* Potongan */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Potongan</h3>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pot. Kehadiran</span>
                <span className="font-mono font-medium text-red-600">
                  {calculatedSalary.potKehadiran > 0 ? `-Rp ${formatCurrency(calculatedSalary.potKehadiran)}` : "-"}
                </span>
              </div>

              <div className="flex justify-between items-center gap-4">
                <Label htmlFor="potBpjsTkJht" className="text-muted-foreground whitespace-nowrap">Pot. BPJS TK JHT</Label>
                <NumericInput
                  id="potBpjsTkJht"
                  value={potBpjsTkJht}
                  onValueChange={setPotBpjsTkJht}
                  className="max-w-[180px] text-right"
                />
              </div>

              <div className="flex justify-between items-center gap-4">
                <Label htmlFor="potBpjsTkJn" className="text-muted-foreground whitespace-nowrap">Pot. BPJS TK JN</Label>
                <NumericInput
                  id="potBpjsTkJn"
                  value={potBpjsTkJn}
                  onValueChange={setPotBpjsTkJn}
                  className="max-w-[180px] text-right"
                />
              </div>

              <div className="flex justify-between items-center gap-4">
                <Label htmlFor="potBpjsKesehatan" className="text-muted-foreground whitespace-nowrap">Pot. BPJS Kes</Label>
                <NumericInput
                  id="potBpjsKesehatan"
                  value={potBpjsKesehatan}
                  onValueChange={setPotBpjsKesehatan}
                  className="max-w-[180px] text-right"
                />
              </div>

              <Separator />

              {/* Editable deduction fields */}
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-4">
                  <Label htmlFor="potPph21" className="text-muted-foreground whitespace-nowrap">Pot. PPH 21</Label>
                  <NumericInput
                    id="potPph21"
                    value={potPph21}
                    onValueChange={setPotPph21}
                    className="max-w-[180px] text-right"
                  />
                </div>

                <div className="flex justify-between items-center gap-4">
                  <Label htmlFor="potPinjaman" className="text-muted-foreground whitespace-nowrap">Pot. Pinjaman</Label>
                  <NumericInput
                    id="potPinjaman"
                    value={potPinjaman}
                    onValueChange={setPotPinjaman}
                    className="max-w-[180px] text-right"
                  />
                </div>

                <div className="flex justify-between items-center gap-4">
                  <Label htmlFor="potLainLain" className="text-muted-foreground whitespace-nowrap">Pot. Lain-lain</Label>
                  <NumericInput
                    id="potLainLain"
                    value={potLainLain}
                    onValueChange={setPotLainLain}
                    className="max-w-[180px] text-right"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                <span className="font-semibold">Total Potongan</span>
                <span className="font-mono font-bold text-lg text-red-600">
                  -Rp {formatCurrency(calculatedSalary.totalPotongan)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="mt-6 p-6 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Upah Diterima</span>
              <span className="text-3xl font-bold text-green-600">
                Rp {formatCurrency(calculatedSalary.upahDiterima)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
