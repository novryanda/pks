-- CreateTable
CREATE TABLE "KaryawanChangeLog" (
    "id" TEXT NOT NULL,
    "masterKaryawanId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "oldDisplayValue" TEXT,
    "newDisplayValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KaryawanChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KaryawanChangeLog_masterKaryawanId_idx" ON "KaryawanChangeLog"("masterKaryawanId");

-- CreateIndex
CREATE INDEX "KaryawanChangeLog_changedAt_idx" ON "KaryawanChangeLog"("changedAt");

-- AddForeignKey
ALTER TABLE "KaryawanChangeLog" ADD CONSTRAINT "KaryawanChangeLog_masterKaryawanId_fkey" FOREIGN KEY ("masterKaryawanId") REFERENCES "MasterKaryawan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
