/*
  Warnings:

  - You are about to drop the `VendorContract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorContractItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nomorKendaraan,companyId]` on the table `Vendor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `namaSupir` to the `Vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomorKendaraan` to the `Vendor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "VendorContract" DROP CONSTRAINT "VendorContract_companyId_fkey";

-- DropForeignKey
ALTER TABLE "VendorContract" DROP CONSTRAINT "VendorContract_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "VendorContractItem" DROP CONSTRAINT "VendorContractItem_vendorContractId_fkey";

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "jenisKendaraan" TEXT,
ADD COLUMN     "namaSupir" TEXT NOT NULL,
ADD COLUMN     "noHpSupir" TEXT,
ADD COLUMN     "nomorKendaraan" TEXT NOT NULL;

-- DropTable
DROP TABLE "VendorContract";

-- DropTable
DROP TABLE "VendorContractItem";

-- DropEnum
DROP TYPE "StatusVendorContract";

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_nomorKendaraan_companyId_key" ON "Vendor"("nomorKendaraan", "companyId");
