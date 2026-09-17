import { Prisma } from "@prisma/client";

type DbClient = Prisma.TransactionClient;

export const STOCK_LEDGER_TRANSACTION_OPTIONS = {
  maxWait: 15_000,
  timeout: 120_000,
} as const;

export const recomputeMaterialLedger = async (
  tx: DbClient,
  companyId: string,
  materialId: string,
) => {
  const ledgerRows = await tx.$queryRaw<
    Array<{
      movementCount: number;
      runningStock: number;
    }>
  >(Prisma.sql`
    WITH movement_delta AS (
      SELECT
        "id",
        "tanggalTransaksi",
        "createdAt",
        CASE
          WHEN "tipeMovement" = 'OUT' THEN -"jumlah"
          WHEN "tipeMovement" = 'ADJUSTMENT' THEN "stockSesudah" - "stockSebelum"
          ELSE "jumlah"
        END AS delta
      FROM "StockMovement"
      WHERE "companyId" = ${companyId}
        AND "materialId" = ${materialId}
    ),
    running_ledger AS (
      SELECT
        "id",
        "tanggalTransaksi",
        "createdAt",
        delta,
        SUM(delta) OVER (
          ORDER BY "tanggalTransaksi" ASC, "createdAt" ASC, "id" ASC
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS "stockSesudah"
      FROM movement_delta
    ),
    updated_movements AS (
      UPDATE "StockMovement" AS movement
      SET
        "stockSebelum" = running_ledger."stockSesudah" - running_ledger.delta,
        "stockSesudah" = running_ledger."stockSesudah"
      FROM running_ledger
      WHERE movement."id" = running_ledger."id"
      RETURNING movement."id"
    )
    SELECT
      COUNT(*)::int AS "movementCount",
      COALESCE(
        (
          SELECT "stockSesudah"
          FROM running_ledger
          ORDER BY "tanggalTransaksi" DESC, "createdAt" DESC, "id" DESC
          LIMIT 1
        ),
        0
      )::double precision AS "runningStock"
    FROM updated_movements
  `);

  const movementCount = ledgerRows[0]?.movementCount ?? 0;
  const runningStock = ledgerRows[0]?.runningStock ?? 0;

  if (movementCount === 0) {
    await tx.stockMaterial.deleteMany({
      where: {
        companyId,
        materialId,
      },
    });
    return;
  }

  await tx.stockMaterial.upsert({
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
};

export const recomputeMaterialLedgers = async (
  tx: DbClient,
  companyId: string,
  materialIds: string[],
) => {
  const uniqueMaterialIds = Array.from(new Set(materialIds));

  for (const materialId of uniqueMaterialIds) {
    await recomputeMaterialLedger(tx, companyId, materialId);
  }
};

export const findNegativeMaterialLedger = async (
  tx: DbClient,
  companyId: string,
  materialIds: string[],
) => {
  const uniqueMaterialIds = Array.from(new Set(materialIds));

  if (uniqueMaterialIds.length === 0) {
    return null;
  }

  return tx.stockMovement.findFirst({
    where: {
      companyId,
      materialId: {
        in: uniqueMaterialIds,
      },
      stockSesudah: {
        lt: 0,
      },
    },
    include: {
      material: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: [{ tanggalTransaksi: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
};
