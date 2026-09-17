# Dokumen Requirement Integrasi Timbangan
## HT Group App — Weighing Scale Integration

**Versi:** 1.0  
**Tanggal:** 10 Februari 2026  
**Dari:** Tim IT HT Group  
**Untuk:** Vendor Timbangan  

---

## 1. Latar Belakang

HT Group mengoperasikan pabrik kelapa sawit (PKS) yang memerlukan integrasi data penimbangan secara otomatis. Saat ini proses input berat dilakukan manual oleh operator. Dengan integrasi ini, data berat dari timbangan fisik akan otomatis dikirim ke sistem kami.

---

## 2. Kebutuhan Integrasi

Vendor timbangan perlu mengirim data penimbangan ke API endpoint HT Group **setiap kali ada penimbangan selesai** menggunakan HTTP POST.

### Alur Kerja

```
┌──────────────────┐                              ┌──────────────────┐
│                  │    1. POST data penimbangan   │                  │
│  TIMBANGAN       │  ──────────────────────────▶  │  HT GROUP APP    │
│  VENDOR          │                               │  (API Receiver)  │
│                  │  ◀──────────────────────────   │                  │
│                  │    2. Response (OK / Error)    │                  │
└──────────────────┘                              └──────────────────┘
                                                          │
                                                          ▼
                                                  ┌──────────────────┐
                                                  │  Operator klik   │
                                                  │  "Baca dari      │
                                                  │  Timbangan" di   │
                                                  │  aplikasi        │
                                                  │                  │
                                                  │  → Form terisi   │
                                                  │    otomatis      │
                                                  └──────────────────┘
```

### Kapan Vendor Harus Mengirim Data?

Setiap kali **satu siklus penimbangan selesai** (kendaraan selesai ditimbang dan berat stabil), vendor mengirimkan data ke API kami.

---

## 3. Spesifikasi Teknis

### 3.1 Endpoint

| Item | Nilai |
|------|-------|
| **Method** | `POST` |
| **URL** | `https://[domain-htgroup]/api/weighing/receive` |
| **Content-Type** | `application/json` |
| **Autentikasi** | API Key via header `X-API-Key` |

> **URL dan API Key akan diberikan oleh Tim IT HT Group saat tahap pengujian.**

### 3.2 Header Request

| Header | Wajib | Nilai |
|--------|-------|-------|
| `Content-Type` | ✅ | `application/json` |
| `X-API-Key` | ✅ | API Key yang diberikan oleh HT Group |

### 3.3 Body Request (JSON)

```json
{
  "weight": 15289,
  "timestamp": "2026-02-10T10:30:00+07:00"
}
```

| Field | Tipe Data | Wajib | Deskripsi |
|-------|-----------|-------|-----------|
| `weight` | `number` (integer) | ✅ | Berat dalam **kilogram**. Angka bulat, positif, maksimal 100.000 |
| `timestamp` | `string` (ISO 8601) | ✅ | Waktu saat penimbangan terjadi. Format: `YYYY-MM-DDTHH:mm:ss+07:00` |

### Contoh Nilai `weight`

| Berat Sebenarnya | Nilai `weight` | Benar? |
|------------------|---------------|--------|
| 15.289 kg | `15289` | ✅ |
| 8.500 kg | `8500` | ✅ |
| 15289.5 kg | `15290` (bulatkan) | ✅ |
| "15289" | ❌ string, bukan number | ❌ |
| -100 | ❌ negatif | ❌ |

### Contoh Nilai `timestamp`

| Format | Benar? |
|--------|--------|
| `2026-02-10T10:30:00+07:00` | ✅ (WIB) |
| `2026-02-10T03:30:00Z` | ✅ (UTC) |
| `2026-02-10T10:30:00` | ✅ (tanpa timezone) |
| `10/02/2026 10:30` | ❌ bukan ISO 8601 |

---

## 4. Response dari Server HT Group

### 4.1 Sukses (HTTP 200)

```json
{
  "status": "OK",
  "message": "Data diterima",
  "received_at": "2026-02-10T10:30:01+07:00"
}
```

**Artinya:** Data berhasil diterima dan tersimpan. Tidak perlu kirim ulang.

### 4.2 Error — API Key Salah (HTTP 401)

```json
{
  "status": "ERROR",
  "message": "API Key tidak valid",
  "code": "UNAUTHORIZED"
}
```

**Solusi:** Periksa header `X-API-Key`, pastikan nilainya sesuai dengan yang diberikan oleh HT Group.

