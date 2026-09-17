/*
  Warnings:

  - You are about to drop the column `devisi` on the `MasterKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `jabatan` on the `MasterKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `devisi` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `gol` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `jabatan` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `namaKaryawan` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `no` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `noBpjsKesehatan` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `noBpjsTk` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `nomorRekening` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `tktk` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - Made the column `masterKaryawanId` on table `PenggajianKaryawan` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PenggajianKaryawan" DROP CONSTRAINT "PenggajianKaryawan_masterKaryawanId_fkey";

-- DropIndex
DROP INDEX "MasterKaryawan_devisi_idx";

-- DropIndex
DROP INDEX "PenggajianKaryawan_devisi_idx";

-- DropIndex
DROP INDEX "PenggajianKaryawan_namaKaryawan_idx";

-- DropIndex
DROP INDEX "PenggajianKaryawan_periodeBulan_periodeTahun_idx";

-- AlterTable
ALTER TABLE "MasterKaryawan" DROP COLUMN "devisi",
DROP COLUMN "jabatan",
ADD COLUMN     "divisiId" TEXT,
ADD COLUMN     "jabatanId" TEXT,
ADD COLUMN     "tanggalKeluar" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PenggajianKaryawan" DROP COLUMN "devisi",
DROP COLUMN "gol",
DROP COLUMN "jabatan",
DROP COLUMN "namaKaryawan",
DROP COLUMN "no",
DROP COLUMN "noBpjsKesehatan",
DROP COLUMN "noBpjsTk",
DROP COLUMN "nomorRekening",
DROP COLUMN "tktk",
ALTER COLUMN "masterKaryawanId" SET NOT NULL;

-- CreateTable
CREATE TABLE "MasterDivisi" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterDivisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterJabatan" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "level" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterJabatan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterDivisi_kode_key" ON "MasterDivisi"("kode");

-- CreateIndex
CREATE INDEX "MasterDivisi_kode_idx" ON "MasterDivisi"("kode");

-- CreateIndex
CREATE INDEX "MasterDivisi_isActive_idx" ON "MasterDivisi"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MasterJabatan_kode_key" ON "MasterJabatan"("kode");

-- CreateIndex
CREATE INDEX "MasterJabatan_kode_idx" ON "MasterJabatan"("kode");

-- CreateIndex
CREATE INDEX "MasterJabatan_isActive_idx" ON "MasterJabatan"("isActive");

-- CreateIndex
CREATE INDEX "MasterKaryawan_divisiId_idx" ON "MasterKaryawan"("divisiId");

-- CreateIndex
CREATE INDEX "MasterKaryawan_jabatanId_idx" ON "MasterKaryawan"("jabatanId");

-- CreateIndex
CREATE INDEX "PenggajianKaryawan_periodeTahun_periodeBulan_idx" ON "PenggajianKaryawan"("periodeTahun", "periodeBulan");

-- AddForeignKey
ALTER TABLE "MasterKaryawan" ADD CONSTRAINT "MasterKaryawan_divisiId_fkey" FOREIGN KEY ("divisiId") REFERENCES "MasterDivisi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterKaryawan" ADD CONSTRAINT "MasterKaryawan_jabatanId_fkey" FOREIGN KEY ("jabatanId") REFERENCES "MasterJabatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenggajianKaryawan" ADD CONSTRAINT "PenggajianKaryawan_masterKaryawanId_fkey" FOREIGN KEY ("masterKaryawanId") REFERENCES "MasterKaryawan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
