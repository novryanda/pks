# Modul Inventaris Gudang - Implementasi

## Overview
Modul inventaris gudang telah diimplementasikan dengan alur lengkap: SR (Store Request), PR (Purchase Request), PO (Purchase Order), Penerimaan Barang, dan Pengeluaran Barang.

## Status Implementasi

### ✅ Selesai Diimplementasikan

#### 1. Database Schema (Prisma)
- **Model MaterialInventaris**: Master data material dengan part number, kategori, satuan, lokasi, min/max stock
- **Model StoreRequest & StoreRequestItem**: Permintaan barang dari divisi
- **Model PurchaseRequest & PurchaseRequestItem**: Permintaan pembelian dari gudang ke head office
- **Model PurchaseOrder & PurchaseOrderItem**: Order pembelian ke vendor
- **Model PenerimaanBarang & PenerimaanBarangItem**: Penerimaan barang dari vendor
- **Model PengeluaranBarang & PengeluaranBarangItem**: Pengeluaran barang ke divisi
- **Model InventoryTransaction**: Riwayat transaksi inventaris (IN/OUT/ADJUSTMENT)

Semua model sudah memiliki relasi yang benar dengan KategoriMaterial dan SatuanMaterial.

#### 2. Schema Validation (Zod)
File di `src/server/schema/`:
- `material-inventaris.ts` - Validasi untuk MaterialInventaris
- `store-request.ts` - Validasi untuk SR beserta approval
- `purchase-request.ts` - Validasi untuk PR beserta approval  
- `purchase-order.ts` - Validasi untuk PO beserta issue
- `penerimaan-barang.ts` - Validasi untuk penerimaan barang
- `pengeluaran-barang.ts` - Validasi untuk pengeluaran barang

#### 3. Repositories (Data Access Layer)
File di `src/server/repositories/`:
- `material-inventaris.repository.ts` - CRUD material, stock summary, low stock alert
- `store-request.repository.ts` - CRUD SR, generate nomor, update status
- `purchase-request.repository.ts` - CRUD PR, generate nomor, approval
- `purchase-order.repository.ts` - CRUD PO, generate nomor, tracking penerimaan
- `penerimaan-barang.repository.ts` - CRUD penerimaan, generate nomor
- `pengeluaran-barang.repository.ts` - CRUD pengeluaran, generate nomor
- `inventory-transaction.repository.ts` - Query transaksi, stock summary

#### 4. Services (Business Logic)
File di `src/server/services/pt-pks/`:
- `material-inventaris.service.ts` - Logic management material
- `store-request.service.ts` - Logic SR dengan approval workflow dan stock checking
- `purchase-request.service.ts` - Logic PR dengan link ke SR
- `purchase-order.service.ts` - Logic PO dengan link ke PR
- `penerimaan-barang.service.ts` - Logic penerimaan dengan **update stock otomatis** dan inventory transaction
- `pengeluaran-barang.service.ts` - Logic pengeluaran dengan **update stock otomatis** dan inventory transaction
- `inventory-transaction.service.ts` - Logic query dan summary transaksi

**Fitur Business Logic:**
- Validasi stock sebelum pengeluaran
- Auto-calculate harga dari inventory transaction history
- Atomic transaction menggunakan Prisma transaction untuk memastikan konsistensi data
- Auto-update status PO (PARTIAL_RECEIVED/COMPLETED) berdasarkan jumlah yang diterima
- Auto-update status SR (COMPLETED) saat barang keluar
- Generate nomor otomatis untuk semua dokumen (SR, PR, PO, GR, GI)

#### 5. API Routes (Controllers) 
File di `src/app/api/pt-pks/`:

**Dibuat:**
- `material-inventaris/route.ts` - GET (all, summary, low-stock), POST
- `material-inventaris/[id]/route.ts` - GET, PATCH, DELETE
- `store-request/route.ts` - GET (with filters), POST
- `store-request/[id]/route.ts` - GET, PATCH, DELETE
- `store-request/[id]/submit/route.ts` - POST untuk submit SR
- `store-request/[id]/approve/route.ts` - POST untuk approve SR

