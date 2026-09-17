# Project Overview: htgroupapp

**htgroupapp** adalah sistem manajemen terpadu (ERP) yang dirancang untuk mengelola operasional berbagai perusahaan di bawah naungan HT Group, dengan fokus utama pada industri kelapa sawit (PKS - Pabrik Kelapa Sawit).

## 🚀 Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS, Lucide React, Framer Motion
- **Backend/ORM**: [Prisma](https://www.prisma.io/) con PostgreSQL
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Auth.js v5 Beta)
- **Validation**: Zod
- **Form Handling**: React Hook Form
- **UI Components**: Radix UI (Shadcn UI pattern)
- **Reporting**: PDF (@react-pdf/renderer), Excel (xlsx)

## 🏗️ Architecture

Sistem ini menggunakan arsitektur **Multi-Tenant** berbasis Perusahaan (`Company`).

### 1. Multi-tenant Structure
Setiap entitas data utama memiliki referensi ke `companyId`.
- **Organisasi**: Data dipisahkan berdasarkan PT (contoh: PT PKS, PT HTK, PT Nilo, dll).
- **Service Layer**: Logika bisnis dipusatkan di `src/server/services`, terbagi berdasarkan modul dan perusahaan.

### 2. Folder Structure Highlights
- `/src/app`: Routing Next.js, termasuk route API dan halaman dashboard (Protected).
- `/src/server`: Core logic.
    - `/repositories`: Abstraksi akses database (Prisma).
    - `/services`: Business process, validasi, dan orkestrasi antar repository.
    - `/schema`: Definisi tipe data dan skema validasi Zod.
- `/src/hooks`: Custom hooks untuk state management di frontend (seperti integrasi timbangan).
- `/docs`: Dokumentasi teknis dan referensi modul.

## 🔐 Security & RBAC
- **NextAuth**: Mengelola session dan autentikasi.
- **Middleware**: Memastikan akses hanya untuk user yang terautentikasi dan melakukan pengalihan berdasarkan domain/perusahaan.
- **RBAC (Role-Based Access Control)**: Izin akses (permissions) disimpan dalam format JSON di level Role, memungkinkan kontrol granular pada tingkat menu dan aksi.

---
*Dibuat otomatis oleh Antigravity untuk dokumentasi internal.*
