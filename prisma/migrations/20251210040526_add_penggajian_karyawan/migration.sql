-- CreateTable
CREATE TABLE "PenggajianKaryawan" (
    "id" TEXT NOT NULL,
    "periodeBulan" INTEGER NOT NULL,
    "periodeTahun" INTEGER NOT NULL,
    "namaKaryawan" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "golongan" TEXT,
    "nomorRekening" TEXT,
    "devisi" TEXT,
    "noBpjsTk" TEXT,
    "noBpjsKesehatan" TEXT,
    "jabatan" TEXT,
    "tanggalKerja" JSONB,
    "hariKerja" INTEGER NOT NULL DEFAULT 0,
    "gajiPokok" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tunjanganJabatan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tunjanganPerformance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lembur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kehadiran" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bpjsTk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bpjsKesehatan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "potBpjsTk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "potBpjsKes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "potPph21" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "potLainnya" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGaji" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPotongan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gajiDiterima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PenggajianKaryawan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PenggajianKaryawan_periodeBulan_periodeTahun_idx" ON "PenggajianKaryawan"("periodeBulan", "periodeTahun");

-- CreateIndex
CREATE INDEX "PenggajianKaryawan_namaKaryawan_idx" ON "PenggajianKaryawan"("namaKaryawan");

-- CreateIndex
CREATE INDEX "PenggajianKaryawan_nik_idx" ON "PenggajianKaryawan"("nik");

-- CreateIndex
CREATE INDEX "PenggajianKaryawan_devisi_idx" ON "PenggajianKaryawan"("devisi");
