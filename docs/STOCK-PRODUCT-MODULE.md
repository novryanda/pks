# Stock Product Module - Tangki Management

## Overview

Module Stock Product adalah sistem manajemen tangki penyimpanan untuk hasil produksi CPO (Crude Palm Oil), Kernel, dan produk lainnya. Sistem ini menyediakan:

1. **Visualisasi Tangki** - Tampilan grafis tangki dengan level pengisian
2. **Manajemen Stock** - Pencatatan stock masuk, keluar, dan transfer antar tangki
3. **Riwayat Transaksi** - Tracking lengkap semua pergerakan stock
4. **Summary Dashboard** - Ringkasan kapasitas dan pengisian tangki

## Database Schema

### Model Tangki
```prisma
model Tangki {
  id          String   @id @default(cuid())
  companyId   String
  materialId  String   // Material yang disimpan (CPO, Kernel, dll)
  namaTangki  String   // Nama tangki (T-001, Tank A, dll)
  kapasitas   Float    // Kapasitas maksimal tangki (dalam kg/liter)
  isiSaatIni  Float    @default(0) // Isi tangki saat ini
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  company     Company  @relation(...)
  material    Material @relation(...)
  riwayatStockTangki StockTangki[]
}
```

### Model StockTangki (Riwayat Transaksi)
```prisma
model StockTangki {
  id                String              @id @default(cuid())
  tangkiId          String
  tipeTransaksi     TipeTransaksiTangki // MASUK, KELUAR, TRANSFER, ADJUSTMENT
  jumlah            Float
  stockSebelum      Float
  stockSesudah      Float
  referensi         String?             // Nomor DO, Nomor Produksi, dll
  keterangan        String?
  operator          String
  tanggalTransaksi  DateTime
}

enum TipeTransaksiTangki {
  MASUK      // Dari hasil produksi
  KELUAR     // Untuk pengiriman/penjualan
  TRANSFER   // Transfer antar tangki
  ADJUSTMENT // Penyesuaian stock
}
```

## File Structure

```
src/
├── server/
│   ├── schema/
│   │   └── tangki.ts                    # Zod validation schemas
│   ├── repositories/
│   │   └── tangki.repository.ts         # Data access layer
│   └── services/
│       └── pt-pks/
│           └── tangki.service.ts        # Business logic
├── app/
│   └── api/
│       └── pt-pks/
│           └── tangki/
│               ├── route.ts             # GET all, POST create
│               ├── [id]/
│               │   └── route.ts         # GET, PUT, DELETE by ID
│               └── stock/
│                   ├── masuk/route.ts   # POST stock masuk
│                   ├── keluar/route.ts  # POST stock keluar
│                   ├── transfer/route.ts # POST transfer
│                   ├── history/route.ts # GET riwayat
│                   └── summary/route.ts # GET summary
└── components/
    └── dashboard/
        └── pt-pks/
            └── stock-product/
                ├── stock-product-list.tsx          # Main page
                ├── tank-visualization.tsx          # Tank visual component
                ├── tank-transaction-modal.tsx      # Transaction modal
                └── create-tank-modal.tsx           # Create tank modal
```

## API Endpoints

### Tangki Management

#### GET `/api/pt-pks/tangki`
Get all tangki or filter by material
- Query params: `materialId` (optional)
- Response: Array of tangki objects

#### POST `/api/pt-pks/tangki`
Create new tangki
```json
{
  "materialId": "cuid",
  "namaTangki": "T-001",
  "kapasitas": 100000
}
```

#### GET `/api/pt-pks/tangki/[id]`
Get tangki by ID with transaction history

#### PUT `/api/pt-pks/tangki/[id]`
Update tangki information
```json
{
  "namaTangki": "T-001A",
  "kapasitas": 120000
}
```

#### DELETE `/api/pt-pks/tangki/[id]`
Delete tangki (only if empty)

### Stock Operations

