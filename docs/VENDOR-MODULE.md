# Vendor (Transportir) Module - Implementation Summary

## Overview
Modul Vendor mengelola data vendor transportir untuk PT PKS. Sistem ini mencakup informasi umum vendor, data kendaraan dan supir, informasi pajak, dan data rekening bank untuk pembayaran jasa transportasi.

## Database Schema

### Model Vendor
Menyimpan informasi vendor transportir dengan field:
- **Informasi Umum**: code, name, contactPerson, email, phone, address
- **Informasi Kendaraan**: nomorKendaraan, jenisKendaraan (Truk, Trailer, dll)
- **Informasi Supir**: namaSupir, noHpSupir
- **Informasi Pajak**: npwp, taxStatus (NON_PKP, PKP_11, PKP_1_1)
- **Informasi Rekening**: bankName, accountNumber, accountName
- **Status**: status (ACTIVE/INACTIVE)

### Unique Constraints
- `code`: Kode vendor harus unik
- `nomorKendaraan` + `companyId`: Nomor kendaraan harus unik per company

## Fitur Utama

### 1. Auto-Generate Kode Vendor
Format: `VND-{YY}-{XXXX}`
- VND: Prefix untuk Vendor
- YY: 2 digit tahun (contoh: 24 untuk 2024)
- XXXX: Nomor urut 4 digit (0001, 0002, dst)

Contoh: `VND-24-0001`, `VND-24-0002`

### 2. Manajemen Data Vendor
- **Create**: Tambah vendor baru dengan validasi kode dan nomor kendaraan unik
- **Read**: Tampilkan list vendor dengan pencarian dan filter
- **Update**: Update data vendor
- **Delete**: Hapus vendor (tidak bisa dihapus jika sudah digunakan)

### 3. Pencarian dan Filter
- Pencarian berdasarkan: nama vendor, kode, nomor kendaraan, nama supir
- Filter berdasarkan status: ACTIVE/INACTIVE

### 4. Validasi Data
- Kode vendor wajib diisi dan harus unik
- Nama vendor wajib diisi
- Contact person wajib diisi
- Nomor telepon wajib diisi
- Alamat wajib diisi
- Nomor kendaraan wajib diisi dan harus unik
- Nama supir wajib diisi
- Status pajak wajib dipilih

## Layer Arsitektur

### 1. Schema Layer (`src/server/schema/vendor.ts`)
Validasi Zod untuk operasi CRUD vendor:
- `createVendorSchema`: Validasi create vendor
- `updateVendorSchema`: Validasi update vendor
- `vendorQuerySchema`: Validasi query parameters
- `vendorIdSchema`: Validasi vendor ID

### 2. Repository Layer (`src/server/repositories/vendor.repository.ts`)
Interaksi dengan database menggunakan Prisma:
- `findByCompanyId()`: Get vendors dengan pagination dan filter
- `findById()`: Get vendor by ID
- `findByCode()`: Get vendor by code
- `isCodeExists()`: Check apakah kode sudah digunakan
- `isNomorKendaraanExists()`: Check apakah nomor kendaraan sudah digunakan
- `create()`: Create vendor baru
- `update()`: Update vendor
- `delete()`: Delete vendor
- `findActiveVendors()`: Get active vendors untuk dropdown
- `getStatistics()`: Get statistik vendor

### 3. Service Layer (`src/server/services/pt-pks/vendor.service.ts`)
Business logic untuk vendor operations:
- `getVendors()`: Get vendors dengan pagination
- `getVendorById()`: Get detail vendor
- `getActiveVendors()`: Get active vendors
- `getVendorStatistics()`: Get statistik
- `createVendor()`: Create vendor dengan validasi
- `updateVendor()`: Update vendor dengan validasi
- `deleteVendor()`: Delete vendor
- `generateVendorCode()`: Generate kode vendor otomatis

### 4. API Routes (`src/app/api/pt-pks/vendor/`)

#### GET `/api/pt-pks/vendor`
Get all vendors dengan query parameters:
- `search`: Pencarian
- `status`: Filter status
- `page`: Nomor halaman
- `limit`: Items per halaman
- `dropdown=true`: Get active vendors untuk dropdown
- `stats=true`: Get statistics

#### POST `/api/pt-pks/vendor`
Create vendor baru dengan request body sesuai `createVendorSchema`.

#### GET `/api/pt-pks/vendor/[id]`
Get detail vendor by ID.

#### PUT `/api/pt-pks/vendor/[id]`
Update vendor dengan request body sesuai `updateVendorSchema`.

#### DELETE `/api/pt-pks/vendor/[id]`
Delete vendor by ID.

