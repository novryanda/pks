# Dokumentasi Integrasi Sistem Timbangan (Push-Based)

## 1. Ringkasan

Sistem ini mengintegrasikan timbangan fisik vendor dengan aplikasi HT Group App menggunakan arsitektur **push-based**. Vendor **POST data penimbangan** ke API endpoint kita setiap kali ada penimbangan. Operator kemudian mengklik tombol "Baca dari Timbangan" untuk mengambil data terakhir ke form.

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            VENDOR TIMBANGAN                                     │
│  ┌─────────────────┐     ┌─────────────────┐     ┌──────────────────────────┐   │
│  │  Timbangan      │     │   Software      │     │     POST Request         │   │
│  │  Fisik          │────▶│   Interface     │────▶│  POST /api/weighing/     │   │
│  │                 │     │                 │     │       receive            │   │
│  └─────────────────┘     └─────────────────┘     │  Header: X-API-Key      │   │
│                                                  │  Body: {weight,         │   │
│                                                  │         timestamp}      │   │
│                                                  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POST (setiap penimbangan)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            HT GROUP APP                                         │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                          BACKEND                                        │   │
│  │  ┌───────────────────┐     ┌──────────────┐     ┌────────────────────┐  │   │
│  │  │ POST /api/weighing│     │              │     │ GET /api/weighing  │  │   │
│  │  │ /receive          │────▶│   Buffer     │◀────│ /read              │  │   │
│  │  │                   │     │  (In-Memory) │     │                    │  │   │
│  │  │ • Validasi API Key│     │              │     │ • Return weight    │  │   │
│  │  │ • Validasi data   │     └──────────────┘     │   + timestamp      │  │   │
│  │  └───────────────────┘                          └────────────────────┘  │   │
│  └──────────────────────────────────────────────┬──────────────────────────┘   │
│                                                 │                              │
│  ┌──────────────────────────────────────────────┴──────────────────────────┐   │
│  │                          FRONTEND                                       │   │
│  │  ┌────────────────┐     ┌────────────────────┐                          │   │
│  │  │  useWeighing   │     │  Form Component    │                          │   │
│  │  │  Scale hook    │────▶│  • beratBruto/Tarra│                          │   │
│  │  │                │     │  • waktuTimbang*   │                          │   │
│  │  └────────────────┘     └────────────────────┘                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Alur Kerja (Sequence Diagram)

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Vendor   │   │ Backend  │   │ Operator │   │ Frontend │   │  Hook    │
│Timbangan │   │ Receiver │   │          │   │          │   │          │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │              │
     │  1. POST     │              │              │              │
     │  /api/       │              │              │              │
     │  weighing/   │              │              │              │
     │  receive     │              │              │              │
     │─────────────▶│              │              │              │
     │              │              │              │              │
     │  2. Response │              │              │              │
     │  {status:OK} │              │              │              │
     │◀─────────────│              │              │              │
     │              │              │              │              │
     │              │  3. Data     │              │              │
     │              │  tersimpan   │              │              │
     │              │  di buffer   │              │              │
     │              │              │              │              │
     │              │              │  4. Operator │              │
     │              │              │  klik "Baca  │              │
     │              │              │  dari        │              │
     │              │              │  Timbangan"  │              │
     │              │              │─────────────▶│              │
     │              │              │              │              │
     │              │              │              │  5. Call     │
     │              │              │              │  fetchWeight │
     │              │              │              │─────────────▶│
     │              │              │              │              │
     │              │              │              │  6. GET      │
     │              │              │              │  /api/       │
     │              │              │              │  weighing/   │
     │              │              │              │  read        │
     │              │              │              │─────────────▶│
     │              │              │              │              │
     │              │              │              │  7. Response │
     │              │              │              │  {weight,    │
     │              │              │              │   timestamp} │
     │              │              │              │◀─────────────│
     │              │              │              │              │
     │              │              │  8. Form     │              │
     │              │              │  terisi:     │              │
     │              │              │  15.289 kg   │              │
     │              │              │  10:30:00    │              │
     │              │              │◀─────────────│              │
     │              │              │              │              │
