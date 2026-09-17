# HT Group Application - RBAC Implementation

## Overview
Aplikasi ini telah diimplementasikan dengan Role-Based Access Control (RBAC) untuk mengelola akses berbasis company dan role.

## Features Implemented

### 1. Database Schema
- **Company Model**: Menyimpan informasi perusahaan (id, code, name)
- **Role Model**: Menyimpan role dan permissions **per company** (role terikat ke company)
- **User Model**: Updated dengan relasi ke Company, Role, dan **password field**
- **Multi-tenant Architecture**: Setiap company memiliki roles sendiri

### 2. **Authentication (NextAuth)**
- ✅ Discord Provider
- ✅ Credentials Provider dengan **bcrypt password verification**
- ✅ **JWT Strategy** untuk session management
- ✅ Session diperluas dengan role dan company data via JWT
- ✅ Auto-refresh user data dari database
- ✅ Secure cookie configuration
- ✅ Custom redirect logic berdasarkan company
- ✅ 24 hours session duration
- ✅ Password hashing dengan bcryptjs (salt rounds: 10)

### 3. RBAC System
- Library RBAC di `src/lib/rbac.ts`
- Permission-based access control
- Role-based menu filtering
- Company-based access restrictions

### 4. UI Components
- App Sidebar dengan dynamic menu berdasarkan company dan role
- Login Form dengan Discord dan Credentials login
- Protected pages dengan role checking

### 5. Middleware
- Route protection
- Role verification
- Company access verification
- Automatic redirect untuk unauthorized access

## Roles & Permissions

### Admin
- Full access ke semua companies
- Dapat manage users, reports, dan settings
- Access ke semua menu items

### Manager
- Access terbatas ke company sendiri (kecuali Admin)
- Dapat view dan create reports
- Tidak bisa manage users atau settings

### User
- Access terbatas ke company sendiri
- Hanya dapat view dashboard dan reports
- Tidak bisa create atau manage apapun

## Companies
1. **PT-PKS** - PT Putra Kalimantan Sejahtera
2. **PT-HTK** - PT Hamparan Tumbuh Kalimantan
3. **PT-NILO** - PT Nusantara Indo Lestari Organik
4. **PT-ZTA** - PT Zaitun Tani Abadi

## Test Accounts
Seed data telah dibuat untuk PT-PKS:

**Default Password untuk semua user: `password123`**

1. **Admin Account**
   - Email: admin@pt-pks.com
   - Password: password123
   - Role: Admin (PT-PKS)
   - Access: All companies

2. **Manager Account**
   - Email: manager@pt-pks.com
   - Password: password123
   - Role: Manager (PT-PKS)
   - Access: PT-PKS only

3. **User Account**
   - Email: user@pt-pks.com
   - Password: password123
   - Role: User (PT-PKS)
   - Access: PT-PKS only

**Note**: Setiap company memiliki roles sendiri. Role "Admin" di PT-PKS berbeda dengan role "Admin" di PT-HTK.

## How to Use

### Setup Database
```bash
# Run migration
npm run db:generate

# Seed data
npm run db:seed
```

### Development
```bash
npm run dev
```

### Login
1. Buka `http://localhost:3000`
2. Klik "Login to Continue"
3. Login dengan salah satu test account di atas
4. Anda akan di-redirect ke dashboard company sesuai role

## Middleware Architecture

### Flow Diagram
```
Request → Middleware → Decision Tree
                        ├─ Public Route? → Allow
                        ├─ API Route?
                        │   ├─ /api/auth/*? → Allow
                        │   ├─ Protected API?
                        │   │   ├─ Authenticated? → Check Role → Allow/Deny
                        │   │   └─ Not Auth? → 401
                        │   └─ Other API? → Allow
                        ├─ /dashboard? → Redirect to Company Dashboard
                        ├─ Protected Route?
                        │   ├─ Not Auth? → Redirect to /auth
                        │   ├─ Wrong Role? → Redirect to /unauthorized
                        │   ├─ Wrong Company? → Redirect to /unauthorized
                        │   └─ All OK? → Allow
                        └─ Other Route?
                            ├─ Not Auth? → Redirect to /auth
                            └─ Auth? → Allow
```

### Middleware Responsibilities
1. **Authentication Check**: Verify user is logged in
2. **Authorization Check**: Verify user has required role
3. **Company Access Check**: Verify user can access the company route
4. **API Protection**: Protect API endpoints with role-based access
5. **Auto Redirect**: 
   - Logged-in users from /auth → their dashboard
   - Non-logged users from protected routes → /auth
   - Unauthorized access → /unauthorized
6. **Callback URL**: Preserve intended destination for post-login redirect

### Pages & Layouts
- **No authentication logic in pages/layouts**
- **No redirect logic in components**
- **All controlled by middleware**
- Pages only fetch and display data assuming user is authorized
```
src/
├── app/
│   ├── (protected-pages)/
│   │   ├── layout.tsx          # Protected layout dengan sidebar
│   │   ├── pt-pks/
│   │   ├── pt-htk/
│   │   ├── pt-nilo/
│   │   └── pt-zta/
│   ├── auth/
│   │   └── page.tsx             # Login page
│   ├── unauthorized/
│   │   └── page.tsx             # Unauthorized access page
│   └── page.tsx                 # Home page
├── components/
│   ├── auth/
│   │   ├── login-form.tsx       # Login form component
│   │   └── session-provider.tsx # Session wrapper
│   └── layout/
│       └── app-sidebar.tsx      # Main sidebar with RBAC
├── lib/
│   ├── rbac.ts                  # RBAC utilities
│   └── utils.ts
├── server/
│   └── auth/
│       ├── config.ts            # NextAuth configuration
│       └── index.ts
├── middleware.ts                # Route protection middleware
└── prisma/
    ├── schema.prisma            # Database schema
    └── seed.ts                  # Seed data
```

## Next Steps

### TODO untuk Development Selanjutnya:
1. Implement password hashing untuk Credentials Provider
2. Tambah user management pages
3. Tambah report management pages
4. Tambah settings pages
5. Implement permission checking di setiap action
6. Tambah audit logging
7. Tambah forgot password functionality
8. Tambah user profile page
9. Implement real-time notifications
10. Add more companies dan test users

## Security Notes
⚠️ **PENTING**: 
- Credentials provider saat ini tidak menggunakan password checking untuk development
- Implementasikan password hashing (bcrypt) di production
- Update environment variables untuk production
- Enable CSRF protection
- Implement rate limiting untuk login attempts

## Environment Variables Required
```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-secret-key"
AUTH_DISCORD_ID="your-discord-client-id"
AUTH_DISCORD_SECRET="your-discord-client-secret"
```

## API Routes
- `GET /api/session` - Get current session
- `GET /api/users` - List all users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `GET /api/companies` - List all companies (Admin only)
- `POST /api/companies` - Create company (Admin only)
- `GET /api/reports` - List reports (Admin, Manager)
- `POST /api/reports` - Create report (Admin, Manager)
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get auth session
- `POST /api/auth/callback/discord` - Discord OAuth callback
- `POST /api/auth/callback/credentials` - Credentials login callback

### API Protection
All API routes (except /api/auth/*) are protected by middleware and checked again in the route handler using helper functions from `src/lib/api-auth.ts`.
