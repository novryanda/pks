# Middleware-Based Access Control

## Overview
Aplikasi ini menggunakan **middleware sebagai single source of truth** untuk semua access control. Pages dan layouts **tidak melakukan pengecekan authentication/authorization** - semua dihandle oleh middleware.

## Architecture Principle

### ✅ DO (Middleware)
- ✅ Check authentication status
- ✅ Verify user roles
- ✅ Check company access
- ✅ Protect API routes
- ✅ Handle redirects
- ✅ Preserve callback URLs

### ❌ DON'T (Pages/Layouts)
- ❌ Check if user is logged in
- ❌ Redirect based on auth status
- ❌ Verify user roles
- ❌ Check company access

## Middleware Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    INCOMING REQUEST                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Is API Route? │
         └────────┬───────┘
                  │
         ┌────────┴─────────┐
         │                  │
        YES                NO
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│ /api/auth/*?    │  │ Public Route?│
│ → Allow         │  │ (/, /auth)   │
└─────────────────┘  └──────┬───────┘
         │                   │
         ▼            ┌──────┴──────┐
┌─────────────────┐  │             │
│ Protected API?  │ YES           NO
│ Check auth &    │  │             │
│ role → Allow/   │  ▼             ▼
│ Deny (401/403)  │ ┌──────────┐ ┌───────────────┐
└─────────────────┘ │ Logged   │ │ /dashboard?   │
                    │ in on    │ │ → Redirect to │
                    │ /auth?   │ │ company dash  │
                    │ → Redir  │ └───────────────┘
                    │ to dash  │         │
                    └──────────┘         ▼
                         │        ┌──────────────┐
                         │        │ Protected    │
                         │        │ Route?       │
                         │        └──────┬───────┘
                         │               │
                         ▼        ┌──────┴───────┐
                    ┌─────────┐  │              │
                    │ Allow   │ YES            NO
                    │ Access  │  │              │
                    └─────────┘  ▼              ▼
                          ┌────────────┐  ┌──────────┐
                          │ Auth? Role?│  │Not logged│
                          │ Company?   │  │→ /auth   │
                          │ → Allow or │  └──────────┘
                          │ → /unauth  │
                          └────────────┘
```

## Route Protection

### Public Routes
Routes yang dapat diakses tanpa login:
```typescript
const publicRoutes = ["/", "/auth", "/unauthorized"];
```

### Protected Routes
Routes yang membutuhkan authentication dan role tertentu:
```typescript
const protectedRoutes = {
  "/pt-pks": ["Admin", "Manager", "User"],
  "/pt-htk": ["Admin", "Manager", "User"],
  "/pt-nilo": ["Admin", "Manager", "User"],
  "/pt-zta": ["Admin", "Manager", "User"],
};
```

### API Route Protection
```typescript
const protectedApiRoutes = {
  "/api/admin": ["Admin"],
  // Add more as needed
};
```

**Note**: User management API (/api/users, /api/companies, /api/reports) are protected by their route handlers using `requireAuthWithRole()` helper, not by middleware. This provides flexibility and better error messages.
## Redirect Rules

### 1. Logged-in User Accessing /auth
```
User is logged in → /auth → Redirect to company dashboard
```

### 2. Not Logged-in User Accessing Protected Route
```
User not logged in → /pt-pks → Redirect to /auth?callbackUrl=/pt-pks
```

### 3. Wrong Role Accessing Protected Route
```
User (role: User) → /api/users (requires: Admin) → 403 Forbidden
```

### 4. Wrong Company Access
```
User (company: PT-HTK) → /pt-pks → Redirect to /unauthorized
Exception: Admin can access all companies
```

### 5. Dashboard Route
```
/dashboard → Redirect to /pt-{user-company-code}
```

## API Authentication Helper

File: `src/lib/api-auth.ts`

### Usage in API Routes

```typescript
import { requireAuthWithRole } from "@/lib/api-auth";

export async function GET() {
  // Check auth + role in one call
  const { error, session } = await requireAuthWithRole(["Admin"]);
  if (error) return error;

  // Your logic here
  return NextResponse.json({ data: "..." });
}
```

### Available Functions

#### `requireAuth()`
Check authentication only
```typescript
const { error, session } = await requireAuth();
if (error) return error;
```

#### `requireRole(session, allowedRoles)`
Check if user has required role
```typescript
const { error, authorized } = requireRole(session, ["Admin", "Manager"]);
if (error) return error;
```

#### `requireCompany(session, companyCode)`
Check if user belongs to company (Admin bypasses)
```typescript
const { error, authorized } = requireCompany(session, "PT-PKS");
if (error) return error;
```

#### `requireAuthWithRole(allowedRoles, companyCode?)`
Combined check for auth + role + optional company
```typescript
// Auth + Role only
const { error, session } = await requireAuthWithRole(["Admin"]);

// Auth + Role + Company
const { error, session } = await requireAuthWithRole(["Manager"], "PT-PKS");
```

## Page/Layout Implementation

### ❌ WRONG - Don't do this
```typescript
// DON'T: Check auth in page
export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth"); // ❌ NO!
  
  // ...
}
```

### ✅ CORRECT - Trust middleware
```typescript
// DO: Assume user is authorized
export default async function DashboardPage() {
  const session = await auth(); // Only to get user data
  
  // User is already authorized by middleware
  return <div>Welcome {session?.user.name}</div>;
}
```

### Layout Example
```typescript
export default async function ProtectedLayout({ children }) {
  const session = await auth();
  
  // No redirect logic - middleware handles it
  // This null check is just for TypeScript safety
  if (!session?.user) return null;
  
  return <SidebarProvider>...</SidebarProvider>;
}
```

## Testing Access Control

### Test Case 1: Access Without Login
```bash
# Should redirect to /auth
curl http://localhost:3000/pt-pks
# Response: 307 Redirect to /auth?callbackUrl=/pt-pks
```

### Test Case 2: API Without Auth
```bash
# Should return 401
curl http://localhost:3000/api/users
# Response: 401 {"error":"Unauthorized"}
```

### Test Case 3: API With Wrong Role
```bash
# Login as User (not Admin)
# Should return 403
curl -H "Cookie: auth-token=..." http://localhost:3000/api/users
# Response: 403 {"error":"Forbidden - Insufficient permissions"}
```

### Test Case 4: Wrong Company Access
```bash
# Login as PT-HTK user
# Try to access PT-PKS
# Should redirect to /unauthorized
curl -H "Cookie: auth-token=..." http://localhost:3000/pt-pks
# Response: 307 Redirect to /unauthorized
```

### Test Case 5: Admin Access All Companies
```bash
# Login as Admin
# Can access any company
curl -H "Cookie: auth-token=..." http://localhost:3000/pt-htk
# Response: 200 OK
```

## Benefits of Middleware-First Approach

### 1. **Single Source of Truth**
- One place to manage all access control
- No duplicate logic across pages
- Easier to maintain and update

### 2. **Consistent Behavior**
- All routes follow same rules
- No risk of forgetting auth check on a page
- Predictable redirects

### 3. **Better Performance**
- Auth check happens once at middleware level
- No redundant checks in pages
- Faster page rendering

### 4. **Easier Testing**
- Test middleware once
- Pages don't need auth testing
- Clear separation of concerns

### 5. **Better Security**
- Can't accidentally expose unprotected route
- Middleware catches all requests
- API routes doubly protected (middleware + handler)

## Adding New Protected Routes

### Step 1: Add to Middleware Config
```typescript
// In src/middleware.ts
const protectedRoutes = {
  "/pt-pks": ["Admin", "Manager", "User"],
  "/pt-htk": ["Admin", "Manager", "User"],
  "/new-route": ["Admin"], // ← Add here
};
```

### Step 2: Create Page (No Auth Logic)
```typescript
// In src/app/new-route/page.tsx
export default async function NewRoutePage() {
  const session = await auth(); // Just to get data
  
  // No auth checks - middleware handled it
  return <div>Content here</div>;
}
```

## Adding New API Routes

### Step 1: Add to Middleware Config (Optional)
```typescript
// In src/middleware.ts
const protectedApiRoutes = {
  "/api/users": ["Admin"],
  "/api/new-api": ["Admin", "Manager"], // ← Add here
};
```

### Step 2: Create API Route with Helper
```typescript
// In src/app/api/new-api/route.ts
import { requireAuthWithRole } from "@/lib/api-auth";

export async function GET() {
  const { error, session } = await requireAuthWithRole(["Admin", "Manager"]);
  if (error) return error;
  
  // Your logic here
}
```

## Summary

✅ **Middleware = Gatekeeper**
- All access control happens here
- Handles authentication, authorization, redirects

✅ **Pages = Content Display**
- No auth logic
- Trust that user is authorized
- Focus on rendering and data fetching

✅ **API Routes = Double Protection**
- Middleware catches first
- Handler checks again with helpers
- Maximum security

This architecture ensures **security**, **consistency**, and **maintainability** across the entire application.
