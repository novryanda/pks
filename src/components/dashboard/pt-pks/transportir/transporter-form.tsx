"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TransporterFormProps = {
  transporter?: {
    id: string;
    nomorKendaraan: string;
    namaSupir: string;
    telepon?: string | null;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export function TransporterForm({ transporter, onSuccess, onCancel }: TransporterFormProps) {
  const [formData, setFormData] = useState({
    nomorKendaraan: transporter?.nomorKendaraan || "",
    namaSupir: transporter?.namaSupir || "",
    telepon: transporter?.telepon || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = "/api/pt-pks/transporter";
      const method = transporter ? "PUT" : "POST";
      const body = transporter
        ? { id: transporter.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan data");
      }
    } catch (error) {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {transporter ? "Edit Transporter" : "Tambah Transporter Baru"}
        </CardTitle>
        <CardDescription>
          Isi data kendaraan dan supir pengirim TBS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nomorKendaraan">Nomor Kendaraan *</Label>
            <Input
              id="nomorKendaraan"
              value={formData.nomorKendaraan}
              onChange={(e) =>
                setFormData({ ...formData, nomorKendaraan: e.target.value })
              }
              placeholder="B 1234 XYZ"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="namaSupir">Nama Supir *</Label>
            <Input
              id="namaSupir"
              value={formData.namaSupir}
              onChange={(e) =>
                setFormData({ ...formData, namaSupir: e.target.value })
              }
              placeholder="Nama supir"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telepon">Telepon</Label>
            <Input
              id="telepon"
              value={formData.telepon}
              onChange={(e) =>
                setFormData({ ...formData, telepon: e.target.value })
              }
              placeholder="08xxx"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
