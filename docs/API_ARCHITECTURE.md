# API Architecture & Design Patterns: htgroupapp

Dokumen ini menjelaskan desain arsitektur backend, pola komunikasi API, dan implementasi multi-tenancy dalam sistem **htgroupapp**.

## 🏗️ Design Patterns

Sistem ini mengikuti pola **Separation of Concerns (SoC)** dengan tiga layer utama di sisi server:

### 1. Route Layer (`src/app/api/...`)
- Bertanggung jawab sebagai entry point HTTP request.
- Melakukan ekstraksi session (NextAuth) dan validasi `companyId`.
- Memanggil *Service Layer* dan mengembalikan response JSON.

### 2. Service Layer (`src/server/services/...`)
- Berisi logika bisnis (Business Logic).
- Melakukan validasi data menggunakan **Zod**.
- Orkestrasi antar repository (contoh: Mengurangi stok material saat menerima TBS).
- Memastikan integritas data sebelum disimpan.

### 3. Repository Layer (`src/server/repositories/...`)
- Abstraksi komunikasi langsung dengan database melalui **Prisma**.
- Berisi query-query spesifik (CRUD, Aggregations, Complex Filters).
- Menghindari logika bisnis yang kompleks agar reusable.

## 🌍 Multi-Tenancy Implementation

Sistem menggunakan pendekatan **Shared Database & Shared Schema** dengan isolasi data di level aplikasi.

### Identifikasi Tenant
- **Header/Session**: `companyId` diambil dari session user yang login.
- **Middleware isolation**: `src/middleware.ts` memastikan user hanya dapat mengakses rute yang sesuai dengan domain atau perusahaan tempat mereka terdaftar.

### Data Isolation
Setiap query ke database di level repository **WAJIB** menyertakan parameter `companyId`.
```typescript
// Contoh di Repository
async findByCompanyId(companyId: string) {
  return db.material.findMany({
    where: { companyId }
  });
}
```

## 🔐 RBAC (Role-Based Access Control)

Hak akses dikelola secara dinamis melalui permission JSON yang disimpan di tabel `Role`.

- **Permissions Structure**: 
  ```json
  {
    "dashboard": ["read"],
    "penerimaan-tbs": ["read", "create", "update", "delete"],
    "finance": ["read", "approve"]
  }
  ```
- **Validation**: Hook `useUserPermissions` di frontend dan utilitas `rbac.ts` di backend digunakan untuk melakukan pengecekan hak akses sebelum merender komponen atau mengeksekusi aksi.

## 📡 API Response Pattern

Semua API mengembalikan format yang konsisten:
- **Success**: `{ success: true, data: ... }`
- **Error**: `{ success: false, error: "Error message" }`
- **Pagination**: 
  ```json
  {
    "data": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
  ```

---
*Dibuat otomatis oleh Antigravity untuk dokumentasi internal.*
