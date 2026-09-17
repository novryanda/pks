"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Pencil, Truck, User, Phone, Trash2, Plus } from "lucide-react";
import { VendorVehicleForm } from "./vendor-vehicle-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Vendor = {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string | null;
  phone: string;
  address: string;
  npwp: string | null;
  taxStatus: string;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  status: string;
  createdAt: Date;
  vehicles?: Array<{
    id: string;
    nomorKendaraan: string;
    namaSupir: string;
    noHpSupir: string | null;
    status: string;
  }>;
  _count: {
    vehicles: number;
  };
};

const taxStatusLabels: Record<string, string> = {
  NON_PKP: "Non PKP (0%)",
  PKP_11: "PKP 11%",
  PKP_1_1: "PKP 1.1%",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" }> = {
  ACTIVE: { label: "Aktif", variant: "default" },
  INACTIVE: { label: "Tidak Aktif", variant: "secondary" },
};

export function VendorDetail({ vendor }: { vendor: Vendor }) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState(vendor.vehicles || []);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleVehicleSuccess = async () => {
    // Refresh data vehicles
    const response = await fetch(`/api/pt-pks/vendor/${vendor.id}/vehicles`);
    if (response.ok) {
      const data = await response.json();
      setVehicles(data.vehicles);
      setShowAddForm(false); // Tutup form setelah berhasil
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/pt-pks/vendor/${vendor.id}/vehicles/${deleteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete vehicle");
      }

      setVehicles(vehicles.filter((v) => v.id !== deleteId));
      setDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      alert(error.message || "Gagal menghapus kendaraan");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{vendor.name}</h2>
          <p className="text-muted-foreground">{vendor.code}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/pt-pks/master/vendor/${vendor.id}/edit`)
            }
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Informasi Umum */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Umum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Kode Vendor</p>
              <p className="font-medium">{vendor.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nama Vendor</p>
              <p className="font-medium">{vendor.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium">{vendor.contactPerson}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No. Telepon</p>
              <p className="font-medium">{vendor.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{vendor.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={statusLabels[vendor.status]?.variant || "default"}>
                {statusLabels[vendor.status]?.label || vendor.status}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Alamat</p>
            <p className="font-medium">{vendor.address}</p>
          </div>
        </CardContent>
      </Card>

      {/* Daftar Kendaraan dan Supir */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Daftar Kendaraan dan Supir
              </CardTitle>
              <CardDescription>
                Total {vehicles.length} kendaraan terdaftar
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant={showAddForm ? "outline" : "default"}
            >
              <Plus className="mr-2 h-4 w-4" />
              {showAddForm ? "Batal" : "Tambah Kendaraan"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Tambah Kendaraan */}
          {showAddForm && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <VendorVehicleForm
                vendorId={vendor.id}
                onSuccess={handleVehicleSuccess}
              />
            </div>
          )}

          {/* Daftar Kendaraan */}
          {vehicles.length > 0 ? (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="border rounded-lg p-4 flex items-start justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Nomor Kendaraan
                      </p>
                      <p className="font-medium font-mono">
                        {vehicle.nomorKendaraan}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nama Supir</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{vehicle.namaSupir}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">No. HP Supir</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{vehicle.noHpSupir || "-"}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(vehicle.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Belum ada kendaraan terdaftar</p>
              <p className="text-sm">Klik tombol "Tambah Kendaraan" untuk menambahkan</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informasi Pajak */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pajak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">NPWP</p>
              <p className="font-medium">{vendor.npwp || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status Pajak</p>
              <Badge variant="outline">
                {taxStatusLabels[vendor.taxStatus] || vendor.taxStatus}
              </Badge>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Keterangan:</strong>{" "}
              {vendor.taxStatus === "NON_PKP" && "Tidak dikenakan PPN"}
              {vendor.taxStatus === "PKP_11" && "Dikenakan PPN 11%"}
              {vendor.taxStatus === "PKP_1_1" && "Dikenakan PPN 1.1%"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informasi Rekening */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Rekening</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vendor.bankName || vendor.accountNumber || vendor.accountName ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Bank</p>
                  <p className="font-medium">{vendor.bankName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Rekening</p>
                  <p className="font-medium font-mono">
                    {vendor.accountNumber || "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Atas Nama</p>
                <p className="font-medium">{vendor.accountName || "-"}</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              Informasi rekening belum diisi
            </p>
          )}
        </CardContent>
      </Card>

      {/* Informasi Sistem */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Sistem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Tanggal Dibuat</p>
            <p className="font-medium">
              {new Date(vendor.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alert Dialog untuk Delete Kendaraan */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kendaraan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kendaraan ini? Tindakan ini
              tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
