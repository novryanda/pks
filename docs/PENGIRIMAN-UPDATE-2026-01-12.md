# Dokumentasi Pembaruan Alur Pengiriman Produk

## Tanggal: 12 Januari 2026

## Ringkasan Perubahan

Pembaruan besar pada modul pengiriman produk dengan perubahan alur proses dan penambahan fitur metode pembayaran kontrak.

## 1. Perubahan Alur Pengiriman Produk

### Alur Lama:
1. Pilih Buyer & Kontrak
2. Pilih Vendor Transportir
3. Timbang Tarra
4. Timbang Gross
5. Input Mutu Kernel

### Alur Baru:
1. **Pilih Vendor Transportir** → Kendaraan dipilih di awal
2. **Timbang Tarra** → Penimbangan truck kosong
3. **Timbang Gross** → Penimbangan truck bermuatan
4. **Pilih Kontrak** → Dari list gross yang tersedia, pilih kontrak yang sesuai
5. **Input Mutu Kernel** → Data mutu kernel (FFA, air, kotoran)

### Status Pengiriman:
- `DRAFT` - Baru dibuat
- `TIMBANG_TARRA` - Sudah timbang tarra, menunggu gross
- `TIMBANG_GROSS` - Sudah timbang gross, menunggu pilih kontrak
- `COMPLETED` - Selesai semua (kontrak dipilih & mutu diisi)
- `CANCELLED` - Dibatalkan

## 2. Penambahan Metode Pembayaran Kontrak

### Metode Pembayaran:
- **LUNAS_AWAL** - Pembayaran lunas di awal (sebelum pengiriman)
- **SEBAGIAN** - Pembayaran 50% di awal
- **SETELAH_PENGIRIMAN** - Pembayaran setelah produk dikirim (default)

### Status Pembayaran:
- **UNPAID** - Belum dibayar
- **PARTIAL** - Dibayar sebagian
- **PAID** - Lunas

### Field Baru di Contract:
- `paymentMethod` - Metode pembayaran (enum)
- `paymentStatus` - Status pembayaran (enum)
- `paidAmount` - Jumlah yang sudah dibayar (float)
- `paymentDate` - Tanggal pembayaran (datetime, nullable)

## 3. Perubahan Schema Database

### Model PengirimanProduct:
- `buyerId`, `contractId`, `contractItemId` → Menjadi **nullable** (diisi setelah timbang gross)
- `beratGross`, `waktuTimbangGross`, `beratNetto` → Menjadi **nullable**
- `ffa`, `air`, `kotoran` → Menjadi **nullable**

### Model Contract:
- Tambah field `paymentMethod`, `paymentStatus`, `paidAmount`, `paymentDate`

## 4. Validasi Kapasitas Kontrak

Ketika memilih kontrak di Step 4:
- Sistem akan mengecek `remainingQuantity` = `quantity` - `deliveredQuantity`
- Jika berat pengiriman > remaining quantity:
  - Tampilkan warning
  - Berikan opsi untuk membuat kontrak baru
  - Contract baru bisa dibuat inline dengan buyer yang sama

## 5. Logika Pembayaran

### Jika paymentMethod = LUNAS_AWAL:
```typescript
paymentStatus = "PAID"
paidAmount = totalAmount
paymentDate = contractDate
```

### Jika paymentMethod = SEBAGIAN:
```typescript
paymentStatus = "PARTIAL"
paidAmount = totalAmount * 0.5
paymentDate = contractDate
```

### Jika paymentMethod = SETELAH_PENGIRIMAN:
```typescript
paymentStatus = "UNPAID"
paidAmount = 0
paymentDate = null
// Akan diupdate setelah pembayaran diterima
```

## 6. File yang Sudah Diupdate

