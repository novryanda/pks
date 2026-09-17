"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, Trash2, Plus, Settings2, FileText, Users, DollarSign, TrendingDown } from "lucide-react";
import { AddKaryawanDialog } from "./add-karyawan-dialog";
import { downloadRekapPenggajianPDF, type PenggajianKaryawanData } from "@/lib/pdf/pt-pks/rekap-penggajian-pdf";
import { downloadRekapLemburPDF } from "@/lib/pdf/pt-pks/rekap-lembur-pdf";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import React from "react";

// Type sesuai dengan mapping Excel yang baru
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
  tanggalKerja: Record<string, string> | null;
  // Hari Kerja Section
  hk: number;
  liburDibayar: number;
  hkTidakDibayar: number;
  hkDibayar: number;
  lemburHari: number; // float
  totalMenitDibayar: number;
  // Gaji & Tunjangan
  gajiPokok: number;
  tunjanganJabatan: number;
  tunjanganPerumahan: number;
  sppd: number;
  thr: number;
  tunjanganLainLain: number;
  // Overtime
  overtime: number;
  // Total sebelum potongan
  totalSebelumPotongan: number;
  // Potongan
  potKehadiran: number;
  potBpjsTkJht: number;
  potBpjsTkJn: number;
  potBpjsKesehatan: number;
  potPph21: number;
  potPinjaman: number;
  potLainLain: number;
  // Total Potongan
  totalPotongan: number;
  // Upah Diterima
  upahDiterima: number;
  createdAt: string;
};

type Summary = {
  totalKaryawan: number;
  totalGajiPokok: number;
  totalTunjanganJabatan: number;
  totalTunjanganPerumahan: number;
  totalOvertime: number;
  totalSebelumPotongan: number;
  totalPotKehadiran: number;
  totalPotBpjsTkJht: number;
  totalPotBpjsTkJn: number;
  totalPotBpjsKesehatan: number;
  totalPotPph21: number;
  totalPotongan: number;
  totalUpahDiterima: number;
};

type GroupedPenggajian = {
  divisi: string;
  items: PenggajianKaryawan[];
};

const bulanOptions = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const startYear = 2020;
const tahunOptions = Array.from({ length: 21 }, (_, i) => ({
  value: String(startYear + i),
  label: String(startYear + i),
}));

