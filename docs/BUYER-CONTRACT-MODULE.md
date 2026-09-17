# Buyer and Contract Management Module - Implementation Summary

## Overview
Modul ini mengimplementasikan manajemen data buyer (pembeli) dan kontrak pembelian produk untuk PT PKS. Sistem ini mencakup informasi umum buyer, informasi pajak, dan pembuatan kontrak pembelian dengan perhitungan otomatis pajak berdasarkan status pajak buyer.

## Database Schema

### Model Buyer
Menyimpan informasi pembeli dengan field:
- **Informasi Umum**: code, name, contactPerson, email, phone, address
- **Informasi Pajak**: npwp, taxStatus (NON_PKP, PKP_11, PKP_1_1)
- **Informasi Rekening**: bankName, accountNumber, accountName
- **Status**: status (ACTIVE/INACTIVE)

### Model Contract
Menyimpan kontrak pembelian dengan field:
- **Informasi Kontrak**: contractNumber, contractDate, startDate, endDate
- **Pengiriman**: deliveryDate, deliveryAddress
- **Harga**: subtotal, taxAmount, totalAmount (auto-calculated)
- **Status**: status (DRAFT/ACTIVE/COMPLETED/CANCELLED)
- **Relasi**: buyerId, contractItems

### Model ContractItem
Menyimpan detail item dalam kontrak:
- materialId: Produk yang dibeli
- quantity: Jumlah kuantitas
- unitPrice: Harga per satuan
- totalPrice: Total harga item (auto-calculated)
- notes: Catatan tambahan

## Perhitungan Pajak Otomatis

Sistem secara otomatis menghitung pajak berdasarkan taxStatus buyer:
- **NON_PKP**: 0% (tidak ada pajak)
- **PKP_11**: 11% dari subtotal
- **PKP_1_1**: 1.1% dari subtotal

**Formula:**
```
Subtotal = Sum(quantity × unitPrice) untuk semua items
Tax Amount = Subtotal × Tax Rate
Total Amount = Subtotal + Tax Amount
```

## Layer Arsitektur

### 1. Schema Layer (`src/server/schema/`)
- `buyer.ts`: Validasi Zod untuk operasi CRUD buyer
- `contract.ts`: Validasi Zod untuk operasi CRUD contract

### 2. Repository Layer (`src/server/repositories/`)
- `buyer.repository.ts`: Query database untuk buyer
- `contract.repository.ts`: Query database untuk contract dengan perhitungan otomatis

### 3. Service Layer (`src/server/services/pt-pks/`)
- `buyer.service.ts`: Business logic untuk buyer
- `contract.service.ts`: Business logic untuk contract dengan validasi status transition

### 4. API Routes (`src/app/api/pt-pks/`)

#### Buyer API:
- `GET /api/pt-pks/buyer` - List buyers dengan pagination & filter
- `GET /api/pt-pks/buyer?dropdown=true` - Get active buyers untuk dropdown
- `POST /api/pt-pks/buyer` - Create buyer baru
- `GET /api/pt-pks/buyer/:id` - Get buyer detail
- `PUT /api/pt-pks/buyer/:id` - Update buyer
- `DELETE /api/pt-pks/buyer/:id` - Delete buyer
- `GET /api/pt-pks/buyer/generate-code` - Generate kode buyer otomatis

#### Contract API:
- `GET /api/pt-pks/contract` - List contracts dengan pagination & filter
- `POST /api/pt-pks/contract` - Create contract baru
- `GET /api/pt-pks/contract/:id` - Get contract detail
- `PUT /api/pt-pks/contract/:id` - Update contract
- `DELETE /api/pt-pks/contract/:id` - Delete contract (hanya DRAFT/CANCELLED)
- `PATCH /api/pt-pks/contract/:id/status` - Update status contract
- `GET /api/pt-pks/contract/generate-number` - Generate nomor contract otomatis

## UI Components

### Buyer Components (`src/components/dashboard/pt-pks/buyer/`)
1. **buyer-table.tsx**: Tabel daftar buyer dengan:
   - Search & filter by status
   - Pagination
   - Actions: View, Edit, Delete
   - Link ke daftar kontrak

