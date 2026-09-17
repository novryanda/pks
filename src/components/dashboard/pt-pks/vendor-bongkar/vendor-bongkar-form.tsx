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
import { Loader2, Plus, Trash2, Building2 } from "lucide-react";

type BankAccount = {
    bankName: string;
    accountNumber: string;
    accountName: string;
    isDefault?: boolean;
};

interface VendorBongkarFormProps {
    mode: "create" | "edit";
    initialData?: {
        id: string;
        code: string;
        name: string;
        contactPerson: string;
        email: string | null;
        phone: string;
        address: string;
        tipe: "SPSI" | "SPLO";
        bankAccounts: BankAccount[] | null;
        status: string;
    };
}

export function VendorBongkarForm({ mode, initialData }: VendorBongkarFormProps) {
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
        tipe: initialData?.tipe || "SPSI",
        status: initialData?.status || "ACTIVE",
    });

    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(
        initialData?.bankAccounts || []
    );

    useEffect(() => {
        if (mode === "create" && !formData.code) {
            generateCode();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const generateCode = async () => {
        setGeneratingCode(true);
        try {
            const response = await fetch("/api/pt-pks/vendor-bongkar/generate-code");
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

    const handleAddBankAccount = () => {
        setBankAccounts([
            ...bankAccounts,
            { bankName: "", accountNumber: "", accountName: "", isDefault: bankAccounts.length === 0 },
        ]);
    };

    const handleRemoveBankAccount = (index: number) => {
        const newAccounts = bankAccounts.filter((_, i) => i !== index);
        // If we removed the default, set first one as default
        if (newAccounts.length > 0 && !newAccounts.some(acc => acc.isDefault)) {
            const firstAccount = newAccounts[0];
            if (firstAccount) {
                firstAccount.isDefault = true;
            }
        }
        setBankAccounts(newAccounts);
    };

    const handleBankAccountChange = (index: number, field: keyof BankAccount, value: string | boolean) => {
        const newAccounts = [...bankAccounts];
        if (field === "isDefault" && value === true) {
            // Set all others to false
            newAccounts.forEach((acc, i) => {
                acc.isDefault = i === index;
            });
        } else {
            (newAccounts[index] as Record<string, unknown>)[field] = value;
        }
        setBankAccounts(newAccounts);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.contactPerson || !formData.phone || !formData.address) {
            toast.error("Nama, Contact Person, Telepon, dan Alamat wajib diisi");
            return;
        }

        // Validate bank accounts if any
        for (const acc of bankAccounts) {
            if (!acc.bankName || !acc.accountNumber || !acc.accountName) {
                toast.error("Semua field rekening harus diisi");
                return;
            }
        }

        setLoading(true);
        try {
            const url =
                mode === "create"
                    ? "/api/pt-pks/vendor-bongkar"
                    : `/api/pt-pks/vendor-bongkar/${initialData?.id}`;

            const response = await fetch(url, {
                method: mode === "create" ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    email: formData.email || null,
                    bankAccounts: bankAccounts.length > 0 ? bankAccounts : null,
                }),
            });

            if (response.ok) {
                toast.success(
                    mode === "create"
                        ? "Vendor Bongkar berhasil dibuat"
                        : "Vendor Bongkar berhasil diupdate"
                );
                router.push("/dashboard/pt-pks/master/vendor-bongkar");
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
                    {mode === "create" ? "Tambah Vendor Bongkar Baru" : "Edit Vendor Bongkar"}
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
                                        placeholder="VDB-26-0001"
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
                                    placeholder="CV. Bongkar Jaya"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person *</Label>
                                <Input
                                    id="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    placeholder="Budi Santoso"
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
                                <Label htmlFor="tipe">Tipe Vendor *</Label>
                                <Select
                                    value={formData.tipe}
                                    onValueChange={(value) => setFormData({ ...formData, tipe: value as "SPSI" | "SPLO" })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih tipe vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SPSI">SPSI</SelectItem>
                                        <SelectItem value="SPLO">SPLO</SelectItem>
                                    </SelectContent>
                                </Select>
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

                    {/* Informasi Rekening */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Informasi Rekening</h3>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddBankAccount}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Rekening
                            </Button>
                        </div>

                        {bankAccounts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada rekening. Klik &quot;Tambah Rekening&quot; untuk menambahkan.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {bankAccounts.map((account, index) => (
                                    <div key={index} className="p-4 border rounded-lg space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Rekening {index + 1}</span>
                                                {account.isDefault && (
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveBankAccount(index)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label>Nama Bank *</Label>
                                                <Input
                                                    value={account.bankName}
                                                    onChange={(e) => handleBankAccountChange(index, "bankName", e.target.value)}
                                                    placeholder="BCA, Mandiri, dll"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Nomor Rekening *</Label>
                                                <Input
                                                    value={account.accountNumber}
                                                    onChange={(e) => handleBankAccountChange(index, "accountNumber", e.target.value)}
                                                    placeholder="1234567890"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Nama Pemilik *</Label>
                                                <Input
                                                    value={account.accountName}
                                                    onChange={(e) => handleBankAccountChange(index, "accountName", e.target.value)}
                                                    placeholder="CV. Bongkar Jaya"
                                                />
                                            </div>
                                        </div>
                                        {!account.isDefault && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleBankAccountChange(index, "isDefault", true)}
                                            >
                                                Jadikan Default
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
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