### 4.3 Error — Data Tidak Valid (HTTP 400)

```json
{
  "status": "ERROR",
  "message": "Field 'weight' harus lebih dari 0",
  "code": "VALIDATION_ERROR"
}
```

**Kemungkinan penyebab:**
- `weight` bukan angka (number)
- `weight` bernilai 0 atau negatif
- `weight` lebih dari 100.000
- `timestamp` tidak ada atau format salah

### 4.4 Error — Server Error (HTTP 500)

```json
{
  "status": "ERROR",
  "message": "Internal server error",
  "code": "SERVER_ERROR"
}
```

**Solusi:** Coba kirim ulang setelah **5 detik**. Jika masih gagal, hubungi Tim IT HT Group.

---

## 5. Contoh Implementasi

### 5.1 cURL (Command Line)

```bash
curl -X POST https://[domain-htgroup]/api/weighing/receive \
  -H "Content-Type: application/json" \
  -H "X-API-Key: [api-key-anda]" \
  -d '{"weight": 15289, "timestamp": "2026-02-10T10:30:00+07:00"}'
```

### 5.2 Node.js

```javascript
const https = require('https');

function kirimDataTimbangan(berat) {
  const data = JSON.stringify({
    weight: berat,
    timestamp: new Date().toISOString()
  });

  const options = {
    hostname: '[domain-htgroup]',
    path: '/api/weighing/receive',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': '[api-key-anda]'
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      const result = JSON.parse(body);
      if (result.status === 'OK') {
        console.log('Data terkirim:', result.received_at);
      } else {
        console.error('Error:', result.message);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Koneksi gagal:', err.message);
    // Retry setelah 5 detik
    setTimeout(() => kirimDataTimbangan(berat), 5000);
  });

  req.write(data);
  req.end();
}

// Panggil setiap penimbangan selesai
kirimDataTimbangan(15289);
```

### 5.3 Python

```python
import requests
from datetime import datetime

API_URL = "https://[domain-htgroup]/api/weighing/receive"
API_KEY = "[api-key-anda]"

def kirim_data_timbangan(berat):
    try:
        response = requests.post(
            API_URL,
            headers={
                "Content-Type": "application/json",
                "X-API-Key": API_KEY
            },
            json={
                "weight": berat,
                "timestamp": datetime.now().isoformat()
            },
            timeout=10
        )

        result = response.json()

        if result["status"] == "OK":
            print(f"Data terkirim: {result['received_at']}")
        else:
            print(f"Error: {result['message']}")

    except requests.exceptions.RequestException as e:
        print(f"Koneksi gagal: {e}")
        # Retry logic di sini

# Panggil setiap penimbangan selesai
kirim_data_timbangan(15289)
```

