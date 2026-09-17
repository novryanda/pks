import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Prisma, type PrismaClient } from "@prisma/client";

type MasterDivisiSeed = {
  id: string;
  nama: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MasterJabatanSeed = {
  id: string;
  nama: string;
  level: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  divisiId: string | null;
};

type MasterKaryawanSeed = {
  id: string;
  namaKaryawan: string;
  tktk: "TK" | "K0" | "K1" | "K2" | "K3" | null;
  gol: string | null;
  nomorRekening: string | null;
  noBpjsTk: string | null;
  noBpjsKesehatan: string | null;
  gajiPokok: Prisma.Decimal;
  tunjanganJabatan: Prisma.Decimal;
  tunjanganPerumahan: Prisma.Decimal;
  isActive: boolean;
  tanggalMulaiKerja: Date | null;
  createdAt: Date;
  updatedAt: Date;
  divisiId: string | null;
  jabatanId: string | null;
  tanggalKeluar: Date | null;
  potBpjsTkJht: Prisma.Decimal;
  potBpjsTkJn: Prisma.Decimal;
  potBpjsKesehatan: Prisma.Decimal;
};

const seedDirectory = path.dirname(fileURLToPath(import.meta.url));
const masterDivisiSeedPath = path.join(
  seedDirectory,
  "..",
  "seed-data",
  "master-divisi.tsv"
);
const masterJabatanSeedPath = path.join(
  seedDirectory,
  "..",
  "seed-data",
  "master-jabatan.tsv"
);
const masterKaryawanSeedPath = path.join(
  seedDirectory,
  "..",
  "seed-data",
  "master-karyawan.tsv"
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

function parseRequiredString(value: string, field: string, rowNumber: number) {
  if (value === "") {
    throw new Error(`Field ${field} kosong pada baris ${rowNumber}`);
  }

  return value;
}

function parseOptionalString(value: string) {
  return value === "" ? null : value;
}

function parseBooleanField(value: string, field: string, rowNumber: number) {
  if (value === "true") return true;
  if (value === "false") return false;

  throw new Error(`Nilai boolean ${field} tidak valid pada baris ${rowNumber}: ${value}`);
}

function parseDateField(value: string, field: string, rowNumber: number) {
  if (value === "") {
    throw new Error(`Nilai tanggal ${field} kosong pada baris ${rowNumber}`);
  }

  const parsed = new Date(value.replace(" ", "T"));

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Nilai tanggal ${field} tidak valid pada baris ${rowNumber}: ${value}`);
  }

  return parsed;
}

function parseOptionalDateField(value: string) {
  if (value === "") {
    return null;
  }

  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Nilai tanggal tidak valid: ${value}`);
  }

  return parsed;
}

