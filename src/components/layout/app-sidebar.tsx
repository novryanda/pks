"use client"

import * as React from "react"
import {
  Building2,
  Home,
  Users,
  FileText,
  Settings,
  Database,
  Truck,
  Factory,
  Warehouse,
  ShoppingCart,
  DollarSign,
  Loader2,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useUserPermissions } from "@/hooks/use-user-permissions"

interface SubMenuItem {
  title: string
  url: string
  permissionModule?: string // e.g., "masterData.supplier"
}

interface MenuItem {
  title: string
  url: string
  icon: React.ComponentType
  roles?: string[]
  permissionCategory?: string // e.g., "masterData", "gudang"
  items?: SubMenuItem[]
}

const companyMenus: Record<string, MenuItem[]> = {
  "PT-PKS": [
    {
      title: "Dashboard",
      url: "/dashboard/pt-pks",
      icon: Home,
      roles: ["Admin", "Manager", "User"],
      // Dashboard always visible for authenticated users
    },

    // ============ MASTER DATA ============
    {
      title: "Master Data",
      url: "/dashboard/pt-pks/master",
      icon: Database,
      roles: ["Admin"],
      permissionCategory: "masterData",
      items: [
        { title: "Supplier", url: "/dashboard/pt-pks/master/supplier", permissionModule: "masterData.supplier" },
        { title: "Buyer", url: "/dashboard/pt-pks/master/buyer", permissionModule: "masterData.buyer" },
        { title: "Vendor", url: "/dashboard/pt-pks/master/vendor", permissionModule: "masterData.vendor" },
        { title: "Driver", url: "/dashboard/pt-pks/master/transportir", permissionModule: "masterData.driver" },
        { title: "Material", url: "/dashboard/pt-pks/master/material", permissionModule: "masterData.material" },
        { title: "Karyawan", url: "/dashboard/pt-pks/master/karyawan", permissionModule: "masterData.karyawan" },
      ],
    },

    // ============ SUPPLY CHAIN (PROCUREMENT) ============
    {
      title: "Supply Chain",
      url: "/dashboard/pt-pks/supply-chain",
      icon: Truck,
      roles: ["Admin", "Staff Procurement"],
      permissionCategory: "supplyChain",
      items: [
        { title: "Penerimaan TBS", url: "/dashboard/pt-pks/supply-chain/penerimaan-tbs", permissionModule: "supplyChain.penerimaanTbs" },
        { title: "Input Harga TBS", url: "/dashboard/pt-pks/supply-chain/input-harga-tbs", permissionModule: "supplyChain.inputHargaTbs" },
        { title: "Pembayaran Supplier", url: "/dashboard/pt-pks/supply-chain/pembayaran-supplier", permissionModule: "supplyChain.pembayaranSupplier" },
      ],
    },

    // ============ PRODUKSI ============
    {
      title: "Produksi",
      url: "/dashboard/pt-pks/produksi",
      icon: Factory,
      roles: ["Admin", "Manager Produksi", "Staff Produksi"],
      permissionCategory: "produksi",
      items: [
        { title: "Dashboard", url: "/dashboard/pt-pks/produksi/dashboard", permissionModule: "produksi.dashboard" },
        { title: "Stock TBS", url: "/dashboard/pt-pks/gudang/stock-tbs", permissionModule: "gudang.stockTbs" },
        { title: "Stock Product", url: "/dashboard/pt-pks/gudang/stock-product", permissionModule: "gudang.stockProduct" },
        { title: "Stock Awal", url: "/dashboard/pt-pks/gudang/stock-awal", permissionModule: "gudang.stockAwal" },
        { title: "Proses Produksi", url: "/dashboard/pt-pks/produksi/proses-produksi", permissionModule: "produksi.prosesProduksi" },
        { title: "Log Produksi", url: "/dashboard/pt-pks/produksi/log-produksi", permissionModule: "produksi.prosesProduksi" },
        { title: "Stock Movement", url: "/dashboard/pt-pks/gudang/stock-movement", permissionModule: "gudang.stockMovement" },
        { title: "Laporan Harian", url: "/dashboard/pt-pks/produksi/laporan-harian", permissionModule: "produksi.laporanHarian" },

      ],
    },

    // ============ GUDANG / INVENTORY ============
    {
      title: "Gudang",
      url: "/dashboard/pt-pks",
      icon: Warehouse,
      roles: ["Admin", "Staff Gudang"],
      permissionCategory: "gudang",
      items: [
        { title: "Material", url: "/dashboard/pt-pks/gudang/inventaris", permissionModule: "gudang.inventaris" },
        { title: "Store Request (SR)", url: "/dashboard/pt-pks/gudang/store-request", permissionModule: "gudang.storeRequest" },
        { title: "Purchase Request (PR)", url: "/dashboard/pt-pks/gudang/purchase-request", permissionModule: "gudang.purchaseRequest" },
        { title: "Biaya Operasional", url: "/dashboard/pt-pks/gudang/biaya-operasional", permissionModule: "gudang.biayaOperasional" },
        { title: "Purchase Order (PO)", url: "/dashboard/pt-pks/gudang/purchase-order", permissionModule: "gudang.purchaseOrder" },
        { title: "Penerimaan Barang", url: "/dashboard/pt-pks/gudang/penerimaan-barang", permissionModule: "gudang.penerimaanBarang" },
        { title: "Pengeluaran Barang", url: "/dashboard/pt-pks/gudang/pengeluaran-barang", permissionModule: "gudang.pengeluaranBarang" },
      ],
    },

    // ============ PEMASARAN (SALES) ============
    {
      title: "Pemasaran",
      url: "/dashboard/pt-pks/pemasaran",
      icon: ShoppingCart,
      roles: ["Admin", "Manager Marketing", "Staff Marketing"],
      permissionCategory: "pemasaran",
      items: [
        { title: "Kontrak", url: "/dashboard/pt-pks/pemasaran/kontrak", permissionModule: "pemasaran.contract" },
        { title: "Pengiriman Product", url: "/dashboard/pt-pks/pemasaran/pengiriman-product", permissionModule: "pemasaran.pengirimanProduct" },
        { title: "Harga Transportir", url: "/dashboard/pt-pks/pemasaran/harga-transportir", permissionModule: "pemasaran.hargaTransportir" },
        { title: "Riwayat Pengiriman", url: "/dashboard/pt-pks/pemasaran/riwayat-pengiriman", permissionModule: "pemasaran.riwayatPengiriman" },
        { title: "Invoice", url: "/dashboard/pt-pks/pemasaran/invoice", permissionModule: "pemasaran.invoice" },
      ],
    },

    {
      title: "Payroll",
      url: "/dashboard/pt-pks/payroll",
      icon: Database,
      roles: ["Admin", "Manager HR", "Staff HR"],
      permissionCategory: "payroll",
      items: [
        { title: "Penggajian", url: "/dashboard/pt-pks/payroll/penggajian", permissionModule: "payroll.penggajian" },
      ],
    },

    {
      title: "Keuangan",
      url: "/dashboard/pt-pks/keuangan",
      icon: DollarSign,
      roles: ["Admin", "Manager Keuangan", "Staff Keuangan"],
      permissionCategory: "keuangan",
      items: [
        { title: "Hutang Supplier", url: "/dashboard/pt-pks/keuangan/hutang-supplier", permissionModule: "keuangan.hutangSupplier" },
        { title: "Upah Bongkar", url: "/dashboard/pt-pks/keuangan/upah-bongkar", permissionModule: "keuangan.upahBongkar" },
        { title: "Pembayaran Transportir", url: "/dashboard/pt-pks/keuangan/pembayaran-transportir", permissionModule: "keuangan.pembayaranTransportir" },
        { title: "Pembayaran PR Langsung", url: "/dashboard/pt-pks/keuangan/pembayaran-pr", permissionModule: "keuangan.pembayaranPr" },
        { title: "Pembayaran PO", url: "/dashboard/pt-pks/keuangan/pembayaran-po", permissionModule: "keuangan.pembayaranPo" },
        { title: "Piutang Customer", url: "/dashboard/pt-pks/keuangan/piutang-customer", permissionModule: "keuangan.piutangCustomer" },
        { title: "Biaya Pengeluaran", url: "/dashboard/pt-pks/keuangan/biaya-pengeluaran", permissionModule: "keuangan.biayaPengeluaran" },
        { title: "Neraca", url: "/dashboard/pt-pks/keuangan/neraca", permissionModule: "keuangan.neraca" },
      ],
    },

    // ============ PENGATURAN (SETTINGS) ============
    {
      title: "Pengaturan",
      url: "/dashboard/pt-pks/settings",
      icon: Settings,
      roles: ["Admin"],
      permissionCategory: "settings",
      items: [
        { title: "Users", url: "/dashboard/pt-pks/settings/users", permissionModule: "settings.users" },
        { title: "Roles & Permissions", url: "/dashboard/pt-pks/settings/roles", permissionModule: "settings.roles" },
      ],
    },
  ],
  "PT-HTK": [
    {
      title: "Dashboard",
      url: "/dashboard/pt-htk",
      icon: Home,
      roles: ["Admin", "Manager", "User"],
    },
    {
      title: "Users",
      url: "/dashboard/pt-htk/users",
      icon: Users,
      roles: ["Admin"],
    },
    {
      title: "Reports",
      url: "/dashboard/pt-htk/reports",
      icon: FileText,
      roles: ["Admin", "Manager"],
    },
  ],
  "PT-NILO": [
    {
      title: "Dashboard",
      url: "/dashboard/pt-nilo",
      icon: Home,
      roles: ["Admin", "Manager", "User"],
    },
    {
      title: "Users",
      url: "/dashboard/pt-nilo/users",
      icon: Users,
      roles: ["Admin"],
    },
    {
      title: "Reports",
      url: "/dashboard/pt-nilo/reports",
      icon: FileText,
      roles: ["Admin", "Manager"],
    },
  ],
  "PT-ANGGUN": [
    {
      title: "Dashboard",
      url: "/dashboard/pt-anggun",
      icon: Home,
      roles: ["Admin", "Manager", "User"],
    },
    {
      title: "Voice Input",
      url: "/dashboard/pt-anggun/voice-input",
      icon: Users, // Using Users as placeholder or maybe Lucide has Mic
      roles: ["Admin", "Manager"],
    },
    {
      title: "Users",
      url: "/dashboard/pt-anggun/users",
      icon: Users,
      roles: ["Admin"],
    },
  ],
  "PT-TAM": [
    {
      title: "Dashboard",
      url: "/dashboard/pt-tam",
      icon: Home,
      roles: ["Admin", "Manager", "User"],
    },
    {
      title: "Users",
      url: "/dashboard/pt-tam/users",
      icon: Users,
      roles: ["Admin"],
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: {
      name: string
    }
    company?: {
      code: string
      name: string
    }
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { isAdmin, hasModuleAccess, isLoading } = useUserPermissions();

  // Get menus for user's company
  const companyCode = user.company?.code
  const allMenus = companyCode ? companyMenus[companyCode] ?? [] : []

  // Filter menus based on permissions
  const filteredMenus = React.useMemo(() => {
    if (isLoading) return [];

    return allMenus
      .map((menu) => {
        // Dashboard is always visible
        if (menu.title === "Dashboard") {
          return menu;
        }

        // Admin sees everything
        if (isAdmin) {
          return menu;
        }

        // Check if user has access to this category
        if (menu.permissionCategory && !hasModuleAccess(menu.permissionCategory)) {
          return null;
        }

        // Filter sub-items based on individual module permissions
        if (menu.items && menu.items.length > 0) {
          const filteredItems = menu.items.filter((item) => {
            if (!item.permissionModule) return true;
            return hasModuleAccess(item.permissionModule);
          });

          // If no sub-items have access, hide the entire menu
          if (filteredItems.length === 0) {
            return null;
          }

          return {
            ...menu,
            items: filteredItems,
          };
        }

        return menu;
      })
      .filter((menu): menu is MenuItem => menu !== null);
  }, [allMenus, isAdmin, hasModuleAccess, isLoading]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 flex items-center border-b border-sidebar-border px-4 py-0 shrink-0">
        <SidebarMenu className="gap-0">
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent p-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center">
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center w-full">
                {/* <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-5" />
                </div> */}
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">HT Group</span>
                  <span className="truncate text-xs">
                    {user.company?.name ?? "Application"}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <NavMain items={filteredMenus} />
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
