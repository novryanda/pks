-- CreateEnum
CREATE TYPE "StatusPengajuanBiaya" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "BiayaPengeluaran" ADD COLUMN "pengajuanBiayaOperasionalId" TEXT;

-- CreateTable
CREATE TABLE "PengajuanBiayaOperasional" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorPengajuan" TEXT NOT NULL,
    "tanggalPengajuan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "divisi" TEXT NOT NULL,
    "kategoriBiaya" TEXT NOT NULL,
    "keperluan" TEXT NOT NULL,
    "totalBiaya" DOUBLE PRECISION NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "tanggalApproval" TIMESTAMP(3),
    "alasanReject" TEXT,
    "catatan" TEXT,
    "status" "StatusPengajuanBiaya" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengajuanBiayaOperasional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PengajuanBiayaOperasionalItem" (
    "id" TEXT NOT NULL,
    "pengajuanId" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "satuan" TEXT NOT NULL,
    "estimasiHarga" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengajuanBiayaOperasionalItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PengajuanBiayaOperasional_nomorPengajuan_key" ON "PengajuanBiayaOperasional"("nomorPengajuan");

-- CreateIndex
CREATE INDEX "PengajuanBiayaOperasional_companyId_idx" ON "PengajuanBiayaOperasional"("companyId");

-- CreateIndex
CREATE INDEX "PengajuanBiayaOperasional_tanggalPengajuan_idx" ON "PengajuanBiayaOperasional"("tanggalPengajuan");

-- CreateIndex
CREATE INDEX "PengajuanBiayaOperasional_status_idx" ON "PengajuanBiayaOperasional"("status");

-- CreateIndex
CREATE INDEX "PengajuanBiayaOperasional_kategoriBiaya_idx" ON "PengajuanBiayaOperasional"("kategoriBiaya");

-- CreateIndex
CREATE INDEX "PengajuanBiayaOperasional_divisi_idx" ON "PengajuanBiayaOperasional"("divisi");

-- CreateIndex
CREATE INDEX "PengajuanBiayaOperasionalItem_pengajuanId_idx" ON "PengajuanBiayaOperasionalItem"("pengajuanId");

-- CreateIndex
CREATE UNIQUE INDEX "BiayaPengeluaran_pengajuanBiayaOperasionalId_key" ON "BiayaPengeluaran"("pengajuanBiayaOperasionalId");

-- AddForeignKey
ALTER TABLE "BiayaPengeluaran" ADD CONSTRAINT "BiayaPengeluaran_pengajuanBiayaOperasionalId_fkey" FOREIGN KEY ("pengajuanBiayaOperasionalId") REFERENCES "PengajuanBiayaOperasional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanBiayaOperasional" ADD CONSTRAINT "PengajuanBiayaOperasional_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanBiayaOperasionalItem" ADD CONSTRAINT "PengajuanBiayaOperasionalItem_pengajuanId_fkey" FOREIGN KEY ("pengajuanId") REFERENCES "PengajuanBiayaOperasional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
