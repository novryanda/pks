# Implementasi Modul Proses Produksi TBS

## Overview
Modul ini mengimplementasikan alur proses produksi TBS (Tandan Buah Segar) yang mengolah TBS menjadi produk-produk hasil seperti CPO, Kernel, dll.

## Alur Proses
1. **Input TBS**: Memilih material TBS dari stock yang tersedia
2. **Input Jumlah Produksi**: Menentukan berapa total TBS yang akan diolah
3. **Hasil Produksi**: Mencatat produk yang dihasilkan dengan:
   - Pilih kategori material output
   - Pilih material spesifik dari kategori tersebut
   - Input jumlah output
   - Rendemen otomatis dihitung: `(jumlah output / jumlah input) × 100%`
4. **Update Stock**: 
   - Ketika status COMPLETED: Stock TBS berkurang, stock hasil produksi bertambah
   - Ketika status diubah dari COMPLETED: Stock dikembalikan

## Database Schema

### Tabel `ProsesProduksi`
```prisma
model ProsesProduksi {
  id                String               @id @default(cuid())
  companyId         String
  nomorProduksi     String               @unique (auto-generated)
  tanggalProduksi   DateTime
  operatorProduksi  String
  materialInputId   String               // Material TBS yang diolah
  jumlahInput       Float                // Total TBS yang diolah
  status            StatusProsesProduksi @default(DRAFT)
  hasilProduksi     HasilProduksi[]
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
}
```

### Tabel `HasilProduksi`
```prisma
model HasilProduksi {
  id                String          @id @default(cuid())
  prosesProduksiId  String
  materialOutputId  String          // Material hasil produksi
  jumlahOutput      Float           // Total hasil produksi
  rendemen          Float           // Rendemen dalam persen
  prosesProduksi    ProsesProduksi  @relation(...)
  materialOutput    Material        @relation(...)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}
```

### Status Proses Produksi
- **DRAFT**: Draft, belum mempengaruhi stock
- **IN_PROGRESS**: Sedang proses, belum mempengaruhi stock
- **COMPLETED**: Selesai, stock sudah diupdate
- **CANCELLED**: Dibatalkan

## File Structure

### Backend

#### Schema Validation
- `src/server/schema/proses-produksi.ts`
  - Validasi input/output
  - Type definitions

#### Repository
- `src/server/repositories/proses-produksi.repository.ts`
  - CRUD operations
  - Stock management
  - Laporan harian
  - Auto-generate nomor produksi

#### Service
- `src/server/services/pt-pks/proses-produksi.service.ts`
  - Business logic
  - Validasi stock
  - Auto-calculate rendemen
  - Helper methods untuk get stock TBS, kategori, materials

#### API Routes
- `src/app/api/pt-pks/proses-produksi/route.ts` - GET (list), POST (create)
- `src/app/api/pt-pks/proses-produksi/[id]/route.ts` - GET (detail), PUT (update), PATCH (update status), DELETE
- `src/app/api/pt-pks/proses-produksi/stock-tbs/route.ts` - GET stock TBS tersedia
- `src/app/api/pt-pks/proses-produksi/kategori-output/route.ts` - GET kategori untuk material output
- `src/app/api/pt-pks/proses-produksi/material-by-kategori/route.ts` - GET materials by kategori
- `src/app/api/pt-pks/proses-produksi/laporan-harian/route.ts` - GET laporan harian

### Frontend

#### Components
**Proses Produksi:**
- `src/components/dashboard/pt-pks/proses-produksi/proses-produksi-list.tsx`
  - List view dengan filter
  - Pagination
  - Actions: view, edit, delete
  
- `src/components/dashboard/pt-pks/proses-produksi/proses-produksi-wizard.tsx`
  - **Wizard/Step-by-step form** untuk create/edit
  - **Step 1**: Pilih material input (langsung dari list material)
  - **Step 2**: Input jumlah yang akan diolah + info tanggal & operator
  - **Step 3**: Pilih kategori → pilih material output → input jumlah output (auto-calculate rendemen)
  - **Step 4**: Review & submit dengan summary lengkap
  - Progress indicator untuk setiap step
  - Validasi per step sebelum lanjut
  
