# Features Inventory: htgroupapp

Dokumen ini merangkum seluruh fitur utama yang diimplementasikan dalam sistem **htgroupapp**, diklasifikasikan berdasarkan modul bisnis.

## 👥 1. Master Data & Management
Fungsi dasar pengelola entitas sistem.
- **User Management**: Pengelolaan akun, profil, dan penempatan perusahaan.
- **RBAC Management**: Pengaturan Role dan izin akses (Permissions).
- **Company Management**: Pengelolaan data entitas bisnis (PT).
- **Supplier & Transporter**: Database pemasok TBS dan armada angkutan.
- **Material & Asset**: Katalog barang, kategori material, dan satuan.
- **Master Kepegawaian**: Divisi, Jabatan, dan Karyawan.

## 🚜 2. Operasional PKS (Pabrik Kelapa Sawit)
Fungsi inti operasional pabrik dengan kontrol data yang ketat.

### 📥 Penerimaan TBS (Tandan Buah Segar)
Proses multi-step dengan validasi status (`statusPenerimaanEnum`): `DRAFT`, `TIMBANG_BRUTO`, `TIMBANG_TARRA`, `PENDING_HARGA`, `COMPLETED`, `CANCELLED`.

- **Step 1: Registrasi Kedatangan**
    - **Fields**: `tanggalTerima`, `materialId`, `supplierId`, `transporterId`, `operatorPenimbang`, `lokasiKebun`, `jenisBuah` (TBS-BB, TBS-BS, TBS-BK).
    - **Logic**: Penomoran otomatis (`TBS-YYYYMM-XXXXX`). Integrasi pembuatan data `Transporter` baru secara inline jika belum terdaftar.
- **Step 2: Timbang Bruto (Masuk)**
    - **Fields**: `beratBruto`, `waktuTimbangBruto`, `metodeBruto` (Manual/Sistem).
    - **Status Change**: `DRAFT` → `TIMBANG_BRUTO`.
- **Step 3: Timbang Tarra (Keluar) & Potongan**
    - **Fields**: `beratTarra`, `waktuTimbangTarra`, `metodeTarra`, `potonganPersen`.
    - **Calculation Logic**:
        - `Netto 1` = `Bruto` - `Tarra`
        - `Potongan (kg)` = (`Netto 1` * `potonganPersen`) / 100
        - `Netto 2 (Final)` = `Netto 1` - `Potongan (kg)`
    - **Status Change**: `TIMBANG_BRUTO` → `TIMBANG_TARRA` / `PENDING_HARGA`.
- **Step 4: Penentuan Harga & Upah Bongkar**
    - **Fields**: `hargaPerKg`, `upahBongkar` (default: 16), `vendorBongkarId`, `selectedBankAccount`.
    - **Calculation Logic**:
        - `Total Bayar` = `Netto 2` * `hargaPerKg`
        - `Total Upah Bongkar` = `Netto 2` * `upahBongkar`
    - **Stock Impact**: Menambah `StockMaterial` saat status menjadi `COMPLETED`.

### ⚖️ Weighing Integration (Bridge)
- **Receive Endpoint**: `/api/weighing/receive` (POST) - Digunakan hardware vendor untuk mendorong data berat terbaru.
- **Read Endpoint**: `/api/weighing/read` (GET) - Digunakan frontend untuk mengambil data berat terbaru dari buffer tanpa input manual.

### 🏭 Proses Produksi
- **Kalkulasi Rendemen**: Menghitung efisiensi pengolahan.
    - `Rendemen (%)` = (`jumlahOutput` / `jumlahInput`) * 100.
- **Stock Impact**: Mengurangi stok bahan baku (`MaterialInput`) dan menambah stok hasil produksi (`MaterialOutput`) secara atomik.

### 🛢️ Tangki & Stock Management
- **Tangki Monitoring**: Kapasitas vs Isi (kg/liter).
- **Stock Movement Log**: Pencatatan setiap transaksi `MASUK`, `KELUAR`, `TRANSFER`, atau `ADJUSTMENT` dengan tracking `operator` dan `referensi`.

## 🚛 3. Logistik & Sales
Manajemen rantai pasok dan komitmen penjualan.

### 🤝 Sales & E-Contract
- **Buyer Management**
    - **Fields**: `code` (BYR-XXXX), `taxStatus` (NON_PKP, PKP_11, PKP_1_1), `bankAccounts`.
- **E-Contract (Buyer)**
    - **Fields**: `contractNumber`, `deliveryDate`, `items` (Material, Quantity, UnitPrice), `paymentMethod`.
    - **Tax Logic**: 
        - `NON_PKP`: 0%
        - `PKP_11`: 11%
        - `PKP_1_1`: 1.1%
    - **Payment Status**: `UNPAID`, `PARTIAL`, `PAID` - Terhitung otomatis berdasarkan `paidAmount` vs `totalAmount`.
    - **Contract Status**: `DRAFT`, `ACTIVE`, `COMPLETED`, `CANCELLED`.

### 📦 Pengiriman Product & Logistics
- **Vendor & Vehicle Management**: Tracking armada vendor pihak ketiga (`VendorVehicle`) lengkap dengan data supir dan nomor polisi.
- **Pengiriman Product (DO)**:
    - Integrasi stok tangki: Mengurangi stok `Tangki` secara otomatis saat produk dikirim.
    - Tracking: Menghubungkan nomor kontrak dengan jumlah aktual yang dikirim (`deliveredQuantity`).

## 💰 4. Finance & Accounting
Automasi pencatatan keuangan berbasis operasional.
- **Invoice & Billing**: Penagihan otomatis kepada Buyer berdasarkan data `PengirimanProduct` yang telah selesai.
- **Pembayaran Supplier**: 
    - **Logic**: Menghitung hutang kepada supplier TBS berdasarkan `Total Bayar` di modul Penerimaan TBS.
    - **Flow**: Approving pembayaran dan pencatatan history pelunasan.
- **Biaya Pengeluaran**: Pencatatan pengeluaran non-produksi dengan kategori biaya yang dinamis.
- **Payroll (Penggajian)**: 
    - Perhitungan otomatis gaji pokok, tunjangan, dan potongan.
    - Integrasi master karyawan dan jabatan.

## 📊 5. Reporting & Analytics
Sistem pelaporan data terkonsolidasi.
- **Dashboard Summary**: Real-time stats untuk `Total TBS Masuk`, `Total Produksi`, dan `Financial Cashflow`.
- **TBS Statistics**: 
    - **Trend Analysis**: Grafik harian `TBS Masuk` vs `TBS Olah`.
    - **Supplier Performance**: Breakdown supply per supplier dalam periode tertentu.
- **Export Engine**:
    - **PDF**: Slip timbangan, Invoice, dan Laporan harian produksi.
    - **Excel**: Rekapitulasi transaksi bulanan untuk kebutuhan audit.

---
*Dibuat otomatis oleh Antigravity untuk dokumentasi internal.*