#### GET `/api/pt-pks/vendor/generate-code`
Generate kode vendor baru otomatis.

## Komponen UI

### 1. VendorTable (`src/components/dashboard/pt-pks/vendor/vendor-table.tsx`)
Tabel untuk menampilkan list vendors dengan fitur:
- Pencarian dan filter
- Pagination
- Actions: View, Edit, Delete
- Display nomor kendaraan dengan icon
- Status badge
- Tax status badge

### 2. VendorForm (`src/components/dashboard/pt-pks/vendor/vendor-form.tsx`)
Form untuk create/edit vendor dengan sections:
- **Informasi Umum**: Data identitas vendor
- **Informasi Kendaraan dan Supir**: Data kendaraan dan pengemudi
- **Informasi Pajak**: NPWP dan status pajak
- **Informasi Rekening**: Data bank untuk pembayaran

Fitur:
- Auto-generate kode vendor
- Validasi real-time menggunakan react-hook-form + Zod
- Disable kode saat edit mode

### 3. VendorDetail (`src/components/dashboard/pt-pks/vendor/vendor-detail.tsx`)
Tampilan detail vendor dengan sections:
- Informasi umum
- Informasi kendaraan dan supir (dengan icon)
- Informasi pajak dengan keterangan
- Informasi rekening
- Informasi sistem (created date)

## Role-Based Access Control (RBAC)

### Roles yang Memiliki Akses:
- **Admin**: Full access (CRUD)
- **Manager PT PKS**: Full access (CRUD)
- **Staff PT PKS**: Read & Create & Update

### Permissions:
- View vendors: Admin, Manager PT PKS, Staff PT PKS
- Create vendor: Admin, Manager PT PKS, Staff PT PKS
- Update vendor: Admin, Manager PT PKS, Staff PT PKS
- Delete vendor: Admin, Manager PT PKS (only)

## Navigasi

### Menu Location
Master Data > Vendor

### Routes
- List: `/dashboard/pt-pks/master/vendor`
- Create: `/dashboard/pt-pks/master/vendor/new`
- Detail: `/dashboard/pt-pks/master/vendor/[id]`
- Edit: `/dashboard/pt-pks/master/vendor/[id]/edit`

## Status Pajak

### NON_PKP (Non Pengusaha Kena Pajak)
- Tidak dikenakan PPN
- Rate: 0%

### PKP_11 (Pengusaha Kena Pajak 11%)
- Dikenakan PPN 11%
- Rate: 11%

### PKP_1_1 (Pengusaha Kena Pajak 1.1%)
- Dikenakan PPN 1.1%
- Rate: 1.1%

## Use Case Examples

### 1. Menambah Vendor Baru
1. Klik "Tambah Vendor" di halaman list
2. Klik "Generate" untuk auto-generate kode
3. Isi informasi umum vendor
4. Isi nomor kendaraan dan nama supir
5. Pilih status pajak
6. Isi informasi rekening (opsional)
7. Klik "Simpan"

### 2. Mencari Vendor
- Ketik nama vendor, nomor kendaraan, atau nama supir di search box
- Pilih filter status jika diperlukan

### 3. Menggunakan Vendor di Transaksi
- Vendor dapat dipilih di modul Penerimaan TBS
- Data kendaraan dan supir otomatis terisi
- Informasi pajak digunakan untuk perhitungan biaya transportasi

## Data Relationships

### Vendor dapat digunakan di:
- Modul Penerimaan TBS (untuk data transportir)
- Modul Pembayaran Vendor (future implementation)
- Laporan Transportasi (future implementation)

## Migration Files
- `20251203043155_add_vendor_and_vendor_contract_models`: Initial migration
- `20251203043453_update_vendor_model_simplified`: Simplified model

## Tech Stack
- **Backend**: Next.js 14 App Router, Prisma ORM
- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Validation**: Zod
- **Form**: React Hook Form
- **Database**: PostgreSQL

## Future Enhancements
1. Kontrak vendor untuk jasa transportasi
2. Tracking history penggunaan vendor
3. Rating dan review vendor
4. Laporan biaya transportasi per vendor
5. Integrasi dengan GPS tracking kendaraan
6. Management dokumen vendor (STNK, KIR, dll)
7. Reminder perpanjangan dokumen kendaraan

## Notes
- Vendor ini berbeda dengan model Transporter yang sudah ada
- Vendor lebih lengkap dengan informasi pajak dan rekening
- Satu vendor = satu kendaraan dengan satu supir
- Jika ada beberapa kendaraan dari vendor yang sama, buat entry vendor terpisah untuk setiap kendaraan