### 5.4 C# (.NET)

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class WeighingIntegration
{
    private static readonly HttpClient client = new HttpClient();
    private const string API_URL = "https://[domain-htgroup]/api/weighing/receive";
    private const string API_KEY = "[api-key-anda]";

    public static async Task KirimDataTimbangan(int berat)
    {
        try
        {
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("X-API-Key", API_KEY);

            var payload = new
            {
                weight = berat,
                timestamp = DateTime.Now.ToString("o")
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync(API_URL, content);
            var body = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"Status: {response.StatusCode}");
            Console.WriteLine($"Response: {body}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}

// Panggil: await WeighingIntegration.KirimDataTimbangan(15289);
```

### 5.5 Delphi / Pascal

```pascal
uses
  System.SysUtils, System.Net.HttpClient, System.JSON, System.DateUtils;

procedure KirimDataTimbangan(Berat: Integer);
var
  HttpClient: THTTPClient;
  Response: IHTTPResponse;
  RequestBody: TStringStream;
  JsonObj: TJSONObject;
begin
  HttpClient := THTTPClient.Create;
  try
    HttpClient.ContentType := 'application/json';
    HttpClient.CustomHeaders['X-API-Key'] := '[api-key-anda]';

    JsonObj := TJSONObject.Create;
    try
      JsonObj.AddPair('weight', TJSONNumber.Create(Berat));
      JsonObj.AddPair('timestamp', FormatDateTime('yyyy-mm-dd"T"hh:nn:ss"+07:00"', Now));

      RequestBody := TStringStream.Create(JsonObj.ToString, TEncoding.UTF8);
      try
        Response := HttpClient.Post(
          'https://[domain-htgroup]/api/weighing/receive',
          RequestBody
        );

        if Response.StatusCode = 200 then
          WriteLn('Data terkirim')
        else
          WriteLn('Error: ' + Response.ContentAsString);
      finally
        RequestBody.Free;
      end;
    finally
      JsonObj.Free;
    end;
  finally
    HttpClient.Free;
  end;
end;

// Panggil: KirimDataTimbangan(15289);
```

---

## 6. Diagram Alur Lengkap

```
                        PROSES PENIMBANGAN
                        ==================

  ┌─────────────────────────────────────────────────────┐
  │  LANGKAH 1: Kendaraan naik ke timbangan             │
  └──────────────────────┬──────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────────┐
  │  LANGKAH 2: Timbangan membaca berat (stabil)        │
  │  Contoh: 15.289 kg                                  │
  └──────────────────────┬──────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────────┐
  │  LANGKAH 3: Software vendor otomatis POST ke API    │
  │                                                     │
  │  POST https://[domain]/api/weighing/receive         │
  │  Header: X-API-Key: [key]                           │
  │  Body: {"weight": 15289,                            │
  │         "timestamp": "2026-02-10T10:30:00+07:00"}   │
  └──────────────────────┬──────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────────┐
  │  LANGKAH 4: Server HT Group menerima dan validasi   │
  │                                                     │
  │  ✅ Response: {"status": "OK"}                       │
  │  ❌ Response: {"status": "ERROR", ...}               │
  └──────────────────────┬──────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────────┐
  │  LANGKAH 5: Operator klik "Baca dari Timbangan"     │
  │  di aplikasi HT Group → Form terisi otomatis        │
  │                                                     │
  │  • Berat: 15.289 kg                                 │
  │  • Waktu: 10:30:00 (dari timbangan, bukan klik)     │
  └─────────────────────────────────────────────────────┘
```

---

## 7. Persyaratan Teknis

### Dari Sisi Vendor

| No | Persyaratan | Keterangan |
|----|-------------|------------|
| 1 | Software timbangan bisa melakukan HTTP POST | Wajib |
| 2 | Koneksi jaringan ke server HT Group | Wajib (internet/VPN) |
| 3 | Mendukung format JSON | Wajib |
| 4 | Menyertakan API Key di header | Wajib |
| 5 | Mengirim berat sebagai integer (kg) | Wajib |
| 6 | Mengirim timestamp ISO 8601 | Wajib |
| 7 | Retry jika gagal (timeout/error 500) | Direkomendasikan |

### Dari Sisi HT Group

| No | Yang Kami Sediakan | Keterangan |
|----|-------------------|------------|
| 1 | URL endpoint | Akan diberikan saat pengujian |
| 2 | API Key | Akan diberikan saat pengujian |
| 3 | Dokumentasi ini | Spesifikasi teknis lengkap |
| 4 | Environment testing | Untuk uji coba sebelum go-live |

---

## 8. Tahapan Implementasi

| Fase | Aktivitas | PIC |
|------|-----------|-----|
| **1. Persiapan** | HT Group berikan URL + API Key testing | IT HT Group |
| **2. Pengembangan** | Vendor implementasi POST di software timbangan | Vendor |
| **3. Pengujian** | Kirim data test, verifikasi response | Bersama |
| **4. UAT** | Test dengan penimbangan real di lokasi | Bersama |
| **5. Go-Live** | Switch ke URL production | IT HT Group |

---

## 9. Checklist Pengujian

### Vendor Harus Memastikan:

- [ ] POST ke endpoint berhasil (response `status: "OK"`)
- [ ] API Key disertakan di header `X-API-Key`
- [ ] Body JSON valid: `weight` (number) + `timestamp` (string ISO 8601)
- [ ] Berat yang dikirim sesuai dengan yang tampil di timbangan
- [ ] Timestamp sesuai dengan waktu penimbangan
- [ ] Handling error: retry jika timeout atau HTTP 500

### HT Group Harus Memastikan:

- [ ] Endpoint aktif dan bisa diakses dari jaringan vendor
- [ ] API Key sudah di-set di server
- [ ] Data yang diterima tampil di form aplikasi saat klik "Baca dari Timbangan"
- [ ] Waktu yang tampil di form = waktu vendor (bukan waktu klik tombol)

---

## 10. Kontak

| Pihak | Nama | Role |
|-------|------|------|
| HT Group | [Nama PIC IT] | Tim IT |
| Vendor | [Nama PIC Vendor] | Tim Teknis |

---

*Dokumen ini adalah spesifikasi teknis resmi untuk integrasi timbangan. Jika ada pertanyaan teknis, silakan hubungi Tim IT HT Group.*
