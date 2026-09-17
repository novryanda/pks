"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { PengirimanFormData } from "./pengiriman-wizard";

type Vendor = {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
};

type VendorVehicle = {
  id: string;
  nomorKendaraan: string;
  namaSupir: string;
  noHpSupir?: string | null;
  noSim?: string | null;
};

type Material = {
  id: string;
  code: string;
  name: string;
  kategori?: {
    name: string;
  };
  satuan: {
    name: string;
    symbol: string;
  };
};

type VendorDropdownResponse = {
  vendors?: Vendor[];
};

type MaterialDropdownResponse = {
  materials?: Material[];
};

type VehicleDropdownResponse = {
  vehicles?: VendorVehicle[];
};

type CreateVehicleResponse = {
  vehicle: VendorVehicle;
};

type SessionResponse = {
  user?: {
    name?: string | null;
  } | null;
};

type PengirimanStep1Props = {
  data: Partial<PengirimanFormData>;
  onUpdate: (data: Partial<PengirimanFormData>) => void;
  onNext: () => void;
};

export function PengirimanStep1({ data, onUpdate, onNext }: PengirimanStep1Props) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vehicles, setVehicles] = useState<VendorVehicle[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    nomorKendaraan: "",
    namaSupir: "",
    noHpSupir: "",
    noSim: "",
  });

  const [formData, setFormData] = useState({
    tanggalPengiriman: data.tanggalPengiriman ?? new Date(),
    operatorPenimbang: data.operatorPenimbang ?? "",
    vendorId: data.vendorId ?? "",
    vendorVehicleId: data.vendorVehicleId ?? "",
    materialId: data.materialId ?? "",
  });

  useEffect(() => {
    void fetchVendors();
    void fetchMaterials();
    void fetchUserName();
  }, []);

  useEffect(() => {
    if (!formData.vendorId) {
      setVehicles([]);
      setFormData((prev) => ({ ...prev, vendorVehicleId: "" }));
      return;
    }

    void fetchVehiclesByVendor(formData.vendorId);
  }, [formData.vendorId]);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/pt-pks/vendor?dropdown=true");
      if (!res.ok) {
        setVendors([]);
        return;
      }

      const result = (await res.json()) as VendorDropdownResponse;
      setVendors(result.vendors ?? []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/pt-pks/material?dropdown=true");
      if (!res.ok) {
        setMaterials([]);
        return;
      }

      const result = (await res.json()) as MaterialDropdownResponse;
      setMaterials(result.materials ?? []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const fetchVehiclesByVendor = async (vendorId: string) => {
    setLoadingVehicles(true);

    try {
      const res = await fetch(`/api/pt-pks/vendor/${vendorId}/vehicles?dropdown=true`);
      if (!res.ok) {
        setVehicles([]);
        return;
      }

      const result = (await res.json()) as VehicleDropdownResponse;
      setVehicles(result.vehicles ?? []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchUserName = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        return;
      }

      const session = (await res.json()) as SessionResponse;
      setFormData((prev) => ({
        ...prev,
        operatorPenimbang: session.user?.name ?? "",
      }));
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  const handleNext = () => {
    if (!formData.materialId) {
      alert("Produk harus dipilih");
      return;
    }

    if (!formData.vendorId) {
      alert("Vendor transportir harus dipilih");
      return;
    }

    if (!formData.vendorVehicleId) {
      alert("Kendaraan harus dipilih");
      return;
    }

    onUpdate(formData);
    onNext();
  };

  const handleAddNewVehicle = async () => {
    if (!newVehicle.nomorKendaraan.trim()) {
      alert("Nomor kendaraan harus diisi");
      return;
    }

    if (!newVehicle.namaSupir.trim()) {
      alert("Nama supir harus diisi");
      return;
    }

    setIsSubmittingVehicle(true);

    try {
      const res = await fetch(`/api/pt-pks/vendor/${formData.vendorId}/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomorKendaraan: newVehicle.nomorKendaraan.trim().toUpperCase(),
          namaSupir: newVehicle.namaSupir.trim(),
          noHpSupir: newVehicle.noHpSupir.trim() || null,
          noSim: newVehicle.noSim.trim() || null,
        }),
      });

      if (!res.ok) {
        const error = (await res.json()) as { error?: string };
        alert(error.error ?? "Gagal menambahkan kendaraan");
        return;
      }

      const result = (await res.json()) as CreateVehicleResponse;
      const createdVehicle = result.vehicle;
      setVehicles((prev) => [...prev, createdVehicle]);
      setFormData((prev) => ({ ...prev, vendorVehicleId: createdVehicle.id }));
      setNewVehicle({ nomorKendaraan: "", namaSupir: "", noHpSupir: "", noSim: "" });
      setIsAddVehicleOpen(false);
      alert("Kendaraan berhasil ditambahkan");
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert("Terjadi kesalahan saat menambahkan kendaraan");
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  const selectedVendor = vendors.find((vendor) => vendor.id === formData.vendorId);
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === formData.vendorVehicleId);
  const selectedMaterial = materials.find((material) => material.id === formData.materialId);

  if (loadingVendors || loadingMaterials) {
    return <div className="flex justify-center p-8">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-900">Informasi Step 1</h3>
        <p className="text-sm text-blue-800">
          Pilih produk yang akan dikirim, vendor transportir, dan kendaraan. Harga vendor transportir akan diinput
          dari menu keuangan setelah pengiriman selesai.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="materialId">Produk yang Dikirim *</Label>
          <Select value={formData.materialId} onValueChange={(value) => setFormData({ ...formData, materialId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih produk" />
            </SelectTrigger>
            <SelectContent>
              {materials.length === 0 ? (
                <div className="p-2 text-center text-sm text-muted-foreground">Tidak ada produk tersedia</div>
              ) : (
                materials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.code} - {material.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedMaterial && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-900">
                {selectedMaterial.name}
              </p>
              <p className="text-xs text-green-700">
                Satuan: {selectedMaterial.satuan.name} ({selectedMaterial.satuan.symbol})
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tanggalPengiriman">Tanggal Pengiriman *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.tanggalPengiriman && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.tanggalPengiriman ? format(formData.tanggalPengiriman, "dd MMMM yyyy") : <span>Pilih tanggal</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.tanggalPengiriman}
                onSelect={(date) => setFormData({ ...formData, tanggalPengiriman: date || new Date() })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operatorPenimbang">Operator Penimbang *</Label>
          <Input id="operatorPenimbang" value={formData.operatorPenimbang} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Operator otomatis terisi dari user yang login</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendorId">Vendor Transportir *</Label>
          <Select value={formData.vendorId} onValueChange={(value) => setFormData({ ...formData, vendorId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih vendor transportir" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.code} - {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedVendor && (
            <div className="text-sm text-muted-foreground">
              <p>Contact: {selectedVendor.contactPerson}</p>
              <p>Telp: {selectedVendor.phone}</p>
            </div>
          )}
        </div>

        {formData.vendorId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vendorVehicleId">Kendaraan *</Label>
              <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Plus className="mr-1 h-4 w-4" />
                    Tambah Kendaraan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Kendaraan Baru</DialogTitle>
                    <DialogDescription>
                      Tambahkan kendaraan baru untuk vendor {selectedVendor?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomorKendaraan">Nomor Kendaraan *</Label>
                      <Input
                        id="nomorKendaraan"
                        placeholder="Contoh: B 1234 ABC"
                        value={newVehicle.nomorKendaraan}
                        onChange={(event) => setNewVehicle({ ...newVehicle, nomorKendaraan: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="namaSupir">Nama Supir *</Label>
                      <Input
                        id="namaSupir"
                        placeholder="Nama lengkap supir"
                        value={newVehicle.namaSupir}
                        onChange={(event) => setNewVehicle({ ...newVehicle, namaSupir: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="noHpSupir">No. HP Supir</Label>
                      <Input
                        id="noHpSupir"
                        placeholder="Opsional"
                        value={newVehicle.noHpSupir}
                        onChange={(event) => setNewVehicle({ ...newVehicle, noHpSupir: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="noSim">No. SIM Supir</Label>
                      <Input
                        id="noSim"
                        placeholder="Masukkan nomor SIM"
                        value={newVehicle.noSim}
                        onChange={(event) => setNewVehicle({ ...newVehicle, noSim: event.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddVehicleOpen(false)} disabled={isSubmittingVehicle}>
                      Batal
                    </Button>
                    <Button onClick={handleAddNewVehicle} disabled={isSubmittingVehicle}>
                      {isSubmittingVehicle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Simpan Kendaraan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Select
              value={formData.vendorVehicleId}
              onValueChange={(value) => setFormData({ ...formData, vendorVehicleId: value })}
              disabled={loadingVehicles}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingVehicles ? "Memuat..." : "Pilih kendaraan"} />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length === 0 && !loadingVehicles ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Belum ada kendaraan. Klik &quot;Tambah Kendaraan&quot; untuk menambah.
                  </div>
                ) : (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.nomorKendaraan} - {vehicle.namaSupir} {vehicle.noSim ? `(SIM: ${vehicle.noSim})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedVehicle && (
              <div className="text-sm text-muted-foreground">
                <p>Supir: {selectedVehicle.namaSupir}</p>
                {selectedVehicle.noHpSupir && <p>HP: {selectedVehicle.noHpSupir}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {formData.materialId && formData.vendorId && formData.vendorVehicleId && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="mb-2 font-semibold">Ringkasan</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Tanggal:</div>
            <div className="font-medium">{format(formData.tanggalPengiriman, "dd MMMM yyyy")}</div>
            <div className="text-muted-foreground">Produk:</div>
            <div className="font-medium">
              {selectedMaterial?.name} ({selectedMaterial?.code})
            </div>
            <div className="text-muted-foreground">Operator:</div>
            <div className="font-medium">{formData.operatorPenimbang}</div>
            <div className="text-muted-foreground">Vendor:</div>
            <div className="font-medium">{selectedVendor?.name}</div>
            <div className="text-muted-foreground">Kendaraan:</div>
            <div className="font-medium">
              {selectedVehicle?.nomorKendaraan} ({selectedVehicle?.namaSupir})
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleNext}>Lanjut ke Timbang Tarra</Button>
      </div>
    </div>
  );
}