### Backend:
- ✅ `prisma/schema.prisma` - Update model
- ✅ `prisma/migrations/20260112042300_...` - Migration file
- ✅ `src/server/schema/pengiriman-product.ts` - Update validation schema
- ✅ `src/server/schema/contract.ts` - Tambah payment method schema
- ✅ `src/server/repositories/pengiriman-product.repository.ts` - Update methods
- ✅ `src/server/repositories/contract.repository.ts` - Update payment logic
- ✅ `src/server/services/pt-pks/pengiriman-product.service.ts` - Update business logic
- ✅ `src/app/api/pt-pks/pengiriman-product/timbang-tarra/route.ts` - API step 1-2
- ✅ `src/app/api/pt-pks/pengiriman-product/update-gross/route.ts` - API step 3
- ✅ `src/app/api/pt-pks/pengiriman-product/update-kontrak-mutu/route.ts` - API step 4-5 (baru)
- ✅ `src/app/api/pt-pks/pengiriman-product/pending-gross/route.ts` - API list pending gross
- ✅ `src/app/api/pt-pks/pengiriman-product/pending-kontrak/route.ts` - API list pending kontrak (baru)

### Frontend:
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/new-pengiriman-step1.tsx` - Pilih vendor
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/new-pengiriman-step2.tsx` - Timbang tarra
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/new-pengiriman-step3.tsx` - Timbang gross
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/new-pengiriman-wizard.tsx` - Wizard step 1-2
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/gross-wizard.tsx` - Wizard step 3
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/kontrak-mutu-step1.tsx` - Pilih kontrak
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/kontrak-mutu-step2.tsx` - Input mutu
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/kontrak-mutu-wizard.tsx` - Wizard step 4-5
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/inline-contract-form.tsx` - Form kontrak baru inline
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/pending-gross-list-new.tsx` - List pending gross
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/pending-kontrak-list.tsx` - List pending kontrak
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/pengiriman-page-content-new.tsx` - Main page
- ✅ `src/components/dashboard/pt-pks/buyer/contract-form.tsx` - Tambah payment method
- ⏳ `src/app/api/pt-pks/contract/` - Update contract API

### Frontend:
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/new-pengiriman-step1.tsx` - Vendor selection
- ✅ `src/components/dashboard/pt-pks/pengiriman-product/new-pengiriman-step2.tsx` - Tarra weighing
- ⏳ `src/components/dashboard/pt-pks/pengiriman-product/new-pengiriman-step3.tsx` - Gross weighing
- ⏳ `src/components/dashboard/pt-pks/pengiriman-product/new-pengiriman-step4.tsx` - Contract selection
- ⏳ `src/components/dashboard/pt-pks/pengiriman-product/new-pengiriman-step5.tsx` - Quality data
- ⏳ `src/components/dashboard/pt-pks/pengiriman-product/new-pengiriman-wizard.tsx` - Main wizard
- ⏳ `src/components/dashboard/pt-pks/pengiriman-product/list-gross.tsx` - List pending gross
- ⏳ `src/components/dashboard/pt-pks/pengiriman-product/pengiriman-page-content.tsx` - Update tabs
- ⏳ `src/components/dashboard/pt-pks/buyer/contract-form.tsx` - Add payment fields

## 7. Migration File

File: `prisma/migrations/20260112042300_update_pengiriman_flow_and_contract_payment/migration.sql`

## 8. Testing Checklist

- [ ] Create pengiriman baru (vendor → tarra)
- [ ] Update timbang gross
- [ ] List gross yang menunggu kontrak
- [ ] Pilih kontrak dengan kapasitas cukup
- [ ] Pilih kontrak dengan kapasitas tidak cukup → buat kontrak baru
- [ ] Input mutu kernel
- [ ] Create kontrak dengan payment method LUNAS_AWAL
- [ ] Create kontrak dengan payment method SEBAGIAN
- [ ] Create kontrak dengan payment method SETELAH_PENGIRIMAN
- [ ] Verify payment status update
- [ ] Verify stock movement

## 9. Next Steps

1. Selesaikan implementasi repository methods
2. Update service business logic
3. Create/update API routes
4. Complete frontend components
5. Create inline contract form component
6. Add capacity validation UI
7. Testing end-to-end
8. Update user documentation

## 10. Breaking Changes

⚠️ **PERHATIAN**: Ini adalah breaking change yang memerlukan:
- Database migration
- Update semua existing code yang menggunakan model PengirimanProduct
- Possible data migration untuk existing records (set nullable fields)
- Update API consumers jika ada

## 11. Rollback Plan

Jika perlu rollback:
```bash
npx prisma migrate revert --name update_pengiriman_flow_and_contract_payment
```

Kemudian restore code dari git:
```bash
git revert <commit-hash>
```
