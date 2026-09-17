"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Upload, FileText, ImageIcon, X, Download, ArrowRight } from "lucide-react";

import { toast } from "sonner";

// Type for attachment
type ContractAttachment = {
  id?: string;
  key?: string;
  fileName: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
};

const contractItemSchema = z.object({
  contractItemId: z.string().optional(),
  materialId: z.string().min(1, "Material wajib dipilih"),
  quantity: z.coerce.number().min(0.01, "Kuantitas harus lebih dari 0"),
  unitPrice: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  notes: z.string().optional(),
  deliveredQuantity: z.coerce.number().min(0).default(0),
});

const contractFormSchema = z.object({
  buyerId: z.string().min(1, "Buyer wajib dipilih"),
  contractNumber: z.string().optional(),
  contractDate: z.string().min(1, "Tanggal kontrak wajib diisi"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryAddress: z.string().min(1, "Alamat pengiriman wajib diisi"),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]),
  paymentMethod: z.enum(["LUNAS_AWAL", "SEBAGIAN", "SETELAH_PENGIRIMAN"]),
  paidAmount: z.coerce.number().min(0),
  items: z.array(contractItemSchema).min(1, "Minimal 1 item produk"),
});

type ContractFormData = z.input<typeof contractFormSchema>;
type ContractFormSubmitData = z.output<typeof contractFormSchema>;

type Buyer = {
  id: string;
  code: string;
  name: string;
  taxStatus: string;
};

type Material = {
  id: string;
  code: string;
  name: string;
  satuan: {
    name: string;
    symbol: string;
  };
};

type ContractFormProps = {
  initialData?: any;
  mode?: "create" | "edit";
};

const taxRates: Record<string, number> = {
  NON_PKP: 0,
  PKP_11: 0.11,
  PKP_1_1: 0.011,
};