- `src/components/dashboard/pt-pks/proses-produksi/proses-produksi-detail.tsx`
  - Detail view
  - Update status
  - Summary info

- `src/components/dashboard/pt-pks/proses-produksi/proses-produksi-form.tsx` *(deprecated - diganti wizard)*
  - Form lama (non-wizard)

**Laporan Harian:**
- `src/components/dashboard/pt-pks/laporan-harian/laporan-harian-produksi.tsx`
  - Filter by date range
  - Summary statistics
  - Detail data
  - Export to CSV

#### Pages
- `src/app/(protected-pages)/dashboard/pt-pks/produksi/proses-produksi/page.tsx`
- `src/app/(protected-pages)/dashboard/pt-pks/produksi/laporan-harian/page.tsx`

## Features

### 1. Proses Produksi
- ✅ Create proses produksi baru
- ✅ View list dengan filter (tanggal, status, material input)
- ✅ Detail view dengan informasi lengkap
- ✅ Edit (hanya untuk status DRAFT)
- ✅ Update status (DRAFT → IN_PROGRESS → COMPLETED / CANCELLED)
- ✅ Delete (hanya untuk status DRAFT)
- ✅ Auto-generate nomor produksi (format: PROD-YYYYMM-####)
- ✅ Multiple hasil produksi per proses
- ✅ Auto-calculate rendemen
- ✅ Validasi stock TBS sebelum COMPLETED
- ✅ Auto-update stock ketika status COMPLETED

### 2. Laporan Harian
- ✅ Filter berdasarkan periode tanggal
- ✅ Summary statistics:
  - Total proses produksi
  - Total input TBS
  - Jumlah jenis output
- ✅ Ringkasan per material input
- ✅ Ringkasan per material output dengan rata-rata rendemen
- ✅ Detail data semua proses produksi
- ✅ Export to CSV

## API Endpoints

### Proses Produksi
```
GET    /api/pt-pks/proses-produksi              - List dengan filter & pagination
POST   /api/pt-pks/proses-produksi              - Create baru
GET    /api/pt-pks/proses-produksi/:id          - Get detail
PUT    /api/pt-pks/proses-produksi/:id          - Update
PATCH  /api/pt-pks/proses-produksi/:id          - Update status
DELETE /api/pt-pks/proses-produksi/:id          - Delete (DRAFT only)
```

### Helper Endpoints
```
GET /api/pt-pks/proses-produksi/stock-tbs              - Get stock TBS tersedia
GET /api/pt-pks/proses-produksi/kategori-output        - Get kategori untuk output
GET /api/pt-pks/proses-produksi/material-by-kategori   - Get materials by kategori
GET /api/pt-pks/proses-produksi/laporan-harian         - Get laporan harian
```

## Cara Penggunaan

### 1. Membuat Proses Produksi (Wizard)

#### **Step 1: Pilih Material Input**
1. Buka halaman "Proses Produksi"
2. Klik "Tambah Proses Produksi"
3. Pilih material yang akan diolah dari dropdown
4. Sistem menampilkan stock tersedia secara otomatis
5. Klik "Selanjutnya"

#### **Step 2: Input Jumlah**
1. Sistem menampilkan material yang dipilih dan stock tersedia
2. Isi tanggal produksi (default: hari ini)
3. Isi nama operator produksi (auto-fill dari user login)
4. Input jumlah yang akan diolah
5. Validasi: Tidak boleh melebihi stock tersedia
6. Klik "Selanjutnya"

#### **Step 3: Hasil Produksi**
1. Pilih kategori material output dari dropdown
2. Sistem menampilkan semua material dalam kategori tersebut dalam bentuk card
3. Klik card material untuk menambahkan ke hasil produksi
4. Input jumlah output untuk setiap material yang ditambahkan
5. Rendemen otomatis dihitung: `(jumlah output / jumlah input) × 100%`
6. Bisa tambah multiple material dari berbagai kategori
7. Hapus material dengan klik icon trash
8. Klik "Selanjutnya"

#### **Step 4: Review & Submit**
1. Review semua data:
   - Informasi umum (tanggal, operator)
   - Material input dan jumlah
   - Tabel hasil produksi lengkap
   - Total output dan rata-rata rendemen
2. Pilih status:
   - **DRAFT**: Simpan sebagai draft (tidak affect stock)
   - **IN_PROGRESS**: Status proses (tidak affect stock)
   - **COMPLETED**: Selesaikan dan update stock
3. Klik "Simpan"

**Keunggulan Wizard:**
- ✅ Step-by-step, tidak overwhelming
- ✅ Progress indicator jelas
- ✅ Validasi per step
- ✅ Review lengkap sebelum submit
- ✅ User-friendly dengan visual card untuk pilih material

### 2. Update Status
1. Buka detail proses produksi
2. Gunakan tombol untuk update status:
   - "Mulai Proses": DRAFT → IN_PROGRESS
   - "Selesaikan": → COMPLETED (update stock)
   - "Batalkan": → CANCELLED

### 3. Melihat Laporan Harian
1. Buka halaman "Laporan Harian"
2. Pilih tanggal mulai dan tanggal akhir
3. Klik "Tampilkan"
4. Review summary dan detail data
5. Optional: Export to CSV

## Migration

Migration telah dijalankan:
```bash
npx prisma migrate dev --name add_proses_produksi_module
```

File migration: `prisma/migrations/20251117043153_add_proses_produksi_module/migration.sql`

## Dependencies Tambahan

```json
{
  "date-fns": "^latest"  // Untuk formatting tanggal
}
```

## Notes

1. **Stock Management**: 
   - Stock TBS hanya berkurang ketika status = COMPLETED
   - Jika status diubah dari COMPLETED ke status lain, stock dikembalikan
   
2. **Validasi**:
   - Proses produksi hanya bisa diedit jika status = DRAFT
   - Proses produksi hanya bisa dihapus jika status = DRAFT
   - Stock TBS divalidasi sebelum mengubah status ke COMPLETED
   
3. **Rendemen**:
   - Dihitung otomatis: `(jumlah output / jumlah input) × 100`
   - Format: 2 decimal places
   
4. **Nomor Produksi**:
   - Auto-generated
   - Format: `PROD-YYYYMM-####`
   - Contoh: `PROD-202511-0001`

## Next Steps

Untuk menggunakan modul ini:

1. ✅ Database migration sudah dijalankan
2. ✅ Prisma client sudah di-generate
3. ⏳ Tambahkan menu navigasi ke halaman-halaman produksi
4. ⏳ (Optional) Tambahkan role permissions untuk akses proses produksi
5. ⏳ (Optional) Implementasikan PDF export untuk laporan
6. ⏳ (Optional) Dashboard widget untuk monitoring produksi

## Testing Checklist

- [ ] Test create proses produksi dengan status DRAFT
- [ ] Test create dengan status COMPLETED (stock harus berkurang)
- [ ] Test edit proses produksi
- [ ] Test update status DRAFT → COMPLETED
- [ ] Test update status COMPLETED → DRAFT (stock harus kembali)
- [ ] Test delete proses produksi
- [ ] Test validasi stock tidak mencukupi
- [ ] Test auto-calculate rendemen
- [ ] Test laporan harian dengan berbagai periode
- [ ] Test export CSV
- [ ] Test pagination
- [ ] Test filter

---

**Implementasi Selesai!** 🎉

Semua file telah dibuat dan migration sudah dijalankan. Modul siap untuk digunakan setelah menambahkan menu navigasi.
