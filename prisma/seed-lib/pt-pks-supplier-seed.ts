import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Prisma } from "@prisma/client";

export type SupplierSeedRecord = {
  id: string;
  type: "RAMP_PERON" | "KUD" | "KELOMPOK_TANI";
  ownerName: string;
  address: string;
  companyPhone: string | null;
  personalPhone: string;
  companyName: string | null;
  rampPeronAddress: string | null;
  gardenProfiles: Prisma.InputJsonValue;
  longitude: number;
  latitude: number;
  swadaya: boolean;
  kelompok: boolean;
  perusahaan: boolean;
  jenisBibit: string | null;
  aktePendirian: string | null;
  aktePerubahan: string | null;
  nib: string | null;
  siup: string | null;
  npwp: string | null;
  salesChannel: "LANGSUNG_PKS" | "AGEN" | null;
  transportation: "MILIK_SENDIRI" | "JASA_PIHAK_KE_3" | null;
  taxStatus: "NON_PKP" | "PKP_11" | "PKP_1_1" | null;
  createdAt: Date;
  updatedAt: Date;
  certificationISPO: boolean;
  certificationRSPO: boolean;
  salesChannelDetails: string | null;
  transportationUnits: number | null;
  bankAccounts: Prisma.InputJsonValue | null;
};

type SupplierBankAccount = {
  bankName?: string | null;
  isDefault?: boolean | null;
  accountName?: string | null;
  accountNumber?: string | null;
};

const EXPECTED_SUPPLIER_TSV_COLUMNS = 31;
const seedDirectory = path.dirname(fileURLToPath(import.meta.url));
const ptPksSupplierSeedPath = path.join(
  seedDirectory,
  "..",
  "seed-data",
  "pt-pks-suppliers.tsv"
);

function parsePostgresTsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "\t" && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

function parseOptionalString(value: string): string | null {
  return value === "" ? null : value;
}

function parseRequiredString(value: string, field: string, rowNumber: number): string {
  if (value === "") {
    throw new Error(`Field ${field} kosong pada baris supplier ${rowNumber}`);
  }

  return value;
}

function parseBooleanField(value: string, field: string, rowNumber: number): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Nilai boolean ${field} tidak valid pada baris supplier ${rowNumber}: ${value}`);
}

function parseFloatField(value: string, field: string, rowNumber: number): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Nilai angka ${field} tidak valid pada baris supplier ${rowNumber}: ${value}`);
  }

  return parsed;
}

function parseIntField(value: string, field: string, rowNumber: number): number | null {
  if (value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Nilai integer ${field} tidak valid pada baris supplier ${rowNumber}: ${value}`);
  }

  return parsed;
}

function parseDateField(value: string, field: string, rowNumber: number): Date {
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Nilai tanggal ${field} tidak valid pada baris supplier ${rowNumber}: ${value}`);
  }

  return parsed;
}

function parseJsonField(
  value: string,
  field: string,
  rowNumber: number
): Prisma.InputJsonValue | null {
  if (value === "") {
    return null;
  }

  try {
    return JSON.parse(value) as Prisma.InputJsonValue;
  } catch (error) {
    throw new Error(
      `Nilai JSON ${field} tidak valid pada baris supplier ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function mapSupplierRow(line: string, rowNumber: number): SupplierSeedRecord {
  const values = parsePostgresTsvLine(line.replace(/\r$/, ""));

  if (values.length !== EXPECTED_SUPPLIER_TSV_COLUMNS) {
    throw new Error(
      `Baris supplier ${rowNumber} memiliki ${values.length} kolom, seharusnya ${EXPECTED_SUPPLIER_TSV_COLUMNS}`
    );
  }

  const [
    id,
    _companyId,
    type,
    ownerName,
    address,
    companyPhone,
    personalPhone,
    companyName,
    rampPeronAddress,
    gardenProfiles,
    longitude,
    latitude,
    swadaya,
    kelompok,
    perusahaan,
    jenisBibit,
    aktePendirian,
    aktePerubahan,
    nib,
    siup,
    npwp,
    salesChannel,
    transportation,
    taxStatus,
    createdAt,
    updatedAt,
    certificationISPO,
    certificationRSPO,
    salesChannelDetails,
    transportationUnits,
    bankAccounts,
  ] = values;

  return {
    id: parseRequiredString(id, "id", rowNumber),
    type: parseRequiredString(type, "type", rowNumber) as SupplierSeedRecord["type"],
    ownerName: parseRequiredString(ownerName, "ownerName", rowNumber),
    address: parseRequiredString(address, "address", rowNumber),
    companyPhone: parseOptionalString(companyPhone),
    personalPhone: parseRequiredString(personalPhone, "personalPhone", rowNumber),
    companyName: parseOptionalString(companyName),
    rampPeronAddress: parseOptionalString(rampPeronAddress),
    gardenProfiles:
      parseJsonField(gardenProfiles, "gardenProfiles", rowNumber) ?? [],
    longitude: parseFloatField(longitude, "longitude", rowNumber),
    latitude: parseFloatField(latitude, "latitude", rowNumber),
    swadaya: parseBooleanField(swadaya, "swadaya", rowNumber),
    kelompok: parseBooleanField(kelompok, "kelompok", rowNumber),
    perusahaan: parseBooleanField(perusahaan, "perusahaan", rowNumber),
    jenisBibit: parseOptionalString(jenisBibit),
    aktePendirian: parseOptionalString(aktePendirian),
    aktePerubahan: parseOptionalString(aktePerubahan),
    nib: parseOptionalString(nib),
    siup: parseOptionalString(siup),
    npwp: parseOptionalString(npwp),
    salesChannel: parseOptionalString(salesChannel) as SupplierSeedRecord["salesChannel"],
    transportation:
      parseOptionalString(transportation) as SupplierSeedRecord["transportation"],
    taxStatus: parseOptionalString(taxStatus) as SupplierSeedRecord["taxStatus"],
    createdAt: parseDateField(createdAt, "createdAt", rowNumber),
    updatedAt: parseDateField(updatedAt, "updatedAt", rowNumber),
    certificationISPO: parseBooleanField(
      certificationISPO,
      "certificationISPO",
      rowNumber
    ),
    certificationRSPO: parseBooleanField(
      certificationRSPO,
      "certificationRSPO",
      rowNumber
    ),
    salesChannelDetails: parseOptionalString(salesChannelDetails),
    transportationUnits: parseIntField(
      transportationUnits,
      "transportationUnits",
      rowNumber
    ),
    bankAccounts: parseJsonField(bankAccounts, "bankAccounts", rowNumber),
  };
}

export async function loadPksSupplierSeedData(): Promise<SupplierSeedRecord[]> {
  const rawFile = await readFile(ptPksSupplierSeedPath, "utf8");

  return rawFile
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line, index) => mapSupplierRow(line, index + 1));
}

export function extractDefaultBankAccount(bankAccounts: Prisma.InputJsonValue | null) {
  if (!Array.isArray(bankAccounts)) {
    return null;
  }

  const accounts = bankAccounts.filter(
    (entry): entry is SupplierBankAccount =>
      typeof entry === "object" && entry !== null && !Array.isArray(entry)
  );

  if (accounts.length === 0) {
    return null;
  }

  return accounts.find((account) => account.isDefault) ?? accounts[0];
}
