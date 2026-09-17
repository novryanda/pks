/*
  Warnings:

  - You are about to drop the column `certification` on the `Supplier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "certification",
ADD COLUMN     "certificationISPO" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "certificationRSPO" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "salesChannelDetails" TEXT,
ADD COLUMN     "transportationUnits" INTEGER;
