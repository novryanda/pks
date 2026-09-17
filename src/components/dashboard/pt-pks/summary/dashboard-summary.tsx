"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Building2,
  Truck,
  Warehouse,
  Factory,
  ShoppingCart,
  Package,
  FileText,
  ClipboardList,
  PackageCheck,
  PackageMinus,
  RefreshCw,
  AlertCircle,
  Scale,
  Boxes,
  FileCheck,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StatCard, StatCardMini, StatSection } from "./stat-cards";
import { TankVisualization, TankSummaryBar } from "./tank-visualization";
import { FinanceSummary, PayrollSummary } from "./finance-summary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardSummary } from "@/server/services/pt-pks/dashboard-summary.service";

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function DashboardSummaryView() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/pt-pks/dashboard-summary?bulan=${selectedMonth}&tahun=${selectedYear}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard summary");
      }
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  const formatWeight = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)} ton`;
    }
    return `${formatNumber(kg)} kg`;
  };

  const formatCurrency = (num: number) => {
    if (num >= 1000000000) {
      return `Rp ${(num / 1000000000).toFixed(1)}M`;
    }
    if (num >= 1000000) {
      return `Rp ${(num / 1000000).toFixed(1)}Jt`;
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-card p-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="font-semibold">Gagal Memuat Data</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={fetchSummary} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Month Filter Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex min-w-[200px] items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2 shadow-sm">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">
              {BULAN_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Refresh Button */}
        <Button
          onClick={fetchSummary}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Master Data Section */}
      <StatSection title="📊 Master Data">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <StatCard
            title="Total Supplier"
            value={formatNumber(summary.totalSupplier)}
            subtitle="Supplier aktif"
            icon={Users}
            iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            title="Total Buyer"
            value={formatNumber(summary.totalBuyer)}
            subtitle="Customer aktif"
            icon={Building2}
            iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          />
          <StatCard
            title="Total Vendor"
            value={formatNumber(summary.totalVendor)}
            subtitle="Vendor transportir"
            icon={Truck}
            iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          />
          <StatCard
            title="Total Driver"
            value={formatNumber(summary.totalDriver)}
            subtitle="Driver/transporter"
            icon={Truck}
            iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          />
          <StatCard
            title="Total Karyawan"
            value={formatNumber(summary.totalKaryawan)}
            subtitle="Karyawan aktif"
            icon={Users}
            iconClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
          />
        </div>
      </StatSection>

      {/* Supply Chain & Production */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Penerimaan TBS */}
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Penerimaan TBS</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Penerimaan</p>
              <p className="text-2xl font-bold">
                {formatNumber(summary.penerimaanTBS.totalPenerimaan)}
              </p>
              <p className="text-xs text-muted-foreground">transaksi</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bulan Ini</p>
              <p className="text-2xl font-bold text-primary">
                {formatNumber(summary.penerimaanTBS.bulanIni)}
              </p>
              <p className="text-xs text-muted-foreground">transaksi</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Berat</p>
              <p className="text-lg font-semibold">
                {formatWeight(summary.penerimaanTBS.totalBerat)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Nilai</p>
              <p className="text-lg font-semibold">
                {formatCurrency(summary.penerimaanTBS.totalNilai)}
              </p>
            </div>
          </div>
        </div>

        {/* Produksi */}
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Produksi</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Produksi</p>
              <p className="text-2xl font-bold">
                {formatNumber(summary.produksi.totalProduksi)}
              </p>
              <p className="text-xs text-muted-foreground">batch</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bulan Ini</p>
              <p className="text-2xl font-bold text-primary">
                {formatNumber(summary.produksi.bulanIni)}
              </p>
              <p className="text-xs text-muted-foreground">batch</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TBS Diolah</p>
              <p className="text-lg font-semibold">
                {formatWeight(summary.produksi.totalTBSDiolah)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hasil Produksi</p>
              <p className="text-lg font-semibold">
                {formatWeight(summary.produksi.totalHasilProduksi)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock & Tank Section */}
      <StatSection title="🛢️ Storage & Tangki">
        <div className="grid gap-6 lg:grid-cols-3">
          <TankSummaryBar
            totalKapasitas={summary.stockProduct.totalKapasitas}
            totalIsi={summary.stockProduct.totalIsi}
            persentaseTerisi={summary.stockProduct.persentaseTerisi}
          />
          <div className="lg:col-span-2">
            <TankVisualization tanks={summary.tangkiDetail} />
          </div>
        </div>
      </StatSection>

      {/* Pengiriman & Gudang */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pengiriman */}
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Pengiriman Product</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">
                {formatNumber(summary.pengiriman.totalPengiriman)}
              </p>
              <p className="text-xs text-muted-foreground">pengiriman</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bulan Ini</p>
              <p className="text-2xl font-bold text-primary">
                {formatNumber(summary.pengiriman.bulanIni)}
              </p>
              <p className="text-xs text-muted-foreground">pengiriman</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Berat</p>
              <p className="text-lg font-semibold">
                {formatWeight(summary.pengiriman.totalBeratDikirim)}
              </p>
            </div>
          </div>
        </div>

        {/* Gudang Stats */}
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Gudang & Inventaris</h3>
            </div>
            <div className="flex gap-2">
              {summary.gudang.prPending > 0 && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {summary.gudang.prPending} PR Pending
                </span>
              )}
              {summary.gudang.poPending > 0 && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  {summary.gudang.poPending} PO Aktif
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCardMini
              title="Store Request"
              value={summary.gudang.totalSR}
              icon={ClipboardList}
            />
            <StatCardMini
              title="Purchase Request"
              value={summary.gudang.totalPR}
              icon={FileText}
            />
            <StatCardMini
              title="Purchase Order"
              value={summary.gudang.totalPO}
              icon={Package}
            />
            <StatCardMini
              title="Penerimaan"
              value={summary.gudang.totalPenerimaanBarang}
              icon={PackageCheck}
            />
            <StatCardMini
              title="Pengeluaran"
              value={summary.gudang.totalPengeluaranBarang}
              icon={PackageMinus}
            />
            <StatCardMini
              title="Item Inventaris"
              value={summary.totalInventaris}
              icon={Boxes}
            />
          </div>
        </div>
      </div>

      {/* Keuangan & Penggajian */}
      <StatSection title="💰 Keuangan & Penggajian">
        <div className="grid gap-6 lg:grid-cols-2">
          <FinanceSummary
            totalHutang={summary.keuangan.totalHutang}
            totalPiutang={summary.keuangan.totalPiutang}
            hutangBelumLunas={summary.keuangan.hutangBelumLunas}
            piutangBelumLunas={summary.keuangan.piutangBelumLunas}
            labaRugi={summary.keuangan.labaRugi}
          />
          <PayrollSummary
            totalKaryawanAktif={summary.penggajian.totalKaryawanAktif}
            totalKaryawan={summary.penggajian.totalKaryawanGaji}
            totalGaji={summary.penggajian.totalGajiBulanIni}
            periode={summary.penggajian.periodeTerakhir}
            riwayatBulanan={summary.penggajian.riwayatBulanan}
          />
        </div>
      </StatSection>

      {/* Contract & Stock Material */}
      <StatSection title="📋 Kontrak & Stock Material">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contract Summary */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {/* Header with gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -right-8 top-8 h-16 w-16 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  <h3 className="font-semibold">Kontrak Aktif</h3>
                </div>
                {summary.contracts.nearDeadline > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-medium text-yellow-100">
                    <AlertTriangle className="h-3 w-3" />
                    {summary.contracts.nearDeadline} mendekati deadline
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x border-b">
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Kontrak</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatNumber(summary.contracts.totalActive)}
                </p>
              </div>
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Nilai</p>
                <p className="mt-1 text-lg font-bold">
                  {formatCurrency(summary.contracts.totalValue)}
                </p>
              </div>
            </div>

            {/* Recent Contracts List */}
            <div className="p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Kontrak Terdekat:</p>
              {summary.contracts.recentContracts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  Tidak ada kontrak aktif
                </p>
              ) : (
                <div className="space-y-2">
                  {summary.contracts.recentContracts.slice(0, 3).map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {contract.contractNumber}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {contract.buyerName}
                        </p>
                      </div>
                      <div className="ml-2 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${contract.daysUntilDelivery <= 3
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : contract.daysUntilDelivery <= 7
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            }`}
                        >
                          <Calendar className="h-3 w-3" />
                          {contract.daysUntilDelivery} hari
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stock Material Summary */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -right-8 top-8 h-16 w-16 rounded-full bg-white/10" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" />
                  <h3 className="font-semibold">Stock Material</h3>
                </div>
                {summary.stockMaterial.lowStockItems.length > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-orange-400/20 px-2 py-0.5 text-xs font-medium text-orange-100">
                    <AlertTriangle className="h-3 w-3" />
                    {summary.stockMaterial.lowStockItems.length} stock rendah
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 divide-x border-b">
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Item</p>
                <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {formatNumber(summary.stockMaterial.totalItems)}
                </p>
              </div>
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Qty</p>
                <p className="mt-1 text-lg font-bold">
                  {formatWeight(summary.stockMaterial.totalValue)}
                </p>
              </div>
            </div>

            {/* Low Stock Items */}
            <div className="p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Item Stock Rendah:
              </p>
              {summary.stockMaterial.lowStockItems.length === 0 ? (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  <TrendingUp className="h-5 w-5" />
                  <p className="text-sm font-medium">Semua stock aman</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {summary.stockMaterial.lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-orange-800 dark:text-orange-200">
                          {item.materialName}
                        </p>
                      </div>
                      <div className="ml-2 flex items-center gap-1">
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                          {formatNumber(item.currentStock)}
                        </span>
                        <span className="text-xs text-orange-500">
                          {item.satuanName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </StatSection>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Master Data */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Supply & Production */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>

      {/* Tank Section */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl lg:col-span-2" />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
