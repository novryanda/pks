"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, X, Search } from "lucide-react";
import { Controller } from "react-hook-form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { NumericInput } from "@/components/ui/numeric-input";
import { paymentMethodLabels, type PaymentMethod } from "@/server/schema/contract";

const contractItemSchema = z.object({
  materialId: z.string().min(1, "Material wajib dipilih"),
  quantity: z.coerce.number().min(0.01, "Kuantitas harus lebih dari 0"),
  unitPrice: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  notes: z.string().optional(),
});

const inlineContractSchema = z.object({
  contractNumber: z.string().optional(),
  contractDate: z.string().min(1, "Tanggal kontrak wajib diisi"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryAddress: z.string().min(1, "Alamat pengiriman wajib diisi"),
  paymentMethod: z.enum(["LUNAS_AWAL", "SEBAGIAN", "SETELAH_PENGIRIMAN"]),
  notes: z.string().optional(),
  items: z.array(contractItemSchema).min(1, "Minimal 1 item produk"),
});

type InlineContractFormData = z.infer<typeof inlineContractSchema>;

type Material = {
  id: string;
  code: string;
  name: string;
  satuan: {
    name: string;
    symbol: string;
  };
};

type Buyer = {
  id: string;
  code: string;
  name: string;
  taxStatus: string;
  address: string;
};

type InlineContractFormProps = {
  buyerId: string;
  onSuccess: (contractId: string, contractItemId: string) => void;
  onCancel: () => void;
};

const taxRates: Record<string, number> = {
  NON_PKP: 0,
  PKP_11: 0.11,
  PKP_1_1: 0.011,
};

export function InlineContractForm({ buyerId, onSuccess, onCancel }: InlineContractFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [customFields, setCustomFields] = useState<{ fieldName: string; fieldValue: string }[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InlineContractFormData>({
    resolver: zodResolver(inlineContractSchema),
    defaultValues: {
      contractNumber: "",
      contractDate: new Date().toISOString().split("T")[0],
      startDate: "",
      endDate: "",
      deliveryDate: "",
      deliveryAddress: "",
      paymentMethod: "SETELAH_PENGIRIMAN",
      notes: "",
      items: [{ materialId: "", quantity: 0, unitPrice: 0, notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      await Promise.all([fetchBuyer(), fetchMaterials()]);
      setLoadingData(false);
    };
    loadData();
  }, []);

  const fetchBuyer = async () => {
    try {
      const res = await fetch(`/api/pt-pks/buyer/${buyerId}`);
      if (res.ok) {
        const result = await res.json();
        setBuyer(result.buyer);
        // Auto-fill delivery address
        if (result.buyer?.address) {
          setValue("deliveryAddress", result.buyer.address);
        }
      }
    } catch (error) {
      console.error("Error fetching buyer:", error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/pt-pks/material?dropdown=true");
      if (res.ok) {
        const result = await res.json();
        setMaterials(result.materials || []);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const qty = item.quantity || 0;
    const price = item.unitPrice || 0;
    return sum + qty * price;
  }, 0);

  const taxRate = buyer ? taxRates[buyer.taxStatus] || 0 : 0;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const onSubmit = async (data: InlineContractFormData) => {
    setLoading(true);
    try {
      const submitData = {
        buyerId,
        ...data,
        customFields: customFields.length > 0 ? customFields : undefined,
        status: "ACTIVE", // Auto-activate
      };

      const res = await fetch("/api/pt-pks/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        const result = await res.json();
        // Return the first contract item ID - API returns { contract: {...} }
        const contractId = result.contract?.id;
        const contractItemId = result.contract?.contractItems?.[0]?.id;

        if (contractId && contractItemId) {
          onSuccess(contractId, contractItemId);
        } else {
          alert("Kontrak berhasil dibuat tetapi tidak ada item kontrak");
        }
      } else {
        const error = await res.json();
        alert(error.error || error.message || "Gagal membuat kontrak");
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      alert("Terjadi kesalahan saat membuat kontrak");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Buat Kontrak Baru</h3>
          <p className="text-sm text-muted-foreground">
            Untuk buyer: {buyer?.name || "Loading..."}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informasi Buyer */}
        {buyer && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informasi Buyer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Kode:</span> {buyer.code}
                </div>
                <div>
                  <span className="text-muted-foreground">Nama:</span> {buyer.name}
                </div>
                <div>
                  <span className="text-muted-foreground">Status Pajak:</span>{" "}
                  {buyer.taxStatus === "NON_PKP" ? "Non PKP" : buyer.taxStatus === "PKP_11" ? "PKP 11%" : "PKP 1.1%"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nomor Kontrak */}
        <div className="space-y-2">
          <Label htmlFor="contractNumber">Nomor Kontrak <span className="text-muted-foreground text-xs">(Opsional - kosongkan untuk auto-generate)</span></Label>
          <Input
            {...register("contractNumber")}
            placeholder="Contoh: KON/2026/001 (kosongkan untuk auto)"
          />
          {errors.contractNumber && (
            <p className="text-xs text-red-500">{errors.contractNumber.message}</p>
          )}
        </div>

        {/* Tanggal */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contractDate">Tanggal Kontrak *</Label>
            <Input type="date" {...register("contractDate")} />
            {errors.contractDate && (
              <p className="text-xs text-red-500">{errors.contractDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryDate">Tanggal Pengiriman <span className="text-muted-foreground text-xs">(Opsional)</span></Label>
            <Input type="date" {...register("deliveryDate")} />
            {errors.deliveryDate && (
              <p className="text-xs text-red-500">{errors.deliveryDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Tanggal Mulai <span className="text-muted-foreground text-xs">(Opsional)</span></Label>
            <Input type="date" {...register("startDate")} />
            {errors.startDate && (
              <p className="text-xs text-red-500">{errors.startDate.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Tanggal Berakhir <span className="text-muted-foreground text-xs">(Opsional)</span></Label>
            <Input type="date" {...register("endDate")} />
            {errors.endDate && (
              <p className="text-xs text-red-500">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        {/* Alamat Pengiriman */}
        <div className="space-y-2">
          <Label htmlFor="deliveryAddress">Alamat Pengiriman *</Label>
          <Textarea {...register("deliveryAddress")} rows={2} />
          {errors.deliveryAddress && (
            <p className="text-xs text-red-500">{errors.deliveryAddress.message}</p>
          )}
        </div>

        {/* Metode Pembayaran */}
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Metode Pembayaran *</Label>
          <Select
            value={paymentMethod}
            onValueChange={(value) => setValue("paymentMethod", value as PaymentMethod)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih metode pembayaran" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {paymentMethod === "LUNAS_AWAL" && (
            <p className="text-xs text-green-600">
              ✓ Kontrak akan berstatus LUNAS meskipun produk belum dikirim
            </p>
          )}
          {paymentMethod === "SEBAGIAN" && (
            <p className="text-xs text-amber-600">
              ⚠ Pembayaran sebagian di awal, sisanya setelah pengiriman
            </p>
          )}
        </div>

        {/* Item Kontrak */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Item Kontrak *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ materialId: "", quantity: 0, unitPrice: 0, notes: "" })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah Item
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Item #{index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Produk *</Label>
                    <SearchableSelect
                      value={items[index]?.materialId || ""}
                      onValueChange={(value) => {
                        const newItems = [...items];
                        newItems[index] = {
                          ...newItems[index],
                          materialId: value,
                          quantity: newItems[index]?.quantity || 0,
                          unitPrice: newItems[index]?.unitPrice || 0
                        };
                        setValue("items", newItems);
                      }}
                      options={materials.map((mat) => ({
                        value: mat.id,
                        label: `${mat.code} - ${mat.name}`,
                        sublabel: mat.satuan.symbol
                      }))}
                      placeholder="Pilih produk"
                      searchPlaceholder="Cari produk..."
                      emptyMessage={materials.length === 0 ? "Tidak ada produk tersedia" : "Tidak ditemukan."}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kuantitas (kg) *</Label>
                    <Controller
                      name={`items.${index}.quantity` as const}
                      control={control}
                      render={({ field }) => (
                        <NumericInput
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="0"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Harga/kg (Rp) *</Label>
                    <Controller
                      name={`items.${index}.unitPrice` as const}
                      control={control}
                      render={({ field }) => (
                        <NumericInput
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="0"
                        />
                      )}
                    />
                  </div>
                </div>

                {items[index] && items[index].quantity > 0 && items[index].unitPrice > 0 && (
                  <div className="text-right text-sm">
                    Subtotal: <span className="font-semibold">
                      Rp {(items[index].quantity * items[index].unitPrice).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {errors.items && (
            <p className="text-xs text-red-500">{errors.items.message}</p>
          )}
        </div>

        {/* Catatan */}
        <div className="space-y-2">
          <Label htmlFor="notes">Catatan</Label>
          <Textarea {...register("notes")} rows={2} placeholder="Catatan tambahan (opsional)" />
        </div>

        {/* Custom Fields */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Field Kustom <span className="text-muted-foreground text-xs">(Opsional)</span></Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomFields([...customFields, { fieldName: "Nomor PO", fieldValue: "" }])}
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah Field
            </Button>
          </div>

          {customFields.length > 0 && (
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <Select
                    value={field.fieldName}
                    onValueChange={(val) => {
                      const newFields = [...customFields];
                      newFields[index] = { ...field, fieldName: val };
                      setCustomFields(newFields);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Pilih Field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nomor PO">Nomor PO</SelectItem>
                      <SelectItem value="Nomor DO">Nomor DO</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Nilai"
                    value={field.fieldValue}
                    onChange={(e) => {
                      const newFields = [...customFields];
                      newFields[index] = { ...field, fieldValue: e.target.value };
                      setCustomFields(newFields);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">Rp {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak ({(taxRate * 100).toFixed(1)}%):</span>
                <span className="font-medium">Rp {taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">Rp {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Buat Kontrak & Gunakan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
