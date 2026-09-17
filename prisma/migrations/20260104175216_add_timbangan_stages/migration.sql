-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusPenerimaan" ADD VALUE 'TIMBANG_BRUTO';
ALTER TYPE "StatusPenerimaan" ADD VALUE 'TIMBANG_TARRA';
ALTER TYPE "StatusPenerimaan" ADD VALUE 'PENDING_HARGA';

-- AlterTable
ALTER TABLE "PenerimaanTBS" ALTER COLUMN "beratBruto" SET DEFAULT 0,
ALTER COLUMN "waktuTimbangBruto" DROP NOT NULL,
ALTER COLUMN "beratTarra" SET DEFAULT 0,
ALTER COLUMN "waktuTimbangTarra" DROP NOT NULL,
ALTER COLUMN "beratNetto1" SET DEFAULT 0,
ALTER COLUMN "beratNetto2" SET DEFAULT 0,
ALTER COLUMN "hargaPerKg" SET DEFAULT 0,
ALTER COLUMN "totalBayar" SET DEFAULT 0;
