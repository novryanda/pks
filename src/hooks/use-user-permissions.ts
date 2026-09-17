"use client";

import { useState, useEffect } from "react";
import type { Permission } from "@/server/schema/user";
import type { PermissionAction } from "@/lib/rbac";

const permissionFallbacks: Record<string, string[]> = {
  "pemasaran.hargaTransportir": ["pemasaran.pengirimanProduct"],
  "keuangan.pembayaranTransportir": ["keuangan.upahBongkar"],
  "gudang.biayaOperasional": ["gudang.purchaseRequest"],
};

// Menu structure for determining first accessible route
const menuRouteMapping = [
  {
    category: "masterData", routes: [
      { module: "masterData.supplier", url: "/dashboard/pt-pks/master/supplier" },
      { module: "masterData.buyer", url: "/dashboard/pt-pks/master/buyer" },
      { module: "masterData.driver", url: "/dashboard/pt-pks/master/transportir" },
      { module: "masterData.material", url: "/dashboard/pt-pks/master/material" },
      { module: "masterData.vendor", url: "/dashboard/pt-pks/master/vendor" },
      { module: "masterData.vendorBongkar", url: "/dashboard/pt-pks/master/vendor-bongkar" },
    ]
  },
  {
    category: "supplyChain", routes: [
      { module: "supplyChain.penerimaanTbs", url: "/dashboard/pt-pks/supply-chain/penerimaan-tbs" },
      { module: "supplyChain.inputHargaTbs", url: "/dashboard/pt-pks/supply-chain/input-harga-tbs" },
      { module: "supplyChain.pembayaranSupplier", url: "/dashboard/pt-pks/supply-chain/pembayaran-supplier" },
    ]
  },
  {
    category: "produksi", routes: [
      { module: "produksi.dashboard", url: "/dashboard/pt-pks/produksi/dashboard" },
      { module: "produksi.prosesProduksi", url: "/dashboard/pt-pks/produksi/proses-produksi" },
      { module: "produksi.laporanHarian", url: "/dashboard/pt-pks/produksi/laporan-harian" },
    ]
  },
  {
    category: "gudang", routes: [
      { module: "gudang.stockTbs", url: "/dashboard/pt-pks/gudang/stock-tbs" },
      { module: "gudang.stockProduct", url: "/dashboard/pt-pks/gudang/stock-product" },
      { module: "gudang.stockMovement", url: "/dashboard/pt-pks/gudang/stock-movement" },
      { module: "gudang.stockAwal", url: "/dashboard/pt-pks/gudang/stock-awal" },
      { module: "gudang.inventaris", url: "/dashboard/pt-pks/gudang/inventaris" },
      { module: "gudang.storeRequest", url: "/dashboard/pt-pks/gudang/store-request" },
      { module: "gudang.purchaseRequest", url: "/dashboard/pt-pks/gudang/purchase-request" },
      { module: "gudang.biayaOperasional", url: "/dashboard/pt-pks/gudang/biaya-operasional" },
      { module: "gudang.purchaseOrder", url: "/dashboard/pt-pks/gudang/purchase-order" },
      { module: "gudang.penerimaanBarang", url: "/dashboard/pt-pks/gudang/penerimaan-barang" },
      { module: "gudang.pengeluaranBarang", url: "/dashboard/pt-pks/gudang/pengeluaran-barang" },
    ]
  },
  {
    category: "pemasaran", routes: [
      { module: "pemasaran.contract", url: "/dashboard/pt-pks/pemasaran/kontrak" },
      { module: "pemasaran.pengirimanProduct", url: "/dashboard/pt-pks/pemasaran/pengiriman-product" },
      { module: "pemasaran.hargaTransportir", url: "/dashboard/pt-pks/pemasaran/harga-transportir" },
      { module: "pemasaran.riwayatPengiriman", url: "/dashboard/pt-pks/pemasaran/riwayat-pengiriman" },
      { module: "pemasaran.invoice", url: "/dashboard/pt-pks/pemasaran/invoice" },
    ]
  },
  {
    category: "payroll", routes: [
      { module: "payroll.penggajian", url: "/dashboard/pt-pks/payroll/penggajian" },
    ]
  },
  {
    category: "keuangan", routes: [
      { module: "keuangan.hutangSupplier", url: "/dashboard/pt-pks/keuangan/hutang-supplier" },
      { module: "keuangan.upahBongkar", url: "/dashboard/pt-pks/keuangan/upah-bongkar" },
      { module: "keuangan.pembayaranTransportir", url: "/dashboard/pt-pks/keuangan/pembayaran-transportir" },
      { module: "keuangan.pembayaranPr", url: "/dashboard/pt-pks/keuangan/pembayaran-pr" },
      { module: "keuangan.pembayaranPo", url: "/dashboard/pt-pks/keuangan/pembayaran-po" },
      { module: "keuangan.biayaPengeluaran", url: "/dashboard/pt-pks/keuangan/biaya-pengeluaran" },
      { module: "keuangan.piutangCustomer", url: "/dashboard/pt-pks/keuangan/piutang-customer" },
      { module: "keuangan.neraca", url: "/dashboard/pt-pks/keuangan/neraca" },
    ]
  },
  {
    category: "settings", routes: [
      { module: "settings.users", url: "/dashboard/pt-pks/settings/users" },
      { module: "settings.roles", url: "/dashboard/pt-pks/settings/roles" },
    ]
  },
];

