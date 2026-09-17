import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  getAdminPermissions,
  getUserPermissions,
  type Permission,
} from "../src/server/schema/user";
import { seedMasterHr } from "./seed-lib/master-hr-seed";
import { seedPksMaterialMaster } from "./seed-lib/pt-pks-material-master";
import { loadPksSupplierSeedData, type SupplierSeedRecord } from "./seed-lib/pt-pks-supplier-seed";
import { seedPksUsers } from "./seed-lib/pt-pks-users-seed";

const prisma = new PrismaClient();

const DEFAULT_ADMIN_PASSWORD = "password123";
const SUPERADMIN_EMAIL =
  process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@htgroup.app";
const SUPERADMIN_PASSWORD =
  process.env.SEED_SUPERADMIN_PASSWORD ?? "Superadmin123!";
const SUPERADMIN_COMPANY_CODE =
  process.env.SEED_SUPERADMIN_COMPANY_CODE ?? "PT-PKS";

const companiesToSeed = [
  { code: "PT-PKS", name: "PT Taro Rakaya Tasyra" },
  { code: "PT-HTK", name: "PT Husni Thamrin" },
  { code: "PT-NILO", name: "PT Nilo Eng" },
  { code: "PT-ANGGUN", name: "PT Zakiyyah Talita Anggun" },
  { code: "PT-TAM", name: "PT Husni Tamrin" },
] as const;

const FULL_CRUD = ["view", "create", "edit", "delete"] as const;
const MANAGE = ["view", "create", "edit"] as const;
const VIEW_ONLY = ["view"] as const;
const APPROVER = ["view", "create", "edit", "approve"] as const;
const MANAGE_WITH_APPROVE = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
] as const;

type SeedCompany = {
  id: string;
  code: string;
  name: string;
};

type SeedRole = {
  id: string;
  name: string;
};

type RoleDefinition = {
  name: string;
  description: string;
  permissions: Permission;
};

type PermissionAction = "view" | "create" | "edit" | "delete" | "approve";
type ModulePath = `${keyof Permission}.${string}`;
type GrantDefinition = readonly [ModulePath, readonly PermissionAction[]];

function clonePermissions(value: Permission): Permission {
  return structuredClone(value);
}

function getEmptyPermissions(): Permission {
  return {
    masterData: {
      supplier: { view: false, create: false, edit: false, delete: false },
      buyer: { view: false, create: false, edit: false, delete: false },
      driver: { view: false, create: false, edit: false, delete: false },
      material: { view: false, create: false, edit: false, delete: false },
      vendor: { view: false, create: false, edit: false, delete: false },
      vendorMaterial: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      karyawan: { view: false, create: false, edit: false, delete: false },
      vendorBongkar: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
    },
    supplyChain: {
      penerimaanTbs: { view: false, create: false, edit: false, delete: false },
      inputHargaTbs: { view: false, create: false, edit: false, delete: false },
      pembayaranSupplier: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
    },
    produksi: {
      dashboard: { view: false, create: false, edit: false, delete: false },
      prosesProduksi: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      laporanHarian: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
    },
    gudang: {
      stockTbs: { view: false, create: false, edit: false, delete: false },
      stockProduct: { view: false, create: false, edit: false, delete: false },
      stockMovement: { view: false, create: false, edit: false, delete: false },
      inventaris: { view: false, create: false, edit: false, delete: false },
      storeRequest: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
      },
      purchaseRequest: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
      },
      purchaseOrder: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
      },
      penerimaanBarang: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      pengeluaranBarang: {
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
      },
    },
    pemasaran: {
      pengirimanProduct: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      riwayatPengiriman: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      contract: { view: false, create: false, edit: false, delete: false },
      invoice: { view: false, create: false, edit: false, delete: false },
    },
    payroll: {
      penggajian: { view: false, create: false, edit: false, delete: false },
    },
    keuangan: {
      hutangSupplier: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      upahBongkar: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      pembayaranPr: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      pembayaranPo: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      biayaPengeluaran: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      piutangCustomer: {
        view: false,
        create: false,
        edit: false,
        delete: false,
      },
      neraca: { view: false, create: false, edit: false, delete: false },
    },
    settings: {
      users: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
    },
  };
}

