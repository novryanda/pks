-- CreateEnum
CREATE TYPE "TipeTransaksiTangki" AS ENUM ('MASUK', 'KELUAR', 'TRANSFER', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "Tangki" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "namaTangki" TEXT NOT NULL,
    "kapasitas" DOUBLE PRECISION NOT NULL,
    "isiSaatIni" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tangki_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTangki" (
    "id" TEXT NOT NULL,
    "tangkiId" TEXT NOT NULL,
    "tipeTransaksi" "TipeTransaksiTangki" NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "stockSebelum" DOUBLE PRECISION NOT NULL,
    "stockSesudah" DOUBLE PRECISION NOT NULL,
    "referensi" TEXT,
    "keterangan" TEXT,
    "operator" TEXT NOT NULL,
    "tanggalTransaksi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTangki_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tangki_companyId_idx" ON "Tangki"("companyId");

-- CreateIndex
CREATE INDEX "Tangki_materialId_idx" ON "Tangki"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "Tangki_companyId_namaTangki_key" ON "Tangki"("companyId", "namaTangki");

-- CreateIndex
CREATE INDEX "StockTangki_tangkiId_idx" ON "StockTangki"("tangkiId");

-- CreateIndex
CREATE INDEX "StockTangki_tanggalTransaksi_idx" ON "StockTangki"("tanggalTransaksi");

-- CreateIndex
CREATE INDEX "StockTangki_tipeTransaksi_idx" ON "StockTangki"("tipeTransaksi");

-- AddForeignKey
ALTER TABLE "Tangki" ADD CONSTRAINT "Tangki_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tangki" ADD CONSTRAINT "Tangki_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTangki" ADD CONSTRAINT "StockTangki_tangkiId_fkey" FOREIGN KEY ("tangkiId") REFERENCES "Tangki"("id") ON DELETE CASCADE ON UPDATE CASCADE;
