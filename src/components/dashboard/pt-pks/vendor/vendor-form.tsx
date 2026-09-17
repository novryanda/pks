"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const vendorFormSchema = z.object({
  code: z.string().min(1, "Kode vendor wajib diisi"),
  name: z.string().min(1, "Nama vendor wajib diisi"),
  contactPerson: z.string().min(1, "Contact person wajib diisi"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  phone: z.string().min(1, "Nomor telepon wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi"),
  // Informasi Pajak
  npwp: z.string().optional().or(z.literal("")),
  taxStatus: z.enum(["NON_PKP", "PKP_11", "PKP_1_1"]),
  // Informasi Rekening
  bankName: z.string().optional().or(z.literal("")),
  accountNumber: z.string().optional().or(z.literal("")),
  accountName: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

type VendorFormProps = {
  initialData?: Partial<VendorFormData> & { id?: string };
  mode?: "create" | "edit";
};

export function VendorForm({ initialData, mode = "create" }: VendorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      contactPerson: initialData?.contactPerson || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      npwp: initialData?.npwp || "",
      taxStatus: initialData?.taxStatus || "NON_PKP",
      bankName: initialData?.bankName || "",
      accountNumber: initialData?.accountNumber || "",
      accountName: initialData?.accountName || "",
      status: initialData?.status || "ACTIVE",
    },
  });

  const taxStatus = watch("taxStatus");

  const generateCode = async () => {
    setGeneratingCode(true);
    try {
      const response = await fetch("/api/pt-pks/vendor/generate-code");
      if (!response.ok) throw new Error("Failed to generate code");
      const data = await response.json();
      setValue("code", data.code);
    } catch (error) {
      console.error("Error generating code:", error);
      alert("Gagal generate kode vendor");
    } finally {
      setGeneratingCode(false);
    }
  };

  const onSubmit = async (data: VendorFormData) => {
    setLoading(true);
    try {
      const url =
        mode === "create"
          ? "/api/pt-pks/vendor"
          : `/api/pt-pks/vendor/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      // Clean up empty strings to null
      const cleanedData = {
        ...data,
        email: data.email || null,
        npwp: data.npwp || null,
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        accountName: data.accountName || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save vendor");
      }

      router.push("/dashboard/pt-pks/master/vendor");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving vendor:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informasi Umum */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Umum</CardTitle>
          <CardDescription>Data identitas vendor transportir</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Kode Vendor <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="VND-24-0001"
                  disabled={mode === "edit"}
                />
                {mode === "create" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCode}
                    disabled={generatingCode}
                  >
                    {generatingCode ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Generate"
                    )}
                  </Button>
                )}
              </div>
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Vendor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="CV. Transport Jaya"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">
                Contact Person <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactPerson"
                {...register("contactPerson")}
                placeholder="Nama contact person"
              />
              {errors.contactPerson && (
                <p className="text-sm text-destructive">
                  {errors.contactPerson.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                No. Telepon <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="08xxxxxxxxxx"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="vendor@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("status", value as "ACTIVE" | "INACTIVE")
                }
                defaultValue={initialData?.status || "ACTIVE"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Alamat <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="address"
              {...register("address")}
              placeholder="Alamat lengkap vendor"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informasi Pajak */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pajak</CardTitle>
          <CardDescription>Data perpajakan vendor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="npwp">NPWP</Label>
              <Input id="npwp" {...register("npwp")} placeholder="00.000.000.0-000.000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxStatus">
                Status Pajak <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("taxStatus", value as "NON_PKP" | "PKP_11" | "PKP_1_1")
                }
                defaultValue={initialData?.taxStatus || "NON_PKP"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status pajak" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NON_PKP">Non PKP</SelectItem>
                  <SelectItem value="PKP_11">PKP 11%</SelectItem>
                  <SelectItem value="PKP_1_1">PKP 1.1%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Keterangan Status Pajak:</strong>
            </p>
            <ul className="text-sm space-y-1 mt-2">
              <li>• Non PKP: Tidak dikenakan PPN</li>
              <li>• PKP 11%: Dikenakan PPN 11%</li>
              <li>• PKP 1.1%: Dikenakan PPN 1.1%</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Informasi Rekening */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Rekening</CardTitle>
          <CardDescription>Data rekening bank untuk pembayaran</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Nama Bank</Label>
            <Input
              id="bankName"
              {...register("bankName")}
              placeholder="Bank BCA, Bank Mandiri, dll"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Nomor Rekening</Label>
              <Input
                id="accountNumber"
                {...register("accountNumber")}
                placeholder="1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Atas Nama</Label>
              <Input
                id="accountName"
                {...register("accountName")}
                placeholder="Nama pemilik rekening"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Simpan" : "Update"}
        </Button>
      </div>
    </form>
  );
}