function grant(
  permissions: Permission,
  modulePath: ModulePath,
  actions: readonly PermissionAction[]
) {
  const [categoryKey, moduleKey] = modulePath.split(".") as [
    keyof Permission,
    string,
  ];

  const category = permissions[categoryKey] as Record<string, Record<string, boolean>>;
  const module = category[moduleKey];

  if (!module) {
    throw new Error(`Module permission tidak ditemukan: ${modulePath}`);
  }

  for (const action of actions) {
    if (action in module) {
      module[action] = true;
    }
  }
}

function createPermissionSet(grants: readonly GrantDefinition[]): Permission {
  const permissions = getEmptyPermissions();
  for (const [modulePath, actions] of grants) {
    grant(permissions, modulePath, actions);
  }
  return permissions;
}

function removeModulePermissions(
  permissions: Permission,
  modulePath: ModulePath
) {
  const [categoryKey, moduleKey] = modulePath.split(".") as [
    keyof Permission,
    string,
  ];
  const category = permissions[categoryKey] as Record<string, Record<string, boolean>>;
  const module = category[moduleKey];

  if (!module) {
    return;
  }

  for (const actionKey of Object.keys(module)) {
    module[actionKey] = false;
  }
}

function stripActionFromAllModules(
  permissions: Permission,
  action: PermissionAction
) {
  for (const category of Object.values(
    permissions as unknown as Record<string, Record<string, Record<string, boolean>>>
  )) {
    for (const module of Object.values(category)) {
      if (action in module) {
        module[action] = false;
      }
    }
  }
}

function buildManagerPermissions(): Permission {
  const permissions = clonePermissions(getAdminPermissions());
  removeModulePermissions(permissions, "settings.users");
  removeModulePermissions(permissions, "settings.roles");
  return permissions;
}

function buildLegacyStaffPermissions(): Permission {
  const permissions = buildManagerPermissions();
  stripActionFromAllModules(permissions, "delete");
  stripActionFromAllModules(permissions, "approve");
  return permissions;
}

function buildProcurementPermissions(): Permission {
  return createPermissionSet([
    ["masterData.supplier", MANAGE],
    ["masterData.driver", MANAGE],
    ["masterData.material", VIEW_ONLY],
    ["masterData.vendor", VIEW_ONLY],
    ["masterData.vendorMaterial", VIEW_ONLY],
    ["masterData.vendorBongkar", VIEW_ONLY],
    ["supplyChain.penerimaanTbs", MANAGE],
    ["supplyChain.inputHargaTbs", MANAGE],
    ["supplyChain.pembayaranSupplier", MANAGE],
    ["gudang.inventaris", VIEW_ONLY],
    ["gudang.purchaseRequest", APPROVER],
    ["gudang.purchaseOrder", APPROVER],
    ["gudang.penerimaanBarang", MANAGE],
  ]);
}

function buildProductionPermissions(isManager: boolean): Permission {
  const manageActions = isManager ? FULL_CRUD : MANAGE;

  return createPermissionSet([
    ["masterData.material", VIEW_ONLY],
    ["produksi.dashboard", VIEW_ONLY],
    ["produksi.prosesProduksi", manageActions],
    ["produksi.laporanHarian", manageActions],
    ["gudang.stockTbs", VIEW_ONLY],
    ["gudang.stockProduct", VIEW_ONLY],
    ["gudang.stockMovement", VIEW_ONLY],
  ]);
}

function buildWarehousePermissions(): Permission {
  return createPermissionSet([
    ["masterData.material", VIEW_ONLY],
    ["masterData.vendorMaterial", VIEW_ONLY],
    ["gudang.stockTbs", MANAGE],
    ["gudang.stockProduct", MANAGE],
    ["gudang.stockMovement", VIEW_ONLY],
    ["gudang.inventaris", MANAGE],
    ["gudang.storeRequest", MANAGE],
    ["gudang.purchaseRequest", MANAGE],
    ["gudang.purchaseOrder", MANAGE],
    ["gudang.penerimaanBarang", MANAGE],
    ["gudang.pengeluaranBarang", MANAGE],
  ]);
}

