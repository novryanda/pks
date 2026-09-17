"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TransporterDetailProps = {
  transporterId: string;
  onBack: () => void;
};

type TransporterDetail = {
  id: string;
  nomorKendaraan: string;
  namaSupir: string;
  telepon?: string | null;
  penerimaanTBS: Array<{
    id: string;
    nomorPenerimaan: string;
    tanggalTerima: string;
    beratNetto2: number;
    supplier: {
      ownerName: string;
    };
    material: {
      name: string;
    };
  }>;
};

export function TransporterDetail({ transporterId, onBack }: TransporterDetailProps) {
  const [transporter, setTransporter] = useState<TransporterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/pt-pks/transporter?id=${transporterId}`);
        if (res.ok) {
          const data = await res.json();
          setTransporter(data);
        }
      } catch (error) {
        console.error("Error fetching transporter detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [transporterId]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!transporter) {
    return <div className="text-center py-8">Data tidak ditemukan</div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Detail Transporter</CardTitle>
          <CardDescription>
            Informasi lengkap transporter dan riwayat pengiriman
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Nomor Kendaraan</div>
              <div className="font-medium">{transporter.nomorKendaraan}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Nama Supir</div>
              <div className="font-medium">{transporter.namaSupir}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Telepon</div>
              <div className="font-medium">{transporter.telepon || "-"}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Riwayat Pengiriman TBS</h3>
            {transporter.penerimaanTBS.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada riwayat pengiriman
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Penerimaan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Berat (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transporter.penerimaanTBS.map((penerimaan) => (
                    <TableRow key={penerimaan.id}>
                      <TableCell className="font-mono text-sm">
                        {penerimaan.nomorPenerimaan}
                      </TableCell>
                      <TableCell>
                        {new Date(penerimaan.tanggalTerima).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>{penerimaan.supplier.ownerName}</TableCell>
                      <TableCell>{penerimaan.material.name}</TableCell>
                      <TableCell className="text-right">
                        {penerimaan.beratNetto2.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
