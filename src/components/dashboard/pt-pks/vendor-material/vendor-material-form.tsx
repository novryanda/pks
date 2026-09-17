"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface VendorMaterialFormProps {
    mode: "create" | "edit";
    initialData?: {
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
        kategori: string | null;
        status: string;
    };
}

export function VendorMaterialForm({ mode, initialData }: VendorMaterialFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [generatingCode, setGeneratingCode] = useState(false);

    const [formData, setFormData] = useState({
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
        kategori: initialData?.kategori || "",
        status: initialData?.status || "ACTIVE",
    });

    useEffect(() => {
        if (mode === "create" && !formData.code) {
            generateCode();
        }
    }, [mode]);

    const generateCode = async () => {
        setGeneratingCode(true);
        try {
            const response = await fetch("/api/pt-pks/vendor-material/generate-code");
            if (response.ok) {
                const data = await response.json();
                setFormData((prev) => ({ ...prev, code: data.code }));
            }
        } catch (error) {
            console.error("Error generating code:", error);
        } finally {
            setGeneratingCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.contactPerson || !formData.phone || !formData.address) {
            toast.error("Nama, Contact Person, Telepon, dan Alamat wajib diisi");
            return;
        }

        setLoading(true);
        try {
            const url =
                mode === "create"
                    ? "/api/pt-pks/vendor-material"
                    : `/api/pt-pks/vendor-material/${initialData?.id}`;

            const response = await fetch(url, {
                method: mode === "create" ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    email: formData.email || null,
                    npwp: formData.npwp || null,
                    bankName: formData.bankName || null,
                    accountNumber: formData.accountNumber || null,
                    accountName: formData.accountName || null,
                    kategori: formData.kategori || null,
                }),
            });

            if (response.ok) {
                toast.success(
                    mode === "create"
                        ? "Vendor Material berhasil dibuat"
                        : "Vendor Material berhasil diupdate"
                );
                router.push("/dashboard/pt-pks/master/vendor-material");
                router.refresh();
            } else {
                const error = await response.json();
                toast.error(error.error || "Gagal menyimpan data");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {mode === "create" ? "Tambah Vendor Material Baru" : "Edit Vendor Material"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informasi Umum */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Informasi Umum</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="code">Kode Vendor *</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="VDM-25-0001"
                                        required
                                        disabled={generatingCode}
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
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Vendor *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="PT. Supplier ABC"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person *</Label>
                                <Input
                                    id="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telepon *</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="08xx-xxxx-xxxx"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="vendor@email.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="kategori">Kategori</Label>
                                <Input
                                    id="kategori"
                                    value={formData.kategori}
                                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                                    placeholder="Spare Part, Consumable, dll"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Alamat *</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Alamat lengkap vendor"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Informasi Pajak */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Informasi Pajak</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="npwp">NPWP</Label>
                                <Input
                                    id="npwp"
                                    value={formData.npwp}
                                    onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                                    placeholder="XX.XXX.XXX.X-XXX.XXX"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxStatus">Status Pajak *</Label>
                                <Select
                                    value={formData.taxStatus}
                                    onValueChange={(value) => setFormData({ ...formData, taxStatus: value })}
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
                    </div>

                    {/* Informasi Rekening */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Informasi Rekening</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Nama Bank</Label>
                                <Input
                                    id="bankName"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    placeholder="BCA, Mandiri, dll"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Nomor Rekening</Label>
                                <Input
                                    id="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                    placeholder="1234567890"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountName">Nama Pemilik Rekening</Label>
                                <Input
                                    id="accountName"
                                    value={formData.accountName}
                                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                    placeholder="PT. Supplier ABC"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Status</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status Vendor *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Aktif</SelectItem>
                                        <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
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
                            ) : mode === "create" ? (
                                "Simpan"
                            ) : (
                                "Update"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
