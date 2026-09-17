/*
  Warnings:

  - You are about to drop the column `bpjsTk` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `gajiDiterima` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `golongan` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `hariKerja` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `kehadiran` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `keterangan` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `lembur` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `nik` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `potBpjsKes` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `potLainnya` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `totalGaji` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `totalPotongan` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to drop the column `tunjanganPerformance` on the `PenggajianKaryawan` table. All the data in the column will be lost.
  - You are about to alter the column `gajiPokok` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `tunjanganJabatan` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `bpjsKesehatan` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `potBpjsTk` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `potPph21` on the `PenggajianKaryawan` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.

*/
-- DropIndex
DROP INDEX "PenggajianKaryawan_nik_idx";

-- AlterTable
ALTER TABLE "PenggajianKaryawan" DROP COLUMN "bpjsTk",
DROP COLUMN "gajiDiterima",
DROP COLUMN "golongan",
DROP COLUMN "hariKerja",
DROP COLUMN "kehadiran",
DROP COLUMN "keterangan",
DROP COLUMN "lembur",
DROP COLUMN "nik",
DROP COLUMN "potBpjsKes",
DROP COLUMN "potLainnya",
DROP COLUMN "totalGaji",
DROP COLUMN "totalPotongan",
DROP COLUMN "tunjanganPerformance",
ADD COLUMN     "bpjsTkJhtTk" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bpjsTkJn" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gol" TEXT,
ADD COLUMN     "hk" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hkDibayar" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "hkTidakDibayar" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "liburDibayar" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "liburTidakDibayar" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "no" INTEGER,
ADD COLUMN     "overPublik" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "potBpjsKesehatan" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tktk" TEXT,
ADD COLUMN     "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tunjanganPerumahan" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "upahDiterima" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "gajiPokok" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "tunjanganJabatan" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "bpjsKesehatan" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "potBpjsTk" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "potPph21" SET DATA TYPE DECIMAL(15,2);
