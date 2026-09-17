# Role-Based Access Control (RBAC) untuk Modul Payroll

## Overview
Modul Payroll (Penggajian) sudah dilengkapi dengan sistem Role-Based Access Control (RBAC) yang komprehensif. Sistem ini memastikan setiap user hanya dapat melakukan aksi yang sesuai dengan permissions role mereka.

## Struktur Permission untuk Payroll

### Module: `payroll.penggajian`

Permission terdiri dari 5 aksi:
- **view** - Melihat data penggajian
- **create** - Menambah data penggajian baru
- **edit** - Mengubah data penggajian
- **delete** - Menghapus data penggajian
- **approve** - Menyetujui penggajian (untuk workflow approval)

## Implementasi di API Routes

### 1. GET `/api/pt-pks/penggajian`
**Permission Required:** `payroll.penggajian` - `view`

```typescript
// GET /api/pt-pks/penggajian - Get all penggajian
export async function GET(request: Request) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "view");
  if (error) return error;
  
  // ... rest of the code
}
```

**Fungsi:**
- Menampilkan daftar data penggajian
- Filter berdasarkan devisi, periode bulan/tahun
- Menampilkan summary statistik penggajian

### 2. POST `/api/pt-pks/penggajian`
**Permission Required:** `payroll.penggajian` - `create`

```typescript
// POST /api/pt-pks/penggajian - Create new penggajian
export async function POST(request: Request) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "create");
  if (error) return error;
  
  // ... rest of the code
}
```

**Fungsi:**
- Menambahkan data penggajian karyawan baru
- Hanya user dengan permission `create` yang bisa menambah data

### 3. PUT `/api/pt-pks/penggajian/[id]`
**Permission Required:** `payroll.penggajian` - `edit`

```typescript
// PUT /api/pt-pks/penggajian/[id] - Update penggajian
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "edit");
  if (error) return error;
  
  // ... rest of the code
}
```

**Fungsi:**
- Mengubah data penggajian yang sudah ada
- Hanya user dengan permission `edit` yang bisa mengubah data

### 4. DELETE `/api/pt-pks/penggajian/[id]`
**Permission Required:** `payroll.penggajian` - `delete`

```typescript
// DELETE /api/pt-pks/penggajian/[id] - Delete penggajian
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "delete");
  if (error) return error;
  
  // ... rest of the code
}
```

**Fungsi:**
- Menghapus data penggajian
- Hanya user dengan permission `delete` yang bisa menghapus data

### 5. POST `/api/pt-pks/penggajian/generate`
**Permission Required:** `payroll.penggajian` - `create`

**Fungsi:**
- Generate otomatis data penggajian dari master karyawan
- Memerlukan permission yang sama dengan create karena membuat data baru

### 6. POST `/api/pt-pks/penggajian/import`
**Permission Required:** `payroll.penggajian` - `create`

**Fungsi:**
- Import data penggajian dari file Excel
- Memerlukan permission create untuk menambah data

## Cara Kerja RBAC

### 1. Authentication & Authorization Flow

```
Request → Middleware (Auth Check) → API Route (Permission Check) → Database → Response
```

#### Step-by-step:

**A. Middleware Level (`src/middleware.ts`)**
- Cek apakah user sudah login
- Cek apakah user memiliki role
- Cek apakah user mengakses company yang benar
- Redirect jika tidak authorize

**B. API Route Level**
- Menggunakan helper function `requireAuthWithPermission()`
- Cek permission di database berdasarkan role user
- Return 403 (Forbidden) jika tidak memiliki permission

### 2. Helper Function: `requireAuthWithPermission()`

Location: `src/lib/api-auth.ts`

```typescript
export async function requireAuthWithPermission(
  module: PermissionModule,  // e.g., "payroll.penggajian"
  action: PermissionAction,  // e.g., "view", "create", "edit", "delete", "approve"
  companyCode?: string
) {
  // 1. Cek authentication
  const { error: permError, session, hasPermission } = await requirePermission(module, action);
  if (permError) return { error: permError, session: null };

  // 2. Cek company access (optional)
  if (companyCode) {
    const { error: companyError } = requireCompany(session, companyCode);
    if (companyError) return { error: companyError, session: null };
  }

  return { error: null, session };
}
```

### 3. Database Permission Check

Location: `src/lib/rbac.ts`