function buildMarketingPermissions(isManager: boolean): Permission {
  const manageActions = isManager ? FULL_CRUD : MANAGE;

  return createPermissionSet([
    ["masterData.buyer", VIEW_ONLY],
    ["masterData.material", VIEW_ONLY],
    ["pemasaran.contract", manageActions],
    ["pemasaran.pengirimanProduct", manageActions],
    ["pemasaran.riwayatPengiriman", VIEW_ONLY],
    ["pemasaran.invoice", manageActions],
    ["gudang.stockProduct", VIEW_ONLY],
    ["gudang.stockMovement", VIEW_ONLY],
  ]);
}

function buildHrPermissions(isManager: boolean): Permission {
  const manageActions = isManager ? FULL_CRUD : MANAGE;

  return createPermissionSet([
    ["masterData.karyawan", manageActions],
    ["payroll.penggajian", manageActions],
  ]);
}

function buildFinancePermissions(isManager: boolean): Permission {
  const financeActions = isManager ? FULL_CRUD : MANAGE;

  return createPermissionSet([
    ["keuangan.hutangSupplier", financeActions],
    ["keuangan.upahBongkar", financeActions],
    ["keuangan.pembayaranPr", financeActions],
    ["keuangan.pembayaranPo", financeActions],
    ["keuangan.biayaPengeluaran", financeActions],
    ["keuangan.piutangCustomer", financeActions],
    ["keuangan.neraca", VIEW_ONLY],
    ["pemasaran.invoice", VIEW_ONLY],
    ["supplyChain.penerimaanTbs", VIEW_ONLY],
    ["gudang.purchaseRequest", VIEW_ONLY],
    ["gudang.purchaseOrder", VIEW_ONLY],
  ]);
}

function getRoleDefinitions(companyCode: string): RoleDefinition[] {
  const definitions: RoleDefinition[] = [
    {
      name: "Admin",
      description: "Administrator dengan akses penuh",
      permissions: getAdminPermissions(),
    },
    {
      name: "Manager",
      description: "Manager umum dengan akses operasional penuh",
      permissions: buildManagerPermissions(),
    },
    {
      name: "User",
      description: "User standar dengan akses view-only",
      permissions: getUserPermissions(),
    },
  ];

  if (companyCode === SUPERADMIN_COMPANY_CODE) {
    definitions.unshift({
      name: "Super Admin",
      description: "Super administrator lintas company dengan akses penuh",
      permissions: getAdminPermissions(),
    });
  }

  if (companyCode === "PT-PKS") {
    definitions.push(
      {
        name: "Manager PT PKS",
        description: "Manager operasional umum PT PKS",
        permissions: buildManagerPermissions(),
      },
      {
        name: "Staff PT PKS",
        description: "Staff operasional umum PT PKS",
        permissions: buildLegacyStaffPermissions(),
      },
      {
        name: "Staff Procurement",
        description: "Staff procurement dan supply chain",
        permissions: buildProcurementPermissions(),
      },
      {
        name: "Manager Produksi",
        description: "Manager produksi",
        permissions: buildProductionPermissions(true),
      },
      {
        name: "Staff Produksi",
        description: "Staff produksi",
        permissions: buildProductionPermissions(false),
      },
      {
        name: "Staff Gudang",
        description: "Staff gudang dan inventaris",
        permissions: buildWarehousePermissions(),
      },
      {
        name: "Manager Marketing",
        description: "Manager pemasaran",
        permissions: buildMarketingPermissions(true),
      },
      {
        name: "Staff Marketing",
        description: "Staff pemasaran",
        permissions: buildMarketingPermissions(false),
      },
      {
        name: "Manager HR",
        description: "Manager HR dan payroll",
        permissions: buildHrPermissions(true),
      },
      {
        name: "Staff HR",
        description: "Staff HR dan payroll",
        permissions: buildHrPermissions(false),
      },
      {
        name: "Manager Keuangan",
        description: "Manager keuangan",
        permissions: buildFinancePermissions(true),
      },
      {
        name: "Staff Keuangan",
        description: "Staff keuangan",
        permissions: buildFinancePermissions(false),
      }
    );
  }

  return definitions;
}