```

---

## 4. Request & Response

### 4.1 Vendor → API Kita (Push Data)

**Request:**
```http
POST /api/weighing/receive HTTP/1.1
Host: [domain-htgroup]
Content-Type: application/json
X-API-Key: [api-key-yang-diberikan]

{
  "weight": 15289,
  "timestamp": "2026-02-10T10:30:00+07:00"
}
```

**Response Sukses (200):**
```json
{
  "status": "OK",
  "message": "Data diterima",
  "received_at": "2026-02-10T10:30:01+07:00"
}
```

**Response Error — API Key salah (401):**
```json
{
  "status": "ERROR",
  "message": "API Key tidak valid",
  "code": "UNAUTHORIZED"
}
```

**Response Error — Data tidak valid (400):**
```json
{
  "status": "ERROR",
  "message": "Field 'weight' wajib berupa angka positif",
  "code": "VALIDATION_ERROR"
}
```

**Response Error — Server error (500):**
```json
{
  "status": "ERROR",
  "message": "Internal server error",
  "code": "SERVER_ERROR"
}
```

---

### 4.2 Frontend → Backend (Baca Data Terakhir)

**Request:**
```http
GET /api/weighing/read HTTP/1.1
Host: [domain-htgroup]
```

**Response Sukses (ada data):**
```json
{
  "success": true,
  "data": {
    "weight": 15289,
    "unit": "kg",
    "timestamp": "2026-02-10T10:30:00+07:00",
    "receivedAt": "2026-02-10T10:30:01+07:00",
    "isStale": false
  }
}
```

**Response Sukses (belum ada data):**
```json
{
  "success": true,
  "data": null,
  "message": "Belum ada data dari timbangan. Pastikan vendor sudah mengirim data."
}
```

---

## 5. Spesifikasi Field

### Field yang Dikirim Vendor

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `weight` | `number` | ✅ | Berat dalam **kg** (integer, positif, max 100.000) |
| `timestamp` | `string` | ✅ | Waktu penimbangan, format **ISO 8601** |

### Validasi yang Dilakukan Server

| Rule | Deskripsi | HTTP Code |
|------|-----------|-----------|
| API Key valid | Header `X-API-Key` harus cocok | 401 |
| `weight` adalah number | Bukan string/null/undefined | 400 |
| `weight > 0` | Harus positif | 400 |
| `weight <= 100000` | Max 100 ton | 400 |
| `timestamp` ada | Wajib diisi | 400 |
| `timestamp` valid | Format ISO 8601 yang bisa di-parse | 400 |

---

## 6. Cara Kerja Internal

### 6.1 Receiver Endpoint (Backend)

**File:** [receive/route.ts](file:///d:/Aplikasi/www/htgroupapp/src/app/api/weighing/receive/route.ts)

```typescript
export async function POST(request: NextRequest) {
    // 1. Validasi API Key dari header X-API-Key
    // 2. Parse body: { weight, timestamp }
    // 3. Validasi weight (number, > 0, <= 100000)
    // 4. Validasi timestamp (ISO 8601)
    // 5. Simpan ke buffer: pushWeight(weight, "kg", parsedTimestamp)
    // 6. Return { status: "OK", message: "Data diterima" }
}
```

### 6.2 Buffer Module

**File:** [weighing-buffer.ts](file:///d:/Aplikasi/www/htgroupapp/src/server/lib/weighing-buffer.ts)

```typescript
// Simpan data terakhir (in-memory)
pushWeight(weight, unit, vendorTimestamp)

// Baca data terakhir + stale check (>30 detik)
readWeight()  // → { weight, unit, vendorTimestamp, receivedAt, isStale }
```

### 6.3 Read Endpoint (Backend → Frontend)

**File:** [read/route.ts](file:///d:/Aplikasi/www/htgroupapp/src/app/api/weighing/read/route.ts)

```typescript
export async function GET() {
    // Baca dari buffer
    // Return: { weight, unit, timestamp (dari vendor), receivedAt, isStale }
}
```

### 6.4 Hook (Frontend)

**File:** [use-weighing-scale.ts](file:///d:/Aplikasi/www/htgroupapp/src/hooks/use-weighing-scale.ts)

```typescript
const { loading, fetchWeight } = useWeighingScale();

