-- CreateEnum
CREATE TYPE "StatusInvoice" AS ENUM ('DRAFT', 'ISSUED', 'PARTIAL_PAID', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "PenggajianKaryawan" ADD COLUMN     "hariBelumMasuk" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PengirimanProduct" ADD COLUMN     "materialId" TEXT;

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorInvoice" TEXT NOT NULL,
    "tanggalInvoice" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalJatuhTempo" TIMESTAMP(3),
    "contractId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "totalBerat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hargaPerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalBruto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "klaimMutuPersen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "klaimMutuNilai" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "klaimMutuKeterangan" TEXT,
    "klaimSusutPersen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "klaimSusutNilai" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "klaimSusutKeterangan" TEXT,
    "totalPotongan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalNetto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ppnPersen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ppnNilai" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pphPersen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pphNilai" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalNilai" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDibayar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sisaPembayaran" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "status" "StatusInvoice" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "issuedBy" TEXT,
    "tanggalIssued" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "pengirimanProductId" TEXT NOT NULL,
    "nomorPengiriman" TEXT NOT NULL,
    "tanggalPengiriman" TIMESTAMP(3) NOT NULL,
    "beratNetto" DOUBLE PRECISION NOT NULL,
    "ffa" DOUBLE PRECISION,
    "air" DOUBLE PRECISION,
    "kotoran" DOUBLE PRECISION,
    "hargaSatuan" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "klaimMutuPersen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "klaimMutuNilai" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "klaimSusutPersen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "klaimSusutNilai" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPotongan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBersih" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PembayaranInvoice" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jumlahBayar" DOUBLE PRECISION NOT NULL,
    "metodePembayaran" TEXT,
    "nomorReferensi" TEXT,
    "keterangan" TEXT,
    "diterimaOleh" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PembayaranInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_nomorInvoice_key" ON "Invoice"("nomorInvoice");

-- CreateIndex
CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");

-- CreateIndex
CREATE INDEX "Invoice_nomorInvoice_idx" ON "Invoice"("nomorInvoice");

-- CreateIndex
CREATE INDEX "Invoice_contractId_idx" ON "Invoice"("contractId");

-- CreateIndex
CREATE INDEX "Invoice_buyerId_idx" ON "Invoice"("buyerId");

-- CreateIndex
CREATE INDEX "Invoice_tanggalInvoice_idx" ON "Invoice"("tanggalInvoice");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceItem_pengirimanProductId_key" ON "InvoiceItem"("pengirimanProductId");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_pengirimanProductId_idx" ON "InvoiceItem"("pengirimanProductId");

-- CreateIndex
CREATE INDEX "PembayaranInvoice_invoiceId_idx" ON "PembayaranInvoice"("invoiceId");

-- CreateIndex
CREATE INDEX "PembayaranInvoice_tanggalBayar_idx" ON "PembayaranInvoice"("tanggalBayar");

-- CreateIndex
CREATE INDEX "PengirimanProduct_materialId_idx" ON "PengirimanProduct"("materialId");

-- AddForeignKey
ALTER TABLE "PengirimanProduct" ADD CONSTRAINT "PengirimanProduct_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_pengirimanProductId_fkey" FOREIGN KEY ("pengirimanProductId") REFERENCES "PengirimanProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembayaranInvoice" ADD CONSTRAINT "PembayaranInvoice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
