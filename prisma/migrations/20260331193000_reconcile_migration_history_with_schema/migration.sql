DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TipeVendorBongkar') THEN
        CREATE TYPE "TipeVendorBongkar" AS ENUM ('SPSI', 'SPLO');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatusBiaya') THEN
        CREATE TYPE "StatusBiaya" AS ENUM ('DRAFT', 'ACTIVE', 'PAID', 'CANCELLED');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'StatusPenerimaan' AND e.enumlabel = 'PENDING_BONGKAR'
    ) THEN
        ALTER TYPE "StatusPenerimaan" ADD VALUE 'PENDING_BONGKAR';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "VendorBongkar" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "tipe" "TipeVendorBongkar" NOT NULL,
    "bankAccounts" JSONB,
    "status" "StatusVendor" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorBongkar_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "POItemPRItemMapping" (
    "id" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT NOT NULL,
    "purchaseRequestItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POItemPRItemMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BiayaPengeluaran" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorBiaya" TEXT NOT NULL,
    "tanggalBiaya" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kategoriBiaya" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "jumlahBiaya" DOUBLE PRECISION NOT NULL,
    "periodeBulan" INTEGER,
    "periodeTahun" INTEGER,
    "keterangan" TEXT,
    "status" "StatusBiaya" NOT NULL DEFAULT 'ACTIVE',
    "dibuatOleh" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiayaPengeluaran_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Contract"
ADD COLUMN IF NOT EXISTS "attachments" JSONB;

ALTER TABLE "VendorVehicle"
ADD COLUMN IF NOT EXISTS "noSim" TEXT;

ALTER TABLE "PenerimaanTBS"
ADD COLUMN IF NOT EXISTS "vendorBongkarId" TEXT,
ADD COLUMN IF NOT EXISTS "selectedVendorBongkarBank" JSONB;

ALTER TABLE "PenggajianKaryawan"
ADD COLUMN IF NOT EXISTS "keteranganDetail" JSONB;

ALTER TABLE "PurchaseRequestItem"
ADD COLUMN IF NOT EXISTS "jumlahPOCreated" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "MasterKaryawan"
DROP COLUMN IF EXISTS "pctBpjsTkJht",
DROP COLUMN IF EXISTS "pctBpjsTkJn",
DROP COLUMN IF EXISTS "pctBpjsKesehatan",
ADD COLUMN IF NOT EXISTS "potBpjsTkJht" DECIMAL(15,0) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "potBpjsTkJn" DECIMAL(15,0) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "potBpjsKesehatan" DECIMAL(15,0) NOT NULL DEFAULT 0;

ALTER TABLE "PengirimanProduct"
DROP COLUMN IF EXISTS "ffa",
DROP COLUMN IF EXISTS "air",
DROP COLUMN IF EXISTS "kotoran",
DROP COLUMN IF EXISTS "noSegel",
ADD COLUMN IF NOT EXISTS "mutuCustomFields" JSONB;

ALTER TABLE "Tangki"
DROP COLUMN IF EXISTS "isiSaatIni";

ALTER TABLE "MasterDivisi"
DROP COLUMN IF EXISTS "kode";

ALTER TABLE "MasterJabatan"
DROP COLUMN IF EXISTS "kode";

DROP INDEX IF EXISTS "MasterDivisi_kode_key";
DROP INDEX IF EXISTS "MasterDivisi_kode_idx";
DROP INDEX IF EXISTS "MasterJabatan_kode_key";
DROP INDEX IF EXISTS "MasterJabatan_kode_idx";
DROP INDEX IF EXISTS "PengirimanProduct_noSegel_key";
DROP INDEX IF EXISTS "PurchaseOrder_purchaseRequestId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "VendorBongkar_code_key" ON "VendorBongkar"("code");
CREATE INDEX IF NOT EXISTS "VendorBongkar_companyId_idx" ON "VendorBongkar"("companyId");
CREATE INDEX IF NOT EXISTS "VendorBongkar_code_idx" ON "VendorBongkar"("code");
CREATE INDEX IF NOT EXISTS "VendorBongkar_tipe_idx" ON "VendorBongkar"("tipe");
CREATE INDEX IF NOT EXISTS "VendorBongkar_status_idx" ON "VendorBongkar"("status");

CREATE INDEX IF NOT EXISTS "POItemPRItemMapping_purchaseOrderItemId_idx" ON "POItemPRItemMapping"("purchaseOrderItemId");
CREATE INDEX IF NOT EXISTS "POItemPRItemMapping_purchaseRequestItemId_idx" ON "POItemPRItemMapping"("purchaseRequestItemId");

CREATE UNIQUE INDEX IF NOT EXISTS "BiayaPengeluaran_nomorBiaya_key" ON "BiayaPengeluaran"("nomorBiaya");
CREATE INDEX IF NOT EXISTS "BiayaPengeluaran_companyId_idx" ON "BiayaPengeluaran"("companyId");
CREATE INDEX IF NOT EXISTS "BiayaPengeluaran_kategoriBiaya_idx" ON "BiayaPengeluaran"("kategoriBiaya");
CREATE INDEX IF NOT EXISTS "BiayaPengeluaran_tanggalBiaya_idx" ON "BiayaPengeluaran"("tanggalBiaya");
CREATE INDEX IF NOT EXISTS "BiayaPengeluaran_status_idx" ON "BiayaPengeluaran"("status");
CREATE INDEX IF NOT EXISTS "BiayaPengeluaran_periodeBulan_periodeTahun_idx" ON "BiayaPengeluaran"("periodeBulan", "periodeTahun");

CREATE INDEX IF NOT EXISTS "PenerimaanTBS_vendorBongkarId_idx" ON "PenerimaanTBS"("vendorBongkarId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'VendorBongkar_companyId_fkey'
    ) THEN
        ALTER TABLE "VendorBongkar"
        ADD CONSTRAINT "VendorBongkar_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'POItemPRItemMapping_purchaseOrderItemId_fkey'
    ) THEN
        ALTER TABLE "POItemPRItemMapping"
        ADD CONSTRAINT "POItemPRItemMapping_purchaseOrderItemId_fkey"
        FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'POItemPRItemMapping_purchaseRequestItemId_fkey'
    ) THEN
        ALTER TABLE "POItemPRItemMapping"
        ADD CONSTRAINT "POItemPRItemMapping_purchaseRequestItemId_fkey"
        FOREIGN KEY ("purchaseRequestItemId") REFERENCES "PurchaseRequestItem"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'BiayaPengeluaran_companyId_fkey'
    ) THEN
        ALTER TABLE "BiayaPengeluaran"
        ADD CONSTRAINT "BiayaPengeluaran_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PenerimaanTBS_vendorBongkarId_fkey'
    ) THEN
        ALTER TABLE "PenerimaanTBS"
        ADD CONSTRAINT "PenerimaanTBS_vendorBongkarId_fkey"
        FOREIGN KEY ("vendorBongkarId") REFERENCES "VendorBongkar"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
