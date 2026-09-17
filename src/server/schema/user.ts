import { z } from "zod";

// Permission structure for RBAC
export const PermissionSchema = z.object({
  // Master Data
  masterData: z.object({
    supplier: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    buyer: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    driver: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    material: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    vendor: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    vendorMaterial: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    karyawan: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    vendorBongkar: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
  }).default({}),

  // Supply Chain
  supplyChain: z.object({
    penerimaanTbs: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    inputHargaTbs: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    pembayaranSupplier: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
  }).default({}),

  // Produksi
  produksi: z.object({
    dashboard: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    prosesProduksi: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    laporanHarian: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
  }).default({}),

  // Gudang
  gudang: z.object({
    stockTbs: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    stockProduct: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    stockMovement: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    stockAwal: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    inventaris: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    storeRequest: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
      approve: z.boolean().default(false),
    }).default({}),
    purchaseRequest: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
      approve: z.boolean().default(false),
    }).default({}),
    biayaOperasional: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
      approve: z.boolean().default(false),
    }).default({}),
    purchaseOrder: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
      approve: z.boolean().default(false),
    }).default({}),
    penerimaanBarang: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    pengeluaranBarang: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
      approve: z.boolean().default(false),
    }).default({}),
  }).default({}),

  // Pemasaran
  pemasaran: z.object({
    pengirimanProduct: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    hargaTransportir: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    riwayatPengiriman: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    contract: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    invoice: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
  }).default({}),

  // Payroll
  payroll: z.object({
    penggajian: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
  }).default({}),

  // Keuangan
  keuangan: z.object({
    hutangSupplier: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    upahBongkar: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    pembayaranTransportir: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    pembayaranPr: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    pembayaranPo: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    biayaPengeluaran: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    piutangCustomer: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    neraca: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
  }).default({}),

  // Settings
  settings: z.object({
    users: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    roles: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    companies: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    reports: z.object({
      view: z.boolean().default(false),
      create: z.boolean().default(false),
      edit: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
  }).default({}),
}).default({});

// Create User Schema
export const CreateUserSchema = z.object({
  name: z.string().min(1, "Nama harus diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  companyId: z.string().cuid("Company ID tidak valid"),
  roleId: z.string().cuid("Role ID tidak valid"),
  image: z.string().url().optional().nullable(),
});

// Update User Schema
export const UpdateUserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Nama harus diisi").optional(),
  email: z.string().email("Format email tidak valid").optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  roleId: z.string().cuid("Role ID tidak valid").optional(),
  image: z.string().url().optional().nullable(),
});

// Change Password Schema
export const ChangePasswordSchema = z.object({
  id: z.string().cuid(),
  currentPassword: z.string().min(1, "Password saat ini harus diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password harus diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru dan konfirmasi tidak cocok",
  path: ["confirmPassword"],
});

// Create Role Schema
export const CreateRoleSchema = z.object({
  name: z.string().min(1, "Nama role harus diisi"),
  description: z.string().optional().nullable(),
  companyId: z.string().cuid("Company ID tidak valid"),
  permissions: PermissionSchema,
});

// Update Role Schema
export const UpdateRoleSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Nama role harus diisi").optional(),
  description: z.string().optional().nullable(),
  permissions: PermissionSchema.optional(),
});

// User Response Schema
export const UserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  image: z.string().url().nullable().optional(),
  companyId: z.string().cuid().nullable(),
  roleId: z.string().cuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

// Role Response Schema
export const RoleSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable(),
  companyId: z.string().cuid(),
  permissions: PermissionSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types
export type Permission = z.infer<typeof PermissionSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type Role = z.infer<typeof RoleSchema>;

