import { PrismaClient, TipeMovement, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply");
const TZ = "Asia/Jakarta";
const DAY_MS = 24 * 60 * 60 * 1000;

const TARGET = {
  companyName: "PT Taro Rakaya Tasyra",
  partNumber: "SOLAR-01",
  expectedReference: "GI/202605/0011",
  fromDate: "2026-05-12",
  toDate: "2026-05-07",
} as const;

const jakartaDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const jakartaDateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const getJakartaDate = (value: Date) => jakartaDateFormatter.format(value);
const formatJakartaDateTime = (value: Date) => jakartaDateTimeFormatter.format(value);

const getDayShift = (fromDate: string, toDate: string) => {
  const from = new Date(`${fromDate}T00:00:00Z`);
  const to = new Date(`${toDate}T00:00:00Z`);
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
};

const shiftDate = (value: Date, dayShift: number) =>
  new Date(value.getTime() + dayShift * DAY_MS);

async function recomputeInventoryLedger(
  tx: Prisma.TransactionClient,
  companyId: string,
  materialId: string
) {
  const transactions = await tx.inventoryTransaction.findMany({
    where: {
      companyId,
      materialId,
    },
    select: {
      id: true,
      tipeTransaksi: true,
      jumlahMasuk: true,
      jumlahKeluar: true,
      stockOnHand: true,
    },
    orderBy: [{ tanggalTransaksi: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });

  let runningStock = 0;

  for (const transaction of transactions) {
    if (transaction.tipeTransaksi === TipeMovement.IN) {
      runningStock += transaction.jumlahMasuk;
    } else if (transaction.tipeTransaksi === TipeMovement.OUT) {
      runningStock -= transaction.jumlahKeluar;
    } else {
      // Preserve explicit adjustment balance when encountered.
      runningStock = transaction.stockOnHand;
    }

    await tx.inventoryTransaction.update({
      where: { id: transaction.id },
      data: {
        stockOnHand: runningStock,
      },
    });
  }

  await tx.materialInventaris.update({
    where: { id: materialId },
    data: {
      stockOnHand: runningStock,
    },
  });
}

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: TARGET.companyName },
    select: { id: true, name: true },
  });

  if (!company) {
    throw new Error(`Company tidak ditemukan: ${TARGET.companyName}`);
  }

  const candidatePengeluaran = await prisma.pengeluaranBarang.findMany({
    where: {
      companyId: company.id,
      items: {
        some: {
          material: {
            partNumber: TARGET.partNumber,
          },
        },
      },
    },
    select: {
      id: true,
      companyId: true,
      nomorPengeluaran: true,
      tanggalPengeluaran: true,
      divisi: true,
      requestedBy: true,
      items: {
        select: {
          material: {
            select: {
              id: true,
              partNumber: true,
              namaMaterial: true,
            },
          },
          jumlahKeluar: true,
        },
      },
    },
    orderBy: [{ tanggalPengeluaran: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });

  const matches = candidatePengeluaran.filter((item) => {
    const sameReference = TARGET.expectedReference
      ? item.nomorPengeluaran === TARGET.expectedReference
      : true;
    const sameLocalDate = getJakartaDate(item.tanggalPengeluaran) === TARGET.fromDate;
    return sameReference && sameLocalDate;
  });

  if (matches.length !== 1) {
    console.log("Kandidat pengeluaran yang ditemukan:");
    for (const item of candidatePengeluaran) {
      const parts = item.items.map((entry) => entry.material.partNumber).join(", ");
      console.log(
        [
          `- ref=${item.nomorPengeluaran}`,
          `tanggal=${formatJakartaDateTime(item.tanggalPengeluaran)}`,
          `divisi=${item.divisi}`,
          `requestedBy=${item.requestedBy}`,
          `parts=[${parts}]`,
        ].join(" | ")
      );
    }

    throw new Error(
      `Expected tepat 1 record yang cocok untuk ${TARGET.partNumber} pada ${TARGET.fromDate}, tetapi ditemukan ${matches.length}.`
    );
  }

  const pengeluaran = matches[0];
  const dayShift = getDayShift(TARGET.fromDate, TARGET.toDate);
  const newPengeluaranDate = shiftDate(pengeluaran.tanggalPengeluaran, dayShift);

  if (getJakartaDate(newPengeluaranDate) !== TARGET.toDate) {
    throw new Error(
      `Perhitungan tanggal baru tidak sesuai target. Hasil: ${getJakartaDate(newPengeluaranDate)}, target: ${TARGET.toDate}`
    );
  }

  const relatedTransactions = await prisma.inventoryTransaction.findMany({
    where: {
      companyId: company.id,
      referensi: pengeluaran.nomorPengeluaran,
    },
    select: {
      id: true,
      materialId: true,
      tanggalTransaksi: true,
      tipeTransaksi: true,
      jumlahMasuk: true,
      jumlahKeluar: true,
      stockOnHand: true,
    },
    orderBy: [{ tanggalTransaksi: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });

  if (relatedTransactions.length === 0) {
    throw new Error(
      `InventoryTransaction tidak ditemukan untuk referensi ${pengeluaran.nomorPengeluaran}`
    );
  }

  const affectedMaterialIds = Array.from(
    new Set(relatedTransactions.map((transaction) => transaction.materialId))
  );

  console.log(`Company       : ${company.name}`);
  console.log(`Part Number   : ${TARGET.partNumber}`);
  console.log(`Reference     : ${pengeluaran.nomorPengeluaran}`);
  console.log(`Tanggal lama  : ${formatJakartaDateTime(pengeluaran.tanggalPengeluaran)}`);
  console.log(`Tanggal baru  : ${formatJakartaDateTime(newPengeluaranDate)}`);
  console.log(`Items         : ${pengeluaran.items.length}`);
  console.log(`Txn terkait   : ${relatedTransactions.length}`);
  console.log(`Mode          : ${APPLY ? "APPLY" : "DRY RUN"}`);

  if (!APPLY) {
    console.log("");
    console.log("Tidak ada data yang diubah. Jalankan ulang dengan --apply untuk eksekusi.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.pengeluaranBarang.update({
      where: {
        id: pengeluaran.id,
      },
      data: {
        tanggalPengeluaran: newPengeluaranDate,
      },
    });

    for (const transaction of relatedTransactions) {
      await tx.inventoryTransaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          tanggalTransaksi: shiftDate(transaction.tanggalTransaksi, dayShift),
        },
      });
    }

    for (const materialId of affectedMaterialIds) {
      await recomputeInventoryLedger(tx, company.id, materialId);
    }
  });

  const updatedPengeluaran = await prisma.pengeluaranBarang.findUnique({
    where: {
      id: pengeluaran.id,
    },
    select: {
      nomorPengeluaran: true,
      tanggalPengeluaran: true,
    },
  });

  console.log("");
  console.log("Perubahan berhasil diterapkan.");
  console.log(
    `Ref ${updatedPengeluaran?.nomorPengeluaran} sekarang bertanggal ${formatJakartaDateTime(
      updatedPengeluaran!.tanggalPengeluaran
    )}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
