-- CreateEnum
CREATE TYPE "StatusPengiriman" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TipeMovement" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "PengirimanProduct" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorPengiriman" TEXT NOT NULL,
    "tanggalPengiriman" TIMESTAMP(3) NOT NULL,
    "operatorPenimbang" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "contractItemId" TEXT NOT NULL,
    "vendorVehicleId" TEXT NOT NULL,
    "beratTarra" DOUBLE PRECISION NOT NULL,
    "waktuTimbangTarra" TIMESTAMP(3) NOT NULL,
    "metodeTarra" "MetodeInput" NOT NULL DEFAULT 'MANUAL',
    "beratGross" DOUBLE PRECISION NOT NULL,
    "waktuTimbangGross" TIMESTAMP(3) NOT NULL,
    "metodeGross" "MetodeInput" NOT NULL DEFAULT 'MANUAL',
    "beratNetto" DOUBLE PRECISION NOT NULL,
    "ffa" DOUBLE PRECISION NOT NULL,
    "air" DOUBLE PRECISION NOT NULL,
    "kotoran" DOUBLE PRECISION NOT NULL,
    "noSegel" TEXT NOT NULL,
    "status" "StatusPengiriman" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengirimanProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "tipeMovement" "TipeMovement" NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "stockSebelum" DOUBLE PRECISION NOT NULL,
    "stockSesudah" DOUBLE PRECISION NOT NULL,
    "referensi" TEXT,
    "keterangan" TEXT,
    "operator" TEXT NOT NULL,
    "tanggalTransaksi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PengirimanProduct_nomorPengiriman_key" ON "PengirimanProduct"("nomorPengiriman");

-- CreateIndex
CREATE UNIQUE INDEX "PengirimanProduct_noSegel_key" ON "PengirimanProduct"("noSegel");

-- CreateIndex
CREATE INDEX "PengirimanProduct_companyId_idx" ON "PengirimanProduct"("companyId");

-- CreateIndex
CREATE INDEX "PengirimanProduct_buyerId_idx" ON "PengirimanProduct"("buyerId");

-- CreateIndex
CREATE INDEX "PengirimanProduct_contractId_idx" ON "PengirimanProduct"("contractId");

-- CreateIndex
CREATE INDEX "PengirimanProduct_contractItemId_idx" ON "PengirimanProduct"("contractItemId");

-- CreateIndex
CREATE INDEX "PengirimanProduct_vendorVehicleId_idx" ON "PengirimanProduct"("vendorVehicleId");

-- CreateIndex
CREATE INDEX "PengirimanProduct_tanggalPengiriman_idx" ON "PengirimanProduct"("tanggalPengiriman");

-- CreateIndex
CREATE INDEX "PengirimanProduct_status_idx" ON "PengirimanProduct"("status");

-- CreateIndex
CREATE INDEX "StockMovement_companyId_idx" ON "StockMovement"("companyId");

-- CreateIndex
CREATE INDEX "StockMovement_materialId_idx" ON "StockMovement"("materialId");

-- CreateIndex
CREATE INDEX "StockMovement_tanggalTransaksi_idx" ON "StockMovement"("tanggalTransaksi");

-- CreateIndex
CREATE INDEX "StockMovement_tipeMovement_idx" ON "StockMovement"("tipeMovement");

-- AddForeignKey
ALTER TABLE "PengirimanProduct" ADD CONSTRAINT "PengirimanProduct_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengirimanProduct" ADD CONSTRAINT "PengirimanProduct_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengirimanProduct" ADD CONSTRAINT "PengirimanProduct_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengirimanProduct" ADD CONSTRAINT "PengirimanProduct_contractItemId_fkey" FOREIGN KEY ("contractItemId") REFERENCES "ContractItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengirimanProduct" ADD CONSTRAINT "PengirimanProduct_vendorVehicleId_fkey" FOREIGN KEY ("vendorVehicleId") REFERENCES "VendorVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
