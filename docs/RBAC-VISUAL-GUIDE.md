# Visual Guide: RBAC Flow untuk Modul Penggajian

## 1. Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER LOGIN                                  │
│  Email: staff@pt-pks.com                                            │
│  Password: ********                                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE CHECK                                │
│  ✓ Is user authenticated?                                           │
│  ✓ Does user have a role?                                           │
│  ✓ Is user accessing correct company?                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       ACCESS GRANTED                                 │
│  Redirect to: /dashboard/pt-pks                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SIDEBAR MENU RENDERING                             │
│  - Check permissions for each menu item                              │
│  - Show only accessible modules                                      │
│  ✓ Payroll → Penggajian (has view permission)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              USER CLICKS: Payroll → Penggajian                       │
│  Navigate to: /dashboard/pt-pks/payroll/penggajian                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PAGE COMPONENT LOADS                             │
│  - useUserPermissions() hook fetches user permissions               │
│  - Render UI based on permissions                                    │
│  - Hide/show buttons: Tambah, Edit, Delete                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              USER CLICKS: "Tambah Data" Button                       │
│  (Only visible if user has 'create' permission)                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API REQUEST                                    │
│  POST /api/pt-pks/penggajian                                        │
│  Body: { ...penggajian data }                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   API ROUTE HANDLER                                  │
│  requireAuthWithPermission("payroll.penggajian", "create")          │
│                                                                      │
│  Step 1: Check if user is authenticated                             │
│  Step 2: Get user's role ID from session                            │
│  Step 3: Query database for role permissions                        │
│  Step 4: Check if permissions.payroll.penggajian.create === true    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
          ┌─────────────────┐  ┌─────────────────┐
          │  HAS PERMISSION │  │  NO PERMISSION  │
          │  ✓ Create data  │  │  ✗ Return 403   │
          │  ✓ Return 200   │  │    Forbidden    │
          └─────────────────┘  └─────────────────┘
