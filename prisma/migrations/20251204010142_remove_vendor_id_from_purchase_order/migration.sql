/*
  Warnings:

  - You are about to drop the column `vendorId` on the `PurchaseOrder` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PurchaseOrder_vendorId_idx";

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "vendorId";