async function upsertCompanies() {
  const companies = await Promise.all(
    companiesToSeed.map((company) =>
      prisma.company.upsert({
        where: { code: company.code },
        update: { name: company.name },
        create: company,
      })
    )
  );

  return Object.fromEntries(
    companies.map((company) => [company.code, company])
  ) as Record<(typeof companiesToSeed)[number]["code"], SeedCompany>;
}

async function createRolesForCompany(company: SeedCompany) {
  const roleDefinitions = getRoleDefinitions(company.code);
  const roleMap: Record<string, SeedRole> = {};

  console.log(`📝 Creating roles for ${company.name}...`);

  for (const definition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: {
        name_companyId: {
          name: definition.name,
          companyId: company.id,
        },
      },
      update: {
        description: definition.description,
        permissions: definition.permissions,
      },
      create: {
        name: definition.name,
        description: definition.description,
        companyId: company.id,
        permissions: definition.permissions,
      },
      select: { id: true, name: true },
    });

    roleMap[role.name] = role;
  }

  return roleMap;
}

async function seedPksSuppliers(company: SeedCompany) {
  const suppliers = await loadPksSupplierSeedData();

  console.log(`🚚 Seeding ${suppliers.length} supplier PT PKS...`);

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: {
        companyId: company.id,
        type: supplier.type,
        ownerName: supplier.ownerName,
        address: supplier.address,
        companyPhone: supplier.companyPhone,
        personalPhone: supplier.personalPhone,
        companyName: supplier.companyName,
        rampPeronAddress: supplier.rampPeronAddress,
        gardenProfiles: supplier.gardenProfiles,
        longitude: supplier.longitude,
        latitude: supplier.latitude,
        swadaya: supplier.swadaya,
        kelompok: supplier.kelompok,
        perusahaan: supplier.perusahaan,
        jenisBibit: supplier.jenisBibit,
        certificationISPO: supplier.certificationISPO,
        certificationRSPO: supplier.certificationRSPO,
        aktePendirian: supplier.aktePendirian,
        aktePerubahan: supplier.aktePerubahan,
        nib: supplier.nib,
        siup: supplier.siup,
        npwp: supplier.npwp,
        salesChannel: supplier.salesChannel,
        salesChannelDetails: supplier.salesChannelDetails,
        transportation: supplier.transportation,
        transportationUnits: supplier.transportationUnits,
        bankAccounts: supplier.bankAccounts,
        taxStatus: supplier.taxStatus,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      },
      create: {
        id: supplier.id,
        companyId: company.id,
        type: supplier.type,
        ownerName: supplier.ownerName,
        address: supplier.address,
        companyPhone: supplier.companyPhone,
        personalPhone: supplier.personalPhone,
        companyName: supplier.companyName,
        rampPeronAddress: supplier.rampPeronAddress,
        gardenProfiles: supplier.gardenProfiles,
        longitude: supplier.longitude,
        latitude: supplier.latitude,
        swadaya: supplier.swadaya,
        kelompok: supplier.kelompok,
        perusahaan: supplier.perusahaan,
        jenisBibit: supplier.jenisBibit,
        certificationISPO: supplier.certificationISPO,
        certificationRSPO: supplier.certificationRSPO,
        aktePendirian: supplier.aktePendirian,
        aktePerubahan: supplier.aktePerubahan,
        nib: supplier.nib,
        siup: supplier.siup,
        npwp: supplier.npwp,
        salesChannel: supplier.salesChannel,
        salesChannelDetails: supplier.salesChannelDetails,
        transportation: supplier.transportation,
        transportationUnits: supplier.transportationUnits,
        bankAccounts: supplier.bankAccounts,
        taxStatus: supplier.taxStatus,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      },
    });
  }

  const totalSuppliers = await prisma.supplier.count({
    where: { companyId: company.id },
  });

  console.log(`✅ Supplier PT PKS tersimpan: ${totalSuppliers}`);
}