function parseOptionalIntField(value: string, field: string, rowNumber: number) {
  if (value === "") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Nilai integer ${field} tidak valid pada baris ${rowNumber}: ${value}`);
  }

  return parsed;
}

function parseDecimalField(value: string, field: string, rowNumber: number) {
  if (value === "") {
    return new Prisma.Decimal(0);
  }

  try {
    return new Prisma.Decimal(value);
  } catch {
    throw new Error(`Nilai decimal ${field} tidak valid pada baris ${rowNumber}: ${value}`);
  }
}

function parseDivisiRow(line: string, rowNumber: number): MasterDivisiSeed {
  const values = parsePostgresTsvLine(line.replace(/\r$/, ""));

  if (values.length !== 5) {
    throw new Error(`Baris master divisi ${rowNumber} memiliki ${values.length} kolom, seharusnya 5`);
  }

  const [id, nama, isActive, createdAt, updatedAt] = values;

  return {
    id: parseRequiredString(id, "id", rowNumber),
    nama: parseRequiredString(nama, "nama", rowNumber),
    isActive: parseBooleanField(isActive, "isActive", rowNumber),
    createdAt: parseDateField(createdAt, "createdAt", rowNumber),
    updatedAt: parseDateField(updatedAt, "updatedAt", rowNumber),
  };
}

function parseJabatanRow(line: string, rowNumber: number): MasterJabatanSeed {
  const values = parsePostgresTsvLine(line.replace(/\r$/, ""));

  if (values.length !== 7) {
    throw new Error(`Baris master jabatan ${rowNumber} memiliki ${values.length} kolom, seharusnya 7`);
  }

  const [id, nama, level, isActive, createdAt, updatedAt, divisiId] = values;

  return {
    id: parseRequiredString(id, "id", rowNumber),
    nama: parseRequiredString(nama, "nama", rowNumber),
    level: parseOptionalIntField(level, "level", rowNumber),
    isActive: parseBooleanField(isActive, "isActive", rowNumber),
    createdAt: parseDateField(createdAt, "createdAt", rowNumber),
    updatedAt: parseDateField(updatedAt, "updatedAt", rowNumber),
    divisiId: parseOptionalString(divisiId),
  };
}

function parseKaryawanRow(line: string, rowNumber: number): MasterKaryawanSeed {
  const values = parsePostgresTsvLine(line.replace(/\r$/, ""));

  if (values.length !== 20) {
    throw new Error(`Baris master karyawan ${rowNumber} memiliki ${values.length} kolom, seharusnya 20`);
  }

  const [
    id,
    namaKaryawan,
    tktk,
    gol,
    nomorRekening,
    noBpjsTk,
    noBpjsKesehatan,
    gajiPokok,
    tunjanganJabatan,
    tunjanganPerumahan,
    isActive,
    tanggalMulaiKerja,
    createdAt,
    updatedAt,
    divisiId,
    jabatanId,
    tanggalKeluar,
    potBpjsTkJht,
    potBpjsTkJn,
    potBpjsKesehatan,
  ] = values;

  const parsedTktk = parseOptionalString(tktk) as MasterKaryawanSeed["tktk"];

  return {
    id: parseRequiredString(id, "id", rowNumber),
    namaKaryawan: parseRequiredString(namaKaryawan, "namaKaryawan", rowNumber),
    tktk: parsedTktk,
    gol: parseOptionalString(gol),
    nomorRekening: parseOptionalString(nomorRekening),
    noBpjsTk: parseOptionalString(noBpjsTk),
    noBpjsKesehatan: parseOptionalString(noBpjsKesehatan),
    gajiPokok: parseDecimalField(gajiPokok, "gajiPokok", rowNumber),
    tunjanganJabatan: parseDecimalField(
      tunjanganJabatan,
      "tunjanganJabatan",
      rowNumber
    ),
    tunjanganPerumahan: parseDecimalField(
      tunjanganPerumahan,
      "tunjanganPerumahan",
      rowNumber
    ),
    isActive: parseBooleanField(isActive, "isActive", rowNumber),
    tanggalMulaiKerja: parseOptionalDateField(tanggalMulaiKerja),
    createdAt: parseDateField(createdAt, "createdAt", rowNumber),
    updatedAt: parseDateField(updatedAt, "updatedAt", rowNumber),
    divisiId: parseOptionalString(divisiId),
    jabatanId: parseOptionalString(jabatanId),
    tanggalKeluar: parseOptionalDateField(tanggalKeluar),
    potBpjsTkJht: parseDecimalField(potBpjsTkJht, "potBpjsTkJht", rowNumber),
    potBpjsTkJn: parseDecimalField(potBpjsTkJn, "potBpjsTkJn", rowNumber),
    potBpjsKesehatan: parseDecimalField(
      potBpjsKesehatan,
      "potBpjsKesehatan",
      rowNumber
    ),
  };
}

async function loadMasterDivisiSeedData() {
  const raw = await readFile(masterDivisiSeedPath, "utf8");
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line, index) => parseDivisiRow(line, index + 1));
}

async function loadMasterJabatanSeedData() {
  const raw = await readFile(masterJabatanSeedPath, "utf8");
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line, index) => parseJabatanRow(line, index + 1));
}

async function loadMasterKaryawanSeedData() {
  const raw = await readFile(masterKaryawanSeedPath, "utf8");
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line, index) => parseKaryawanRow(line, index + 1));
}

export async function seedMasterHr(prisma: PrismaClient) {
  console.log("👷 Seeding master HR (divisi, jabatan, karyawan)...");

  const [divisiRows, jabatanRows, karyawanRows] = await Promise.all([
    loadMasterDivisiSeedData(),
    loadMasterJabatanSeedData(),
    loadMasterKaryawanSeedData(),
  ]);

  for (const divisi of divisiRows) {
    await prisma.masterDivisi.upsert({
      where: { id: divisi.id },
      update: {
        nama: divisi.nama,
        isActive: divisi.isActive,
        createdAt: divisi.createdAt,
        updatedAt: divisi.updatedAt,
      },
      create: {
        id: divisi.id,
        nama: divisi.nama,
        isActive: divisi.isActive,
        createdAt: divisi.createdAt,
        updatedAt: divisi.updatedAt,
      },
    });
  }

  for (const jabatan of jabatanRows) {
    await prisma.masterJabatan.upsert({
      where: { id: jabatan.id },
      update: {
        nama: jabatan.nama,
        level: jabatan.level,
        isActive: jabatan.isActive,
        createdAt: jabatan.createdAt,
        updatedAt: jabatan.updatedAt,
        divisiId: jabatan.divisiId,
      },
      create: {
        id: jabatan.id,
        nama: jabatan.nama,
        level: jabatan.level,
        isActive: jabatan.isActive,
        createdAt: jabatan.createdAt,
        updatedAt: jabatan.updatedAt,
        divisiId: jabatan.divisiId,
      },
    });
  }

  for (const karyawan of karyawanRows) {
    await prisma.masterKaryawan.upsert({
      where: { id: karyawan.id },
      update: {
        namaKaryawan: karyawan.namaKaryawan,
        divisiId: karyawan.divisiId,
        jabatanId: karyawan.jabatanId,
        gol: karyawan.gol,
        tktk: karyawan.tktk,
        nomorRekening: karyawan.nomorRekening,
        noBpjsTk: karyawan.noBpjsTk,
        noBpjsKesehatan: karyawan.noBpjsKesehatan,
        gajiPokok: karyawan.gajiPokok,
        tunjanganJabatan: karyawan.tunjanganJabatan,
        tunjanganPerumahan: karyawan.tunjanganPerumahan,
        potBpjsTkJht: karyawan.potBpjsTkJht,
        potBpjsTkJn: karyawan.potBpjsTkJn,
        potBpjsKesehatan: karyawan.potBpjsKesehatan,
        tanggalMulaiKerja: karyawan.tanggalMulaiKerja,
        tanggalKeluar: karyawan.tanggalKeluar,
        isActive: karyawan.isActive,
        createdAt: karyawan.createdAt,
        updatedAt: karyawan.updatedAt,
      },
      create: {
        id: karyawan.id,
        namaKaryawan: karyawan.namaKaryawan,
        divisiId: karyawan.divisiId,
        jabatanId: karyawan.jabatanId,
        gol: karyawan.gol,
        tktk: karyawan.tktk,
        nomorRekening: karyawan.nomorRekening,
        noBpjsTk: karyawan.noBpjsTk,
        noBpjsKesehatan: karyawan.noBpjsKesehatan,
        gajiPokok: karyawan.gajiPokok,
        tunjanganJabatan: karyawan.tunjanganJabatan,
        tunjanganPerumahan: karyawan.tunjanganPerumahan,
        potBpjsTkJht: karyawan.potBpjsTkJht,
        potBpjsTkJn: karyawan.potBpjsTkJn,
        potBpjsKesehatan: karyawan.potBpjsKesehatan,
        tanggalMulaiKerja: karyawan.tanggalMulaiKerja,
        tanggalKeluar: karyawan.tanggalKeluar,
        isActive: karyawan.isActive,
        createdAt: karyawan.createdAt,
        updatedAt: karyawan.updatedAt,
      },
    });
  }

  const [divisiCount, jabatanCount, karyawanCount] = await Promise.all([
    prisma.masterDivisi.count(),
    prisma.masterJabatan.count(),
    prisma.masterKaryawan.count(),
  ]);

  console.log(
    `✅ Master HR tersimpan: divisi ${divisiCount}, jabatan ${jabatanCount}, karyawan ${karyawanCount}`
  );
}
