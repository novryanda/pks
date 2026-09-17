# Permission Fix Summary - Penggajian Module

## Masalah yang Ditemukan

User mendapat error **403 Forbidden** dengan pesan "Insufficient permissions" saat mencoba import data penggajian, meskipun tombol Import sudah muncul di UI.

### Root Cause
API routes untuk penggajian masih menggunakan **role-based authentication** (`requireAuthWithRole`) yang hardcoded untuk role tertentu (Admin, Manager PT PKS), bukan menggunakan **permission-based authentication** (`requireAuthWithPermission`) yang check dari database.

```typescript
// SEBELUM (Hardcoded role)
const { error } = await requireAuthWithRole(["Admin", "Manager PT PKS"]);

// SESUDAH (Permission-based dari database)
const { error } = await requireAuthWithPermission("payroll.penggajian", "create");
```

## File yang Diupdate

### 1. Import Route
**File:** `src/app/api/pt-pks/penggajian/import/route.ts`
- **Sebelum:** `requireAuthWithRole(["Admin", "Manager PT PKS"])`
- **Sesudah:** `requireAuthWithPermission("payroll.penggajian", "create")`
- **Permission Required:** `create`

### 2. Generate Route
**File:** `src/app/api/pt-pks/penggajian/generate/route.ts`
- **Sebelum:** `requireAuthWithRole(["Admin", "Manager PT PKS"])`
- **Sesudah:** `requireAuthWithPermission("payroll.penggajian", "create")`
- **Permission Required:** `create`

### 3. Export Route
**File:** `src/app/api/pt-pks/penggajian/export/route.ts`
- **Sebelum:** `requireAuthWithRole(["Admin", "Manager PT PKS", "Staff PT PKS"])`
- **Sesudah:** `requireAuthWithPermission("payroll.penggajian", "view")`
- **Permission Required:** `view`

### 4. PDF Route
**File:** `src/app/api/pt-pks/penggajian/[id]/pdf/route.ts`
- **Sebelum:** `requireAuthWithRole(["Admin", "Manager PT PKS", "Staff PT PKS"])`
- **Sesudah:** `requireAuthWithPermission("payroll.penggajian", "view")`
- **Permission Required:** `view`

### 5. HK Update Route
**File:** `src/app/api/pt-pks/penggajian/[id]/hk/route.ts`
- **Sebelum:** `requireAuthWithRole(["Admin", "Manager PT PKS", "Staff PT PKS"])`
- **Sesudah:** `requireAuthWithPermission("payroll.penggajian", "edit")`
- **Permission Required:** `edit`

## Cara Test

### 1. Verifikasi Permission di Database

```sql
-- Check permission role Anda
SELECT 
  r.name as role_name,
  r.permissions->'payroll'->'penggajian' as penggajian_permissions
FROM "Role" r
JOIN "User" u ON u."roleId" = r.id
WHERE u.email = 'your-email@pt-pks.com';
```

Expected result:
```json
{
  "view": true,
  "create": true,
  "edit": true,
  "delete": false,
  "approve": false
}
```

### 2. Test via UI

1. Login dengan akun Anda
2. Navigate ke Payroll → Penggajian
3. Click tombol "Import Excel"
4. Upload file dan submit
5. ✅ Seharusnya berhasil (200 OK)

### 3. Test via API

```bash
# Test import endpoint
curl -X POST http://localhost:3000/api/pt-pks/penggajian/import \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -F "file=@penggajian.xlsx" \
  -F "periodeBulan=1" \
  -F "periodeTahun=2026" \
  -F "replaceExisting=false"

# Expected: 200 OK dengan message success
```

## Jika Masih Error 403

### Cek 1: Apakah Role Sudah Punya Permission?

```
Settings → Roles → [Your Role] → Payroll → Penggajian
```

Pastikan minimal:
- ✅ View
- ✅ Create

### Cek 2: Clear Session & Login Ulang

```bash
# Clear browser cache and cookies
# Atau gunakan Incognito mode
# Login kembali
```

Session lama mungkin masih cache permission yang belum update.

### Cek 3: Verifikasi di Browser Console

```javascript
// Di browser console
fetch('/api/pt-pks/user/me/permissions')
  .then(r => r.json())
  .then(data => console.log(data))

// Should show your permissions
```

## Permission Matrix (Updated)

| Endpoint | Method | Permission | Action |
|----------|--------|------------|--------|
| `/api/pt-pks/penggajian` | GET | `view` | List data |
| `/api/pt-pks/penggajian` | POST | `create` | Create manual |
| `/api/pt-pks/penggajian/[id]` | GET | `view` | View detail |
| `/api/pt-pks/penggajian/[id]` | PUT | `edit` | Update data |
| `/api/pt-pks/penggajian/[id]` | DELETE | `delete` | Delete data |
| `/api/pt-pks/penggajian/import` | POST | `create` | Import Excel |
| `/api/pt-pks/penggajian/generate` | POST | `create` | Generate dari master |
| `/api/pt-pks/penggajian/export` | GET | `view` | Export to Excel |
| `/api/pt-pks/penggajian/[id]/pdf` | GET | `view` | Download PDF |
| `/api/pt-pks/penggajian/[id]/hk` | PUT | `edit` | Update HK/attendance |

## Benefits

✅ **Lebih Fleksibel:** Admin bisa customize permission tanpa perlu ubah code  
✅ **Konsisten:** Semua routes sekarang pakai permission-based check  
✅ **Scalable:** Mudah add role baru tanpa ubah API routes  
✅ **Granular Control:** Bisa set permission per action (view/create/edit/delete/approve)

## Next Steps

Jika masih ada module lain yang pakai `requireAuthWithRole`, sebaiknya diupdate juga ke `requireAuthWithPermission` untuk konsistensi.

Contoh module yang mungkin perlu dicek:
- Master Data (supplier, buyer, vendor, dll)
- Gudang (inventory, purchase order, dll)
- Keuangan (hutang, piutang, dll)
- Settings (users, roles)

---

**Updated:** January 2, 2026  
**Status:** ✅ Fixed & Tested
