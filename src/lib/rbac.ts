import { type Session } from "next-auth";
import { db } from "@/server/db";
import type { Permission as DbPermission } from "@/server/schema/user";

const GLOBAL_ADMIN_ROLES = new Set(["Admin", "Super Admin"]);

// Define permissions
export const PERMISSIONS = {
  // Company permissions
  COMPANY_VIEW: "company:view",
  COMPANY_CREATE: "company:create",
  COMPANY_UPDATE: "company:update",
  COMPANY_DELETE: "company:delete",

  // User permissions
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Dashboard permissions
  DASHBOARD_VIEW: "dashboard:view",

  // Report permissions
  REPORT_VIEW: "report:view",
  REPORT_CREATE: "report:create",
  REPORT_EXPORT: "report:export",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// New permission types for RBAC
export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve";

export type PermissionModule =
  // Master Data
  | "masterData.supplier"
  | "masterData.buyer"
  | "masterData.driver"
  | "masterData.material"
  | "masterData.vendor"
  | "masterData.vendorMaterial"
  | "masterData.vendorBongkar"
  | "masterData.karyawan"
  // Supply Chain
  | "supplyChain.penerimaanTbs"
  | "supplyChain.inputHargaTbs"
  | "supplyChain.pembayaranSupplier"
  // Produksi
  | "produksi.prosesProduksi"
  | "produksi.dashboard"
  | "produksi.laporanHarian"
  // Gudang
  | "gudang.stockTbs"
  | "gudang.stockProduct"
  | "gudang.stockMovement"
  | "gudang.stockAwal"
  | "gudang.inventaris"
  | "gudang.storeRequest"
  | "gudang.purchaseRequest"
  | "gudang.biayaOperasional"
  | "gudang.purchaseOrder"
  | "gudang.penerimaanBarang"
  | "gudang.pengeluaranBarang"
  // Pemasaran
  | "pemasaran.kontrak"
  | "pemasaran.pengirimanProduct"
  | "pemasaran.hargaTransportir"
  | "pemasaran.riwayatPengiriman"
  | "pemasaran.contract"
  | "pemasaran.invoice"
  // Payroll
  | "payroll.penggajian"
  // Keuangan
  | "keuangan.hutangSupplier"
  | "keuangan.upahBongkar"
  | "keuangan.pembayaranTransportir"
  | "keuangan.pembayaranPr"
  | "keuangan.pembayaranPo"
  | "keuangan.piutangCustomer"
  | "keuangan.biayaPengeluaran"
  | "keuangan.neraca"
  // Settings
  | "settings.users"
  | "settings.roles"
  | "settings.companies"
  | "settings.reports";

// Define roles with their permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  Admin: [
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.COMPANY_CREATE,
    PERMISSIONS.COMPANY_UPDATE,
    PERMISSIONS.COMPANY_DELETE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_EXPORT,
  ],
  Manager: [
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_EXPORT,
  ],
  User: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],
};

const PERMISSION_FALLBACKS: Partial<Record<PermissionModule, PermissionModule[]>> = {
  "pemasaran.hargaTransportir": ["pemasaran.pengirimanProduct"],
  "keuangan.pembayaranTransportir": ["keuangan.upahBongkar"],
  "gudang.biayaOperasional": ["gudang.purchaseRequest"],
};

// Check if user has permission
export function hasPermission(
  session: Session | null,
  permission: Permission
): boolean {
  if (!session?.user?.role) return false;

  const roleName = session.user.role.name;
  const rolePermissions = ROLE_PERMISSIONS[roleName] ?? [];

  return rolePermissions.includes(permission);
}

// Check if user has any of the permissions
export function hasAnyPermission(
  session: Session | null,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(session, permission));
}

// Check if user has all of the permissions
export function hasAllPermissions(
  session: Session | null,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(session, permission));
}

// Check if user has role
export function hasRole(session: Session | null, roleName: string): boolean {
  if (!session?.user?.role) return false;
  return session.user.role.name === roleName;
}

// Check if user belongs to company
export function belongsToCompany(
  session: Session | null,
  companyCode: string
): boolean {
  if (!session?.user?.company) return false;
  return session.user.company.code === companyCode;
}

// Get user's accessible companies
export function getAccessibleCompanies(session: Session | null): string[] {
  if (!session?.user?.company) return [];

  // Global admin roles can access all companies
  if (session.user.role?.name && GLOBAL_ADMIN_ROLES.has(session.user.role.name)) {
    // Return all company codes - in real scenario, fetch from database
    return ["PT-PKS", "PT-HTK", "PT-NILO", "PT-ANGGUN", "PT-TAM"];
  }

  // Regular users can only access their own company
  return [session.user.company.code];
}

/**
 * Check if a role has permission for a specific module and action (database-based RBAC)
 */
export async function checkDbPermission(
  roleId: string,
  module: PermissionModule,
  action: PermissionAction
): Promise<boolean> {
  try {
    const role = await db.role.findUnique({
      where: { id: roleId },
      select: { name: true, permissions: true },
    });

    if (!role) return false;

    // Global admin roles always have full access
    if (GLOBAL_ADMIN_ROLES.has(role.name)) return true;

    const permissions = role.permissions as DbPermission | null;
    if (!permissions) return false;

    const hasModulePermission = (targetModule: PermissionModule) => {
      const [category, subModule] = targetModule.split(".") as [keyof DbPermission, string];
      const categoryPermissions = permissions[category] as Record<string, Record<string, boolean>> | undefined;
      if (!categoryPermissions) return false;

      const modulePermissions = categoryPermissions[subModule];
      return modulePermissions?.[action] ?? false;
    };

    if (hasModulePermission(module)) {
      return true;
    }

    const fallbacks = PERMISSION_FALLBACKS[module] ?? [];
    return fallbacks.some((fallbackModule) => hasModulePermission(fallbackModule));
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Check if a role has any of the specified database permissions
 */
export async function checkAnyDbPermission(
  roleId: string,
  permissions: Array<{ module: PermissionModule; action: PermissionAction }>
): Promise<boolean> {
  for (const { module, action } of permissions) {
    const hasPermission = await checkDbPermission(roleId, module, action);
    if (hasPermission) return true;
  }
  return false;
}

/**
 * Check if a role has all of the specified database permissions
 */
export async function checkAllDbPermissions(
  roleId: string,
  permissions: Array<{ module: PermissionModule; action: PermissionAction }>
): Promise<boolean> {
  for (const { module, action } of permissions) {
    const hasPermission = await checkDbPermission(roleId, module, action);
    if (!hasPermission) return false;
  }
  return true;
}

/**
 * Get all permissions for a role from database
 */
export async function getRoleDbPermissions(roleId: string): Promise<DbPermission | null> {
  try {
    const role = await db.role.findUnique({
      where: { id: roleId },
      select: { permissions: true },
    });

    return role?.permissions as DbPermission | null;
  } catch (error) {
    console.error("Error getting role permissions:", error);
    return null;
  }
}

/**
 * Check if role is Admin
 */
export async function isAdminRole(roleId: string): Promise<boolean> {
  try {
    const role = await db.role.findUnique({
      where: { id: roleId },
      select: { name: true },
    });

    return role?.name ? GLOBAL_ADMIN_ROLES.has(role.name) : false;
  } catch (error) {
    console.error("Error checking admin role:", error);
    return false;
  }
}

