import { PrismaClient, type TaxStatus } from "@prisma/client";

import {
  extractDefaultBankAccount,
  loadPksSupplierSeedData,
  type SupplierSeedRecord,
} from "./seed-lib/pt-pks-supplier-seed";

const prisma = new PrismaClient();

const DEFAULT_COMPANY_CODE =
  process.env.SEED_VENDOR_MATERIAL_COMPANY_CODE ?? "PT-PKS";
const DEFAULT_COMPANY_NAME =
  process.env.SEED_VENDOR_MATERIAL_COMPANY_NAME ?? "PT Taro Rakaya Tasyra";

function isMeaningfulText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim() !== "" && value.trim() !== "-";
}

function pickFirstMeaningful(
  ...values: Array<string | null | undefined>
): string | null {
  return values.find((value) => isMeaningfulText(value)) ?? null;
}

function buildVendorMaterialCode(supplierId: string) {
  return `VM-SUP-${supplierId.replace(/-/g, "").toUpperCase()}`;
}

function getVendorMaterialName(supplier: SupplierSeedRecord) {
  return pickFirstMeaningful(supplier.companyName, supplier.ownerName) ?? supplier.ownerName;
}

function getVendorMaterialPhone(supplier: SupplierSeedRecord) {
  return pickFirstMeaningful(supplier.personalPhone, supplier.companyPhone) ?? "-";
}

function getVendorMaterialAddress(supplier: SupplierSeedRecord) {
  return (
    pickFirstMeaningful(
      supplier.address,
      supplier.rampPeronAddress,
      supplier.companyName
    ) ?? "-"
  );
}

function getVendorMaterialCategory(supplier: SupplierSeedRecord) {
  switch (supplier.type) {
    case "KUD":
      return "Supplier TBS - KUD";
    case "KELOMPOK_TANI":
      return "Supplier TBS - Kelompok Tani";
    default:
      return "Supplier TBS - Ramp/Peron";
  }
}

function getVendorMaterialTaxStatus(supplier: SupplierSeedRecord): TaxStatus {
  return supplier.taxStatus ?? "NON_PKP";
}

async function resolveCompany() {
  return prisma.company.upsert({
    where: { code: DEFAULT_COMPANY_CODE },
    update: { name: DEFAULT_COMPANY_NAME },
    create: {
      code: DEFAULT_COMPANY_CODE,
      name: DEFAULT_COMPANY_NAME,
    },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });
}

async function main() {
  console.log("🌱 Starting vendor material seed from supplier data...");

  const company = await resolveCompany();
  const suppliers = await loadPksSupplierSeedData();

  console.log(
    `🏢 Company ready: ${company.code} (${company.name}), source suppliers: ${suppliers.length}`
  );

  for (const supplier of suppliers) {
    const bankAccount = extractDefaultBankAccount(supplier.bankAccounts);

    await prisma.vendorMaterial.upsert({
      where: {
        code: buildVendorMaterialCode(supplier.id),
      },
      update: {
        companyId: company.id,
        name: getVendorMaterialName(supplier),
        contactPerson: supplier.ownerName,
        email: null,
        phone: getVendorMaterialPhone(supplier),
        address: getVendorMaterialAddress(supplier),
        npwp: supplier.npwp,
        taxStatus: getVendorMaterialTaxStatus(supplier),
        bankName: pickFirstMeaningful(bankAccount?.bankName) ?? null,
        accountNumber: pickFirstMeaningful(bankAccount?.accountNumber) ?? null,
        accountName: pickFirstMeaningful(bankAccount?.accountName) ?? null,
        kategori: getVendorMaterialCategory(supplier),
        status: "ACTIVE",
      },
      create: {
        code: buildVendorMaterialCode(supplier.id),
        companyId: company.id,
        name: getVendorMaterialName(supplier),
        contactPerson: supplier.ownerName,
        email: null,
        phone: getVendorMaterialPhone(supplier),
        address: getVendorMaterialAddress(supplier),
        npwp: supplier.npwp,
        taxStatus: getVendorMaterialTaxStatus(supplier),
        bankName: pickFirstMeaningful(bankAccount?.bankName) ?? null,
        accountNumber: pickFirstMeaningful(bankAccount?.accountNumber) ?? null,
        accountName: pickFirstMeaningful(bankAccount?.accountName) ?? null,
        kategori: getVendorMaterialCategory(supplier),
        status: "ACTIVE",
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      },
    });
  }

  const seededCount = await prisma.vendorMaterial.count({
    where: {
      companyId: company.id,
      code: {
        startsWith: "VM-SUP-",
      },
    },
  });

  console.log(`✅ Vendor material hasil konversi supplier tersimpan: ${seededCount}`);
}

main()
  .catch((error) => {
    console.error("❌ Vendor material seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
