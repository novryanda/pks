-- CreateEnum
CREATE TYPE "StatusPenerimaan" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MetodeInput" AS ENUM ('MANUAL', 'SISTEM_TIMBANGAN');

-- CreateTable
CREATE TABLE "KategoriMaterial" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KategoriMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatuanMaterial" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SatuanMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kategoriId" TEXT NOT NULL,
    "satuanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transporter" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorKendaraan" TEXT NOT NULL,
    "namaSupir" TEXT NOT NULL,
    "telepon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierTransporter" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierTransporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenerimaanTBS" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorPenerimaan" TEXT NOT NULL,
    "tanggalTerima" TIMESTAMP(3) NOT NULL,
    "materialId" TEXT NOT NULL,
    "operatorPenimbang" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "beratBruto" DOUBLE PRECISION NOT NULL,
    "waktuTimbangBruto" TIMESTAMP(3) NOT NULL,
    "metodeBruto" "MetodeInput" NOT NULL DEFAULT 'MANUAL',
    "beratTarra" DOUBLE PRECISION NOT NULL,
    "waktuTimbangTarra" TIMESTAMP(3) NOT NULL,
    "metodeTarra" "MetodeInput" NOT NULL DEFAULT 'MANUAL',
    "beratNetto1" DOUBLE PRECISION NOT NULL,
    "potonganPersen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "potonganKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "beratNetto2" DOUBLE PRECISION NOT NULL,
    "hargaPerKg" DOUBLE PRECISION NOT NULL,
    "totalBayar" DOUBLE PRECISION NOT NULL,
    "status" "StatusPenerimaan" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PenerimaanTBS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMaterial" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KategoriMaterial_companyId_idx" ON "KategoriMaterial"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "KategoriMaterial_name_companyId_key" ON "KategoriMaterial"("name", "companyId");

-- CreateIndex
CREATE INDEX "SatuanMaterial_companyId_idx" ON "SatuanMaterial"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "SatuanMaterial_name_companyId_key" ON "SatuanMaterial"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE INDEX "Material_companyId_idx" ON "Material"("companyId");

-- CreateIndex
CREATE INDEX "Material_kategoriId_idx" ON "Material"("kategoriId");

-- CreateIndex
CREATE INDEX "Material_satuanId_idx" ON "Material"("satuanId");

-- CreateIndex
CREATE INDEX "Transporter_companyId_idx" ON "Transporter"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Transporter_nomorKendaraan_companyId_key" ON "Transporter"("nomorKendaraan", "companyId");

-- CreateIndex
CREATE INDEX "SupplierTransporter_supplierId_idx" ON "SupplierTransporter"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierTransporter_transporterId_idx" ON "SupplierTransporter"("transporterId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierTransporter_supplierId_transporterId_key" ON "SupplierTransporter"("supplierId", "transporterId");

-- CreateIndex
CREATE UNIQUE INDEX "PenerimaanTBS_nomorPenerimaan_key" ON "PenerimaanTBS"("nomorPenerimaan");

-- CreateIndex
CREATE INDEX "PenerimaanTBS_companyId_idx" ON "PenerimaanTBS"("companyId");

-- CreateIndex
CREATE INDEX "PenerimaanTBS_materialId_idx" ON "PenerimaanTBS"("materialId");

-- CreateIndex
CREATE INDEX "PenerimaanTBS_supplierId_idx" ON "PenerimaanTBS"("supplierId");

-- CreateIndex
CREATE INDEX "PenerimaanTBS_transporterId_idx" ON "PenerimaanTBS"("transporterId");

-- CreateIndex
CREATE INDEX "PenerimaanTBS_tanggalTerima_idx" ON "PenerimaanTBS"("tanggalTerima");

-- CreateIndex
CREATE INDEX "PenerimaanTBS_status_idx" ON "PenerimaanTBS"("status");

-- CreateIndex
CREATE INDEX "StockMaterial_companyId_idx" ON "StockMaterial"("companyId");

-- CreateIndex
CREATE INDEX "StockMaterial_materialId_idx" ON "StockMaterial"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "StockMaterial_companyId_materialId_key" ON "StockMaterial"("companyId", "materialId");

-- AddForeignKey
ALTER TABLE "KategoriMaterial" ADD CONSTRAINT "KategoriMaterial_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatuanMaterial" ADD CONSTRAINT "SatuanMaterial_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "KategoriMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_satuanId_fkey" FOREIGN KEY ("satuanId") REFERENCES "SatuanMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transporter" ADD CONSTRAINT "Transporter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierTransporter" ADD CONSTRAINT "SupplierTransporter_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierTransporter" ADD CONSTRAINT "SupplierTransporter_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "Transporter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanTBS" ADD CONSTRAINT "PenerimaanTBS_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanTBS" ADD CONSTRAINT "PenerimaanTBS_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanTBS" ADD CONSTRAINT "PenerimaanTBS_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanTBS" ADD CONSTRAINT "PenerimaanTBS_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "Transporter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMaterial" ADD CONSTRAINT "StockMaterial_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMaterial" ADD CONSTRAINT "StockMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