async function upsertUser(params: {
  email: string;
  name: string;
  password: string;
  companyId: string;
  roleId: string;
}) {
  const hashedPassword = await bcrypt.hash(params.password, 12);

  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      password: hashedPassword,
      emailVerified: new Date(),
      companyId: params.companyId,
      roleId: params.roleId,
    },
    create: {
      email: params.email,
      name: params.name,
      password: hashedPassword,
      emailVerified: new Date(),
      companyId: params.companyId,
      roleId: params.roleId,
    },
  });
}

async function main() {
  console.log("🌱 Starting seed...");

  console.log("🏢 Creating companies...");
  const companies = await upsertCompanies();
  console.log("✅ Companies ready:", Object.keys(companies).join(", "));

  const roleMap: Record<string, Record<string, SeedRole>> = {};

  for (const company of Object.values(companies)) {
    roleMap[company.code] = await createRolesForCompany(company);
  }

  console.log("✅ Roles created for all companies");

  await seedPksSuppliers(companies["PT-PKS"]);
  await seedPksMaterialMaster(prisma, companies["PT-PKS"]);
  await seedMasterHr(prisma);
  await seedPksUsers(prisma);

  await upsertUser({
    email: "admin@pt-pks.com",
    name: "Admin PT Taro Rakaya Tasyra",
    password: DEFAULT_ADMIN_PASSWORD,
    companyId: companies["PT-PKS"].id,
    roleId: roleMap["PT-PKS"].Admin.id,
  });

  await upsertUser({
    email: "admin@pt-htk.com",
    name: "Admin PT HTK",
    password: DEFAULT_ADMIN_PASSWORD,
    companyId: companies["PT-HTK"].id,
    roleId: roleMap["PT-HTK"].Admin.id,
  });

  await upsertUser({
    email: "admin@pt-nilo.com",
    name: "Admin PT NILO",
    password: DEFAULT_ADMIN_PASSWORD,
    companyId: companies["PT-NILO"].id,
    roleId: roleMap["PT-NILO"].Admin.id,
  });

  await upsertUser({
    email: "admin@pt-anggun.com",
    name: "Admin PT ANGGUN",
    password: DEFAULT_ADMIN_PASSWORD,
    companyId: companies["PT-ANGGUN"].id,
    roleId: roleMap["PT-ANGGUN"].Admin.id,
  });

  await upsertUser({
    email: "admin@pt-tam.com",
    name: "Admin PT TAM",
    password: DEFAULT_ADMIN_PASSWORD,
    companyId: companies["PT-TAM"].id,
    roleId: roleMap["PT-TAM"].Admin.id,
  });

  const superadminCompany = companies[SUPERADMIN_COMPANY_CODE];
  if (!superadminCompany) {
    throw new Error(
      `Company ${SUPERADMIN_COMPANY_CODE} tidak ditemukan untuk seed superadmin`
    );
  }

  const superadminRole = roleMap[SUPERADMIN_COMPANY_CODE]["Super Admin"];
  if (!superadminRole) {
    throw new Error(
      `Role Super Admin belum dibuat untuk company ${SUPERADMIN_COMPANY_CODE}`
    );
  }

  await upsertUser({
    email: SUPERADMIN_EMAIL,
    name: "Super Admin HT Group",
    password: SUPERADMIN_PASSWORD,
    companyId: superadminCompany.id,
    roleId: superadminRole.id,
  });

  console.log("🎉 Seed completed successfully!");
  console.log(`📝 Default admin password: ${DEFAULT_ADMIN_PASSWORD}`);
  console.log(
    `📝 Superadmin: ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD} (role Super Admin, company ${SUPERADMIN_COMPANY_CODE})`
  );
  console.log(
    `📝 PT PKS roles: ${Object.keys(roleMap["PT-PKS"]).join(", ")}`
  );
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
