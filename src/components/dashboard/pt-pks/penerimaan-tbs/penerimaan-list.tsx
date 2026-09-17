"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type PenerimaanTBS = {
  id: string;
  nomorPenerimaan: string;
  tanggalTerima: string;
  beratBruto: number;
  beratTarra: number;
  beratNetto2: number;
  hargaPerKg: number;
  totalBayar: number;
  status: string;
  material: {
    nama: string;
  };
  supplier: {
    ownerName: string;
    companyName?: string | null;
  };
  transporter: {
    nomorKendaraan: string;
    namaSupir: string;
  };
};

type PenerimaanTBSListProps = {
  onRefresh?: () => void;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  TIMBANG_BRUTO: { label: "Menunggu Tarra", variant: "outline" },
  TIMBANG_TARRA: { label: "Timbangan Selesai", variant: "outline" },
  PENDING_HARGA: { label: "Menunggu Harga", variant: "outline" },
  COMPLETED: { label: "Selesai", variant: "default" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

export function PenerimaanTBSList({ onRefresh }: PenerimaanTBSListProps) {
  const [data, setData] = useState<PenerimaanTBS[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pt-pks/penerimaan-tbs");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Belum ada data penerimaan TBS</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Penerimaan</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Kendaraan</TableHead>
            <TableHead className="text-right">Bruto (kg)</TableHead>
            <TableHead className="text-right">Tarra (kg)</TableHead>
            <TableHead className="text-right">Netto (kg)</TableHead>
            <TableHead className="text-right">Harga/kg</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const statusInfo = statusConfig[item.status] || { label: item.status, variant: "secondary" as const };
            return (
              <TableRow key={item.id}>
                <TableCell className="font-mono font-medium">
                  {item.nomorPenerimaan}
                </TableCell>
                <TableCell>
                  {format(new Date(item.tanggalTerima), "dd MMM yyyy", { locale: idLocale })}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.supplier.companyName?.trim() || item.supplier.ownerName}</div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.transporter.nomorKendaraan}</div>
                    <div className="text-xs text-muted-foreground">{item.transporter.namaSupir}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {item.beratBruto > 0 ? item.beratBruto.toLocaleString("id-ID") : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {item.beratTarra > 0 ? item.beratTarra.toLocaleString("id-ID") : "-"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.beratNetto2 > 0 ? item.beratNetto2.toLocaleString("id-ID") : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {item.hargaPerKg > 0 ? `Rp ${item.hargaPerKg.toLocaleString("id-ID")}` : "-"}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {item.totalBayar > 0 ? `Rp ${item.totalBayar.toLocaleString("id-ID")}` : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant}>
                    {statusInfo.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
