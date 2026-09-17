ALTER TABLE "PengirimanProduct"
ADD COLUMN IF NOT EXISTS "vendorBongkarId" TEXT,
ADD COLUMN IF NOT EXISTS "upahBongkar" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalUpahBongkar" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "selectedVendorBongkarBank" JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PengirimanProduct_vendorBongkarId_fkey'
  ) THEN
    ALTER TABLE "PengirimanProduct"
    ADD CONSTRAINT "PengirimanProduct_vendorBongkarId_fkey"
    FOREIGN KEY ("vendorBongkarId") REFERENCES "VendorBongkar"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PengirimanProduct_vendorBongkarId_idx"
ON "PengirimanProduct"("vendorBongkarId");
