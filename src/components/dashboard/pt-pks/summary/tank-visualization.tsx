"use client";

import { cn } from "@/lib/utils";
import { Droplet } from "lucide-react";

interface TankData {
  id: string;
  namaTangki: string;
  materialName: string;
  kapasitas: number;
  isiSaatIni: number;
  persentase: number;
}

interface TankVisualizationProps {
  tanks: TankData[];
  className?: string;
}

export function TankVisualization({ tanks, className }: TankVisualizationProps) {
  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 60) return "bg-orange-500";
    if (percentage >= 40) return "bg-yellow-500";
    if (percentage >= 20) return "bg-green-500";
    return "bg-blue-500";
  };

  const getColorByMaterial = (materialName: string) => {
    const name = materialName.toUpperCase();
    if (name.includes("CPO")) return "bg-orange-500";
    if (name.includes("KERNEL") || name.includes("PK")) return "bg-amber-600";
    if (name.includes("SOLAR") || name.includes("FUEL")) return "bg-gray-600";
    return "bg-blue-500";
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Storage Tanks</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {tanks.length} tangki
        </span>
      </div>

      {tanks.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          Belum ada data tangki
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tanks.map((tank) => (
            <TankItem
              key={tank.id}
              tank={tank}
              colorClass={getColorByMaterial(tank.materialName)}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-orange-500" />
          <span className="text-xs text-muted-foreground">CPO</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-600" />
          <span className="text-xs text-muted-foreground">Kernel/PK</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-xs text-muted-foreground">Lainnya</span>
        </div>
      </div>
    </div>
  );
}

interface TankItemProps {
  tank: TankData;
  colorClass: string;
}

function TankItem({ tank, colorClass }: TankItemProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background p-4 transition-all hover:shadow-md">
      {/* Tank visualization */}
      <div className="relative mb-3">
        <div className="relative h-24 w-full overflow-hidden rounded-lg border-2 border-muted bg-muted/30">
          {/* Fill level */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 transition-all duration-500",
              colorClass
            )}
            style={{ height: `${Math.min(tank.persentase, 100)}%` }}
          >
            {/* Wave effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -left-1/2 top-0 h-3 w-[200%] animate-pulse rounded-full bg-white/20" />
            </div>
          </div>

          {/* Tank markings */}
          <div className="absolute inset-0 flex flex-col justify-between p-1">
            <div className="h-px w-full border-t border-dashed border-muted-foreground/20" />
            <div className="h-px w-full border-t border-dashed border-muted-foreground/20" />
            <div className="h-px w-full border-t border-dashed border-muted-foreground/20" />
          </div>

          {/* Percentage display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "text-lg font-bold",
                tank.persentase > 50 ? "text-white" : "text-foreground"
              )}
            >
              {tank.persentase}%
            </span>
          </div>
        </div>
      </div>

      {/* Tank info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">{tank.namaTangki}</h4>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              tank.persentase >= 80
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : tank.persentase >= 60
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  : tank.persentase >= 40
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            )}
          >
            {tank.persentase >= 80
              ? "Penuh"
              : tank.persentase >= 60
                ? "Tinggi"
                : tank.persentase >= 40
                  ? "Sedang"
                  : "Rendah"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{tank.materialName}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {formatNumber(tank.isiSaatIni)} kg
          </span>
          <span className="text-muted-foreground">
            / {formatNumber(tank.kapasitas)} kg
          </span>
        </div>
      </div>
    </div>
  );
}

interface TankSummaryBarProps {
  totalKapasitas: number;
  totalIsi: number;
  persentaseTerisi: number;
  className?: string;
}

export function TankSummaryBar({
  totalKapasitas,
  totalIsi,
  persentaseTerisi,
  className,
}: TankSummaryBarProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Total Kapasitas Tangki</h3>
        <span className="text-2xl font-bold text-primary">
          {persentaseTerisi}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-4 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all duration-500",
            persentaseTerisi >= 80
              ? "bg-red-500"
              : persentaseTerisi >= 60
                ? "bg-orange-500"
                : persentaseTerisi >= 40
                  ? "bg-yellow-500"
                  : "bg-green-500"
          )}
          style={{ width: `${Math.min(persentaseTerisi, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Terisi</p>
          <p className="text-lg font-semibold">{formatNumber(totalIsi)} kg</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Kapasitas</p>
          <p className="text-lg font-semibold">
            {formatNumber(totalKapasitas)} kg
          </p>
        </div>
      </div>
    </div>
  );
}