// Attendance status colors (menggunakan ATTENDANCE_CATEGORIES)
import { ATTENDANCE_CATEGORIES } from "@/server/schema/penggajian";
const getAttendanceColor = (status: string) => {
  if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  const cat = ATTENDANCE_CATEGORIES.find(c => c.code.toLowerCase() === status.toLowerCase());
  if (!cat) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  switch (cat.color) {
    case 'green': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'blue': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'red': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'cyan': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
    case 'orange': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'yellow': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'gray': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'purple': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID").format(value);
};

// Column visibility configuration
type ColumnGroup = {
  id: string;
  label: string;
  defaultVisible: boolean;
};

const COLUMN_GROUPS: ColumnGroup[] = [
  { id: "info", label: "Info Karyawan", defaultVisible: true },
  { id: "tanggalKerja", label: "Tanggal Kerja (1-31)", defaultVisible: false },
  { id: "hariKerja", label: "Hari Kerja (HK, LIB, TDK, DIB, LEM)", defaultVisible: true },
  { id: "gajiTunjangan", label: "Gaji & Tunjangan", defaultVisible: true },
  { id: "overtime", label: "Overtime", defaultVisible: true },
  { id: "totalSebelumPotongan", label: "Total Sebelum Potongan", defaultVisible: true },
  { id: "potongan", label: "Potongan (Detail)", defaultVisible: false },
  { id: "totalPotongan", label: "Total Potongan", defaultVisible: true },
  { id: "upahDiterima", label: "Upah Diterima", defaultVisible: true },
];

const COLUMN_VISIBILITY_KEY = "penggajian-column-visibility";

const getDefaultVisibility = (): Record<string, boolean> => {
  return COLUMN_GROUPS.reduce((acc, group) => {
    acc[group.id] = group.defaultVisible;
    return acc;
  }, {} as Record<string, boolean>);
};

export function PenggajianTable() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isAdmin, permissions } = useUserPermissions();
  const [data, setData] = useState<PenggajianKaryawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [divisiFilter, setdivisiFilter] = useState("all");
  const [periodeBulan, setPeriodeBulan] = useState<string>("");
  const [periodeTahun, setPeriodeTahun] = useState<string>("");
  const [periodeList, setPeriodeList] = useState<{ periodeBulan: number; periodeTahun: number }[]>([]);
  const [periodeLoaded, setPeriodeLoaded] = useState(false);
  const [divisiList, setdivisiList] = useState<{ id: string; nama: string }[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addKaryawanDialogOpen, setAddKaryawanDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pdfType, setPdfType] = useState<"rekap-gaji" | "rekap-lembur">("rekap-gaji");
  const [excelType, setExcelType] = useState<"rekap-penggajian" | "data-bank">("rekap-penggajian");

  // Column visibility state with localStorage persistence
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return getDefaultVisibility();
        }
      }
    }
    return getDefaultVisibility();
  });

  // Save visibility to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility]);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  }, []);

  // Reset visibility to default
  const resetColumnVisibility = useCallback(() => {
    setColumnVisibility(getDefaultVisibility());
  }, []);

  // Check permissions
  const canCreate = isAdmin || permissions?.payroll?.penggajian?.create === true;
  const canEdit = isAdmin || permissions?.payroll?.penggajian?.edit === true;
  const canDelete = isAdmin || permissions?.payroll?.penggajian?.delete === true;
  const canView = isAdmin || permissions?.payroll?.penggajian?.view === true;

  const attendanceDays = useMemo(() => {
    if (!periodeBulan || !periodeTahun) {
      return 31;
    }

    const year = parseInt(periodeTahun, 10);
    const month = parseInt(periodeBulan, 10);

    if (Number.isNaN(year) || Number.isNaN(month)) {
      return 31;
    }

    return new Date(year, month, 0).getDate();
  }, [periodeBulan, periodeTahun]);

  const totalColumnCount = useMemo(() => {
    let count = canDelete ? 3 : 2;

    if (columnVisibility.info) count += 7;
    if (columnVisibility.tanggalKerja) count += attendanceDays;
    if (columnVisibility.hariKerja) count += 5;
    if (columnVisibility.gajiTunjangan) count += 6;
    if (columnVisibility.overtime) count += 1;
    if (columnVisibility.totalSebelumPotongan) count += 1;
    if (columnVisibility.potongan) count += 7;
    if (columnVisibility.totalPotongan) count += 1;
    if (columnVisibility.upahDiterima) count += 1;

    return count;
  }, [attendanceDays, canDelete, columnVisibility]);

  // Fetch data - only when periode is set
  const fetchData = async () => {
    // Don't fetch if periode is not set
    if (!periodeBulan || !periodeTahun) {
      setData([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (divisiFilter && divisiFilter !== "all") params.append("divisiId", divisiFilter);
      params.append("periodeBulan", periodeBulan);
      params.append("periodeTahun", periodeTahun);
      params.append("page", page.toString());
      params.append("limit", "100");

      const [dataResponse, summaryResponse] = await Promise.all([
        fetch(`/api/pt-pks/penggajian?${params.toString()}`),
        fetch(`/api/pt-pks/penggajian?summary=true&${params.toString()}`),
      ]);

      if (!dataResponse.ok) throw new Error("Failed to fetch data");
      if (!summaryResponse.ok) throw new Error("Failed to fetch summary");

      const dataResult = await dataResponse.json();
      const summaryResult = await summaryResponse.json();

      setData(dataResult.data || []);
      setTotalPages(dataResult.pagination?.totalPages || 1);
      setSummary(summaryResult.summary || null);
    } catch (error) {
      console.error("Error fetching penggajian:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch periode list and set default to latest
  const fetchPeriodeList = async () => {
    try {
      const response = await fetch("/api/pt-pks/penggajian?periodeList=true");
      if (!response.ok) throw new Error("Failed to fetch periode list");
      const result = await response.json();
      const periodes = result.periode || [];
      setPeriodeList(periodes);

      // Auto-select the latest period (first item since sorted desc)
      if (periodes.length > 0) {
        const latest = periodes[0];
        setPeriodeBulan(String(latest.periodeBulan));
        setPeriodeTahun(String(latest.periodeTahun));
      }
      setPeriodeLoaded(true);
    } catch (error) {
      console.error("Error fetching periode list:", error);
      setPeriodeLoaded(true);
    }
  };

  // Fetch divisi list
  const fetchdivisiList = async () => {
    try {
      const response = await fetch("/api/pt-pks/penggajian?divisiList=true");
      if (!response.ok) throw new Error("Failed to fetch divisi list");
      const result = await response.json();
      setdivisiList(result.divisi || []);
    } catch (error) {
      console.error("Error fetching divisi list:", error);
    }
  };

  // Initial fetch - get periode list and divisi list
  useEffect(() => {
    fetchPeriodeList();
    fetchdivisiList();
  }, []);

  // Fetch data when periode changes (only after periode is loaded)
  useEffect(() => {
    if (periodeLoaded) {
      fetchData();
    }
  }, [searchTerm, divisiFilter, periodeBulan, periodeTahun, page, periodeLoaded]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, divisiFilter, periodeBulan, periodeTahun]);

  // Group data by divisi
  const groupedData = useMemo<GroupedPenggajian[]>(() => {
    const groups = new Map<string, PenggajianKaryawan[]>();

    data.forEach((item) => {
      const divisi = item.masterKaryawan?.divisi?.nama || "Lainnya";
      if (!groups.has(divisi)) {
        groups.set(divisi, []);
      }

      groups.get(divisi)?.push(item);
    });

    return Array.from(groups.entries()).map(([divisi, items]) => ({ divisi, items }));
  }, [data]);

  // Handle delete by periode
  const handleDeletePeriode = async () => {
    if (!periodeBulan || !periodeTahun) return;

    try {
      const response = await fetch(
        `/api/pt-pks/penggajian?periodeBulan=${periodeBulan}&periodeTahun=${periodeTahun}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting penggajian:", error);
    }
  };

  // Handle export Excel
  const handleExport = () => {
    if (data.length === 0) return;

    if (excelType === "data-bank") {
      const exportData = data.map((item, index) => ({
        no: index + 1,
        namaKaryawan: item.masterKaryawan?.namaKaryawan || "-",
        infoRekening: item.masterKaryawan?.nomorRekening || "-",
        diterima: item.upahDiterima,
      }));

      exportToExcel(
        exportData,
        [
          { header: "No", key: "no", width: 5 },
          { header: "Nama Karyawan", key: "namaKaryawan", width: 28 },
          { header: "Info Rekening", key: "infoRekening", width: 22 },
          { header: "Diterima", key: "diterima", width: 15 },
        ],
        `Data_Bank_Penggajian_${getBulanLabel(parseInt(periodeBulan))}_${periodeTahun}`,
        "Data Bank"
      );
      return;
    }

    const columns: ExportColumn[] = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Karyawan", key: "masterKaryawan.namaKaryawan", width: 25 },
    ];

    if (columnVisibility.info) {
      columns.push(
        { header: "St. Keluarga", key: "masterKaryawan.tktk", width: 10 },
        { header: "Gol", key: "masterKaryawan.gol", width: 5 },
        { header: "Rekening", key: "masterKaryawan.nomorRekening", width: 15 },
        { header: "divisi", key: "masterKaryawan.divisi.nama", width: 15 },
        { header: "BPJS TK", key: "masterKaryawan.noBpjsTk", width: 15 },
        { header: "BPJS Kes", key: "masterKaryawan.noBpjsKesehatan", width: 15 },
        { header: "Jabatan", key: "masterKaryawan.jabatan.nama", width: 15 }
      );
    }

    if (columnVisibility.tanggalKerja) {
      for (let i = 1; i <= attendanceDays; i++) {
        columns.push({ header: String(i), key: `tanggalKerja.${i}`, width: 4 });
      }
    }

    if (columnVisibility.hariKerja) {
      columns.push(
        { header: "HK", key: "hk", width: 5 },
        { header: "LIB", key: "liburDibayar", width: 5 },
        { header: "TDK", key: "hkTidakDibayar", width: 5 },
        { header: "DIB", key: "hkDibayar", width: 5 },
        { header: "LEM", key: "jamDibayar", width: 5 }
      );
    }

    if (columnVisibility.gajiTunjangan) {
      columns.push(
        { header: "Gapok", key: "gajiPokok", width: 12 },
        { header: "Tunj. Jab", key: "tunjanganJabatan", width: 12 },
        { header: "Tunj. Per", key: "tunjanganPerumahan", width: 12 },
        { header: "SPPD", key: "sppd", width: 10 },
        { header: "THR", key: "thr", width: 10 },
        { header: "T. Lain", key: "tunjanganLainLain", width: 12 }
      );
    }

    if (columnVisibility.overtime) {
      columns.push({ header: "Overtime", key: "overtime", width: 12 });
    }

    if (columnVisibility.totalSebelumPotongan) {
      columns.push({ header: "Total", key: "totalSebelumPotongan", width: 15 });
    }

    if (columnVisibility.potongan) {
      columns.push(
        { header: "Pot. Abs", key: "potKehadiran", width: 12 },
        { header: "JHT", key: "potBpjsTkJht", width: 12 },
        { header: "JN", key: "potBpjsTkJn", width: 12 },
        { header: "BPJS Kes", key: "potBpjsKesehatan", width: 12 },
        { header: "Pph21", key: "potPph21", width: 12 },
        { header: "Pot. Pinj", key: "potPinjaman", width: 12 },
        { header: "Pot. Lain", key: "potLainLain", width: 12 }
      );
    }

    if (columnVisibility.totalPotongan) {
      columns.push({ header: "Tot. Pot", key: "totalPotongan", width: 15 });
    }

    if (columnVisibility.upahDiterima) {
      columns.push({ header: "Diterima", key: "upahDiterima", width: 15 });
    }

    // Add row numbers and format total jam dibayar
    const exportData = data.map((item, index) => ({
      ...item,
      no: index + 1,
      jamDibayar: item.totalMenitDibayar / 60,
    }));

    exportToExcel(
      exportData as unknown as Record<string, unknown>[],
      columns,
      `Rekap_Penggajian_${getBulanLabel(parseInt(periodeBulan))}_${periodeTahun}`,
      "Penggajian"
    );
  };

  // Handle export PDF
  const [exportingPDF, setExportingPDF] = useState(false);
  const handleExportPDF = async () => {
    if (data.length === 0 || !periodeBulan || !periodeTahun) return;

    setExportingPDF(true);
    try {
      if (pdfType === "rekap-gaji") {
        await downloadRekapPenggajianPDF(
          data as PenggajianKaryawanData[],
          parseInt(periodeBulan),
          parseInt(periodeTahun),
          columnVisibility,
          session?.user?.name || undefined
        );
      } else {
        await downloadRekapLemburPDF(
          data,
          parseInt(periodeBulan),
          parseInt(periodeTahun),
          session?.user?.name || undefined
        );
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF");
    } finally {
      setExportingPDF(false);
    }
  };

  // Get bulan label
  const getBulanLabel = (bulan: number) => {
    const option = bulanOptions.find((o) => o.value === String(bulan));
    return option?.label || String(bulan);
  };

  // Handle click on karyawan name - navigate to detail page
  const handleKaryawanClick = (karyawan: PenggajianKaryawan) => {
    router.push(`/dashboard/pt-pks/payroll/penggajian/${karyawan.id}`);
  };

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [data]);

  // Toggle selection for individual item
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle select all
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((item) => item.id)));
    }
  }, [data, selectedIds.size]);

  // Handle delete individual
  const handleDeleteIndividual = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pt-pks/penggajian?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      setDeleteItemId(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting penggajian:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete bulk
  const handleDeleteBulk = async () => {
    if (deletingIds.length === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pt-pks/penggajian?ids=${deletingIds.join(",")}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      setDeletingIds([]);
      setSelectedIds(new Set());
      fetchData();
    } catch (error) {
      console.error("Error bulk deleting penggajian:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open bulk delete dialog
  const openBulkDeleteDialog = () => {
    setDeletingIds(Array.from(selectedIds));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {summary && (
        <div className="mb-3 grid shrink-0 gap-3 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-0">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Karyawan
              </CardTitle>
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-2xl font-bold leading-none">{summary.totalKaryawan}</div>
              <p className="text-[10px] text-muted-foreground">karyawan terdaftar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-0">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Gaji
              </CardTitle>
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-2xl font-bold leading-none">
                Rp {formatCurrency(Number(summary.totalSebelumPotongan))}
              </div>
              <p className="text-[10px] text-muted-foreground">total sebelum potongan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-0">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Upah Diterima
              </CardTitle>
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-2xl font-bold leading-none text-green-600">
                Rp {formatCurrency(Number(summary.totalUpahDiterima))}
              </div>
              <p className="text-[10px] text-muted-foreground">upah diterima karyawan</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="shrink-0 gap-2 border-b px-4 py-3">
          <div className="flex flex-col gap-1 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Rekap Penggajian</CardTitle>
              <p className="text-xs text-muted-foreground">
                Tabel mengikuti urutan kode divisi lalu kode jabatan seperti halaman master karyawan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari karyawan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={divisiFilter} onValueChange={setdivisiFilter}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Semua Divisi</SelectItem>
                {divisiList.map((divisi) => (
                  <SelectItem key={divisi.id} value={divisi.id} className="text-xs">
                    {divisi.id} - {divisi.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodeBulan} onValueChange={setPeriodeBulan}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {bulanOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periodeTahun} onValueChange={setPeriodeTahun}>
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent className="max-h-[160px]">
                {tahunOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                  <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                  Kolom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Tampilkan Kolom</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetColumnVisibility}
                      className="h-6 px-2 text-[10px]"
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {COLUMN_GROUPS.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${group.id}`}
                          checked={columnVisibility[group.id] ?? group.defaultVisible}
                          onCheckedChange={() => toggleColumnVisibility(group.id)}
                        />
                        <label
                          htmlFor={`col-${group.id}`}
                          className="cursor-pointer text-xs font-medium leading-none"
                        >
                          {group.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {canCreate && (
              <>
                <Button
                  size="sm"
                  onClick={() => setAddKaryawanDialogOpen(true)}
                  className="h-8 px-3 text-xs"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Tambah Karyawan
                </Button>
                <AddKaryawanDialog
                  open={addKaryawanDialogOpen}
                  onOpenChange={setAddKaryawanDialogOpen}
                  onSuccess={() => { fetchPeriodeList(); fetchData(); }}
                  defaultPeriodeBulan={periodeBulan}
                  defaultPeriodeTahun={periodeTahun}
                />
              </>
            )}
            {canView && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={data.length === 0} className="h-8 px-2 text-xs">
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Excel
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="end">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Export Excel</h4>
                      <RadioGroup
                        value={excelType}
                        onValueChange={(v) => setExcelType(v as "rekap-penggajian" | "data-bank")}
                        className="gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rekap-penggajian" id="excel-rekap-penggajian" />
                          <Label htmlFor="excel-rekap-penggajian" className="cursor-pointer text-xs">Rekap Penggajian</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="data-bank" id="excel-data-bank" />
                          <Label htmlFor="excel-data-bank" className="cursor-pointer text-xs">Data Bank</Label>
                        </div>
                      </RadioGroup>
                      <Button size="sm" className="h-8 w-full text-xs" onClick={handleExport}>
                        Download Excel
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.length === 0 || exportingPDF}
                      className="h-8 px-2 text-xs"
                    >
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      {exportingPDF ? "Generating..." : "PDF"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-3" align="end">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Cetak PDF</h4>
                      <RadioGroup
                        value={pdfType}
                        onValueChange={(v) => setPdfType(v as "rekap-gaji" | "rekap-lembur")}
                        className="gap-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rekap-gaji" id="rekap-gaji" />
                          <Label htmlFor="rekap-gaji" className="cursor-pointer text-xs">Rekap Gaji</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rekap-lembur" id="rekap-lembur" />
                          <Label htmlFor="rekap-lembur" className="cursor-pointer text-xs">Rekap Lembur</Label>
                        </div>
                      </RadioGroup>
                      <Button
                        size="sm"
                        className="h-8 w-full text-xs"
                        onClick={handleExportPDF}
                        disabled={exportingPDF}
                      >
                        {exportingPDF ? "Generating..." : "Download PDF"}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
            {canDelete && selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={openBulkDeleteDialog}
                className="h-8 px-2 text-xs"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Hapus ({selectedIds.size})
              </Button>
            )}
            {canDelete && periodeBulan && periodeTahun && data.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-8 px-2 text-xs"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Hapus Periode
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <p className="text-xs text-muted-foreground">
                {!periodeBulan || !periodeTahun
                  ? "Silakan pilih periode bulan dan tahun untuk melihat data penggajian."
                  : canView
                    ? "Belum ada data penggajian untuk periode ini. Silakan tambahkan karyawan."
                    : "Anda tidak memiliki akses untuk melihat data penggajian."}
              </p>
            </div>
          ) : (
            <>
          <ScrollArea className="h-full min-h-[440px] w-full flex-1 lg:min-h-[560px]">
            <div className="min-w-[1800px]">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-20">
                  <TableRow className="h-9">
                    {/* Checkbox column for selection */}
                    {canDelete && (
                      <TableHead className="sticky left-0 bg-muted/50 z-30 w-[32px] text-center py-1 px-1 border-r">
                        <Checkbox
                          checked={data.length > 0 && selectedIds.size === data.length}
                          onCheckedChange={toggleSelectAll}
                          className="h-3.5 w-3.5"
                        />
                      </TableHead>
                    )}
                    {/* NO dan NAMA selalu tampil */}
                    <TableHead className={`sticky ${canDelete ? 'left-[32px]' : 'left-0'} bg-muted/50 z-30 w-[40px] text-[10px] font-bold uppercase py-1 px-2 border-r`}>NO</TableHead>
                    <TableHead className={`sticky ${canDelete ? 'left-[72px]' : 'left-[40px]'} bg-muted/50 z-30 min-w-[150px] text-[10px] font-bold uppercase py-1 px-2 border-r`}>NAMA KARYAWAN</TableHead>

                    {/* Info Karyawan */}
                    {columnVisibility.info && (
                      <>
                        <TableHead className="min-w-[70px] text-[10px] font-bold uppercase py-1 px-1 text-center">ST. KELUARGA</TableHead>
                        <TableHead className="min-w-[40px] text-[10px] font-bold uppercase py-1 px-1 text-center">GOL</TableHead>
                        <TableHead className="min-w-[110px] text-[10px] font-bold uppercase py-1 px-2">REKENING</TableHead>
                        <TableHead className="min-w-[100px] text-[10px] font-bold uppercase py-1 px-2">divisi</TableHead>
                        <TableHead className="min-w-[110px] text-[10px] font-bold uppercase py-1 px-2">BPJS TK</TableHead>
                        <TableHead className="min-w-[110px] text-[10px] font-bold uppercase py-1 px-2">BPJS KES</TableHead>
                        <TableHead className="min-w-[100px] text-[10px] font-bold uppercase py-1 px-2">JABATAN</TableHead>
                      </>
                    )}

                    {/* Tanggal Kerja (1-31, dinamis sesuai bulan) */}
                    {columnVisibility.tanggalKerja && Array.from({ length: attendanceDays }, (_, i) => (
                        <TableHead key={i + 1} className="w-[28px] text-[9px] font-bold text-center px-0.5 border-l">
                          {i + 1}
                        </TableHead>
                      ))}

                    {/* Hari Kerja Section */}
                    {columnVisibility.hariKerja && (
                      <>
                        <TableHead className="min-w-[35px] text-[10px] font-bold uppercase text-center py-1 px-1 border-l">HK</TableHead>
                        <TableHead className="min-w-[35px] text-[10px] font-bold uppercase text-center py-1 px-1 border-l">LIB</TableHead>
                        <TableHead className="min-w-[35px] text-[10px] font-bold uppercase text-center py-1 px-1 border-l text-red-500">TDK</TableHead>
                        <TableHead className="min-w-[35px] text-[10px] font-bold uppercase text-center py-1 px-1 border-l">DIB</TableHead>
                        <TableHead className="min-w-[40px] text-[10px] font-bold uppercase text-center py-1 px-1 border-l">LEM</TableHead>
                      </>
                    )}

                    {/* Gaji & Tunjangan */}
                    {columnVisibility.gajiTunjangan && (
                      <>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l">GAPOK</TableHead>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l">TUNJ.JAB</TableHead>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l">TUNJ.PER</TableHead>
                        <TableHead className="min-w-[70px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l">SPPD</TableHead>
                        <TableHead className="min-w-[70px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l">THR</TableHead>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l">T.LAIN</TableHead>
                      </>
                    )}

                    {/* Overtime */}
                    {columnVisibility.overtime && (
                      <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l">OVERTIME</TableHead>
                    )}

                    {/* Total Sebelum Potongan */}
                    {columnVisibility.totalSebelumPotongan && (
                      <TableHead className="min-w-[95px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l bg-primary/5">TOTAL</TableHead>
                    )}

                    {/* Potongan Detail */}
                    {columnVisibility.potongan && (
                      <>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l text-red-600">POT.ABS</TableHead>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l text-red-600">JHT</TableHead>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l text-red-600">JN</TableHead>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l text-red-600">BPJS KES</TableHead>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l text-red-600">PPH21</TableHead>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l text-red-600">P.PINJ</TableHead>
                        <TableHead className="min-w-[85px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l text-red-600">P.LAIN</TableHead>
                      </>
                    )}

                    {/* Total Potongan */}
                    {columnVisibility.totalPotongan && (
                      <TableHead className="min-w-[95px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l text-red-700 bg-red-50/50">TOT.POT</TableHead>
                    )}

                    {/* Upah Diterima */}
                    {columnVisibility.upahDiterima && (
                      <TableHead className="min-w-[110px] text-[10px] font-bold uppercase text-right py-1 px-2 border-l bg-green-50">DITERIMA</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    let globalNo = 1;

                    return groupedData.map(({ divisi, items }) => (
                        <React.Fragment key={divisi}>
                          <TableRow key={`header-${divisi}`} className="bg-muted/30 h-7">
                            <TableCell
                              colSpan={totalColumnCount}
                              className="font-bold text-[10px] uppercase tracking-wider sticky left-0 bg-muted/30 py-1"
                            >
                              {divisi}
                            </TableCell>
                          </TableRow>
                          {items.map((item) => (
                            <TableRow key={item.id} className={`hover:bg-muted/20 h-8 transition-colors ${selectedIds.has(item.id) ? 'bg-accent/30' : ''}`}>
                              {/* Checkbox cell */}
                              {canDelete && (
                                <TableCell className="sticky left-0 bg-background text-center py-1 px-1 border-r">
                                  <Checkbox
                                    checked={selectedIds.has(item.id)}
                                    onCheckedChange={() => toggleSelection(item.id)}
                                    className="h-3.5 w-3.5"
                                  />
                                </TableCell>
                              )}
                              <TableCell className={`sticky ${canDelete ? 'left-[32px]' : 'left-0'} bg-background text-[10px] py-1 px-2 text-center border-r`}>
                                {globalNo++}
                              </TableCell>
                              <TableCell
                                className={`sticky ${canDelete ? 'left-[72px]' : 'left-[40px]'} bg-background font-bold text-[11px] cursor-pointer hover:text-primary hover:underline py-1 px-2 border-r whitespace-nowrap truncate max-w-[150px]`}
                                onClick={() => handleKaryawanClick(item)}
                              >
                                {item.masterKaryawan?.namaKaryawan || "-"}
                              </TableCell>
                              {/* Info Karyawan */}
                              {columnVisibility.info && (
                                <>
                                  <TableCell className="text-[10px] text-center p-0">
                                    {item.masterKaryawan?.tktk || '-'}
                                  </TableCell>
                                  <TableCell className="text-center p-0">
                                    {item.masterKaryawan?.gol && (
                                      <span className="text-[9px] font-bold border rounded px-1">{item.masterKaryawan?.gol}</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-[10px] py-1 px-2 truncate max-w-[110px]" title={item.masterKaryawan?.nomorRekening || ""}>
                                    {item.masterKaryawan?.nomorRekening || '-'}
                                  </TableCell>
                                  <TableCell className="text-[10px] py-1 px-2 truncate max-w-[100px]">{item.masterKaryawan?.divisi?.nama || "-"}</TableCell>
                                  <TableCell className="font-mono text-[9px] py-1 px-2 truncate max-w-[110px]">{item.masterKaryawan?.noBpjsTk || '-'}</TableCell>
                                  <TableCell className="font-mono text-[9px] py-1 px-2 truncate max-w-[110px]">{item.masterKaryawan?.noBpjsKesehatan || '-'}</TableCell>
                                  <TableCell className="text-[10px] py-1 px-2 truncate max-w-[100px]">{item.masterKaryawan?.jabatan?.nama || "-"}</TableCell>
                                </>
                              )}

                              {/* Attendance cells (dinamis sesuai bulan) */}
                              {columnVisibility.tanggalKerja && (() => {
                                return Array.from({ length: attendanceDays }, (_, i) => {
                                  const day = String(i + 1);
                                  const status = item.tanggalKerja?.[day] || '';
                                  return (
                                    <TableCell
                                      key={i + 1}
                                      className={`text-center p-0 text-[10px] h-full border-l ${getAttendanceColor(status)}`}
                                    >
                                      <div className="flex items-center justify-center h-7 w-7 m-auto">
                                        {status || ''}
                                      </div>
                                    </TableCell>
                                  );
                                });
                              })()}

                              {/* Hari Kerja Section */}
                              {columnVisibility.hariKerja && (
                                <>
                                  <TableCell className="text-center font-bold text-[10px] p-0 border-l bg-primary/5">
                                    {item.hk}
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-[9px] p-0 border-l">
                                    {item.liburDibayar}
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-[9px] p-0 border-l text-red-600">
                                    {item.hkTidakDibayar}
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-[9px] p-0 border-l">
                                    {item.hkDibayar}
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-blue-600 font-bold text-[10px] p-0 border-l">
                                    {item.totalMenitDibayar / 60}
                                  </TableCell>
                                </>
                              )}

                              {/* Gaji & Tunjangan */}
                              {columnVisibility.gajiTunjangan && (
                                <>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l">
                                    {formatCurrency(Number(item.gajiPokok))}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l">
                                    {formatCurrency(Number(item.tunjanganJabatan))}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l">
                                    {formatCurrency(Number(item.tunjanganPerumahan))}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l">
                                    {formatCurrency(Number(item.sppd || 0))}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l">
                                    {formatCurrency(Number(item.thr || 0))}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l">
                                    {formatCurrency(Number(item.tunjanganLainLain || 0))}
                                  </TableCell>
                                </>
                              )}

                              {/* Overtime */}
                              {columnVisibility.overtime && (
                                <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l">
                                  {formatCurrency(Number(item.overtime))}
                                </TableCell>
                              )}

                              {/* Total Sebelum Potongan */}
                              {columnVisibility.totalSebelumPotongan && (
                                <TableCell className="text-right font-mono text-[10px] font-bold py-1 px-2 border-l bg-primary/5">
                                  {formatCurrency(Number(item.totalSebelumPotongan))}
                                </TableCell>
                              )}

                              {/* Potongan Detail */}
                              {columnVisibility.potongan && (
                                <>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l text-red-600">
                                    {Number(item.potKehadiran) > 0 ? `-${formatCurrency(Number(item.potKehadiran))}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l text-red-600">
                                    {Number(item.potBpjsTkJht) > 0 ? `-${formatCurrency(Number(item.potBpjsTkJht))}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l text-red-600">
                                    {Number(item.potBpjsTkJn) > 0 ? `-${formatCurrency(Number(item.potBpjsTkJn))}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l text-red-600">
                                    {Number(item.potBpjsKesehatan) > 0 ? `-${formatCurrency(Number(item.potBpjsKesehatan))}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l text-red-600">
                                    {Number(item.potPph21) > 0 ? `-${formatCurrency(Number(item.potPph21))}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l text-red-600">
                                    {Number(item.potPinjaman) > 0 ? `-${formatCurrency(Number(item.potPinjaman))}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l text-red-600">
                                    {Number(item.potLainLain) > 0 ? `-${formatCurrency(Number(item.potLainLain))}` : '-'}
                                  </TableCell>
                                </>
                              )}

                              {/* Total Potongan */}
                              {columnVisibility.totalPotongan && (
                                <TableCell className="text-right font-mono text-[10px] py-1 px-2 border-l text-red-700 font-bold bg-red-50/50">
                                  {Number(item.totalPotongan) > 0 ? `-${formatCurrency(Number(item.totalPotongan))}` : '-'}
                                </TableCell>
                              )}

                              {/* Upah Diterima */}
                              {columnVisibility.upahDiterima && (
                                <TableCell className="text-right font-mono text-[11px] font-bold text-green-600 py-1 px-2 border-l bg-green-50">
                                  {formatCurrency(Number(item.upahDiterima))}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ));
                  })()}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Penggajian</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus semua data penggajian untuk periode{" "}
              {periodeBulan && getBulanLabel(parseInt(periodeBulan))} {periodeTahun}?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePeriode}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Individual Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Karyawan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data penggajian karyawan ini?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItemId && handleDeleteIndividual(deleteItemId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={deletingIds.length > 0} onOpenChange={(open) => !open && setDeletingIds([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {deletingIds.length} Data Karyawan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {deletingIds.length} data penggajian karyawan yang dipilih?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBulk}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : `Hapus ${deletingIds.length} Data`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
