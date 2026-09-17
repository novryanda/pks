import type { Prisma, TipeMovement } from "@prisma/client";
import { db } from "@/server/db";
import { materialRepository } from "@/server/repositories/material.repository";
import type { OpeningStockEntryInput } from "@/server/schema/opening-stock";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import {
  recomputeMaterialLedger,
  STOCK_LEDGER_TRANSACTION_OPTIONS,
} from "@/server/services/pt-pks/stock-ledger.service";

type DbClient = Prisma.TransactionClient;

export type OpeningStockRow = {
  materialId: string;
  code: string;
  name: string;
  kategoriName: string;
  satuan: string;
  currentStock: number;
  stockBeforeDate: number;
  openingQuantity: number | null;
  openingMovementId: string | null;
  openingUpdatedAt: string | null;
};

const buildOpeningReference = (date: string) => `OPENING-STOCK-${date}`;

const getOpeningDateRange = (date: string) => {
  const start = parseJakartaDateBoundary(date);
  const end = parseJakartaDateBoundary(date, { endOfDay: true });

  if (!start || !end) {
    throw new Error("Tanggal stock awal tidak valid");
  }

  return { start, end };
};

export class OpeningStockService {
  async getRows(companyId: string, date: string): Promise<OpeningStockRow[]> {
    const { start } = getOpeningDateRange(date);
    const beforeDate = new Date(start.getTime() - 1);
    const reference = buildOpeningReference(date);

    const [materials, openingMovements] = await Promise.all([
      db.material.findMany({
        where: { companyId },
        select: {
          id: true,
          code: true,
          name: true,
          kategori: {
            select: {
              name: true,
            },
          },
          satuan: {
            select: {
              symbol: true,
            },
          },
          stockMaterial: {
            select: {
              jumlah: true,
            },
            take: 1,
          },
        },
        orderBy: [{ code: "asc" }],
      }),
      db.stockMovement.findMany({
        where: {
          companyId,
          referensi: reference,
        },
        select: {
          id: true,
          materialId: true,
          stockSesudah: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    ]);

    const openingMovementMap = new Map(
      openingMovements.map((movement) => [movement.materialId, movement]),
    );

    return Promise.all(
      materials.map(async (material) => {
        const stockBeforeDate = await materialRepository.getStockBalanceAtDate(
          companyId,
          material.id,
          beforeDate,
        );
        const openingMovement = openingMovementMap.get(material.id);

        return {
          materialId: material.id,
          code: material.code,
          name: material.name,
          kategoriName: material.kategori.name,
          satuan: material.satuan.symbol,
          currentStock: material.stockMaterial[0]?.jumlah ?? 0,
          stockBeforeDate,
          openingQuantity: openingMovement?.stockSesudah ?? null,
          openingMovementId: openingMovement?.id ?? null,
          openingUpdatedAt: openingMovement?.createdAt.toISOString() ?? null,
        };
      }),
    );
  }

  async save(
    companyId: string,
    date: string,
    entries: OpeningStockEntryInput[],
    operator: string,
  ) {
    const normalizedEntries = Array.from(
      new Map(entries.map((entry) => [entry.materialId, entry])).values(),
    );

    const materialIds = normalizedEntries.map((entry) => entry.materialId);
    const materials = await db.material.findMany({
      where: {
        companyId,
        id: { in: materialIds },
      },
      select: { id: true },
    });

    if (materials.length !== materialIds.length) {
      throw new Error("Ada material stock awal yang tidak valid");
    }

    await db.$transaction(async (tx) => {
      for (const entry of normalizedEntries) {
        await this.upsertOpeningForMaterial(
          tx,
          companyId,
          date,
          entry,
          operator,
        );
      }

      for (const entry of normalizedEntries) {
        await recomputeMaterialLedger(tx, companyId, entry.materialId);
      }
    }, STOCK_LEDGER_TRANSACTION_OPTIONS);

    return this.getRows(companyId, date);
  }

  private async upsertOpeningForMaterial(
    tx: DbClient,
    companyId: string,
    date: string,
    entry: OpeningStockEntryInput,
    operator: string,
  ) {
    const { end } = getOpeningDateRange(date);
    const reference = buildOpeningReference(date);

    await tx.stockMovement.deleteMany({
      where: {
        companyId,
        materialId: entry.materialId,
        referensi: reference,
      },
    });

    if (entry.quantity === null) {
      return;
    }

    const latestBalanceWithoutOpening = await tx.stockMovement.findFirst({
      where: {
        companyId,
        materialId: entry.materialId,
        tanggalTransaksi: {
          lte: end,
        },
      },
      select: {
        stockSesudah: true,
      },
      orderBy: [
        { tanggalTransaksi: "desc" },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });

    const currentBalanceAtDate = latestBalanceWithoutOpening?.stockSesudah ?? 0;
    const delta = entry.quantity - currentBalanceAtDate;

    if (delta === 0) {
      return;
    }

    const tipeMovement: TipeMovement = delta > 0 ? "IN" : "OUT";

    await tx.stockMovement.create({
      data: {
        companyId,
        materialId: entry.materialId,
        tipeMovement,
        jumlah: Math.abs(delta),
        stockSebelum: 0,
        stockSesudah: 0,
        referensi: reference,
        keterangan: `Stock awal per ${date}`,
        operator,
        tanggalTransaksi: end,
      },
    });
  }
}

export const openingStockService = new OpeningStockService();
