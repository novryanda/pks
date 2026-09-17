# RBAC Quick Reference - Modul Penggajian

## 🎯 Quick Setup untuk Admin

### 1. Buat Role Baru
```
Settings → Roles → Tambah Role Baru

Name: "Staff Payroll"
Description: "Staff dengan akses input payroll"

Permissions:
┌─────────────────────────────────────┐
│ Payroll                             │
│  └─ Penggajian                      │
│     ├─ ✓ View                       │
│     ├─ ✓ Create                     │
│     ├─ ✗ Edit                       │
│     ├─ ✗ Delete                     │
│     └─ ✗ Approve                    │
└─────────────────────────────────────┘
```

### 2. Assign Role ke User
```
Settings → Users → Edit User

User: john@pt-pks.com
Role: Staff Payroll ← Select dari dropdown

Save
```

### 3. Test Permission
```
1. Logout
2. Login sebagai john@pt-pks.com
3. Navigate: Payroll → Penggajian
4. Verify:
   ✓ Bisa lihat data
   ✓ Ada button "Import Excel"
   ✗ Tidak ada button "Delete"
```

## 📋 Permission Actions Explained

| Action | Description | Example Use Case |
|--------|-------------|-----------------|
| **view** | Melihat data | View list penggajian, detail slip gaji |
| **create** | Menambah data baru | Import Excel, Generate dari master, Add manual |
| **edit** | Mengubah data existing | Update gaji, koreksi absensi |
| **delete** | Menghapus data | Delete single record, bulk delete by periode |
| **approve** | Menyetujui data | Approve penggajian sebelum payment |

## 🔑 Common Permission Combinations

### Admin / HRD Manager
```json
{
  "view": true,
  "create": true,
  "edit": true,
  "delete": true,
  "approve": true
}
```
**Can do:** Everything

### Payroll Manager
```json
{
  "view": true,
  "create": true,
  "edit": true,
  "delete": false,
  "approve": true
}
```
**Can do:** View, add, edit, approve  
**Cannot:** Delete data

### Payroll Staff
```json
{
  "view": true,
  "create": true,
  "edit": false,
  "delete": false,
  "approve": false
}
```
**Can do:** View and input new data  
**Cannot:** Edit, delete, or approve

### Payroll Viewer / Auditor
```json
{
  "view": true,
  "create": false,
  "edit": false,
  "delete": false,
  "approve": false
}
```
**Can do:** View only (read-only access)  
**Cannot:** Modify anything

### Finance (untuk payment)
```json
{
  "view": true,
  "create": false,
  "edit": false,
  "delete": false,
  "approve": false
}
```
**Can do:** View untuk proses pembayaran  
**Cannot:** Modify payroll data

## 🚀 Quick API Test

### Test dengan cURL

```bash
# 1. Login dulu untuk dapat session cookie
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@pt-pks.com","password":"password123"}'

# 2. Test GET (view permission)
curl http://localhost:3000/api/pt-pks/penggajian \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Expected: 200 OK (jika punya view permission)
# Expected: 403 Forbidden (jika tidak punya view permission)

# 3. Test POST (create permission)
curl -X POST http://localhost:3000/api/pt-pks/penggajian \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"namaKaryawan":"John Doe",...}'

# Expected: 200 OK (jika punya create permission)
# Expected: 403 Forbidden (jika tidak punya create permission)
```

## 🎨 UI Component Checklist

Saat develop component baru dengan RBAC:

```typescript
// ✓ Import hook
import { useUserPermissions } from "@/hooks/use-user-permissions";

// ✓ Get permissions
const { isAdmin, permissions } = useUserPermissions();

// ✓ Define permission checks
const canView = isAdmin || permissions?.payroll?.penggajian?.view === true;
const canCreate = isAdmin || permissions?.payroll?.penggajian?.create === true;
const canEdit = isAdmin || permissions?.payroll?.penggajian?.edit === true;
const canDelete = isAdmin || permissions?.payroll?.penggajian?.delete === true;

// ✓ Conditional rendering
{canCreate && <Button>Tambah</Button>}
{canEdit && <Button>Edit</Button>}
{canDelete && <Button>Delete</Button>}
```

## 🔒 API Route Checklist

Saat buat API route baru:

```typescript
// ✓ Import helper
import { requireAuthWithPermission } from "@/lib/api-auth";

// ✓ Add permission check
export async function POST(request: Request) {
  const { error } = await requireAuthWithPermission(
    "payroll.penggajian",  // module
    "create"               // action
  );
  if (error) return error;
  
  // Your code here...
}
```

## ⚠️ Common Mistakes to Avoid

### ❌ JANGAN: Skip permission check di API
```typescript
// BAD - No permission check!
export async function POST(request: Request) {
  const body = await request.json();
  // Directly save to DB - ANYONE can access!
}
```

### ✅ DO: Always check permission
```typescript
// GOOD - Permission check enforced
export async function POST(request: Request) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "create");
  if (error) return error;
  
  const body = await request.json();
  // Save to DB
}
```

### ❌ JANGAN: Hard-code roles
```typescript
// BAD - Hard-coded role check
if (user.role.name === "Admin" || user.role.name === "Manager") {
  // Allow
}
```

### ✅ DO: Use permission-based check
```typescript
// GOOD - Permission-based
const canCreate = isAdmin || permissions?.payroll?.penggajian?.create === true;
if (canCreate) {
  // Allow
}
```

## 🐛 Debug Checklist

User komplain tidak bisa akses? Check:

```
☐ User sudah login?
   → Check session di DevTools → Application → Cookies

☐ User punya role?
   → Check di Settings → Users → cari user

☐ Role punya permission?
   → Check di Settings → Roles → pilih role → lihat permissions

☐ Permission sudah benar?
   → Pastikan permission yang dicek sesuai dengan yang ada di DB
   → Example: "payroll.penggajian.create" bukan "payroll.create"

☐ API route sudah implement permission check?
   → Check code di src/app/api/... 
   → Pastikan ada requireAuthWithPermission()

☐ Clear browser cache & cookies
   → Sometimes old session cache the problem
```

## 📊 Permission Inheritance

```
Admin
  └─ Has all permissions automatically
     (no need to set in database)

Other Roles
  └─ Must explicitly set each permission
     in database via Settings → Roles
```

## 💡 Pro Tips

1. **Gunakan Admin account untuk initial setup**
   - Admin role otomatis punya semua permission
   - Tidak perlu set permission satu-satu

2. **Test dengan non-admin account**
   - Selalu test dengan role yang permission-nya terbatas
   - Pastikan button yang tidak punya permission benar-benar HIDDEN

3. **Permission di 2 layer**
   - Frontend: Hide UI elements (UX)
   - Backend: Enforce permission (Security)
   - Never rely on frontend only!

4. **Update permission via UI, bukan DB direct**
   - Gunakan Settings → Roles
   - Lebih aman dan ada validation

5. **Document custom permissions**
   - Jika tambah module baru, update docs
   - Jangan lupa update type definitions

## 📞 Support

Jika masih ada masalah:
1. Check logs di terminal (API errors)
2. Check browser console (Frontend errors)
3. Check database: `SELECT * FROM "Role" WHERE id = 'role-id'`
4. Verify permission structure matches expected format

---

Last Updated: January 2, 2026