export function ContractForm({ initialData, mode = "create" }: ContractFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [customFields, setCustomFields] = useState<{ fieldName: string; fieldValue: string }[]>(
    initialData?.customFields || []
  );
  const [attachments, setAttachments] = useState<ContractAttachment[]>(
    initialData?.attachments || []
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContractFormData, unknown, ContractFormSubmitData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      buyerId: initialData?.buyerId || "",
      contractNumber: initialData?.contractNumber || "",
      contractDate: initialData?.contractDate
        ? new Date(initialData.contractDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      startDate: initialData?.startDate
        ? new Date(initialData.startDate).toISOString().split("T")[0]
        : "",
      endDate: initialData?.endDate
        ? new Date(initialData.endDate).toISOString().split("T")[0]
        : "",
      deliveryDate: initialData?.deliveryDate
        ? new Date(initialData.deliveryDate).toISOString().split("T")[0]
        : "",
      deliveryAddress: initialData?.deliveryAddress || "",
      notes: initialData?.notes || "",
      status: initialData?.status || "DRAFT",
      paymentMethod: initialData?.paymentMethod || "SETELAH_PENGIRIMAN",
      paidAmount: initialData?.paidAmount || 0,
      items: initialData?.contractItems || [
        {
          contractItemId: undefined,
          materialId: "",
          quantity: 0,
          unitPrice: 0,
          notes: "",
          deliveredQuantity: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const buyerId = watch("buyerId");

  // Fetch buyers and materials
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buyersRes, materialsRes] = await Promise.all([
          fetch("/api/pt-pks/buyer?dropdown=true"),
          fetch("/api/pt-pks/material?dropdown=true"),
        ]);

        if (buyersRes.ok) {
          const buyersData = await buyersRes.json();
          setBuyers(buyersData.buyers || []);
        }

        if (materialsRes.ok) {
          const materialsData = await materialsRes.json();
          setMaterials(materialsData.materials || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Set selected buyer when buyerId changes
  useEffect(() => {
    const buyer = buyers.find((b) => b.id === buyerId);
    setSelectedBuyer(buyer || null);
  }, [buyerId, buyers]);

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => {
    const total = (item.quantity || 0) * (item.unitPrice || 0);
    return sum + total;
  }, 0);

  const taxRate = selectedBuyer ? taxRates[selectedBuyer.taxStatus] || 0 : 0;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const onSubmit = async (data: ContractFormSubmitData) => {
    setLoading(true);
    try {
      const url =
        mode === "create"
          ? "/api/pt-pks/contract"
          : `/api/pt-pks/contract/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          customFields: customFields.filter(f => f.fieldName && f.fieldValue),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save contract");
      }

      router.push("/dashboard/pt-pks/master/buyer");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving contract:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialById = (id: string) => {
    return materials.find((m) => m.id === id);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // For new contracts, we need to save the contract first
    if (mode === "create" && !initialData?.id) {
      alert("Silakan simpan kontrak terlebih dahulu sebelum mengupload file.");
      return;
    }

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (file) {
          const formData = new FormData();
          formData.append("files", file);

          const response = await fetch(`/api/pt-pks/contract/${initialData?.id}/upload-files`, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Gagal mengupload file ${file.name}`);
          }

          const uploadData = await response.json();
          const updatedAttachments = uploadData.data?.attachments as ContractAttachment[] | undefined;
          if (updatedAttachments) {
            setAttachments(updatedAttachments);
          }
        }
      }
      toast.success("File berhasil diupload");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      alert(error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle file delete
  const handleFileDelete = async (fileId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;

    try {
      const response = await fetch(`/api/pt-pks/contract/${initialData?.id}/upload-files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: fileId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus file");
      }

      const result = await response.json();
      setAttachments(result.data?.attachments || []);
      toast.success("File dihapus dari kontrak");
    } catch (error: any) {
      console.error("Error deleting file:", error);
      alert(error.message);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informasi Buyer */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Buyer</CardTitle>
          <CardDescription>Pilih buyer untuk kontrak ini</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyerId">
              Buyer <span className="text-destructive">*</span>
            </Label>
            <Select
              value={buyerId}
              onValueChange={(value) => setValue("buyerId", value)}
              disabled={mode === "edit"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih buyer" />
              </SelectTrigger>
              <SelectContent>
                {buyers.map((buyer) => (
                  <SelectItem key={buyer.id} value={buyer.id}>
                    {buyer.code} - {buyer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.buyerId && (
              <p className="text-sm text-destructive">{errors.buyerId.message}</p>
            )}
          </div>

          {selectedBuyer && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">{selectedBuyer.name}</p>
              <p className="text-sm text-muted-foreground">
                Status Pajak:{" "}
                <Badge variant="outline">
                  {selectedBuyer.taxStatus === "NON_PKP"
                    ? "Non PKP"
                    : selectedBuyer.taxStatus === "PKP_11"
                      ? "PKP 11%"
                      : "PKP 1.1%"}
                </Badge>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informasi Kontrak */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Kontrak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nomor Kontrak */}
          <div className="space-y-2">
            <Label htmlFor="contractNumber">
              Nomor Kontrak <span className="text-muted-foreground text-xs">(Opsional - kosongkan untuk auto-generate)</span>
            </Label>
            <Input
              id="contractNumber"
              {...register("contractNumber")}
              placeholder="Contoh: KON/2026/001 (kosongkan untuk auto)"
            />
            {errors.contractNumber && (
              <p className="text-sm text-destructive">
                {errors.contractNumber.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractDate">
                Tanggal Kontrak <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contractDate"
                type="date"
                {...register("contractDate")}
              />
              {errors.contractDate && (
                <p className="text-sm text-destructive">
                  {errors.contractDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate">
                Tanggal Pengiriman <span className="text-muted-foreground text-xs">(Opsional)</span>
              </Label>
              <Input
                id="deliveryDate"
                type="date"
                {...register("deliveryDate")}
              />
              {errors.deliveryDate && (
                <p className="text-sm text-destructive">
                  {errors.deliveryDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Tanggal Mulai <span className="text-muted-foreground text-xs">(Opsional)</span>
              </Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                Tanggal Berakhir <span className="text-muted-foreground text-xs">(Opsional)</span>
              </Label>
              <Input id="endDate" type="date" {...register("endDate")} />
              {errors.endDate && (
                <p className="text-sm text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">
              Alamat Pengiriman <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="deliveryAddress"
              {...register("deliveryAddress")}
              placeholder="Alamat lengkap pengiriman"
              rows={3}
            />
            {errors.deliveryAddress && (
              <p className="text-sm text-destructive">
                {errors.deliveryAddress.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">
                Metode Pembayaran <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("paymentMethod")}
                onValueChange={(value) =>
                  setValue("paymentMethod", value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LUNAS_AWAL">Lunas di Awal</SelectItem>
                  <SelectItem value="SEBAGIAN">Pembayaran Sebagian</SelectItem>
                  <SelectItem value="SETELAH_PENGIRIMAN">Setelah Pengiriman</SelectItem>
                </SelectContent>
              </Select>
              {watch("paymentMethod") === "LUNAS_AWAL" && (
                <p className="text-sm text-muted-foreground">
                  Kontrak akan dianggap lunas meskipun produk belum dikirim
                </p>
              )}
            </div>

            {watch("paymentMethod") === "SEBAGIAN" && (
              <div className="space-y-2">
                <Label htmlFor="paidAmount">
                  Jumlah Dibayar <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="paidAmount"
                  render={({ field }) => (
                    <NumericInput
                      id="paidAmount"
                      placeholder="0"
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("status")}
              onValueChange={(value) =>
                setValue("status", value as any)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Custom Fields</CardTitle>
              <CardDescription>
                Tambahkan informasi tambahan untuk kontrak ini (opsional)
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomFields([...customFields, { fieldName: "Nomor PO", fieldValue: "" }])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada custom field. Klik "Tambah Field" untuk menambahkan.
            </p>
          ) : (
            <div className="space-y-3">
              {customFields.map((field, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Nama Field</Label>
                    <Select
                      value={field.fieldName}
                      onValueChange={(val) => {
                        const newFields = [...customFields];
                        newFields[index] = { ...newFields[index]!, fieldName: val };
                        setCustomFields(newFields);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nomor PO">Nomor PO</SelectItem>
                        <SelectItem value="Nomor DO">Nomor DO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Nilai</Label>
                    <Input
                      placeholder="Contoh: PO-2026-001"
                      value={field.fieldValue}
                      onChange={(e) => {
                        const newFields = [...customFields];
                        newFields[index] = { ...newFields[index]!, fieldValue: e.target.value };
                        setCustomFields(newFields);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Produk */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Item Produk</CardTitle>
              <CardDescription>
                Produk yang dibeli dalam kontrak ini
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  contractItemId: undefined,
                  materialId: "",
                  quantity: 0,
                  unitPrice: 0,
                  notes: "",
                  deliveredQuantity: 0,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Produk</TableHead>
                  <TableHead>Kuantitas</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field: any, index: number) => {
                  const material = getMaterialById(items[index]?.materialId || "");
                  const total =
                    (items[index]?.quantity || 0) * (items[index]?.unitPrice || 0);
                  const deliveredQuantity = items[index]?.deliveredQuantity || 0;
                  const remainingQuantity = Math.max(
                    0,
                    (items[index]?.quantity || 0) - deliveredQuantity
                  );
                  const isUsedInDelivery = deliveredQuantity > 0;

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select
                          value={items[index]?.materialId || ""}
                          onValueChange={(value) =>
                            setValue(`items.${index}.materialId`, value)
                          }
                          disabled={isUsedInDelivery}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih produk" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((mat) => (
                              <SelectItem key={mat.id} value={mat.id}>
                                {mat.code} - {mat.name} ({mat.satuan.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.items?.[index]?.materialId && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.items[index]?.materialId?.message}
                          </p>
                        )}
                        {isUsedInDelivery && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Material terkunci karena item ini sudah dipakai pengiriman.
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Controller
                              control={control}
                              name={`items.${index}.quantity` as const}
                              render={({ field }) => (
                                <NumericInput
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  className="w-24"
                                  placeholder="0"
                                />
                              )}
                            />
                            {material && (
                              <span className="text-sm text-muted-foreground">
                                {material.satuan.symbol}
                              </span>
                            )}
                          </div>
                          {isUsedInDelivery && (
                            <p className="text-xs text-muted-foreground">
                              Sudah terkirim: {deliveredQuantity.toLocaleString("id-ID")} {material?.satuan.symbol || "kg"}
                              {" | "}
                              Sisa: {remainingQuantity.toLocaleString("id-ID")} {material?.satuan.symbol || "kg"}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Controller
                          control={control}
                          name={`items.${index}.unitPrice` as const}
                          render={({ field }) => (
                            <NumericInput
                              value={field.value}
                              onValueChange={field.onChange}
                              className="w-32"
                              placeholder="0"
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          Rp {total.toLocaleString("id-ID")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isUsedInDelivery}
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {errors.items && (
            <p className="text-sm text-destructive mt-2">
              {errors.items.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lampiran File</CardTitle>
              <CardDescription>
                Upload dokumen atau gambar terkait kontrak ini (PDF, PNG, JPG)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {uploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || (mode === "create" && !initialData?.id)}
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "create" && !initialData?.id ? (
            <div className="p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Fitur upload akan tersedia setelah Anda menyimpan draft kontrak ini.
              </p>
            </div>
          ) : attachments.length === 0 ? (
            <div className="p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Belum ada file yang diupload. Klik "Upload File" untuk menambahkan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-primary/10 rounded text-primary">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <p className="text-sm font-medium truncate" title={file.originalName}>
                        {file.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      asChild
                    >
                      <a href={file.path} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleFileDelete(file.key || file.id || file.fileName)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Harga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-lg">
            <span>Subtotal:</span>
            <span className="font-medium">
              Rp {subtotal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between text-lg">
            <span>
              Pajak ({taxRate * 100}%):
            </span>
            <span className="font-medium">
              Rp {taxAmount.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t pt-3">
            <span>Total:</span>
            <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
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
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Kontrak"
          )}
        </Button>
      </div>
    </form>
  );
}