```typescript
export async function checkDbPermission(
  roleId: string,
  module: PermissionModule,
  action: PermissionAction
): Promise<boolean> {
  const role = await db.role.findUnique({
    where: { id: roleId },
    select: { name: true, permissions: true },
  });

  if (!role) return false;

  // Admin role always has full access
  if (role.name === "Admin") return true;

  const permissions = role.permissions as DbPermission | null;
  if (!permissions) return false;

  // Parse module path (e.g., "payroll.penggajian")
  const [category, subModule] = module.split(".");
  
  // Navigate: permissions.payroll.penggajian.create
  const categoryPermissions = permissions[category];
  const modulePermissions = categoryPermissions[subModule];
  
  return modulePermissions[action] === true;
}
```

## Contoh Skenario Permission

### Skenario 1: Admin Role
**Role:** Admin  
**Permissions:** Full access to all modules

```json
{
  "payroll": {
    "penggajian": {
      "view": true,
      "create": true,
      "edit": true,
      "delete": true,
      "approve": true
    }
  }
}
```

**Hasil:**
- ✅ Dapat melihat semua data penggajian
- ✅ Dapat menambah data penggajian baru
- ✅ Dapat mengubah data penggajian
- ✅ Dapat menghapus data penggajian
- ✅ Dapat approve penggajian

### Skenario 2: Manager Payroll
**Role:** Manager Payroll  
**Permissions:** View, Create, Edit only

```json
{
  "payroll": {
    "penggajian": {
      "view": true,
      "create": true,
      "edit": true,
      "delete": false,
      "approve": false
    }
  }
}
```

**Hasil:**
- ✅ Dapat melihat semua data penggajian
- ✅ Dapat menambah data penggajian baru
- ✅ Dapat mengubah data penggajian
- ❌ Tidak dapat menghapus data penggajian (403 Forbidden)
- ❌ Tidak dapat approve penggajian

### Skenario 3: Staff Payroll
**Role:** Staff Payroll  
**Permissions:** View and Create only

```json
{
  "payroll": {
    "penggajian": {
      "view": true,
      "create": true,
      "edit": false,
      "delete": false,
      "approve": false
    }
  }
}
```

**Hasil:**
- ✅ Dapat melihat semua data penggajian
- ✅ Dapat menambah data penggajian baru
- ❌ Tidak dapat mengubah data penggajian (403 Forbidden)
- ❌ Tidak dapat menghapus data penggajian
- ❌ Tidak dapat approve penggajian

### Skenario 4: Viewer Only
**Role:** Payroll Viewer  
**Permissions:** View only

```json
{
  "payroll": {
    "penggajian": {
      "view": true,
      "create": false,
      "edit": false,
      "delete": false,
      "approve": false
    }
  }
}
```

**Hasil:**
- ✅ Dapat melihat semua data penggajian
- ❌ Tidak dapat menambah data penggajian (403 Forbidden)
- ❌ Tidak dapat mengubah data penggajian
- ❌ Tidak dapat menghapus data penggajian
- ❌ Tidak dapat approve penggajian

## Cara Mengatur Permission Role

### 1. Melalui UI Settings

1. Login sebagai Admin
2. Navigasi ke **Settings → Roles**
3. Pilih role yang ingin diatur atau buat role baru
4. Di bagian **Payroll**, cari modul **Penggajian**
5. Centang permission yang diinginkan:
   - [x] View
   - [x] Create
   - [x] Edit
   - [ ] Delete
   - [ ] Approve
6. Klik **Simpan**

### 2. Melalui Database (Manual)

```sql
UPDATE "Role"
SET permissions = jsonb_set(
  permissions,
  '{payroll,penggajian}',
  '{"view": true, "create": true, "edit": false, "delete": false, "approve": false}'
)
WHERE id = 'role-id-here';
```

### 3. Melalui Seed Data

Edit file `prisma/seed.ts`:

```typescript
const managerRole = await prisma.role.create({
  data: {
    name: "Manager Payroll",
    description: "Manager dengan akses terbatas payroll",
    companyId: company.id,
    permissions: {
      payroll: {
        penggajian: {
          view: true,
          create: true,
          edit: true,
          delete: false,
          approve: false,
        },
      },
    },
  },
});
```

## Testing Permission

### 1. Test dengan Postman/Thunder Client

```bash
# Login sebagai user dengan role tertentu
POST /api/auth/callback/credentials
{
  "email": "staff@pt-pks.com",
  "password": "password123"
}

# Coba akses endpoint yang tidak punya permission
GET /api/pt-pks/penggajian
# Expected: 200 OK (jika punya view permission)

POST /api/pt-pks/penggajian
# Expected: 403 Forbidden (jika tidak punya create permission)
```

