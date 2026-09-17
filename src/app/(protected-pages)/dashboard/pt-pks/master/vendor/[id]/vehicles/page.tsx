"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VendorVehicleTable } from "@/components/dashboard/pt-pks/vendor/vendor-vehicle-table";
import { VendorVehicleForm } from "@/components/dashboard/pt-pks/vendor/vendor-vehicle-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Plus, Truck, Loader2, FileSpreadsheet } from "lucide-react";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

interface VendorVehicle {
  id: string;
  nomorKendaraan: string;
  namaSupir: string;
  noHpSupir: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

interface Vendor {
  id: string;
  kodeVendor: string;
  nama: string;
}

export default function VendorVehiclesPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vehicles, setVehicles] = useState<VendorVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VendorVehicle | null>(null);

  useEffect(() => {
    fetchVendorAndVehicles();
  }, [vendorId]);

  const fetchVendorAndVehicles = async () => {
    setIsLoading(true);
    try {
      // Fetch vendor details
      const vendorResponse = await fetch(`/api/pt-pks/vendor/${vendorId}`);
      if (!vendorResponse.ok) throw new Error("Failed to fetch vendor");
      const vendorData = await vendorResponse.json();
      setVendor(vendorData.vendor);

      // Fetch vehicles
      const vehiclesResponse = await fetch(
        `/api/pt-pks/vendor/${vendorId}/vehicles`
      );
      if (!vehiclesResponse.ok) throw new Error("Failed to fetch vehicles");
      const vehiclesData = await vehiclesResponse.json();
      setVehicles(vehiclesData.vehicles);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setIsSheetOpen(true);
  };

  const handleEditVehicle = (vehicle: VendorVehicle) => {
    setEditingVehicle(vehicle);
    setIsSheetOpen(true);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setVehicles(vehicles.filter((v) => v.id !== vehicleId));
  };

  const handleFormSuccess = () => {
    setIsSheetOpen(false);
    setEditingVehicle(null);
    fetchVendorAndVehicles();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Vendor tidak ditemukan</p>
        <Button onClick={() => router.push("/dashboard/pt-pks/master/vendor")}>
          Kembali ke Daftar Vendor
        </Button>
      </div>
    );
  }

  const handleExportExcel = () => {
    if (vehicles.length === 0) return;

    const columns: ExportColumn[] = [
      { header: "Nomor Kendaraan", key: "nomorKendaraan", width: 20 },
      { header: "Nama Supir", key: "namaSupir", width: 25 },
      { header: "No. HP Supir", key: "noHpSupir", width: 20 },
      { header: "Status", key: "statusLabel", width: 15 },
    ];

    const dataToExport = vehicles.map((v) => ({
      nomorKendaraan: v.nomorKendaraan,
      namaSupir: v.namaSupir || "-",
      noHpSupir: v.noHpSupir || "-",
      statusLabel: v.status === "ACTIVE" ? "Aktif" : "Tidak Aktif",
    }));

    exportToExcel(
      dataToExport,
      columns,
      `Kendaraan_Vendor_${vendor?.kodeVendor || "Vendor"}_${new Date().toISOString().split("T")[0]}`,
      "Kendaraan"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/pt-pks/master/vendor">
                Vendor
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/pt-pks/master/vendor/${vendorId}`}>
                {vendor.nama}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Kendaraan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/pt-pks/master/vendor/${vendorId}`)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Detail Vendor
            </Button>
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Daftar Kendaraan</h1>
                <p className="text-muted-foreground">
                  {vendor.kodeVendor} - {vendor.nama}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={vehicles.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
              Export Excel
            </Button>
            <Button onClick={handleAddVehicle}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kendaraan
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kendaraan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kendaraan Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles.filter((v) => v.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kendaraan Tidak Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles.filter((v) => v.status === "INACTIVE").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kendaraan</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorVehicleTable
            vendorId={vendorId}
            vehicles={vehicles}
            onEdit={handleEditVehicle}
            onDelete={handleDeleteVehicle}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingVehicle ? "Edit Kendaraan" : "Tambah Kendaraan"}
            </SheetTitle>
            <SheetDescription>
              {editingVehicle
                ? "Ubah informasi kendaraan dan supir"
                : "Tambahkan kendaraan baru untuk vendor ini"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <VendorVehicleForm
              vendorId={vendorId}
              initialData={editingVehicle || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
