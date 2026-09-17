/*
  Warnings:

  - You are about to drop the column `bpjsKesehatan` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `bpjsTkJhtTk` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `bpjsTkJn` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `liburTidakDibayar` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `overPublik` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `potBpjsTk` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to alter the column `gajiPokok` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,0)`.
  - You are about to alter the column `tunjanganJabatan` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,0)`.
  - You are about to alter the column `potPph21` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,0)`.
  - You are about to alter the column `hkDibayar` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Integer`.
  - You are about to alter the column `hkTidakDibayar` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Integer`.
  - You are about to alter the column `liburDibayar` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Integer`.
  - You are about to alter the column `potBpjsKesehatan` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,0)`.
  - You are about to alter the column `tunjanganPerumahan` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,0)`.

*/
-- AlterTable
ALTER TABLE "PenggajianKaryawan" DROP COLUMN "bpjsKesehatan",
DROP COLUMN "bpjsTkJhtTk",
DROP COLUMN "bpjsTkJn",
DROP COLUMN "liburTidakDibayar",
DROP COLUMN "overPublik",
DROP COLUMN "potBpjsTk",
DROP COLUMN "total",
ADD COLUMN     "lemburHari" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overtime" DECIMAL(15,0) NOT NULL DEFAULT 0,
ADD COLUMN     "potBpjsTkJht" DECIMAL(15,0) NOT NULL DEFAULT 0,
ADD COLUMN     "potBpjsTkJn" DECIMAL(15,0) NOT NULL DEFAULT 0,
ADD COLUMN     "potKehadiran" DECIMAL(15,0) NOT NULL DEFAULT 0,
ADD COLUMN     "totalPotongan" DECIMAL(15,0) NOT NULL DEFAULT 0,
ADD COLUMN     "totalSebelumPotongan" DECIMAL(15,0) NOT NULL DEFAULT 0,
ALTER COLUMN "gajiPokok" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "tunjanganJabatan" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "potPph21" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "hkDibayar" SET DEFAULT 0,
ALTER COLUMN "hkDibayar" SET DATA TYPE INTEGER,
ALTER COLUMN "hkTidakDibayar" SET DEFAULT 0,
ALTER COLUMN "hkTidakDibayar" SET DATA TYPE INTEGER,
ALTER COLUMN "liburDibayar" SET DEFAULT 0,
ALTER COLUMN "liburDibayar" SET DATA TYPE INTEGER,
ALTER COLUMN "potBpjsKesehatan" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "tunjanganPerumahan" SET DATA TYPE DECIMAL(15,0),
ALTER COLUMN "upahDiterima" SET DEFAULT 0,
ALTER COLUMN "upahDiterima" SET DATA TYPE DECIMAL(15,0);
