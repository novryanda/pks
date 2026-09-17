-- CreateEnum
CREATE TYPE "StatusStoreRequest" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'NEED_PR', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StatusPurchaseRequest" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PO_CREATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StatusPurchaseOrder" AS ENUM ('DRAFT', 'ISSUED', 'PARTIAL_RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StatusPenerimaanBarang" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StatusPengeluaranBarang" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "StoreRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorSR" TEXT NOT NULL,
    "tanggalRequest" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "divisi" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "tanggalApproval" TIMESTAMP(3),
    "keterangan" TEXT,
    "status" "StatusStoreRequest" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreRequestItem" (
    "id" TEXT NOT NULL,
    "storeRequestId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "jumlahRequest" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorPR" TEXT NOT NULL,
    "tanggalRequest" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storeRequestId" TEXT,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "tanggalApproval" TIMESTAMP(3),
    "keterangan" TEXT,
    "status" "StatusPurchaseRequest" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestItem" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "jumlahRequest" DOUBLE PRECISION NOT NULL,
    "estimasiHarga" DOUBLE PRECISION,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorPO" TEXT NOT NULL,
    "tanggalPO" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchaseRequestId" TEXT,
    "vendorId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorAddress" TEXT,
    "vendorPhone" TEXT,
    "tanggalKirimDiharapkan" TIMESTAMP(3),
    "termPembayaran" TEXT,
    "issuedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "tanggalApproval" TIMESTAMP(3),
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "status" "StatusPurchaseOrder" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "jumlahOrder" DOUBLE PRECISION NOT NULL,
    "hargaSatuan" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "jumlahDiterima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenerimaanBarang" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorPenerimaan" TEXT NOT NULL,
    "tanggalPenerimaan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchaseOrderId" TEXT,
    "vendorId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "nomorSuratJalan" TEXT,
    "tanggalSuratJalan" TIMESTAMP(3),
    "nomorInvoice" TEXT,
    "tanggalInvoice" TIMESTAMP(3),
    "receivedBy" TEXT NOT NULL,
    "checkedBy" TEXT,
    "keterangan" TEXT,
    "status" "StatusPenerimaanBarang" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PenerimaanBarang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenerimaanBarangItem" (
    "id" TEXT NOT NULL,
    "penerimaanBarangId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT,
    "jumlahDiterima" DOUBLE PRECISION NOT NULL,
    "hargaSatuan" DOUBLE PRECISION NOT NULL,
    "totalHarga" DOUBLE PRECISION NOT NULL,
    "lokasiPenyimpanan" TEXT,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PenerimaanBarangItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PengeluaranBarang" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nomorPengeluaran" TEXT NOT NULL,
    "tanggalPengeluaran" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storeRequestId" TEXT,
    "divisi" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "tanggalApproval" TIMESTAMP(3),
    "issuedBy" TEXT,
    "receivedByDivisi" TEXT,
    "tanggalDiterima" TIMESTAMP(3),
    "keterangan" TEXT,
    "status" "StatusPengeluaranBarang" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengeluaranBarang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PengeluaranBarangItem" (
    "id" TEXT NOT NULL,
    "pengeluaranBarangId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "jumlahKeluar" DOUBLE PRECISION NOT NULL,
    "hargaSatuan" DOUBLE PRECISION NOT NULL,
    "totalHarga" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengeluaranBarangItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialInventaris" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "namaMaterial" TEXT NOT NULL,
    "kategoriMaterialId" TEXT NOT NULL,
    "satuanMaterialId" TEXT NOT NULL,
    "lokasiDigunakan" TEXT,
    "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockOnHand" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialInventaris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "tanggalTransaksi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipeTransaksi" "TipeMovement" NOT NULL,
    "referensi" TEXT,
    "vendorId" TEXT,
    "vendorName" TEXT,
    "jumlahMasuk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jumlahKeluar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockOnHand" DOUBLE PRECISION NOT NULL,
    "hargaSatuan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHarga" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "operator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreRequest_nomorSR_key" ON "StoreRequest"("nomorSR");

-- CreateIndex
CREATE INDEX "StoreRequest_companyId_idx" ON "StoreRequest"("companyId");

-- CreateIndex
CREATE INDEX "StoreRequest_tanggalRequest_idx" ON "StoreRequest"("tanggalRequest");

-- CreateIndex
CREATE INDEX "StoreRequest_status_idx" ON "StoreRequest"("status");

-- CreateIndex
CREATE INDEX "StoreRequest_divisi_idx" ON "StoreRequest"("divisi");

-- CreateIndex
CREATE INDEX "StoreRequestItem_storeRequestId_idx" ON "StoreRequestItem"("storeRequestId");

-- CreateIndex
CREATE INDEX "StoreRequestItem_materialId_idx" ON "StoreRequestItem"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_nomorPR_key" ON "PurchaseRequest"("nomorPR");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_storeRequestId_key" ON "PurchaseRequest"("storeRequestId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_companyId_idx" ON "PurchaseRequest"("companyId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_tanggalRequest_idx" ON "PurchaseRequest"("tanggalRequest");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequest_storeRequestId_idx" ON "PurchaseRequest"("storeRequestId");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_purchaseRequestId_idx" ON "PurchaseRequestItem"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_materialId_idx" ON "PurchaseRequestItem"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_nomorPO_key" ON "PurchaseOrder"("nomorPO");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_purchaseRequestId_key" ON "PurchaseOrder"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_companyId_idx" ON "PurchaseOrder"("companyId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_tanggalPO_idx" ON "PurchaseOrder"("tanggalPO");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_purchaseRequestId_idx" ON "PurchaseOrder"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_materialId_idx" ON "PurchaseOrderItem"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "PenerimaanBarang_nomorPenerimaan_key" ON "PenerimaanBarang"("nomorPenerimaan");

-- CreateIndex
CREATE INDEX "PenerimaanBarang_companyId_idx" ON "PenerimaanBarang"("companyId");

-- CreateIndex
CREATE INDEX "PenerimaanBarang_tanggalPenerimaan_idx" ON "PenerimaanBarang"("tanggalPenerimaan");

-- CreateIndex
CREATE INDEX "PenerimaanBarang_status_idx" ON "PenerimaanBarang"("status");

-- CreateIndex
CREATE INDEX "PenerimaanBarang_vendorId_idx" ON "PenerimaanBarang"("vendorId");

-- CreateIndex
CREATE INDEX "PenerimaanBarang_purchaseOrderId_idx" ON "PenerimaanBarang"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PenerimaanBarangItem_penerimaanBarangId_idx" ON "PenerimaanBarangItem"("penerimaanBarangId");

-- CreateIndex
CREATE INDEX "PenerimaanBarangItem_materialId_idx" ON "PenerimaanBarangItem"("materialId");

-- CreateIndex
CREATE INDEX "PenerimaanBarangItem_purchaseOrderItemId_idx" ON "PenerimaanBarangItem"("purchaseOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PengeluaranBarang_nomorPengeluaran_key" ON "PengeluaranBarang"("nomorPengeluaran");

-- CreateIndex
CREATE UNIQUE INDEX "PengeluaranBarang_storeRequestId_key" ON "PengeluaranBarang"("storeRequestId");

-- CreateIndex
CREATE INDEX "PengeluaranBarang_companyId_idx" ON "PengeluaranBarang"("companyId");

-- CreateIndex
CREATE INDEX "PengeluaranBarang_tanggalPengeluaran_idx" ON "PengeluaranBarang"("tanggalPengeluaran");

-- CreateIndex
CREATE INDEX "PengeluaranBarang_status_idx" ON "PengeluaranBarang"("status");

-- CreateIndex
CREATE INDEX "PengeluaranBarang_divisi_idx" ON "PengeluaranBarang"("divisi");

-- CreateIndex
CREATE INDEX "PengeluaranBarang_storeRequestId_idx" ON "PengeluaranBarang"("storeRequestId");

-- CreateIndex
CREATE INDEX "PengeluaranBarangItem_pengeluaranBarangId_idx" ON "PengeluaranBarangItem"("pengeluaranBarangId");

-- CreateIndex
CREATE INDEX "PengeluaranBarangItem_materialId_idx" ON "PengeluaranBarangItem"("materialId");

-- CreateIndex
CREATE INDEX "MaterialInventaris_companyId_idx" ON "MaterialInventaris"("companyId");

-- CreateIndex
CREATE INDEX "MaterialInventaris_kategoriMaterialId_idx" ON "MaterialInventaris"("kategoriMaterialId");

-- CreateIndex
CREATE INDEX "MaterialInventaris_satuanMaterialId_idx" ON "MaterialInventaris"("satuanMaterialId");

-- CreateIndex
CREATE INDEX "MaterialInventaris_partNumber_idx" ON "MaterialInventaris"("partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialInventaris_partNumber_companyId_key" ON "MaterialInventaris"("partNumber", "companyId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_companyId_idx" ON "InventoryTransaction"("companyId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_materialId_idx" ON "InventoryTransaction"("materialId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_tanggalTransaksi_idx" ON "InventoryTransaction"("tanggalTransaksi");

-- CreateIndex
CREATE INDEX "InventoryTransaction_tipeTransaksi_idx" ON "InventoryTransaction"("tipeTransaksi");

-- CreateIndex
CREATE INDEX "InventoryTransaction_vendorId_idx" ON "InventoryTransaction"("vendorId");

-- AddForeignKey
ALTER TABLE "StoreRequestItem" ADD CONSTRAINT "StoreRequestItem_storeRequestId_fkey" FOREIGN KEY ("storeRequestId") REFERENCES "StoreRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreRequestItem" ADD CONSTRAINT "StoreRequestItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialInventaris"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_storeRequestId_fkey" FOREIGN KEY ("storeRequestId") REFERENCES "StoreRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialInventaris"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialInventaris"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanBarang" ADD CONSTRAINT "PenerimaanBarang_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanBarangItem" ADD CONSTRAINT "PenerimaanBarangItem_penerimaanBarangId_fkey" FOREIGN KEY ("penerimaanBarangId") REFERENCES "PenerimaanBarang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanBarangItem" ADD CONSTRAINT "PenerimaanBarangItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialInventaris"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenerimaanBarangItem" ADD CONSTRAINT "PenerimaanBarangItem_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengeluaranBarang" ADD CONSTRAINT "PengeluaranBarang_storeRequestId_fkey" FOREIGN KEY ("storeRequestId") REFERENCES "StoreRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengeluaranBarangItem" ADD CONSTRAINT "PengeluaranBarangItem_pengeluaranBarangId_fkey" FOREIGN KEY ("pengeluaranBarangId") REFERENCES "PengeluaranBarang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengeluaranBarangItem" ADD CONSTRAINT "PengeluaranBarangItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialInventaris"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialInventaris" ADD CONSTRAINT "MaterialInventaris_kategoriMaterialId_fkey" FOREIGN KEY ("kategoriMaterialId") REFERENCES "KategoriMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialInventaris" ADD CONSTRAINT "MaterialInventaris_satuanMaterialId_fkey" FOREIGN KEY ("satuanMaterialId") REFERENCES "SatuanMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialInventaris"("id") ON DELETE CASCADE ON UPDATE CASCADE;
