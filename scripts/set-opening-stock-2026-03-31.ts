import { PrismaClient, type TipeMovement } from "@prisma/client";

const prisma = new PrismaClient();

const COMPANY_NAME = "PT Taro Rakaya Tasyra";
const OPENING_REFERENCE = "OPENING-STOCK-2026-03-31";
const OPENING_NOTE = "Saldo awal per 31 Maret 2026";
const OPENING_DATE = new Date("2026-03-31T23:59:59+07:00");
const OPERATOR = "system-opening-stock";

const TARGET_BALANCES = {
  TBS: 20000,
  CPO: 361347,
  KERNEL: 116685,
  CANGKANG: 99357,
  FIBER: 44378,
} as const;

const normalizeName = (value: string) => value.trim().toUpperCase();

const signedAmount = (tipeMovement: TipeMovement, jumlah: number) => {
  if (tipeMovement === "OUT") return -jumlah;
  return jumlah;
};

async function upsertOpeningMovement(companyId: string, materialId: string, targetBalance: number) {
  const priorMovements = await prisma.stockMovement.findMany({
    where: {
      companyId,
      materialId,
      referensi: {
        not: OPENING_REFERENCE,
      },
      tanggalTransaksi: {
        lte: OPENING_DATE,
      },
    },
    select: {
      tipeMovement: true,
      jumlah: true,
    },
  });

  const stockBeforeOpening = priorMovements.reduce(
    (sum, item) => sum + signedAmount(item.tipeMovement, item.jumlah),
    0
  );

  const delta = targetBalance - stockBeforeOpening;

  const existingOpeningMovements = await prisma.stockMovement.findMany({
    where: {
      companyId,
      materialId,
      referensi: OPENING_REFERENCE,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  if (existingOpeningMovements.length > 1) {
    throw new Error(`Duplicate opening movements found for material ${materialId}`);
  }

  if (delta === 0) {
    if (existingOpeningMovements[0]) {
      await prisma.stockMovement.delete({
        where: { id: existingOpeningMovements[0].id },
      });
    }
    return;
  }

  const tipeMovement: TipeMovement = delta > 0 ? "IN" : "OUT";
  const jumlah = Math.abs(delta);

  if (existingOpeningMovements[0]) {
    await prisma.stockMovement.update({
      where: { id: existingOpeningMovements[0].id },
      data: {
        tipeMovement,
        jumlah,
        referensi: OPENING_REFERENCE,
        keterangan: OPENING_NOTE,
        operator: OPERATOR,
        tanggalTransaksi: OPENING_DATE,
      },
    });
    return;
  }

  await prisma.stockMovement.create({
    data: {
      companyId,
      materialId,
      tipeMovement,
      jumlah,
      stockSebelum: 0,
      stockSesudah: 0,
      referensi: OPENING_REFERENCE,
      keterangan: OPENING_NOTE,
      operator: OPERATOR,
      tanggalTransaksi: OPENING_DATE,
    },
  });
}

async function recomputeMaterialLedger(companyId: string, materialId: string) {
  const movements = await prisma.stockMovement.findMany({
    where: { companyId, materialId },
    orderBy: [{ tanggalTransaksi: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      tipeMovement: true,
      jumlah: true,
    },
  });

  let runningStock = 0;

  for (const movement of movements) {
    const stockSebelum = runningStock;
    runningStock += signedAmount(movement.tipeMovement, movement.jumlah);

    await prisma.stockMovement.update({
      where: { id: movement.id },
      data: {
        stockSebelum,
        stockSesudah: runningStock,
      },
    });
  }

  if (movements.length === 0) {
    await prisma.stockMaterial.deleteMany({
      where: { companyId, materialId },
    });
    return 0;
  }

  await prisma.stockMaterial.upsert({
    where: {
      companyId_materialId: {
        companyId,
        materialId,
      },
    },
    create: {
      companyId,
      materialId,
      jumlah: runningStock,
    },
    update: {
      jumlah: runningStock,
    },
  });

  return runningStock;
}

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: COMPANY_NAME },
    select: { id: true, name: true },
  });

  if (!company) {
    throw new Error(`Company not found: ${COMPANY_NAME}`);
  }

  const materials = await prisma.material.findMany({
    where: { companyId: company.id },
    select: { id: true, name: true, code: true },
  });

  const materialMap = new Map(materials.map((item) => [normalizeName(item.name), item]));

  for (const [materialName, targetBalance] of Object.entries(TARGET_BALANCES)) {
    const material = materialMap.get(normalizeName(materialName));
    if (!material) {
      throw new Error(`Material not found: ${materialName}`);
    }

    await upsertOpeningMovement(company.id, material.id, targetBalance);
    const finalStock = await recomputeMaterialLedger(company.id, material.id);

    console.log(
      `${material.name} (${material.code}) => saldo akhir ${finalStock.toLocaleString("id-ID")}`
    );
  }

  console.log(`Opening stock ${OPENING_REFERENCE} applied for ${company.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
