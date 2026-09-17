-- AlterTable
ALTER TABLE "PenerimaanBarang" ADD COLUMN     "vendorMaterialId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "vendorMaterialId" TEXT;

-- CreateTable
CREATE TABLE "VendorMaterial" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "npwp" TEXT,
    "taxStatus" "TaxStatus" NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "kategori" TEXT,
    "status" "StatusVendor" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorMaterial_code_key" ON "VendorMaterial"("code");

-- CreateIndex
CREATE INDEX "VendorMaterial_companyId_idx" ON "VendorMaterial"("companyId");

-- CreateIndex
CREATE INDEX "VendorMaterial_code_idx" ON "VendorMaterial"("code");

-- CreateIndex
CREATE INDEX "VendorMaterial_status_idx" ON "VendorMaterial"("status");

-- CreateIndex
CREATE INDEX "VendorMaterial_kategori_idx" ON "VendorMaterial"("kategori");

-- CreateIndex
CREATE INDEX "PenerimaanBarang_vendorMaterialId_idx" ON "PenerimaanBarang"("vendorMaterialId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorMaterialId_idx" ON "PurchaseOrder"("vendorMaterialId");

-- AddForeignKey
ALTER TABLE "VendorMaterial" ADD CONSTRAINT "VendorMaterial_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorMaterialId_fkey" FOREIGN KEY ("vendorMaterialId") REFERENCES "VendorMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanBarang" ADD CONSTRAINT "PenerimaanBarang_vendorMaterialId_fkey" FOREIGN KEY ("vendorMaterialId") REFERENCES "VendorMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
