ALTER TABLE "Material"
ADD COLUMN IF NOT EXISTS "hargaPerUnit" DOUBLE PRECISION DEFAULT 0;

ALTER TABLE "Contract"
ADD COLUMN IF NOT EXISTS "customFields" JSONB;

CREATE TABLE IF NOT EXISTS "MaterialHargaHistory" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "hargaLama" DOUBLE PRECISION NOT NULL,
    "hargaBaru" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT,
    "operator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialHargaHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MaterialHargaHistory_materialId_idx" ON "MaterialHargaHistory"("materialId");
CREATE INDEX IF NOT EXISTS "MaterialHargaHistory_createdAt_idx" ON "MaterialHargaHistory"("createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'MaterialHargaHistory_materialId_fkey'
    ) THEN
        ALTER TABLE "MaterialHargaHistory"
        ADD CONSTRAINT "MaterialHargaHistory_materialId_fkey"
        FOREIGN KEY ("materialId") REFERENCES "Material"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END $$;
