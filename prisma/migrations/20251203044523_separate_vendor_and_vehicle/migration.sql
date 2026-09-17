/*
  Warnings:

  - You are about to drop the column `jenisKendaraan` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `namaSupir` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `noHpSupir` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `nomorKendaraan` on the `Vendor` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Vendor_nomorKendaraan_companyId_key";

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "jenisKendaraan",
DROP COLUMN "namaSupir",
DROP COLUMN "noHpSupir",
DROP COLUMN "nomorKendaraan";

-- CreateTable
CREATE TABLE "VendorVehicle" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "nomorKendaraan" TEXT NOT NULL,
    "jenisKendaraan" TEXT,
    "namaSupir" TEXT NOT NULL,
    "noHpSupir" TEXT,
    "status" "StatusVendor" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorVehicle_vendorId_idx" ON "VendorVehicle"("vendorId");

-- CreateIndex
CREATE INDEX "VendorVehicle_status_idx" ON "VendorVehicle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VendorVehicle_nomorKendaraan_vendorId_key" ON "VendorVehicle"("nomorKendaraan", "vendorId");

-- AddForeignKey
ALTER TABLE "VendorVehicle" ADD CONSTRAINT "VendorVehicle_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