interface UseUserPermissionsResult {
  isAdmin: boolean;
  permissions: Permission | null;
  isLoading: boolean;
  error: string | null;
  hasModuleAccess: (module: string) => boolean;
  hasActionAccess: (module: string, action?: PermissionAction) => boolean;
  getFirstAccessibleRoute: () => string | null;
}

type PermissionsResponse = {
  isAdmin: boolean;
  permissions: Permission | null;
  error?: string;
};

export function useUserPermissions(): UseUserPermissionsResult {
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<Permission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/pt-pks/user/me/permissions");

        if (!response.ok) {
          throw new Error("Failed to fetch permissions");
        }

        const data = (await response.json()) as PermissionsResponse;
        setIsAdmin(data.isAdmin);
        setPermissions(data.permissions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPermissions();
  }, []);

  /**
   * Check if user has access to a specific module (has any 'view' permission)
   * @param module - Module path like "masterData.supplier", "gudang", "settings.users"
   */
  const hasModuleAccess = (module: string): boolean => {
    return hasActionAccess(module, "view");
  };

  const hasActionAccess = (module: string, action: PermissionAction = "view"): boolean => {
    // Admin always has access
    if (isAdmin) return true;

    if (!permissions) return false;

    const parts = module.split(".");

    // For category-level access (e.g., "masterData", "gudang")
    if (parts.length === 1) {
      const category = parts[0] as keyof Permission;
      const categoryPerms = permissions[category];

      if (!categoryPerms || typeof categoryPerms !== "object") return false;

      // Check if any sub-module has view permission
      return Object.values(categoryPerms).some((subModule) => {
        const actionMap = subModule as Record<string, boolean> | null;
        if (actionMap && typeof actionMap === "object" && action in actionMap) {
          return actionMap[action] === true;
        }
        return false;
      });
    }

    // For specific module access (e.g., "masterData.supplier")
    if (parts.length === 2) {
      const hasPermission = (targetModule: string) => {
        const [category, subModule] = targetModule.split(".") as [keyof Permission, string];
        const categoryPerms = permissions[category] as Record<string, Record<string, boolean>> | undefined;

        if (!categoryPerms) return false;

        const modulePerms = categoryPerms[subModule];
        return modulePerms?.[action] === true;
      };

      if (hasPermission(module)) {
        return true;
      }

      const fallbackModules = permissionFallbacks[module] ?? [];
      return fallbackModules.some((fallbackModule) => hasPermission(fallbackModule));
    }

    return false;
  };

  /**
   * Get the first accessible route for the user based on their permissions
   * Returns null if Admin (should go to dashboard) or no accessible route found
   */
  const getFirstAccessibleRoute = (): string | null => {
    // Admin should stay on dashboard
    if (isAdmin) return null;

    if (!permissions) return null;

    // Iterate through menu categories to find first accessible route
    for (const category of menuRouteMapping) {
      for (const route of category.routes) {
        if (hasModuleAccess(route.module)) {
          return route.url;
        }
      }
    }

    return null;
  };

  return {
    isAdmin,
    permissions,
    isLoading,
    error,
    hasModuleAccess,
    hasActionAccess,
    getFirstAccessibleRoute,
  };
}
