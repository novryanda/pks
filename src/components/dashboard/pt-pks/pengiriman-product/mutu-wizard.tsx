"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Beaker, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types untuk pengiriman yang menunggu input mutu
export type PendingMutuPengiriman = {
    id: string;
    nomorPengiriman: string;
    tanggalPengiriman: string;
    operatorPenimbang: string;
    materialId: string | null;
    beratTarra: number;
    waktuTimbangTarra: string;
    metodeTarra: string;
    beratGross: number | null;
    waktuTimbangGross: string | null;
    metodeGross: string;
    beratNetto: number | null;
    status: string;
    mutuCustomFields?: { fieldName: string; fieldValue: string }[] | null;
    vendorVehicle: {
        nomorKendaraan: string;
        namaSupir: string;
        vendor: {
            name: string;
        };
    };
    material?: {
        name: string;
        code: string;
    };
};

type MutuWizardProps = {
    pengiriman: PendingMutuPengiriman;
    onSuccess?: () => void;
    onCancel?: () => void;
};

export function MutuWizard({ pengiriman, onSuccess, onCancel }: MutuWizardProps) {
    const MUTU_OPTIONS = ["FFA", "M&I", "Dobi", "Suhu", "Air", "Kotoran"];
    const SEGEL_OPTIONS = ["Nomor Segel", "Nomor Segel Atas", "Nomor Segel Bawah"];
    const productLabel = pengiriman.material?.name || pengiriman.material?.code || "produk";

    const initialFields = (pengiriman as any).mutuCustomFields || [];

    // Split initial fields into mutu and segel categories
    const initialMutu = initialFields.filter((f: any) => MUTU_OPTIONS.includes(f.fieldName));
    const initialSegel = initialFields.filter((f: any) => SEGEL_OPTIONS.includes(f.fieldName));
    // Any remaining custom fields go to mutu
    const initialOthers = initialFields.filter((f: any) => !MUTU_OPTIONS.includes(f.fieldName) && !SEGEL_OPTIONS.includes(f.fieldName));

    const [mutuFields, setMutuFields] = useState<{ fieldName: string; fieldValue: string }[]>(
        [...initialMutu, ...initialOthers].length > 0 ? [...initialMutu, ...initialOthers] : []
    );
    const [segelFields, setSegelFields] = useState<{ fieldName: string; fieldValue: string }[]>(
        initialSegel.length > 0 ? initialSegel : []
    );
    const [loading, setLoading] = useState(false);

    const handleAddMutu = () => {
        setMutuFields([...mutuFields, { fieldName: "", fieldValue: "" }]);
    };

    const handleAddSegel = () => {
        setSegelFields([...segelFields, { fieldName: "", fieldValue: "" }]);
    };

    const handleRemoveMutu = (index: number) => {
        setMutuFields(mutuFields.filter((_, i) => i !== index));
    };

    const handleRemoveSegel = (index: number) => {
        setSegelFields(segelFields.filter((_, i) => i !== index));
    };

    const handleMutuChange = (index: number, field: "fieldName" | "fieldValue", value: string) => {
        const newFields = [...mutuFields];
        newFields[index] = { ...newFields[index]!, [field]: value };
        setMutuFields(newFields);
    };

    const handleSegelChange = (index: number, field: "fieldName" | "fieldValue", value: string) => {
        const newFields = [...segelFields];
        newFields[index] = { ...newFields[index]!, [field]: value };
        setSegelFields(newFields);
    };

    const handleSubmit = async () => {
        const allFields = [...mutuFields, ...segelFields];

        // Validate that at least one field is filled
        if (allFields.length === 0) {
            alert("Minimal tambahkan 1 data mutu atau segel");
            return;
        }

        // Validate all fields are filled
        const hasEmptyField = allFields.some(f => !f.fieldName.trim() || !f.fieldValue.trim());
        if (hasEmptyField) {
            alert("Semua nama field dan nilai harus diisi");
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                id: pengiriman.id,
                mutuCustomFields: allFields,
            };

            console.log("Submitting mutu data:", submitData);

            const res = await fetch("/api/pt-pks/pengiriman-product/update-mutu", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            if (res.ok) {
                alert(
                    `Data mutu ${productLabel} berhasil disimpan!\n\n` +
                    `Lanjutkan ke tab "Pilih Kontrak" untuk memvalidasi kontrak buyer.`
                );
                onSuccess?.();
            } else {
                const error = await res.json();
                alert(error.message || "Gagal menyimpan data mutu");
            }
        } catch (error) {
            console.error("Error submitting mutu:", error);
            alert("Terjadi kesalahan saat menyimpan data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Info Pengiriman */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">
                    Input Mutu: {pengiriman.nomorPengiriman}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Kendaraan:</span>
                        <p className="font-medium">{pengiriman.vendorVehicle.nomorKendaraan}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Supir:</span>
                        <p className="font-medium">{pengiriman.vendorVehicle.namaSupir}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Vendor:</span>
                        <p className="font-medium">{pengiriman.vendorVehicle.vendor.name}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Berat Netto:</span>
                        <p className="font-bold text-green-600">{(pengiriman.beratNetto || 0).toLocaleString()} kg</p>
                    </div>
                </div>
            </div>

            <div className="border rounded-lg p-6 space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-900 mb-2">📊 Informasi Mutu</h3>
                    <p className="text-sm text-amber-800">
                        Tambahkan parameter mutu produk sesuai hasil laboratorium.
                        Data kontrak akan dipilih di tahap selanjutnya.
                    </p>
                </div>

                {/* Dynamic Mutu Fields */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Beaker className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold">Input Data Mutu</h4>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddMutu}>
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah Field
                        </Button>
                    </div>

                    {mutuFields.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/20">
                            <p className="text-muted-foreground text-sm mb-2">Belum ada data mutu</p>
                            <Button type="button" variant="ghost" size="sm" onClick={handleAddMutu}>
                                <Plus className="h-3 w-3 mr-1" />
                                Klik untuk menambah
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {mutuFields.map((field, index) => (
                                <div key={index} className="flex gap-3 items-end p-3 bg-muted/30 rounded-lg border">
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">Parameter Mutu</Label>
                                        <Select
                                            value={field.fieldName}
                                            onValueChange={(val) => handleMutuChange(index, "fieldName", val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Parameter" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MUTU_OPTIONS.map(opt => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">Nilai</Label>
                                        <Input
                                            placeholder="Masukkan nilai"
                                            value={field.fieldValue}
                                            onChange={(e) => handleMutuChange(index, "fieldValue", e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveMutu(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Nomor Segel Section */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            <h4 className="font-semibold font-bold">Nomor Segel</h4>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddSegel}>
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah Segel
                        </Button>
                    </div>

                    {segelFields.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed rounded-lg bg-green-50/20">
                            <p className="text-muted-foreground text-sm mb-2">Belum ada data segel</p>
                            <Button type="button" variant="ghost" size="sm" onClick={handleAddSegel}>
                                <Plus className="h-3 w-3 mr-1" />
                                Klik untuk menambah nomor segel
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {segelFields.map((field, index) => (
                                <div key={index} className="flex gap-3 items-end p-3 bg-green-50/30 rounded-lg border border-green-100">
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">Tipe Segel</Label>
                                        <Select
                                            value={field.fieldName}
                                            onValueChange={(val) => handleSegelChange(index, "fieldName", val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Tipe Segel" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SEGEL_OPTIONS.map(opt => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-xs text-muted-foreground">No. Segel</Label>
                                        <Input
                                            placeholder="Masukkan nomor segel"
                                            value={field.fieldValue}
                                            onChange={(e) => handleSegelChange(index, "fieldValue", e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveSegel(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ringkasan Gabungan */}
                {([...mutuFields, ...segelFields]).length > 0 && (
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-slate-50 to-muted">
                        <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Ringkasan Data</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[...mutuFields, ...segelFields].map((field, index) => (
                                <div key={index} className="p-3 bg-white border rounded-lg shadow-sm">
                                    <div className="text-muted-foreground text-[10px] uppercase font-bold">{field.fieldName || "-"}</div>
                                    <div className="text-lg font-bold text-slate-800">
                                        {field.fieldValue || "-"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>⚠️ Perhatian:</strong> Setelah data mutu tersimpan, pengiriman akan berpindah ke tab "Pilih Kontrak".
                    </p>
                </div>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        Kembali
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || (mutuFields.length === 0 && segelFields.length === 0)}>
                        {loading ? "Menyimpan..." : "Simpan Data"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
