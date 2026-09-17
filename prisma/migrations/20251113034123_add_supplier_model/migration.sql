-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('RAMP_PERON', 'KUD', 'KELOMPOK_TANI');

-- CreateEnum
CREATE TYPE "CertificationType" AS ENUM ('ISPO', 'RSPO');

-- CreateEnum
CREATE TYPE "TaxStatus" AS ENUM ('NON_PKP', 'PKP_11', 'PKP_1_1');

-- CreateEnum
CREATE TYPE "SalesChannel" AS ENUM ('LANGSUNG_PKS', 'AGEN');

-- CreateEnum
CREATE TYPE "TransportationType" AS ENUM ('MILIK_SENDIRI', 'JASA_PIHAK_KE_3');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL,
    "ownerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "companyPhone" TEXT,
    "personalPhone" TEXT NOT NULL,
    "companyName" TEXT,
    "rampPeronAddress" TEXT,
    "gardenProfiles" JSONB NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "swadaya" BOOLEAN NOT NULL DEFAULT false,
    "kelompok" BOOLEAN NOT NULL DEFAULT false,
    "perusahaan" BOOLEAN NOT NULL DEFAULT false,
    "jenisBibit" TEXT,
    "certification" "CertificationType",
    "aktePendirian" TEXT,
    "aktePerubahan" TEXT,
    "nib" TEXT,
    "siup" TEXT,
    "npwp" TEXT,
    "salesChannel" "SalesChannel",
    "transportation" "TransportationType",
    "bankName" TEXT,
    "accountNumber" TEXT,
    "taxStatus" "TaxStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supplier_companyId_idx" ON "Supplier"("companyId");

-- CreateIndex
CREATE INDEX "Supplier_type_idx" ON "Supplier"("type");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