// Default permissions for Admin role
export const getAdminPermissions = (): Permission => {
  return {
    masterData: {
      supplier: { view: true, create: true, edit: true, delete: true },
      buyer: { view: true, create: true, edit: true, delete: true },
      driver: { view: true, create: true, edit: true, delete: true },
      material: { view: true, create: true, edit: true, delete: true },
      vendor: { view: true, create: true, edit: true, delete: true },
      vendorMaterial: { view: true, create: true, edit: true, delete: true },
      karyawan: { view: true, create: true, edit: true, delete: true },
      vendorBongkar: { view: true, create: true, edit: true, delete: true },
    },
    supplyChain: {
      penerimaanTbs: { view: true, create: true, edit: true, delete: true },
      inputHargaTbs: { view: true, create: true, edit: true, delete: true },
      pembayaranSupplier: { view: true, create: true, edit: true, delete: true },
    },
    produksi: {
      dashboard: { view: true, create: true, edit: true, delete: true },
      prosesProduksi: { view: true, create: true, edit: true, delete: true },
      laporanHarian: { view: true, create: true, edit: true, delete: true },
    },
    gudang: {
      stockTbs: { view: true, create: true, edit: true, delete: true },
      stockProduct: { view: true, create: true, edit: true, delete: true },
      stockMovement: { view: true, create: true, edit: true, delete: true },
      stockAwal: { view: true, create: true, edit: true, delete: true },
      inventaris: { view: true, create: true, edit: true, delete: true },
      storeRequest: { view: true, create: true, edit: true, delete: true, approve: true },
      purchaseRequest: { view: true, create: true, edit: true, delete: true, approve: true },
      biayaOperasional: { view: true, create: true, edit: true, delete: true, approve: true },
      purchaseOrder: { view: true, create: true, edit: true, delete: true, approve: true },
      penerimaanBarang: { view: true, create: true, edit: true, delete: true },
      pengeluaranBarang: { view: true, create: true, edit: true, delete: true, approve: true },
    },
    pemasaran: {
      pengirimanProduct: { view: true, create: true, edit: true, delete: true },
      hargaTransportir: { view: true, create: true, edit: true, delete: true },
      riwayatPengiriman: { view: true, create: true, edit: true, delete: true },
      contract: { view: true, create: true, edit: true, delete: true },
      invoice: { view: true, create: true, edit: true, delete: true },
    },
    payroll: {
      penggajian: { view: true, create: true, edit: true, delete: true },
    },
    keuangan: {
      hutangSupplier: { view: true, create: true, edit: true, delete: true },
      upahBongkar: { view: true, create: true, edit: true, delete: true },
      pembayaranTransportir: { view: true, create: true, edit: true, delete: true },
      pembayaranPr: { view: true, create: true, edit: true, delete: true },
      pembayaranPo: { view: true, create: true, edit: true, delete: true },
      biayaPengeluaran: { view: true, create: true, edit: true, delete: true },
      piutangCustomer: { view: true, create: true, edit: true, delete: true },
      neraca: { view: true, create: true, edit: true, delete: true },
    },
    settings: {
      users: { view: true, create: true, edit: true, delete: true },
      roles: { view: true, create: true, edit: true, delete: true },
      companies: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
    },
  };
};

// Default permissions for User role (view only)
export const getUserPermissions = (): Permission => {
  return {
    masterData: {
      supplier: { view: true, create: false, edit: false, delete: false },
      buyer: { view: true, create: false, edit: false, delete: false },
      driver: { view: true, create: false, edit: false, delete: false },
      material: { view: true, create: false, edit: false, delete: false },
      vendor: { view: true, create: false, edit: false, delete: false },
      vendorMaterial: { view: true, create: false, edit: false, delete: false },
      karyawan: { view: true, create: false, edit: false, delete: false },
      vendorBongkar: { view: true, create: false, edit: false, delete: false },
    },
    supplyChain: {
      penerimaanTbs: { view: true, create: false, edit: false, delete: false },
      inputHargaTbs: { view: true, create: false, edit: false, delete: false },
      pembayaranSupplier: { view: true, create: false, edit: false, delete: false },
    },
    produksi: {
      dashboard: { view: true, create: false, edit: false, delete: false },
      prosesProduksi: { view: true, create: false, edit: false, delete: false },
      laporanHarian: { view: true, create: false, edit: false, delete: false },
    },
    gudang: {
      stockTbs: { view: true, create: false, edit: false, delete: false },
      stockProduct: { view: true, create: false, edit: false, delete: false },
      stockMovement: { view: true, create: false, edit: false, delete: false },
      stockAwal: { view: true, create: false, edit: false, delete: false },
      inventaris: { view: true, create: false, edit: false, delete: false },
      storeRequest: { view: true, create: false, edit: false, delete: false, approve: false },
      purchaseRequest: { view: true, create: false, edit: false, delete: false, approve: false },
      biayaOperasional: { view: true, create: false, edit: false, delete: false, approve: false },
      purchaseOrder: { view: true, create: false, edit: false, delete: false, approve: false },
      penerimaanBarang: { view: true, create: false, edit: false, delete: false },
      pengeluaranBarang: { view: true, create: false, edit: false, delete: false, approve: false },
    },
    pemasaran: {
      pengirimanProduct: { view: true, create: false, edit: false, delete: false },
      hargaTransportir: { view: true, create: false, edit: false, delete: false },
      riwayatPengiriman: { view: true, create: false, edit: false, delete: false },
      contract: { view: true, create: false, edit: false, delete: false },
      invoice: { view: true, create: false, edit: false, delete: false },
    },
    payroll: {
      penggajian: { view: true, create: false, edit: false, delete: false },
    },
    keuangan: {
      hutangSupplier: { view: true, create: false, edit: false, delete: false },
      upahBongkar: { view: true, create: false, edit: false, delete: false },
      pembayaranTransportir: { view: true, create: false, edit: false, delete: false },
      pembayaranPr: { view: true, create: false, edit: false, delete: false },
      pembayaranPo: { view: true, create: false, edit: false, delete: false },
      biayaPengeluaran: { view: true, create: false, edit: false, delete: false },
      piutangCustomer: { view: true, create: false, edit: false, delete: false },
      neraca: { view: true, create: false, edit: false, delete: false },
    },
    settings: {
      users: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
      companies: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
    },
  };
};
