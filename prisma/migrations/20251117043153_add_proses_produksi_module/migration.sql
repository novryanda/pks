-- CreateEnum
CREATE TYPE "StatusProsesProduksi" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ProsesProduksi" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorProduksi" TEXT NOT NULL,
    "tanggalProduksi" TIMESTAMP(3) NOT NULL,
    "operatorProduksi" TEXT NOT NULL,
    "materialInputId" TEXT NOT NULL,
    "jumlahInput" DOUBLE PRECISION NOT NULL,
    "status" "StatusProsesProduksi" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProsesProduksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HasilProduksi" (
    "id" TEXT NOT NULL,
    "prosesProduksiId" TEXT NOT NULL,
    "materialOutputId" TEXT NOT NULL,
    "jumlahOutput" DOUBLE PRECISION NOT NULL,
    "rendemen" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HasilProduksi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProsesProduksi_nomorProduksi_key" ON "ProsesProduksi"("nomorProduksi");

-- CreateIndex
CREATE INDEX "ProsesProduksi_companyId_idx" ON "ProsesProduksi"("companyId");

-- CreateIndex
CREATE INDEX "ProsesProduksi_materialInputId_idx" ON "ProsesProduksi"("materialInputId");

-- CreateIndex
CREATE INDEX "ProsesProduksi_tanggalProduksi_idx" ON "ProsesProduksi"("tanggalProduksi");

-- CreateIndex
CREATE INDEX "ProsesProduksi_status_idx" ON "ProsesProduksi"("status");

-- CreateIndex
CREATE INDEX "HasilProduksi_prosesProduksiId_idx" ON "HasilProduksi"("prosesProduksiId");

-- CreateIndex
CREATE INDEX "HasilProduksi_materialOutputId_idx" ON "HasilProduksi"("materialOutputId");

-- AddForeignKey
ALTER TABLE "ProsesProduksi" ADD CONSTRAINT "ProsesProduksi_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProsesProduksi" ADD CONSTRAINT "ProsesProduksi_materialInputId_fkey" FOREIGN KEY ("materialInputId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasilProduksi" ADD CONSTRAINT "HasilProduksi_prosesProduksiId_fkey" FOREIGN KEY ("prosesProduksiId") REFERENCES "ProsesProduksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasilProduksi" ADD CONSTRAINT "HasilProduksi_materialOutputId_fkey" FOREIGN KEY ("materialOutputId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
