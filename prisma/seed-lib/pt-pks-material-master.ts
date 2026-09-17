import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { PrismaClient } from "@prisma/client";

type SeedCompany = {
  id: string;
  code: string;
  name: string;
};

type KategoriMaterialSeed = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type SatuanMaterialSeed = {
  id: string;
  name: string;
  symbol: string;
  createdAt: Date;
  updatedAt: Date;
};

type MaterialSeed = {
  id: string;
  kategoriName: string;
  satuanName: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  hargaPerUnit: number;
};

type MaterialInventarisSeed = {
  id?: string;
  kategoriName: string;
  satuanName: string;
  partNumber: string;
  namaMaterial: string;
  lokasiDigunakan: string | null;
  spesifikasi: string | null;
  hargaSatuan: number;
  minStock: number;
  maxStock: number;
  stockOnHand: number;
  createdAt: Date;
  updatedAt: Date;
};

const seedDirectory = path.dirname(fileURLToPath(import.meta.url));
const materialInventarisSqlPath = path.join(
  seedDirectory,
  "..",
  "seed-material-inventaris.sql"
);

const defaultTimestamp = new Date("2026-01-15T10:30:57.836");

const kategoriMaterialSeeds: KategoriMaterialSeed[] = [
  {
    id: "0255e161-a62c-4df8-8b1d-a536f68762d0",
    name: "Consumable",
    description: "Bahan habis pakai",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "0d4018fb-f274-4a1f-8af7-97877b1e6fa6",
    name: "Sparepart Tee",
    description: "Tee dan sambungan pipa T",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "1b0f96fe-214b-4e30-ad93-16f0385caad4",
    name: "Chemical",
    description: "Bahan kimia",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "23186e43-f1a3-46e7-8df0-1bd710fbbaef",
    name: "Alat Laboratorium",
    description: "Peralatan lab",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "4cc06418-db0f-4f61-a900-2bd31406fef6",
    name: "Hasil Produk",
    description: "Hasil produksi PKS",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "57728840-811d-4e0f-88a6-9ca05d603da1",
    name: "Sparepart Bearing",
    description: "Bearing dan komponen terkait",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "6fd1ed74-a6f9-4c8b-a43c-809b929f0764",
    name: "Sparepart",
    description: "Sparepart umum",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "8d274722-cf4d-4997-96cb-f2997c0308fb",
    name: "Bahan Baku",
    description: "Bahan baku produksi",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "9e57fd85-7b87-4754-9f36-e3d3ad0fea9d",
    name: "Sparepart Valve",
    description: "Valve dan komponen terkait",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "ab0c3835-4d01-4c75-810d-3c6f8df101b8",
    name: "Fuel",
    description: "Bahan bakar",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "cf01146a-a122-42a0-aeb4-36cfa8aa9f88",
    name: "Electrikal",
    description: "Komponen elektrikal",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "cmkf7ftjb001zuoz8dklrwszl",
    name: "Raw Material",
    description: null,
    createdAt: new Date("2026-01-15T08:45:44.900"),
    updatedAt: new Date("2026-01-15T08:45:44.900"),
  },
  {
    id: "cmkklskks0001uo3o8ppsbqxd",
    name: "Production",
    description: null,
    createdAt: new Date("2026-01-19T03:26:25.320"),
    updatedAt: new Date("2026-01-19T03:26:25.320"),
  },
  {
    id: "d9a0422c-dc7b-4750-a9dd-061136d333f0",
    name: "Sparepart Elbo",
    description: "Elbow dan sambungan pipa",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "f64afa56-27e9-4ea2-b02a-4126850f06fd",
    name: "Cat",
    description: "Cat dan thinner",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
  {
    id: "fb613c42-863d-4145-b895-5e19e4784dd0",
    name: "Lubrican",
    description: "Pelumas dan grease",
    createdAt: new Date("2026-01-15T10:30:57.836"),
    updatedAt: new Date("2026-01-15T10:30:57.836"),
  },
];

// Catatan: dump satuan yang dikirim user identik dengan kategori, jadi di sini
// dipakai master satuan yang konsisten dengan schema dan relasi material/inventaris.
const satuanMaterialSeeds: SatuanMaterialSeed[] = [
  {
    id: "c17b413a-b660-4ba2-8e53-cc3693f34638",
    name: "Pcs",
    symbol: "pcs",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "f2032136-2ac8-4891-9d93-79aedb7a01c7",
    name: "Kg",
    symbol: "kg",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "d6c0867b-6d06-4ce7-88b1-e60c852d906d",
    name: "Liter",
    symbol: "L",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "693d0f19-1dec-4f78-b7dd-c1b1c72b69ae",
    name: "Meter",
    symbol: "m",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "8f621a71-1929-412a-b0d5-023d3e0776df",
    name: "Roll",
    symbol: "roll",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "b232302c-3616-47c3-9b2c-b60747e5f024",
    name: "Set",
    symbol: "set",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "c585d206-ae19-48b0-bd0d-3f1378b45c99",
    name: "Unit",
    symbol: "unit",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "0b57f9dc-c34a-4484-9188-cec8ba17df62",
    name: "Botol",
    symbol: "btl",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "3857b89e-b9bb-40e7-8ffa-80596249fe67",
    name: "Kaleng",
    symbol: "kaleng",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "f8e94370-23ba-4493-b3d0-e52edabf053f",
    name: "Buah",
    symbol: "buah",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "87c28a9d-a620-4257-957d-16de16b086b2",
    name: "Batang",
    symbol: "btg",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "44044620-56a0-4454-899c-dd42ec6922d9",
    name: "Pasang",
    symbol: "psg",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
  {
    id: "5ed2f3e3-9c86-4aed-9bec-5f282cac43c8",
    name: "Pail",
    symbol: "pail",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
];

const materialSeeds: MaterialSeed[] = [
  {
    id: "cmkf7g1sd0021uoz83anjj0eu",
    name: "TBS",
    code: "TBS-01",
    kategoriName: "Raw Material",
    satuanName: "Kg",
    description: null,
    createdAt: new Date("2026-01-15T08:45:55.597"),
    updatedAt: new Date("2026-01-15T08:45:55.597"),
    hargaPerUnit: 0,
  },
  {
    id: "cmkkltemj0003uo3o84zcu8js",
    name: "CPO",
    code: "01",
    kategoriName: "Production",
    satuanName: "Kg",
    description: null,
    createdAt: new Date("2026-01-19T03:27:04.254"),
    updatedAt: new Date("2026-02-06T08:21:47.332"),
    hargaPerUnit: 15000,
  },
  {
    id: "cmkklu4qk0005uo3oh576s89x",
    name: "Cangkang",
    code: "03",
    kategoriName: "Production",
    satuanName: "Kg",
    description: null,
    createdAt: new Date("2026-01-19T03:27:38.108"),
    updatedAt: new Date("2026-02-05T07:28:11.516"),
    hargaPerUnit: 5000,
  },
  {
    id: "cmknuuoe00013uowo1j92np0o",
    name: "Kernel",
    code: "02",
    kategoriName: "Production",
    satuanName: "Kg",
    description: null,
    createdAt: new Date("2026-01-21T10:03:18.643"),
    updatedAt: new Date("2026-02-05T07:08:10.790"),
    hargaPerUnit: 15000,
  },
  {
    id: "cmknuv5r40015uowoohbh0z7d",
    name: "FIBER",
    code: "04",
    kategoriName: "Production",
    satuanName: "Kg",
    description: null,
    createdAt: new Date("2026-01-21T10:03:41.152"),
    updatedAt: new Date("2026-02-05T07:40:14.444"),
    hargaPerUnit: 15000,
  },
];

const extraMaterialInventarisSeeds: MaterialInventarisSeed[] = [
  {
    id: "cmkey33r5000buoqg3iszv6hg",
    partNumber: "KL001",
    namaMaterial: "KAWAT LAS",
    kategoriName: "Consumable",
    satuanName: "Kg",
    lokasiDigunakan: "WORKSHOP",
    spesifikasi: "7016 3,2",
    hargaSatuan: 23000,
    minStock: 10,
    maxStock: 50,
    stockOnHand: 5,
    createdAt: new Date("2026-01-15T04:23:55.069"),
    updatedAt: new Date("2026-01-15T07:36:43.347"),
  },
  {
    id: "cmn5qmu4i000bqn015j1kavsp",
    partNumber: "SOLAR-01",
    namaMaterial: "MINYAK SOLAR",
    kategoriName: "Fuel",
    satuanName: "Liter",
    lokasiDigunakan: "GENSET,MOBIL,DAN ALL ALAT BERAT",
    spesifikasi: null,
    hargaSatuan: 0,
    minStock: 2000,
    maxStock: 10000,
    stockOnHand: 4920,
    createdAt: new Date("2026-03-25T07:44:30.210"),
    updatedAt: new Date("2026-03-25T07:56:53.092"),
  },
];

const materialInventarisOverrides = new Map<
  string,
  Partial<MaterialInventarisSeed>
>([
  [
    "MAT-055",
    {
      hargaSatuan: 5000,
      maxStock: 20,
      updatedAt: new Date("2026-01-15T08:37:18.245"),
    },
  ],
]);

const obsoleteSatuanNames = ["Bungkus"];

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseInventoryRowsFromSql(sql: string): MaterialInventarisSeed[] {
  const matches = [
    ...sql.matchAll(
      /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([0-9.]+),\s*([0-9.]+)\)/g
    ),
  ];

  return matches.map((match) => {
    const [partNumber, namaMaterial, kategoriName, satuanName, minStock, stockOnHand] =
      match.slice(1);

    const baseRow: MaterialInventarisSeed = {
      partNumber,
      namaMaterial: normalizeText(namaMaterial),
      kategoriName: normalizeText(kategoriName),
      satuanName: normalizeText(satuanName),
      lokasiDigunakan: null,
      spesifikasi: null,
      hargaSatuan: 0,
      minStock: Number(minStock),
      maxStock: 0,
      stockOnHand: Number(stockOnHand),
      createdAt: new Date("2026-01-15T10:56:50.335"),
      updatedAt: new Date("2026-01-15T10:56:50.335"),
    };

    return {
      ...baseRow,
      ...materialInventarisOverrides.get(partNumber),
    };
  });
}

async function loadMaterialInventarisSeeds() {
  const sql = await readFile(materialInventarisSqlPath, "utf8");
  return [...parseInventoryRowsFromSql(sql), ...extraMaterialInventarisSeeds];
}

export async function seedPksMaterialMaster(
  prisma: PrismaClient,
  company: SeedCompany
) {
  console.log(`📦 Seeding master material PT PKS untuk ${company.code}...`);

  for (const kategori of kategoriMaterialSeeds) {
    await prisma.kategoriMaterial.upsert({
      where: {
        name_companyId: {
          name: kategori.name,
          companyId: company.id,
        },
      },
      update: {
        description: kategori.description,
        updatedAt: kategori.updatedAt,
      },
      create: {
        companyId: company.id,
        name: kategori.name,
        description: kategori.description,
        createdAt: kategori.createdAt,
        updatedAt: kategori.updatedAt,
      },
    });
  }

  for (const satuan of satuanMaterialSeeds) {
    await prisma.satuanMaterial.upsert({
      where: {
        name_companyId: {
          name: satuan.name,
          companyId: company.id,
        },
      },
      update: {
        symbol: satuan.symbol,
        updatedAt: satuan.updatedAt,
      },
      create: {
        companyId: company.id,
        name: satuan.name,
        symbol: satuan.symbol,
        createdAt: satuan.createdAt,
        updatedAt: satuan.updatedAt,
      },
    });
  }

  for (const obsoleteName of obsoleteSatuanNames) {
    const obsolete = await prisma.satuanMaterial.findFirst({
      where: {
        companyId: company.id,
        name: obsoleteName,
      },
      select: { id: true },
    });

    if (!obsolete) {
      continue;
    }

    const [materialUsage, inventarisUsage] = await Promise.all([
      prisma.material.count({
        where: {
          companyId: company.id,
          satuanId: obsolete.id,
        },
      }),
      prisma.materialInventaris.count({
        where: {
          companyId: company.id,
          satuanMaterialId: obsolete.id,
        },
      }),
    ]);

    if (materialUsage === 0 && inventarisUsage === 0) {
      await prisma.satuanMaterial.delete({
        where: { id: obsolete.id },
      });
    }
  }

  const [kategoriRows, satuanRows] = await Promise.all([
    prisma.kategoriMaterial.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true },
    }),
    prisma.satuanMaterial.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true },
    }),
  ]);

  const kategoriMap = new Map(kategoriRows.map((row) => [row.name, row.id]));
  const satuanMap = new Map(satuanRows.map((row) => [row.name, row.id]));

  for (const material of materialSeeds) {
    const kategoriId = kategoriMap.get(material.kategoriName);
    const satuanId = satuanMap.get(material.satuanName);

    if (!kategoriId || !satuanId) {
      throw new Error(
        `Kategori atau satuan tidak ditemukan untuk material ${material.code}`
      );
    }

    await prisma.material.upsert({
      where: { code: material.code },
      update: {
        companyId: company.id,
        kategoriId,
        satuanId,
        name: material.name,
        description: material.description,
        hargaPerUnit: material.hargaPerUnit,
        updatedAt: material.updatedAt,
      },
      create: {
        id: material.id,
        companyId: company.id,
        kategoriId,
        satuanId,
        name: material.name,
        code: material.code,
        description: material.description,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt,
        hargaPerUnit: material.hargaPerUnit,
      },
    });
  }

  const inventarisSeeds = await loadMaterialInventarisSeeds();

  for (const inventaris of inventarisSeeds) {
    const kategoriMaterialId = kategoriMap.get(inventaris.kategoriName);
    const satuanMaterialId = satuanMap.get(inventaris.satuanName);

    if (!kategoriMaterialId || !satuanMaterialId) {
      throw new Error(
        `Kategori atau satuan tidak ditemukan untuk inventaris ${inventaris.partNumber}`
      );
    }

    await prisma.materialInventaris.upsert({
      where: {
        partNumber_companyId: {
          partNumber: inventaris.partNumber,
          companyId: company.id,
        },
      },
      update: {
        namaMaterial: inventaris.namaMaterial,
        kategoriMaterialId,
        satuanMaterialId,
        lokasiDigunakan: inventaris.lokasiDigunakan,
        spesifikasi: inventaris.spesifikasi,
        hargaSatuan: inventaris.hargaSatuan,
        minStock: inventaris.minStock,
        maxStock: inventaris.maxStock,
        stockOnHand: inventaris.stockOnHand,
        updatedAt: inventaris.updatedAt,
      },
      create: {
        ...(inventaris.id ? { id: inventaris.id } : {}),
        companyId: company.id,
        partNumber: inventaris.partNumber,
        namaMaterial: inventaris.namaMaterial,
        kategoriMaterialId,
        satuanMaterialId,
        lokasiDigunakan: inventaris.lokasiDigunakan,
        spesifikasi: inventaris.spesifikasi,
        hargaSatuan: inventaris.hargaSatuan,
        minStock: inventaris.minStock,
        maxStock: inventaris.maxStock,
        stockOnHand: inventaris.stockOnHand,
        createdAt: inventaris.createdAt,
        updatedAt: inventaris.updatedAt,
      },
    });
  }

  const [kategoriCount, satuanCount, materialCount, inventarisCount] =
    await Promise.all([
      prisma.kategoriMaterial.count({ where: { companyId: company.id } }),
      prisma.satuanMaterial.count({ where: { companyId: company.id } }),
      prisma.material.count({ where: { companyId: company.id } }),
      prisma.materialInventaris.count({ where: { companyId: company.id } }),
    ]);

  console.log(
    `✅ Master material PT PKS: kategori ${kategoriCount}, satuan ${satuanCount}, material ${materialCount}, inventaris ${inventarisCount}`
  );
}