**Yang Perlu Dilengkapi:**
API routes lainnya mengikuti pola yang sama. Buat file berikut:

```
gudang/
  store-request/
    [id]/
      reject/route.ts - POST untuk reject SR
      check-stock/route.ts - GET untuk check stock availability
      complete/route.ts - POST untuk mark as completed
      need-pr/route.ts - POST untuk mark as need PR
      
  purchase-request/
    route.ts - GET (with filters), POST
    [id]/
      route.ts - GET, PATCH, DELETE
      submit/route.ts - POST
      approve/route.ts - POST
      reject/route.ts - POST
      
  purchase-order/
    route.ts - GET (with filters), POST
    [id]/
      route.ts - GET, PATCH, DELETE
      approve/route.ts - POST
      issue/route.ts - POST untuk terbitkan PO ke vendor
      cancel/route.ts - POST
      
  penerimaan-barang/
    route.ts - GET (with filters), POST
    [id]/
      route.ts - GET, PATCH, DELETE
      complete/route.ts - POST (update stock + create transaction)
      
  pengeluaran-barang/
    route.ts - GET (with filters), POST
    [id]/
      route.ts - GET, PATCH, DELETE
      submit/route.ts - POST
      approve/route.ts - POST
      reject/route.ts - POST
      issue/route.ts - POST (update stock + create transaction)
      complete/route.ts - POST
      
  inventory-transaction/
    route.ts - GET (with filters untuk inventaris page)
```

## Alur Proses Bisnis

### 1. Store Request (SR)
```
DRAFT → submit() → PENDING → approve() → APPROVED
                           ↓ reject() 
                         REJECTED

Dari APPROVED:
- checkStock() → jika stock cukup → complete() → COMPLETED
- checkStock() → jika stock tidak cukup → needPR() → NEED_PR → buat PR
```

### 2. Purchase Request (PR)
```
DRAFT → submit() → PENDING → approve() → APPROVED → buat PO → PO_CREATED
                           ↓ reject()
                         REJECTED
```

### 3. Purchase Order (PO)
```
DRAFT → approve() → issue() → ISSUED → penerimaan barang → PARTIAL_RECEIVED/COMPLETED
                                    ↓ cancel()
                                  CANCELLED
```

### 4. Penerimaan Barang
```
DRAFT → complete() → COMPLETED
(saat complete: stock bertambah, buat inventory transaction, update PO item)
```

### 5. Pengeluaran Barang
```
DRAFT → submit() → PENDING → approve() → APPROVED → issue() → barang keluar
                           ↓ reject()
                         REJECTED

Setelah issue: complete() → COMPLETED
(saat issue: stock berkurang, buat inventory transaction, update SR jadi COMPLETED)
```

## Halaman Dashboard

### Routes yang Dibutuhkan:
```
/dashboard/pt-pks/inventaris - Tampilan semua material dengan transaksi
/dashboard/pt-pks/store-request - List dan form SR
/dashboard/pt-pks/purchase-request - List dan form PR
/dashboard/pt-pks/purchase-order - List dan form PO
/dashboard/pt-pks/penerimaan-barang - List dan form penerimaan
/dashboard/pt-pks/pengeluaran-barang - List dan form pengeluaran
```

## Langkah Implementasi Selanjutnya

### Step 1: Migration Database
```bash
# Generate migration untuk model baru
npx prisma migrate dev --name add_inventory_gudang_module

# Generate Prisma Client
npx prisma generate
```

### Step 2: Seed Data (Optional)
Tambahkan sample data di `prisma/seed.ts` untuk testing:
- Sample MaterialInventaris
- Sample KategoriMaterial untuk inventaris (Spare Part, Consumables, Tools, dll)
- Sample SatuanMaterial (Unit, Pcs, Set, Box, dll)

### Step 3: Lengkapi API Routes
Copy pola dari API routes yang sudah dibuat untuk melengkapi endpoint lainnya.

