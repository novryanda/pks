"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createVendorVehicleSchema } from "@/server/schema/vendor";
import { Loader2, Truck } from "lucide-react";

type VendorVehicleFormValues = z.infer<typeof createVendorVehicleSchema>;

interface VendorVehicleFormProps {
  vendorId: string;
  initialData?: VendorVehicleFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Tidak Aktif" },
];

export function VendorVehicleForm({
  vendorId,
  initialData,
  onSuccess,
  onCancel,
}: VendorVehicleFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch,
  } = useForm<VendorVehicleFormValues>({
    resolver: zodResolver(createVendorVehicleSchema),
    defaultValues: initialData || {
      nomorKendaraan: "",
      namaSupir: "",
      noHpSupir: "",
      noSim: "",
      status: "ACTIVE",
    },
  });

  const onSubmit = async (data: VendorVehicleFormValues) => {
    try {
      const url = isEditing
        ? `/api/pt-pks/vendor/${vendorId}/vehicles/${initialData.id}`
        : `/api/pt-pks/vendor/${vendorId}/vehicles`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save vehicle");
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving vehicle:", error);
      setError("root", {
        type: "manual",
        message: error.message || "Terjadi kesalahan saat menyimpan kendaraan",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Tambah Kendaraan dan Supir
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nomor Kendaraan */}
            <div className="space-y-2">
              <Label htmlFor="nomorKendaraan">Nomor Kendaraan *</Label>
              <Input
                id="nomorKendaraan"
                placeholder="Contoh: B 1234 XYZ"
                {...register("nomorKendaraan")}
                disabled={isSubmitting}
              />
              {errors.nomorKendaraan && (
                <p className="text-sm text-destructive">
                  {errors.nomorKendaraan.message}
                </p>
              )}
            </div>

            {/* Nama Supir */}
            <div className="space-y-2">
              <Label htmlFor="namaSupir">Nama Supir *</Label>
              <Input
                id="namaSupir"
                placeholder="Masukkan nama supir"
                {...register("namaSupir")}
                disabled={isSubmitting}
              />
              {errors.namaSupir && (
                <p className="text-sm text-destructive">
                  {errors.namaSupir.message}
                </p>
              )}
            </div>

            {/* No HP Supir */}
            <div className="space-y-2">
              <Label htmlFor="noHpSupir">No. HP Supir</Label>
              <Input
                id="noHpSupir"
                placeholder="Contoh: 081234567890"
                {...register("noHpSupir")}
                disabled={isSubmitting}
              />
              {errors.noHpSupir && (
                <p className="text-sm text-destructive">
                  {errors.noHpSupir.message}
                </p>
              )}
            </div>

            {/* No SIM */}
            <div className="space-y-2">
              <Label htmlFor="noSim">No. SIM</Label>
              <Input
                id="noSim"
                placeholder="Contoh: 1234567890123456"
                {...register("noSim")}
                disabled={isSubmitting}
              />
              {errors.noSim && (
                <p className="text-sm text-destructive">
                  {errors.noSim.message}
                </p>
              )}
            </div>
          </div>

          {errors.root && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {errors.root.message}
            </div>
          )}

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Batal
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Simpan Perubahan" : "Tambah Kendaraan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