### 2. Test di Browser

1. Login dengan user yang berbeda-beda role
2. Coba akses menu Payroll → Penggajian
3. Tombol "Import Excel" hanya muncul jika punya permission `create`
4. Tombol "Generate Penggajian" hanya muncul jika punya permission `create`
5. Tombol "Export" hanya muncul jika punya permission `view`
6. Tombol "Hapus" hanya muncul jika punya permission `delete`
7. Tombol action di row (Edit, dll) sesuai dengan permission

## Error Responses

### 401 Unauthorized
User belum login atau session expired

```json
{
  "error": "Unauthorized"
}
```

**Solusi:** Login ulang

### 403 Forbidden - No Role
User tidak memiliki role yang assigned

```json
{
  "error": "Forbidden - No role assigned"
}
```

**Solusi:** Admin perlu assign role ke user

### 403 Forbidden - No Permission
User tidak memiliki permission untuk aksi tertentu

```json
{
  "error": "Forbidden - Insufficient permissions"
}
```

**Solusi:** Admin perlu update permission di role user

## Best Practices

### 1. Principle of Least Privilege
- Berikan permission minimum yang diperlukan untuk user menjalankan tugasnya
- Jangan langsung berikan semua permission

### 2. Role Hierarchy
Buat role hierarchy yang jelas:

```
Admin (Full Access)
  └── Manager Payroll (View, Create, Edit, Approve)
      └── Staff Payroll (View, Create, Edit)
          └── Payroll Viewer (View Only)
```

### 3. Audit Trail
- Log setiap aksi yang dilakukan user
- Track siapa yang create/edit/delete data penggajian
- Implementasi di future: tambah field `createdBy`, `updatedBy` di table

### 4. Regular Permission Review
- Review permission setiap 3-6 bulan
- Hapus permission yang tidak diperlukan
- Update permission sesuai perubahan job description

## Troubleshooting

### Problem: User tidak bisa akses halaman penggajian
**Kemungkinan:**
1. User tidak punya permission `view` di `payroll.penggajian`
2. User belum di-assign role
3. User mengakses company yang salah

**Solusi:**
1. Cek permission role user di Settings → Roles
2. Pastikan user sudah di-assign role
3. Pastikan user login ke company yang benar

### Problem: Tombol "Import Excel" atau "Generate" tidak muncul
**Kemungkinan:**
- User tidak punya permission `create` di `payroll.penggajian`

**Solusi:**
- Admin update permission role user untuk enable `create`

### Problem: Error 403 saat save data
**Kemungkinan:**
- User punya permission `view` tapi tidak punya `create` atau `edit`

**Solusi:**
- Cek network tab di browser untuk lihat endpoint mana yang return 403
- Update permission sesuai kebutuhan (create/edit)

## API Endpoints Summary

| Endpoint | Method | Permission Required | Description |
|----------|--------|-------------------|-------------|
| `/api/pt-pks/penggajian` | GET | `view` | List semua penggajian |
| `/api/pt-pks/penggajian` | POST | `create` | Tambah penggajian baru |
| `/api/pt-pks/penggajian/[id]` | GET | `view` | Detail penggajian |
| `/api/pt-pks/penggajian/[id]` | PUT | `edit` | Update penggajian |
| `/api/pt-pks/penggajian/[id]` | DELETE | `delete` | Hapus penggajian |
| `/api/pt-pks/penggajian/generate` | POST | `create` | Generate dari master |
| `/api/pt-pks/penggajian/import` | POST | `create` | Import dari Excel |
| `/api/pt-pks/penggajian/export` | GET | `view` | Export ke Excel |
| `/api/pt-pks/penggajian/[id]/pdf` | GET | `view` | Download slip gaji PDF |

## Kesimpulan

Sistem RBAC untuk modul Payroll sudah fully implemented dan siap digunakan. Setiap aksi (view, create, edit, delete, approve) sudah ter-protect dengan permission check di level API. Admin dapat dengan mudah mengatur permission untuk setiap role melalui UI Settings, dan user akan otomatis mendapatkan akses sesuai dengan permission role mereka.

**Key Points:**
- ✅ Authentication & Authorization sudah terintegrasi
- ✅ Permission check di semua API endpoints
- ✅ Role-based menu filtering (hide/show berdasarkan permission)
- ✅ Granular permission control (view/create/edit/delete/approve)
- ✅ Admin role always has full access
- ✅ Easy permission management via UI

Untuk pertanyaan lebih lanjut atau custom permission requirements, silakan hubungi tim development.