### Step 4: Buat Komponen UI
Komponen yang dibutuhkan di `src/components/dashboard/pt-pks/`:
- `material-inventaris/` - Table, form, detail
- `store-request/` - Table, form, detail, approval
- `purchase-request/` - Table, form, detail, approval
- `purchase-order/` - Table, form, detail
- `penerimaan-barang/` - Form wizard (mirip penerimaan-tbs)
- `pengeluaran-barang/` - Form wizard, approval
- `inventaris-dashboard/` - Dashboard overview dengan filter

### Step 5: Buat Pages
Buat file di `src/app/(protected-pages)/dashboard/pt-pks/`:
- `inventaris/page.tsx` - Import component
- `store-request/page.tsx`
- `purchase-request/page.tsx`
- `purchase-order/page.tsx`
- `penerimaan-barang/page.tsx`
- `pengeluaran-barang/page.tsx`

## Fitur Tambahan yang Sudah Diimplementasikan

### Inventory Transaction Tracking
Setiap penerimaan dan pengeluaran barang otomatis tercatat di `InventoryTransaction` dengan:
- Part Number
- Nama Material  
- Tanggal Transaksi
- Vendor (untuk penerimaan)
- Received (jumlah masuk)
- Issuing (jumlah keluar)
- Stock on Hand (stock setelah transaksi)
- Harga Satuan
- Total Harga
- Lokasi digunakan (dari MaterialInventaris)

### Auto-Generate Nomor Dokumen
- SR: SR/YYYYMM/0001
- PR: PR/YYYYMM/0001
- PO: PO/YYYYMM/0001
- GR (Goods Receipt): GR/YYYYMM/0001
- GI (Goods Issue): GI/YYYYMM/0001

### Stock Management
- Real-time stock update saat penerimaan dan pengeluaran
- Low stock alert (stock <= minStock)
- Stock summary per material
- Stock movement history

## Contoh Penggunaan API

### Membuat Store Request
```typescript
POST /api/pt-pks/store-request
{
  "divisi": "Produksi",
  "requestedBy": "John Doe",
  "keterangan": "Kebutuhan maintenance mesin",
  "items": [
    {
      "materialId": "xxx",
      "jumlahRequest": 5,
      "keterangan": "Urgent"
    }
  ]
}
```

### Complete Penerimaan Barang (Update Stock)
```typescript
POST /api/pt-pks/penerimaan-barang/{id}/complete
{
  "checkedBy": "Admin Gudang"
}

// Akan otomatis:
// 1. Update stock di MaterialInventaris
// 2. Buat InventoryTransaction (IN)
// 3. Update PO items jumlahDiterima
// 4. Update PO status jika semua sudah diterima
```

### Issue Pengeluaran Barang (Update Stock)
```typescript
POST /api/pt-pks/pengeluaran-barang/{id}/issue
{
  "issuedBy": "Admin Gudang"
}

// Akan otomatis:
// 1. Kurangi stock di MaterialInventaris
// 2. Buat InventoryTransaction (OUT)
// 3. Update SR status jadi COMPLETED jika linked
```

## Security & Authorization
Semua API routes sudah memiliki authorization check:
- Admin: Full access
- Manager PT PKS: Full access
- Staff PT PKS: Create SR, PR
- Staff Gudang: Manage inventory, penerimaan, pengeluaran

## Testing Checklist
- [ ] Test create material inventaris
- [ ] Test create SR dan check stock
- [ ] Test approval workflow SR → PR → PO
- [ ] Test penerimaan barang dan verifikasi stock bertambah
- [ ] Test pengeluaran barang dan verifikasi stock berkurang
- [ ] Test inventory transaction history
- [ ] Test generate nomor dokumen
- [ ] Test filter dan search di setiap halaman

## Notes
- Semua operasi yang mengupdate stock menggunakan Prisma transaction untuk atomicity
- Harga material di pengeluaran menggunakan average dari transaksi terakhir
- PO bisa partial received (terima sebagian dulu)
- Validation lengkap di setiap step menggunakan Zod
- Error handling sudah diimplementasikan di semua layer