```

## 2. Permission Matrix untuk Payroll Module

### Role: Admin
```
┌──────────────────────────────────────────────┐
│  Module: payroll.penggajian                  │
├──────────────────────────────────────────────┤
│  ✓ view     - Lihat data penggajian         │
│  ✓ create   - Tambah data baru              │
│  ✓ edit     - Ubah data existing            │
│  ✓ delete   - Hapus data                    │
│  ✓ approve  - Approve penggajian            │
├──────────────────────────────────────────────┤
│  UI Elements Visible:                        │
│  • View: Table, Cards, Summary               │
│  • Create: Import, Generate, Add buttons     │
│  • Edit: Edit button di setiap row          │
│  • Delete: Delete button, Bulk delete        │
│  • Approve: Approve button                   │
└──────────────────────────────────────────────┘
```

### Role: Manager Payroll
```
┌──────────────────────────────────────────────┐
│  Module: payroll.penggajian                  │
├──────────────────────────────────────────────┤
│  ✓ view     - Lihat data penggajian         │
│  ✓ create   - Tambah data baru              │
│  ✓ edit     - Ubah data existing            │
│  ✗ delete   - TIDAK BISA hapus data         │
│  ✗ approve  - TIDAK BISA approve            │
├──────────────────────────────────────────────┤
│  UI Elements Visible:                        │
│  • View: Table, Cards, Summary               │
│  • Create: Import, Generate, Add buttons     │
│  • Edit: Edit button di setiap row          │
│  • Delete: HIDDEN                            │
│  • Approve: HIDDEN                           │
└──────────────────────────────────────────────┘
```

### Role: Staff Payroll
```
┌──────────────────────────────────────────────┐
│  Module: payroll.penggajian                  │
├──────────────────────────────────────────────┤
│  ✓ view     - Lihat data penggajian         │
│  ✓ create   - Tambah data baru              │
│  ✗ edit     - TIDAK BISA ubah data          │
│  ✗ delete   - TIDAK BISA hapus data         │
│  ✗ approve  - TIDAK BISA approve            │
├──────────────────────────────────────────────┤
│  UI Elements Visible:                        │
│  • View: Table, Cards, Summary               │
│  • Create: Import, Generate, Add buttons     │
│  • Edit: HIDDEN                              │
│  • Delete: HIDDEN                            │
│  • Approve: HIDDEN                           │
└──────────────────────────────────────────────┘
```

### Role: Payroll Viewer
```
┌──────────────────────────────────────────────┐
│  Module: payroll.penggajian                  │
├──────────────────────────────────────────────┤
│  ✓ view     - Lihat data penggajian         │
│  ✗ create   - TIDAK BISA tambah data        │
│  ✗ edit     - TIDAK BISA ubah data          │
│  ✗ delete   - TIDAK BISA hapus data         │
│  ✗ approve  - TIDAK BISA approve            │
├──────────────────────────────────────────────┤
│  UI Elements Visible:                        │
│  • View: Table, Cards, Summary (READ ONLY)   │
│  • Create: HIDDEN                            │
│  • Edit: HIDDEN                              │
│  • Delete: HIDDEN                            │
│  • Approve: HIDDEN                           │
└──────────────────────────────────────────────┘
```

## 3. API Endpoint Permission Matrix

| HTTP Method | Endpoint | Permission | Description |
|-------------|----------|------------|-------------|
| `GET` | `/api/pt-pks/penggajian` | `view` | List semua data penggajian |
| `GET` | `/api/pt-pks/penggajian/[id]` | `view` | Detail satu penggajian |
| `POST` | `/api/pt-pks/penggajian` | `create` | Tambah penggajian manual |
| `POST` | `/api/pt-pks/penggajian/import` | `create` | Import dari Excel |
| `POST` | `/api/pt-pks/penggajian/generate` | `create` | Generate dari master data |
| `PUT` | `/api/pt-pks/penggajian/[id]` | `edit` | Update penggajian |
| `DELETE` | `/api/pt-pks/penggajian/[id]` | `delete` | Hapus satu penggajian |
| `DELETE` | `/api/pt-pks/penggajian?periode=...` | `delete` | Hapus bulk by periode |
| `GET` | `/api/pt-pks/penggajian/export` | `view` | Export to Excel |
| `GET` | `/api/pt-pks/penggajian/[id]/pdf` | `view` | Download slip gaji PDF |

## 4. User Journey Scenarios

### Scenario A: Admin menambah data penggajian
```
1. Login sebagai Admin
   ↓
2. Navigate to Payroll → Penggajian
   ↓
3. Click "Import Excel" button
   ✓ Button visible (has create permission)
   ↓
4. Upload Excel file
   ↓
5. Submit
   ↓
6. API POST /api/pt-pks/penggajian/import
   ✓ Permission check: PASS (Admin has create)
   ↓
7. Data saved to database
   ↓
8. Success message shown
   ✓ Table refreshed with new data
```

### Scenario B: Staff Payroll mencoba delete data
```
1. Login sebagai Staff Payroll
   ↓
2. Navigate to Payroll → Penggajian
   ↓
3. Try to find "Delete" button
   ✗ Button NOT VISIBLE (no delete permission)
   ↓
4. Staff tries to delete via API directly (using tools)
   ↓
5. API DELETE /api/pt-pks/penggajian/[id]
   ✗ Permission check: FAIL
   ↓
6. Return 403 Forbidden
   Error: "Insufficient permissions"
```

### Scenario C: Payroll Viewer hanya bisa lihat
```
1. Login sebagai Payroll Viewer
   ↓
2. Navigate to Payroll → Penggajian
   ↓
3. See data table with all penggajian
   ✓ Can view (has view permission)
   ↓
4. Look for action buttons
   ✗ No "Tambah", "Edit", "Delete" buttons
   ✗ Only "Export" and "Print" available
   ↓
5. Can only:
   • View data
   • Filter/search data
   • Export to Excel
   • Print slip gaji
```

## 5. Database Permission Structure

```json
{
  "payroll": {
    "penggajian": {
      "view": true,     ← Can see data
      "create": true,   ← Can add new data
      "edit": false,    ← Cannot modify data
      "delete": false,  ← Cannot delete data
      "approve": false  ← Cannot approve
    }
  },
  "masterData": {
    "supplier": {
      "view": true,
      "create": false,
      "edit": false,
      "delete": false,
      "approve": false
    }
  }
}
```

## 6. Code Implementation Points

### Frontend (React Component)
```typescript
// 1. Import hook
import { useUserPermissions } from "@/hooks/use-user-permissions";

