# Technical Flows & Sequences: htgroupapp

Dokumen ini menjelaskan alur teknis proses bisnis kritis dalam sistem **htgroupapp** menggunakan diagram Mermaid.

## 1. Alur Penerimaan TBS (Stage 1-4)
Proses dari pendaftaran kendaraan hingga penyelesaian transaksi dan update stok.

```mermaid
graph TD
    A[Portal Masuk: Registrasi] --> B[Step 1: Data Kendaraan & Supplier]
    B --> C[Step 2: Timbang Bruto]
    C --> D{Kirim Ke Pabrik/Bongkar}
    D --> E[Step 3: Timbang Tarra]
    E --> F[Kalkulasi Netto & Potongan]
    F --> G[Step 4: Input Harga & Upah Bongkar]
    G --> H[Status: COMPLETED]
    H --> I[Update Stock Material TBS]
```

## 2. Sequence Diagram: Weighing Scale Integration
Bagaimana data diambil secara otomatis dari timbangan vendor.

```mermaid
sequenceDiagram
    participant FE as Frontend (Browser)
    participant API as API Server (Next.js)
    participant VR as Vendor Router/Timbangan
    participant DB as Buffer (Prisma/DB)

    Note over VR, DB: Vendor melakuan POST data berat secara berkala
    VR->>API: POST /api/weighing/receive
    API->>DB: Simpan berat ke Buffer (Latest)
    
    Note over FE, API: User menekan tombol "Baca dari Timbangan"
    FE->>API: GET /api/weighing/read
    API->>DB: Ambil data berat terbaru dari Buffer
    DB-->>API: Data Berat (kg)
    API-->>FE: Return Weight Data
    FE->>FE: Update Form Field
```

## 3. Alur Produksi & Stok
Siklus pengolahan bahan baku menjadi produk jadi.

```mermaid
graph LR
    TBS[(Stok TBS)] --> Proc[Proses Produksi]
    Proc --> CPO[Hasil: CPO]
    Proc --> PK[Hasil: Kernel]
    Proc --> Shell[Hasil: Shell]
    
    CPO --> Tank[(Tangki Timbun)]
    PK --> Warehouse[(Gudang Kernel)]
    
    Note right of Proc: Kalkulasi Rendemen Otomatis
```

## 4. State Transition: Penerimaan TBS
Diagram ini menunjukkan perubahan status pada entitas `PenerimaanTBS` berdasarkan aksi user.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create (Step 1)
    DRAFT --> TIMBANG_BRUTO : Input Bruto (Step 2)
    TIMBANG_BRUTO --> TIMBANG_TARRA : Input Tarra (Step 3)
    TIMBANG_TARRA --> PENDING_HARGA : Tarra Complete
    PENDING_HARGA --> COMPLETED : Input Harga (Step 4)
    
    DRAFT --> CANCELLED : Cancel
    TIMBANG_BRUTO --> CANCELLED : Cancel
    TIMBANG_TARRA --> CANCELLED : Cancel
    PENDING_HARGA --> CANCELLED : Cancel
    
    COMPLETED --> [*] : Locked (Stock Updated)
```

## 5. RBAC JSON Structure & Check Logic
Hak akses (permissions) disimpan di dalam model `Role` sebagai field `Json`.

### Struktur Izin (Permissions JSON)
Format yang digunakan memungkinkan kontrol per module dan per action.
```json
{
  "resources": {
    "tbs-penerimaan": ["read", "create", "update", "delete", "export"],
    "produksi": ["read", "process"],
    "finance-invoice": ["read", "create", "pay"],
    "settings-user": ["read", "write"]
  }
}
```

### Mekanisme Pengecekan (Logic)
- **Frontend**: Komponen `<PermissionGuard permission="tbs-penerimaan.create">` akan melakukan pengecekan terhadap array permissions dalam session user. Jika tidak memiliki izin, anak komponen tidak akan dirender.
- **Backend (API)**: Fungsi `checkPermission(session, "tbs-penerimaan", "create")` dijalankan di awal handler API untuk memastikan keamanan data di tingkat server.

---
*Dibuat otomatis oleh Antigravity untuk dokumentasi internal.*