#### POST `/api/pt-pks/tangki/stock/masuk`
Add stock to tangki
```json
{
  "tangkiId": "cuid",
  "jumlah": 5000,
  "referensi": "PROD-2024-001",
  "keterangan": "Hasil produksi batch 1"
}
```

#### POST `/api/pt-pks/tangki/stock/keluar`
Remove stock from tangki
```json
{
  "tangkiId": "cuid",
  "jumlah": 3000,
  "referensi": "DO-2024-001",
  "keterangan": "Pengiriman ke customer A"
}
```

#### POST `/api/pt-pks/tangki/stock/transfer`
Transfer stock between tanks
```json
{
  "tangkiAsalId": "cuid",
  "tangkiTujuanId": "cuid",
  "jumlah": 2000,
  "keterangan": "Transfer untuk maintenance tangki"
}
```

#### GET `/api/pt-pks/tangki/stock/history`
Get stock transaction history
- Query params: `tangkiId`, `tipeTransaksi`, `tanggalMulai`, `tanggalSelesai`, `page`, `limit`

#### GET `/api/pt-pks/tangki/stock/summary`
Get stock summary grouped by material

## Features

### 1. Tank Visualization

Komponen `TankVisualization` menampilkan tangki dengan:
- **Visual tank** dengan liquid level indicator
- **Percentage display** di tengah tank
- **Color coding**:
  - 🔴 Merah: ≥95% (Penuh)
  - 🟡 Kuning: <20% (Rendah)
  - 🔵 Biru: 20-95% (Normal)
  - ⚪ Abu-abu: Kosong
- **Status badge** (Kosong, Penuh, Stock Rendah, Normal)
- **Clickable** untuk membuka modal transaksi

### 2. Transaction Modal

Modal dengan 3 tabs:
1. **Stock Masuk** - Input stock dari hasil produksi
2. **Stock Keluar** - Output stock untuk pengiriman
3. **Transfer** - Transfer antar tangki dengan material sama

Validasi otomatis:
- Stock masuk tidak boleh melebihi kapasitas
- Stock keluar tidak boleh melebihi stock tersedia
- Transfer hanya bisa ke tangki dengan material sama

### 3. Create Tank Modal

Form untuk membuat tangki baru:
- Pilih material (filter CPO/Kernel/Minyak)
- Input nama tangki
- Input kapasitas
- Validasi nama tangki unique per company

### 4. Dashboard Summary

Menampilkan:
- Total jumlah tangki
- Total kapasitas semua tangki
- Tingkat pengisian keseluruhan (%)
- Filter by material

## Business Rules

### Stock Management
1. **Stock Masuk**:
   - Validasi kapasitas tersisa
   - Update `isiSaatIni` tangki
   - Catat riwayat dengan `tipeTransaksi: MASUK`

2. **Stock Keluar**:
   - Validasi stock tersedia
   - Kurangi `isiSaatIni` tangki
   - Catat riwayat dengan `tipeTransaksi: KELUAR`

3. **Transfer**:
   - Validasi material sama antara tangki asal & tujuan
   - Validasi stock tersedia di tangki asal
   - Validasi kapasitas tersedia di tangki tujuan
   - Catat 2 riwayat transaksi (KELUAR dari asal, MASUK ke tujuan)

4. **Delete Tangki**:
   - Hanya tangki kosong yang bisa dihapus
   - Riwayat transaksi tetap tersimpan

### Integration dengan Proses Produksi

Saat proses produksi di-`COMPLETE`:
1. Stock TBS input dikurangi dari `StockMaterial`
2. Stock hasil produksi (CPO, Kernel) **HARUS diinputkan ke tangki**
3. Gunakan endpoint `POST /api/pt-pks/tangki/stock/masuk` dengan:
   - `referensi`: Nomor Produksi
   - `keterangan`: Detail batch produksi

