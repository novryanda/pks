"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

type VendorVehicle = {
  id: string;
  nomorKendaraan: string;
  namaSupir: string;
  noHpSupir: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
};

type VendorVehicleTableProps = {
  vendorId: string;
  vehicles: VendorVehicle[];
  onEdit: (vehicle: VendorVehicle) => void;
  onDelete: (id: string) => void;
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" }> = {
  ACTIVE: { label: "Aktif", variant: "default" },
  INACTIVE: { label: "Tidak Aktif", variant: "secondary" },
};

export function VendorVehicleTable({
  vendorId,
  vehicles,
  onEdit,
  onDelete,
}: VendorVehicleTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nomor Kendaraan</TableHead>
            <TableHead>Jenis Kendaraan</TableHead>
            <TableHead>Nama Supir</TableHead>
            <TableHead>No. HP Supir</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Belum ada kendaraan terdaftar
              </TableCell>
            </TableRow>
          ) : (
            vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">
                  {vehicle.nomorKendaraan}
                </TableCell>
                <TableCell>{vehicle.namaSupir}</TableCell>
                <TableCell>{vehicle.noHpSupir || "-"}</TableCell>
                <TableCell>
                  <Badge variant={statusLabels[vehicle.status]?.variant || "secondary"}>
                    {statusLabels[vehicle.status]?.label || vehicle.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(vehicle)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(vehicle.id)}
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
