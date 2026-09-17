"use client";

import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Receipt, CreditCard, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface LabaRugiData {
  pendapatan: {
    penjualanProduct: number;
    penerimaanLainnya: number;
    total: number;
  };
  pengeluaran: {
    pembelianTBS: number;
    pembelianMaterial: number;
    biayaGaji: number;
    pengeluaranLainnya: number;
    total: number;
  };
  labaKotor: number;
  labaBersih: number;
}

interface FinanceSummaryProps {
  totalHutang: number;
  totalPiutang: number;
  hutangBelumLunas: number;
  piutangBelumLunas: number;
  labaRugi: LabaRugiData;
  className?: string;
}

export function FinanceSummary({
  totalHutang,
  totalPiutang,
  hutangBelumLunas,
  piutangBelumLunas,
  labaRugi,
  className,
}: FinanceSummaryProps) {
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatCompact = (num: number) => {
    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    if (absNum >= 1000000000) {
      return `${sign}Rp ${(absNum / 1000000000).toFixed(1)}M`;
    }
    if (absNum >= 1000000) {
      return `${sign}Rp ${(absNum / 1000000).toFixed(1)}Jt`;
    }
    if (absNum >= 1000) {
      return `${sign}Rp ${(absNum / 1000).toFixed(0)}K`;
    }
    return formatCurrency(num);
  };

  const isProfit = labaRugi.labaBersih >= 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Laba Rugi Card */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Header */}
        <div className={cn(
          "relative overflow-hidden p-4 text-white",
          isProfit
            ? "bg-gradient-to-r from-emerald-500 to-green-600"
            : "bg-gradient-to-r from-red-500 to-rose-600"
        )}>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -right-8 top-8 h-16 w-16 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              <h3 className="font-semibold">Laba Rugi Bulan Ini</h3>
            </div>
            <span className={cn(
              "rounded-full px-3 py-1 text-sm font-bold",
              isProfit ? "bg-white/20" : "bg-white/20"
            )}>
              {isProfit ? "LABA" : "RUGI"}
            </span>
          </div>
        </div>

        {/* Laba Bersih */}
        <div className="p-4 text-center border-b">
          <p className="text-sm text-muted-foreground">Laba/Rugi Bersih</p>
          <p className={cn(
            "text-3xl font-bold mt-1",
            isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {formatCompact(labaRugi.labaBersih)}
          </p>
        </div>

        {/* Pendapatan & Pengeluaran */}
        <div className="grid grid-cols-2 divide-x">
          {/* Pendapatan */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-muted-foreground">Pendapatan</span>
            </div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              {formatCompact(labaRugi.pendapatan.total)}
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Penjualan Product</span>
                <span className="font-medium">{formatCompact(labaRugi.pendapatan.penjualanProduct)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lainnya</span>
                <span className="font-medium">{formatCompact(labaRugi.pendapatan.penerimaanLainnya)}</span>
              </div>
            </div>
          </div>

          {/* Pengeluaran */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">Pengeluaran</span>
            </div>
            <p className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
              {formatCompact(labaRugi.pengeluaran.total)}
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pembelian TBS</span>
                <span className="font-medium">{formatCompact(labaRugi.pengeluaran.pembelianTBS)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pembelian Material</span>
                <span className="font-medium">{formatCompact(labaRugi.pengeluaran.pembelianMaterial)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya Gaji</span>
                <span className="font-medium">{formatCompact(labaRugi.pengeluaran.biayaGaji)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hutang Piutang Card */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Header */}
        <div className="border-b bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Hutang & Piutang</h3>
          </div>
        </div>

        {/* Piutang & Hutang Grid */}
        <div className="grid grid-cols-2 gap-4 p-4">
          {/* Piutang (Receivables) */}
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Piutang</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">{formatCompact(totalPiutang)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Belum Lunas</p>
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                {formatCompact(piutangBelumLunas)}
              </p>
            </div>
          </div>

          {/* Hutang (Payables) */}
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Hutang</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">{formatCompact(totalHutang)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Belum Lunas</p>
              <p className="text-base font-bold text-red-600 dark:text-red-400">
                {formatCompact(hutangBelumLunas)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PayrollHistoryItem {
  bulan: number;
  tahun: number;
  periode: string;
  jumlahKaryawan: number;
  totalGaji: number;
}

interface PayrollSummaryProps {
  totalKaryawanAktif: number;
  totalKaryawan: number;
  totalGaji: number;
  periode: string | null;
  riwayatBulanan?: PayrollHistoryItem[];
  className?: string;
}

export function PayrollSummary({
  totalKaryawanAktif,
  totalKaryawan,
  totalGaji,
  periode,
  riwayatBulanan = [],
  className,
}: PayrollSummaryProps) {
  const formatCurrency = (num: number) => {
    if (num >= 1000000000) {
      return `Rp ${(num / 1000000000).toFixed(1)}M`;
    }
    if (num >= 1000000) {
      return `Rp ${(num / 1000000).toFixed(1)}Jt`;
    }
    if (num >= 1000) {
      return `Rp ${(num / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Find max gaji for chart scaling
  const maxGaji = Math.max(...riwayatBulanan.map((r) => r.totalGaji), 1);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        className
      )}
    >
      {/* Header with gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -right-8 top-8 h-16 w-16 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <h3 className="font-semibold">Penggajian</h3>
          </div>
          {periode && (
            <p className="mt-1 text-sm text-white/80">Periode: {periode}</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 divide-x border-b">
        <div className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Karyawan Aktif</p>
          <p className="mt-1 text-xl font-bold text-purple-600 dark:text-purple-400">
            {totalKaryawanAktif}
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Digaji Bulan Ini</p>
          <p className="mt-1 text-xl font-bold">{totalKaryawan}</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Gaji</p>
          <p className="mt-1 text-lg font-bold text-primary">
            {formatCurrency(totalGaji)}
          </p>
        </div>
      </div>

      {/* Monthly History Chart */}
      {riwayatBulanan.length > 0 && (
        <div className="p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Riwayat Gaji (6 Bulan Terakhir):
          </p>
          <div className="flex items-end justify-between gap-2">
            {riwayatBulanan.map((item) => (
              <div key={`${item.bulan}-${item.tahun}`} className="flex-1 text-center">
                <div className="relative mx-auto h-20 w-full max-w-8">
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-gradient-to-t from-purple-500 to-indigo-400 transition-all"
                    style={{
                      height: `${(item.totalGaji / maxGaji) * 100}%`,
                      minHeight: item.totalGaji > 0 ? "8px" : "0px",
                    }}
                  />
                </div>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {item.periode.split(" ")[0]?.substring(0, 3)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.totalGaji)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