2. **buyer-form.tsx**: Form create/edit buyer dengan:
   - Auto-generate kode buyer
   - Validasi form
   - Support untuk informasi umum, pajak, dan rekening

3. **buyer-detail.tsx**: Detail view buyer dengan:
   - Informasi lengkap buyer
   - Recent contracts
   - Actions: Edit, View Contracts

4. **contract-form.tsx**: Form create/edit contract dengan:
   - Dynamic item management (add/remove items)
   - Auto-calculate totals
   - Material dropdown dengan satuan
   - Real-time tax calculation

5. **contract-table.tsx**: Tabel daftar contract dengan:
   - Search & filter by status & buyer
   - Pagination
   - Actions: View, Edit (hanya DRAFT)

## Pages Structure

### Buyer Pages:
```
/dashboard/pt-pks/master/buyer
├── page.tsx                    - List all buyers
├── new/page.tsx               - Create new buyer
└── [id]/
    ├── page.tsx               - Buyer detail
    ├── edit/page.tsx          - Edit buyer
    └── contracts/
        ├── page.tsx           - List buyer contracts
        └── new/page.tsx       - Create contract for buyer
```

### Contract Pages:
```
/dashboard/pt-pks/master/contract
├── page.tsx                    - List all contracts
└── new/page.tsx               - Create new contract
```

## Features

### Buyer Management:
✅ CRUD operations untuk buyer
✅ Auto-generate kode buyer (BYR-0001, BYR-0002, dst)
✅ Validasi kode buyer unique
✅ Status management (Active/Inactive)
✅ Cek buyer tidak bisa dihapus jika masih punya kontrak
✅ Search & filter dengan pagination

### Contract Management:
✅ CRUD operations untuk contract
✅ Auto-generate nomor kontrak (CTR/YYYYMM/0001)
✅ Multi-item support dengan dynamic add/remove
✅ Auto-calculate subtotal, pajak, dan total
✅ Validasi tanggal (endDate >= startDate)
✅ Status management dengan business rules
✅ Link ke buyer information
✅ Search & filter dengan pagination

### Business Rules:
1. **Buyer**:
   - Kode buyer harus unique
   - Buyer dengan kontrak tidak bisa dihapus
   - Email harus valid (jika diisi)

2. **Contract**:
   - Minimal 1 item produk
   - Tanggal berakhir >= tanggal mulai
   - Status transition rules:
     - DRAFT → ACTIVE ✅
     - DRAFT → CANCELLED ✅
     - ACTIVE → COMPLETED ✅
     - ACTIVE → CANCELLED ✅
     - COMPLETED/CANCELLED → Any ❌
   - Hanya DRAFT yang bisa diedit
   - Hanya DRAFT/CANCELLED yang bisa dihapus

## Next Steps

1. **Testing**: Test semua endpoint dan UI flow
2. **PDF Generation**: Buat PDF untuk kontrak
3. **Email Notification**: Kirim email saat kontrak dibuat/updated
4. **Delivery Tracking**: Track status pengiriman
5. **Payment Integration**: Integrasi dengan modul pembayaran
6. **Reporting**: Dashboard dan report untuk kontrak

## Migration

Migration sudah berhasil dijalankan:
```bash
npx prisma migrate dev --name add_buyer_contract_models
```

Database tables yang dibuat:
- `Buyer`
- `Contract`
- `ContractItem`

## Usage Example

### Create Buyer:
1. Navigate to `/dashboard/pt-pks/master/buyer`
2. Click "Tambah Buyer"
3. Fill form and click "Generate" untuk kode otomatis
4. Select tax status
5. Save

### Create Contract:
1. Navigate to buyer detail
2. Click "Lihat Kontrak"
3. Click "Buat Kontrak Baru"
4. Select buyer (auto-filled jika dari buyer page)
5. Add contract items (pilih material, quantity, unit price)
6. System akan auto-calculate total dengan pajak
7. Fill delivery date and address
8. Save

## Technical Notes

- Menggunakan React Hook Form untuk form management
- Zod untuk validation
- Prisma untuk database ORM
- Server Components untuk SEO-friendly pages
- Client Components untuk interactive UI
- Type-safe dengan TypeScript
- Responsive design dengan Tailwind CSS