**Contoh Flow**:
```
1. Proses Produksi COMPLETED
   → ProsesProduksi.nomorProduksi = "PROD-2024-001"
   → HasilProduksi: CPO = 5000 kg, Kernel = 1000 kg

2. Auto-create stock transaction ke tangki:
   POST /api/pt-pks/tangki/stock/masuk
   {
     "tangkiId": "tangki_cpo_1",
     "jumlah": 5000,
     "referensi": "PROD-2024-001",
     "keterangan": "Hasil produksi dari 50 ton TBS"
   }
   
   POST /api/pt-pks/tangki/stock/masuk
   {
     "tangkiId": "tangki_kernel_1", 
     "jumlah": 1000,
     "referensi": "PROD-2024-001",
     "keterangan": "Hasil produksi dari 50 ton TBS"
   }
```

## Usage Examples

### Membuat Tangki Baru
1. Klik tombol "Buat Tangki"
2. Pilih material (CPO/Kernel)
3. Masukkan nama tangki (T-001, Tank A, dll)
4. Input kapasitas dalam kg/liter
5. Klik "Simpan"

### Input Stock dari Hasil Produksi
1. Klik pada tangki yang ingin diisi
2. Pilih tab "Stock Masuk"
3. Input jumlah stock
4. (Optional) Input nomor referensi produksi
5. (Optional) Tambahkan keterangan
6. Klik "Simpan Stock Masuk"

### Mengeluarkan Stock untuk Pengiriman
1. Klik pada tangki
2. Pilih tab "Stock Keluar"
3. Input jumlah yang akan dikirim
4. Input nomor DO/referensi pengiriman
5. Tambahkan keterangan customer/tujuan
6. Klik "Simpan Stock Keluar"

### Transfer Antar Tangki
1. Klik pada tangki sumber
2. Pilih tab "Transfer"
3. Pilih tangki tujuan (harus material sama)
4. Input jumlah yang akan ditransfer
5. Tambahkan keterangan alasan transfer
6. Klik "Transfer Stock"

## Navigation

Menu location: **Gudang > Stock Product**

Path: `/dashboard/pt-pks/stock-product`

## Security & Permissions

Roles yang dapat akses:
- `Admin`
- `Manager PT PKS`
- `Staff PT PKS`
- `Staff Gudang`

## Future Enhancements

1. **Alert System**:
   - Email notification saat tangki hampir penuh (>90%)
   - Alert saat stock rendah (<10%)
   
2. **Maintenance Tracking**:
   - Jadwal cleaning tangki
   - History maintenance per tangki

3. **Temperature Monitoring** (jika ada sensor):
   - Real-time temperature tracking
   - Alert jika temperature tidak normal

4. **Stock Forecast**:
   - Prediksi kapan tangki akan penuh
   - Rekomendasi transfer/pengiriman

5. **Batch Tracking**:
   - FIFO (First In First Out) management
   - Quality control per batch

6. **PDF Export**:
   - Laporan stock per tangki
   - Laporan riwayat transaksi
   - Stock card per tangki

7. **Dashboard Analytics**:
   - Chart penggunaan tangki over time
   - Trend pengisian/pengosongan
   - Efficiency metrics

## Migration

Migration file: `20251117070329_add_tangki_stock_tangki_models`

To apply:
```bash
npx prisma migrate dev
```

To rollback (jika perlu):
```bash
npx prisma migrate reset
```

## Testing Checklist

- [ ] Create tangki dengan material CPO
- [ ] Create tangki dengan material Kernel
- [ ] Input stock masuk (validasi kapasitas)
- [ ] Input stock keluar (validasi stock tersedia)
- [ ] Transfer antar tangki (validasi material sama)
- [ ] View riwayat transaksi
- [ ] Filter tangki by material
- [ ] Update tangki name & capacity
- [ ] Delete tangki kosong
- [ ] Attempt delete tangki berisi (should fail)
- [ ] Tank visualization color coding
- [ ] Summary dashboard calculations

## Support & Maintenance

For issues or questions:
- Check console logs for detailed error messages
- Verify Prisma migrations are applied
- Check API endpoint responses
- Review transaction history for audit trail