// 2. Get permissions
const { isAdmin, permissions } = useUserPermissions();

// 3. Check permission
const canCreate = isAdmin || permissions?.payroll?.penggajian?.create === true;

// 4. Conditional rendering
{canCreate && <Button>Tambah Data</Button>}
```

### Backend (API Route)
```typescript
// Import helper
import { requireAuthWithPermission } from "@/lib/api-auth";

// Check permission at route handler
export async function POST(request: Request) {
  const { error } = await requireAuthWithPermission("payroll.penggajian", "create");
  if (error) return error; // Returns 403 if no permission
  
  // Proceed with business logic
}
```

## 7. Testing Checklist

### ✓ Test sebagai Admin
- [ ] Dapat melihat semua data
- [ ] Dapat tambah data baru
- [ ] Dapat edit data existing
- [ ] Dapat delete data
- [ ] Semua button visible

### ✓ Test sebagai Manager
- [ ] Dapat melihat semua data
- [ ] Dapat tambah data baru
- [ ] Dapat edit data existing
- [ ] TIDAK dapat delete data
- [ ] Delete button HIDDEN

### ✓ Test sebagai Staff
- [ ] Dapat melihat semua data
- [ ] Dapat tambah data baru
- [ ] TIDAK dapat edit data
- [ ] TIDAK dapat delete data
- [ ] Edit & Delete buttons HIDDEN

### ✓ Test sebagai Viewer
- [ ] Dapat melihat semua data
- [ ] TIDAK dapat tambah data
- [ ] TIDAK dapat edit data
- [ ] TIDAK dapat delete data
- [ ] Hanya Export button visible

### ✓ Test API Endpoints
- [ ] GET request dengan view permission: SUCCESS
- [ ] POST request tanpa create permission: 403 FORBIDDEN
- [ ] PUT request tanpa edit permission: 403 FORBIDDEN
- [ ] DELETE request tanpa delete permission: 403 FORBIDDEN

## 8. Troubleshooting Decision Tree

```
User tidak bisa akses halaman?
├─ Cek: Apakah sudah login?
│  ├─ NO → Redirect ke /auth
│  └─ YES → Next
│
├─ Cek: Apakah punya role?
│  ├─ NO → Assign role di Settings → Users
│  └─ YES → Next
│
├─ Cek: Apakah role punya permission view?
│  ├─ NO → Update permission di Settings → Roles
│  └─ YES → Next
│
└─ Cek: Apakah akses company yang benar?
   ├─ NO → Login dengan user yang sesuai company
   └─ YES → Should work!

Button tidak muncul?
├─ Cek: Apakah permission untuk action tersebut ada?
│  ├─ create permission → Tampilkan button Tambah/Import
│  ├─ edit permission → Tampilkan button Edit
│  ├─ delete permission → Tampilkan button Delete
│  └─ view permission → Tampilkan Export/Print
│
└─ Fix: Update permission di Settings → Roles

API return 403?
├─ Cek di database: Role permissions
├─ Cek di code: requireAuthWithPermission() call
├─ Cek di session: User role ID
└─ Fix: Sesuaikan permission di Settings → Roles
```

## Kesimpulan

Sistem RBAC untuk modul Payroll sudah fully implemented dengan:

1. ✅ **Middleware-level** authentication check
2. ✅ **API-level** permission enforcement 
3. ✅ **UI-level** conditional rendering
4. ✅ **Database-driven** permissions
5. ✅ **Granular control** (view/create/edit/delete/approve)
6. ✅ **Easy to manage** via Settings UI

Setiap user hanya bisa melakukan aksi sesuai dengan permission yang dimiliki role mereka. Permission dicek di **2 level**:
- **Frontend**: Hide/show UI elements
- **Backend**: Enforce permission di API routes

Ini memberikan security yang berlapis dan user experience yang baik.