// fetchWeight() returns: { weight: number, timestamp: string } | null
const data = await fetchWeight();
if (data) {
    setFormData({
        beratBruto: data.weight,                    // Berat dari vendor
        waktuTimbangBruto: new Date(data.timestamp), // Waktu dari vendor
    });
}
```

---

## 7. Komponen yang Menggunakan Integrasi

| Modul | File | Field Berat | Field Waktu |
|-------|------|-------------|-------------|
| Penerimaan TBS (Bruto) | [penerimaan-step2.tsx](file:///d:/Aplikasi/www/htgroupapp/src/components/dashboard/pt-pks/penerimaan-tbs/penerimaan-step2.tsx) | `beratBruto` | `waktuTimbangBruto` |
| Penerimaan TBS (Bruto) | [penerimaan-bruto-step2.tsx](file:///d:/Aplikasi/www/htgroupapp/src/components/dashboard/pt-pks/penerimaan-tbs/penerimaan-bruto-step2.tsx) | `beratBruto` | `waktuTimbangBruto` |
| Penerimaan TBS (Tarra) | [penerimaan-step3.tsx](file:///d:/Aplikasi/www/htgroupapp/src/components/dashboard/pt-pks/penerimaan-tbs/penerimaan-step3.tsx) | `beratTarra` | `waktuTimbangTarra` |
| Pengiriman Product (Tarra) | [pengiriman-step2.tsx](file:///d:/Aplikasi/www/htgroupapp/src/components/dashboard/pt-pks/pengiriman-product/pengiriman-step2.tsx) | `beratTarra` | `waktuTimbangTarra` |
| Pengiriman Product (Gross) | [gross-wizard.tsx](file:///d:/Aplikasi/www/htgroupapp/src/components/dashboard/pt-pks/pengiriman-product/gross-wizard.tsx) | `beratGross` | `waktuTimbangGross` |

---

## 8. File yang Terlibat

| File | Lokasi | Fungsi |
|------|--------|--------|
| [route.ts](file:///d:/Aplikasi/www/htgroupapp/src/app/api/weighing/receive/route.ts) | `src/app/api/weighing/receive/` | API receiver (vendor POST ke sini) |
| [route.ts](file:///d:/Aplikasi/www/htgroupapp/src/app/api/weighing/read/route.ts) | `src/app/api/weighing/read/` | API read (frontend baca data) |
| [weighing-buffer.ts](file:///d:/Aplikasi/www/htgroupapp/src/server/lib/weighing-buffer.ts) | `src/server/lib/` | Buffer in-memory |
| [use-weighing-scale.ts](file:///d:/Aplikasi/www/htgroupapp/src/hooks/use-weighing-scale.ts) | `src/hooks/` | React hook untuk frontend |

---

## 9. Konfigurasi

### Environment Variable

```env
# API Key untuk autentikasi vendor (wajib untuk production)
WEIGHING_API_KEY=wgh_k3y_your_secret_key_here
```

> **Catatan:** Jika `WEIGHING_API_KEY` tidak diset, endpoint menerima POST tanpa autentikasi (mode development).

---

# BAGIAN UNTUK VENDOR

## Spesifikasi Integrasi Timbangan — HT Group App

### Ikhtisar

Vendor timbangan mengirim data penimbangan ke API HT Group setiap kali ada penimbangan. Data dikirim melalui **HTTP POST**.

### Endpoint

```
Method  : POST
URL     : https://[domain-htgroup]/api/weighing/receive
```

### Header

| Header | Wajib | Keterangan |
|--------|-------|------------|
| `Content-Type` | ✅ | `application/json` |
| `X-API-Key` | ✅ | API Key yang diberikan oleh HT Group |

### Body (JSON)

```json
{
  "weight": 15289,
  "timestamp": "2026-02-10T10:30:00+07:00"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `weight` | `number` | ✅ | Berat dalam **kg** (angka bulat, positif, max 100.000) |
| `timestamp` | `string` | ✅ | Waktu penimbangan, format **ISO 8601** (contoh: `2026-02-10T10:30:00+07:00`) |

### Response

**Sukses (HTTP 200):**
```json
{
  "status": "OK",
  "message": "Data diterima",
  "received_at": "2026-02-10T10:30:01+07:00"
}
```

**Error — API Key salah (HTTP 401):**
```json
{
  "status": "ERROR",
  "message": "API Key tidak valid",
  "code": "UNAUTHORIZED"
}
```

**Error — Data tidak valid (HTTP 400):**
```json
{
  "status": "ERROR",
  "message": "Field 'weight' wajib berupa angka positif",
  "code": "VALIDATION_ERROR"
}
```

### Contoh Implementasi

**cURL:**
```bash
curl -X POST https://[domain-htgroup]/api/weighing/receive \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wgh_k3y_your_key" \
  -d '{"weight": 15289, "timestamp": "2026-02-10T10:30:00+07:00"}'
```

**Node.js:**
```javascript
async function sendWeighingData(weight) {
  const response = await fetch("https://[domain-htgroup]/api/weighing/receive", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "wgh_k3y_your_key"
    },
    body: JSON.stringify({
      weight: weight,
      timestamp: new Date().toISOString()
    })
  });

  const result = await response.json();
  console.log(result);
  // { status: "OK", message: "Data diterima", received_at: "..." }
}

// Panggil setiap penimbangan selesai
sendWeighingData(15289);
```

**Python:**
```python
import requests
from datetime import datetime

def send_weighing_data(weight):
    response = requests.post(
        "https://[domain-htgroup]/api/weighing/receive",
        headers={
            "Content-Type": "application/json",
            "X-API-Key": "wgh_k3y_your_key"
        },
        json={
            "weight": weight,
            "timestamp": datetime.now().isoformat()
        }
    )
    print(response.json())

# Panggil setiap penimbangan selesai
send_weighing_data(15289)
```

**C# (.NET):**
```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;

async Task SendWeighingData(int weight)
{
    var client = new HttpClient();
    client.DefaultRequestHeaders.Add("X-API-Key", "wgh_k3y_your_key");

    var payload = new {
        weight = weight,
        timestamp = DateTime.Now.ToString("o")
    };

    var content = new StringContent(
        JsonSerializer.Serialize(payload),
        Encoding.UTF8,
        "application/json"
    );

    var response = await client.PostAsync(
        "https://[domain-htgroup]/api/weighing/receive",
        content
    );

    var result = await response.Content.ReadAsStringAsync();
    Console.WriteLine(result);
}

// Panggil setiap penimbangan selesai
await SendWeighingData(15289);
```

### Catatan Penting

1. **API Key wajib** — disertakan di header `X-API-Key`
2. **Kirim setiap penimbangan** — POST dilakukan setiap kali ada penimbangan selesai
3. **Timestamp dari timbangan** — gunakan waktu saat penimbangan terjadi, bukan waktu pengiriman data
4. **Format berat** — integer dalam kilogram (contoh: 15289, bukan 15.289 atau 15289.0)
5. **Response OK** — jika mendapat `status: "OK"`, data sudah diterima
6. **Retry jika gagal** — jika mendapat error 500, coba kirim ulang setelah 5 detik

---

## Checklist Go-Live

**Vendor:**
- [ ] POST ke `/api/weighing/receive` berfungsi
- [ ] Header `X-API-Key` disertakan
- [ ] Body mengandung `weight` (number) dan `timestamp` (ISO 8601)
- [ ] Mendapat response `status: "OK"` dari server
- [ ] Firewall mengizinkan akses ke server HT Group

**HT Group:**
- [ ] Set `WEIGHING_API_KEY` di `.env`
- [ ] Restart server
- [ ] Berikan API Key ke vendor
- [ ] Test tombol "Baca dari Timbangan"
- [ ] Verifikasi waktu timbang sesuai waktu vendor (bukan waktu klik tombol)
