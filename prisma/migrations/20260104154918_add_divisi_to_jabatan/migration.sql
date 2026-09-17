-- AlterTable
ALTER TABLE "MasterJabatan" ADD COLUMN     "divisiId" TEXT;

-- CreateIndex
CREATE INDEX "MasterJabatan_divisiId_idx" ON "MasterJabatan"("divisiId");

-- AddForeignKey
ALTER TABLE "MasterJabatan" ADD CONSTRAINT "MasterJabatan_divisiId_fkey" FOREIGN KEY ("divisiId") REFERENCES "MasterDivisi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
