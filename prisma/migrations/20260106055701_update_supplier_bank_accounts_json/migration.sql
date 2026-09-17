/*
  Warnings:

  - You are about to drop the column `accountNumber` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `Supplier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PenerimaanTBS" ADD COLUMN     "selectedBankAccount" JSONB;

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "accountNumber",
DROP COLUMN "bankName",
ADD COLUMN     "bankAccounts" JSONB;
