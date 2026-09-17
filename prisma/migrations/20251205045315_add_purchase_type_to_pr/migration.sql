-- CreateEnum
CREATE TYPE "TipePembelianPR" AS ENUM ('PEMBELIAN_LANGSUNG', 'PENGAJUAN_PO');

-- AlterEnum
ALTER TYPE "StatusPurchaseRequest" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "PenerimaanBarang" ADD COLUMN     "purchaseRequestId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseRequest" ADD COLUMN     "tipePembelian" "TipePembelianPR" NOT NULL DEFAULT 'PENGAJUAN_PO',
ADD COLUMN     "vendorAddressDirect" TEXT,
ADD COLUMN     "vendorNameDirect" TEXT,
ADD COLUMN     "vendorPhoneDirect" TEXT;

-- CreateIndex
CREATE INDEX "PenerimaanBarang_purchaseRequestId_idx" ON "PenerimaanBarang"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_tipePembelian_idx" ON "PurchaseRequest"("tipePembelian");

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanBarang" ADD CONSTRAINT "PenerimaanBarang_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
