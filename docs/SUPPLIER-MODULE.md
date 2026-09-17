# Modul Supplier TBS - PT PKS

## Overview
Modul ini menangani manajemen supplier TBS (Tandan Buah Segar) untuk PT PKS dengan fitur lengkap untuk registrasi, visualisasi maps, dan pengelolaan data supplier.

## Fitur Utama

### 1. **Registrasi Supplier**
Form registrasi lengkap dengan section:
- **Identitas**: Tipe supplier (Ramp/Peron, KUD, Kelompok Tani), nama pemilik, alamat, kontak
- **Profil Kebun**: Multiple garden profiles dengan tahun tanam, luas kebun, estimasi supply TBS
- **Lokasi**: Koordinat GPS dengan interactive map (Leaflet) untuk pin location
- **Tipe Pengelolaan**: Swadaya, Kelompok, Perusahaan, jenis bibit, sertifikasi (checkbox ISPO dan/atau RSPO - bisa keduanya)
- **Profil Izin Usaha**: Akte pendirian, perubahan, NIB, SIUP, NPWP
- **Penjualan TBS**: Channel penjualan (Langsung PKS/Agen) dengan keterangan detail, transportasi dengan jumlah unit
- **Rekening & Pajak**: Bank, nomor rekening, status pajak (Non PKP, PKP 11%, PKP 1.1%)

### 2. **Peta Lokasi Supplier**
- Interactive map menggunakan Leaflet/OpenStreetMap
- Marker untuk setiap supplier dengan popup info
- Auto-center based on supplier locations

### 3. **Daftar Supplier**
- Table view dengan fitur search
- Filter by nama pemilik, nama perusahaan, alamat
- Actions: View detail, Edit, Delete

## Struktur Arsitektur

### Database Layer
**File**: `prisma/schema.prisma`
- Model `Supplier` dengan semua field yang diperlukan
- Enums: `SupplierType`, `CertificationType`, `TaxStatus`, `SalesChannel`, `TransportationType`
- Relasi dengan `Company` model

### Schema Layer
**File**: `src/server/schema/supplier.ts`
- Zod schemas untuk validasi
- TypeScript types untuk type safety
- Input/Output schemas

### Repository Layer
**File**: `src/server/repositories/supplier.repository.ts`
- Query functions menggunakan Prisma
- Methods:
  - `findByCompanyId()` - Get all suppliers
  - `findById()` - Get single supplier
  - `create()` - Create new supplier
  - `update()` - Update supplier
  - `delete()` - Delete supplier
  - `findSuppliersForMap()` - Get suppliers for map view
  - `search()` - Search suppliers

### Service Layer
**File**: `src/server/services/pt-pks/supplier.service.ts`
- Business logic layer
- Validation using Zod schemas
- Error handling

### Controller/API Layer
**File**: `src/app/api/pt-pks/supplier/route.ts`
- `GET /api/pt-pks/supplier` - List suppliers
  - Query params: `type=map` for map view, `search=term` for search
- `POST /api/pt-pks/supplier` - Create new supplier
- Auth middleware: Admin, Manager PT PKS, Staff PT PKS

### Component Layer
**Files**: `src/components/dashboard/pt-pks/supplier/`

1. **supplier-form.tsx**
   - Complete registration form
   - Interactive map for location selection
   - Dynamic garden profiles (add/remove)
   - Form validation

2. **supplier-map.tsx**
   - Leaflet map integration
   - Display all suppliers as markers
   - Popup with supplier info

3. **supplier-table.tsx**
   - DataTable with search
   - CRUD actions
   - Responsive design

### Page Layer
**File**: `src/app/(protected-pages)/dashboard/pt-pks/mitra/supplier/page.tsx`
- Tabs interface: "Data Supplier" dan "Registrasi Supplier"
- Integrates Map, Table, and Form components

## Dependencies

### Core
- `leaflet` - Map library
- `react-leaflet` - React wrapper for Leaflet
- `@types/leaflet` - TypeScript types

### UI Components (shadcn/ui)
- `table` - Data table
- `tabs` - Tab navigation
- `select` - Dropdown select
- `checkbox` - Checkbox input
- `card` - Card container
- Other base components (button, input, label, etc.)

## Database Schema

```prisma
model Supplier {
  id          String       @id @default(cuid())
  companyId   String
  type        SupplierType
  
  // Identitas
  ownerName         String
  address           String
  companyPhone      String?
  personalPhone     String
  companyName       String?
  rampPeronAddress  String?
  
  // Profil Kebun (JSON array)
  gardenProfiles    Json
  
  // Lokasi
  longitude         Float
  latitude          Float
  
  // Tipe Pengelolaan
  swadaya           Boolean
  kelompok          Boolean
  perusahaan        Boolean
  jenisBibit        String?
  certificationISPO Boolean  @default(false)
  certificationRSPO Boolean  @default(false)
  
  // Profil Izin Usaha
  aktePendirian     String?
  aktePerubahan     String?
  nib               String?
  siup              String?
  npwp              String?
  
  // Penjualan TBS
  salesChannel      SalesChannel?
  salesChannelDetails String?
  
  // Transportasi
  transportation    TransportationType?
  transportationUnits Int?
  
  // Rekening & Pajak
  bankName          String?
  accountNumber     String?
  taxStatus         TaxStatus?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  company           Company  @relation(fields: [companyId], references: [id])
}
```

## API Endpoints

### GET /api/pt-pks/supplier
**Description**: Get list of suppliers

**Query Parameters**:
- `type=map` - Returns simplified data for map markers
- `search=<term>` - Search by owner name, company name, or address

**Response**:
```json
{
  "suppliers": [
    {
      "id": "...",
      "type": "RAMP_PERON",
      "ownerName": "...",
      "companyName": "...",
      "address": "...",
      "latitude": -2.5,
      "longitude": 118.0,
      ...
    }
  ]
}
```

### POST /api/pt-pks/supplier
**Description**: Create new supplier

**Request Body**:
```json
{
  "type": "RAMP_PERON",
  "ownerName": "John Doe",
  "address": "...",
  "personalPhone": "08123456789",
  "gardenProfiles": [
    {
      "tahunTanam": 2020,
      "luasKebun": 10.5,
      "estimasiSupplyTBS": 200
    }
  ],
  "latitude": -2.5489,
  "longitude": 118.0149,
  ...
}
```

**Response**:
```json
{
  "supplier": {
    "id": "...",
    ...
  }
}
```

## Usage

### Accessing the Module
1. Login dengan role: Admin, Manager PT PKS, atau Staff PT PKS
2. Navigate to: `/dashboard/pt-pks/mitra/supplier`

### Registering a Supplier
1. Go to "Registrasi Supplier" tab
2. Fill in all required fields (marked with *)
3. Click on map to set location or input coordinates manually
4. Add multiple garden profiles if needed
5. Click "Simpan Supplier"

### Viewing Suppliers
1. Go to "Data Supplier" tab
2. View map with all supplier locations
3. Scroll down to see table list
4. Use search to filter suppliers

## Notes

- Garden profiles stored as JSON array in database
- Interactive map requires client-side rendering (dynamic import)
- Leaflet icons loaded from CDN
- All coordinates use decimal degrees format
- Form validation handled by Zod schema

## Future Enhancements
- Export supplier data to Excel/PDF
- Bulk import from CSV
- Supplier detail page with full info
- Edit supplier functionality
- Photo upload for documentation
- Document management for legal files
- Analytics dashboard for supplier performance
