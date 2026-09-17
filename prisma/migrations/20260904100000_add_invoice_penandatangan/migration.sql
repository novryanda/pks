-- AlterTable
ALTER TABLE "Invoice" 
ADD COLUMN IF NOT EXISTS "jabatanPenandatangan" TEXT DEFAULT 'Direktur',
ADD COLUMN IF NOT EXISTS "namaPenandatangan" TEXT DEFAULT 'TARA MIFTAHUR';
