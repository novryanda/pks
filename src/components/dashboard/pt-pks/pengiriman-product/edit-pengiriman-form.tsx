"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumericInput } from "@/components/ui/numeric-input";
import { Plus, Trash2, Beaker, ShieldCheck, Loader2, Save, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import type { PendingKontrakPengiriman } from "./kontrak-mutu-wizard";

type EditPengirimanFormProps = {
    pengiriman: PendingKontrakPengiriman;
    onSuccess: () => void;
    onCancel: () => void;
};

type Vendor = {
    id: string;
    code: string;
    name: string;
};

type VendorVehicle = {
    id: string;
    nomorKendaraan: string;
    namaSupir: string;
    noSim?: string | null;
};

export function EditPengirimanForm({ pengiriman, onSuccess, onCancel }: EditPengirimanFormProps) {
    const MUTU_OPTIONS = ["FFA", "M&I", "Dobi", "Suhu", "Air", "Kotoran"];
    const SEGEL_OPTIONS = ["Nomor Segel", "Nomor Segel Atas", "Nomor Segel Bawah"];

    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [vehicles, setVehicles] = useState<VendorVehicle[]>([]);
    const [loadingVendors, setLoadingVendors] = useState(true);
    const [loadingVehicles, setLoadingVehicles] = useState(false);

    // State untuk tambah kendaraan baru
    const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
    const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        nomorKendaraan: "",
        namaSupir: "",
        noHpSupir: "",
        noSim: "",
    });

    // Form State
    const [formData, setFormData] = useState({
        vendorId: (pengiriman as any).vendorVehicle?.vendor?.id || "",
        vendorVehicleId: pengiriman.vendorVehicleId || "",
        beratTarra: pengiriman.beratTarra,
        beratGross: pengiriman.beratGross || 0,
    });

    const initialFields = pengiriman.mutuCustomFields || [];
    const initialMutu = initialFields.filter((f) => MUTU_OPTIONS.includes(f.fieldName));
    const initialSegel = initialFields.filter((f) => SEGEL_OPTIONS.includes(f.fieldName));
    const initialOthers = initialFields.filter((f) => !MUTU_OPTIONS.includes(f.fieldName) && !SEGEL_OPTIONS.includes(f.fieldName));

    const [mutuFields, setMutuFields] = useState(
        [...initialMutu, ...initialOthers].length > 0 ? [...initialMutu, ...initialOthers] : []
    );
    const [segelFields, setSegelFields] = useState(
        initialSegel.length > 0 ? initialSegel : []
    );

    useEffect(() => {
        fetchVendors();
        if (formData.vendorId) {
            fetchVehicles(formData.vendorId);
        }
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await fetch("/api/pt-pks/vendor?dropdown=true");
            if (res.ok) {
                const data = await res.json();
                setVendors(data.vendors || []);
            }
        } catch (error) {
            console.error("Error fetching vendors:", error);
        } finally {
            setLoadingVendors(false);
        }
    };

    const fetchVehicles = async (vendorId: string) => {
        setLoadingVehicles(true);
        try {
            const res = await fetch(`/api/pt-pks/vendor/${vendorId}/vehicles?dropdown=true`);
            if (res.ok) {
                const data = await res.json();
                setVehicles(data.vehicles || []);
            }
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setLoadingVehicles(false);
        }
    };

    const handleVendorChange = (vendorId: string) => {
        setFormData({ ...formData, vendorId, vendorVehicleId: "" });
        fetchVehicles(vendorId);
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

            if (res.ok) {
                const result = await res.json();
                const createdVehicle = result.vehicle;

                setVehicles((prev) => [...prev, createdVehicle]);
                setFormData((prev) => ({ ...prev, vendorVehicleId: createdVehicle.id }));

                setNewVehicle({ nomorKendaraan: "", namaSupir: "", noHpSupir: "", noSim: "" });
                setIsAddVehicleOpen(false);
            } else {
                const error = await res.json();
                alert(error.error || "Gagal menambahkan kendaraan");
            }
        } catch (error) {
            console.error("Error adding vehicle:", error);
            alert("Terjadi kesalahan saat menambahkan kendaraan");
        } finally {
            setIsSubmittingVehicle(false);
        }
    };

    const beratNetto = (formData.beratGross || 0) - (formData.beratTarra || 0);

    const handleSubmit = async () => {
        if (!formData.vendorVehicleId) {
            alert("Kendaraan harus dipilih");
            return;
        }

        if (formData.beratGross <= formData.beratTarra) {
            alert("Berat Gross harus lebih besar dari berat Tarra");
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                id: pengiriman.id,
                vendorVehicleId: formData.vendorVehicleId,
                beratTarra: formData.beratTarra,
                beratGross: formData.beratGross,
                mutuCustomFields: [...mutuFields, ...segelFields].filter(f => f.fieldName && f.fieldValue),
            };

            const res = await fetch("/api/pt-pks/pengiriman-product", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            if (res.ok) {
                alert("Data pengiriman berhasil diperbarui");
                onSuccess();
            } else {
                const error = await res.json();
                alert(error.error || "Gagal memperbarui data");
            }
        } catch (error) {
            console.error("Error updating pengiriman:", error);
            alert("Terjadi kesalahan saat menyimpan data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h3 className="text-xl font-bold">Edit Data Pengiriman</h3>
                    <p className="text-sm text-muted-foreground">{pengiriman.nomorPengiriman}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onCancel}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column: Vehicle & Weights */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            🚚 Informasi Kendaraan
                        </h4>
                        <div className="space-y-2">
                            <Label>Vendor Transportir</Label>
                            <Select value={formData.vendorId} onValueChange={handleVendorChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Vendor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map(v => (
                                        <SelectItem key={v.id} value={v.id}>{v.code} - {v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Kendaraan & Supir</Label>
                                {formData.vendorId && (
                                    <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                                                <Plus className="mr-1 h-3 w-3" />
                                                Tambah
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Tambah Kendaraan Baru</DialogTitle>
                                                <DialogDescription>
                                                    Tambahkan kendaraan untuk vendor{" "}
                                                    {vendors.find((v) => v.id === formData.vendorId)?.name}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Nomor Kendaraan *</Label>
                                                    <Input
                                                        placeholder="K 1234 AB"
                                                        value={newVehicle.nomorKendaraan}
                                                        onChange={(e) =>
                                                            setNewVehicle({
                                                                ...newVehicle,
                                                                nomorKendaraan: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Nama Supir *</Label>
                                                    <Input
                                                        placeholder="Nama lengkap"
                                                        value={newVehicle.namaSupir}
                                                        onChange={(e) =>
                                                            setNewVehicle({
                                                                ...newVehicle,
                                                                namaSupir: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>No. HP Supir</Label>
                                                    <Input
                                                        placeholder="0812..."
                                                        value={newVehicle.noHpSupir}
                                                        onChange={(e) =>
                                                            setNewVehicle({
                                                                ...newVehicle,
                                                                noHpSupir: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>No. SIM</Label>
                                                    <Input
                                                        placeholder="Nomor SIM"
                                                        value={newVehicle.noSim}
                                                        onChange={(e) =>
                                                            setNewVehicle({ ...newVehicle, noSim: e.target.value })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsAddVehicleOpen(false)}
                                                >
                                                    Batal
                                                </Button>
                                                <Button
                                                    onClick={handleAddNewVehicle}
                                                    disabled={isSubmittingVehicle}
                                                >
                                                    {isSubmittingVehicle && (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    )}
                                                    Simpan
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                            <Select
                                value={formData.vendorVehicleId}
                                onValueChange={(val) => setFormData({ ...formData, vendorVehicleId: val })}
                                disabled={!formData.vendorId || loadingVehicles}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingVehicles ? "Memuat..." : "Pilih Kendaraan"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.nomorKendaraan} - {v.namaSupir} {v.noSim ? `(SIM: ${v.noSim})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-semibold flex items-center gap-2">
                            ⚖️ Data Timbangan
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Berat Tarra (kg)</Label>
                                <NumericInput
                                    value={formData.beratTarra}
                                    onValueChange={(val) => setFormData({ ...formData, beratTarra: val })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Berat Gross (kg)</Label>
                                <NumericInput
                                    value={formData.beratGross}
                                    onValueChange={(val) => setFormData({ ...formData, beratGross: val })}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex justify-between items-center">
                            <span className="text-sm font-medium text-green-800">Berat Netto Akhir:</span>
                            <span className="text-xl font-bold text-green-700">{beratNetto.toLocaleString()} kg</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Mutu & Segel */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold flex items-center gap-2">
                                🧪 Parameter Mutu
                            </h4>
                            <Button type="button" variant="outline" size="sm" onClick={() => setMutuFields([...mutuFields, { fieldName: "", fieldValue: "" }])}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {mutuFields.map((field, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Select
                                            value={field.fieldName}
                                            onValueChange={(val) => handleMutuChange(index, "fieldName", val)}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Pilih" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MUTU_OPTIONS.map(opt => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-[1.5]">
                                        <Input
                                            className="h-9"
                                            placeholder="Nilai"
                                            value={field.fieldValue}
                                            onChange={(e) => handleMutuChange(index, "fieldValue", e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setMutuFields(mutuFields.filter((_, i) => i !== index))}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold flex items-center gap-2">
                                🔒 Nomor Segel
                            </h4>
                            <Button type="button" variant="outline" size="sm" onClick={() => setSegelFields([...segelFields, { fieldName: "", fieldValue: "" }])}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {segelFields.map((field, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Select
                                            value={field.fieldName}
                                            onValueChange={(val) => handleSegelChange(index, "fieldName", val)}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Pilih Jenis" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SEGEL_OPTIONS.map(opt => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-[1.5]">
                                        <Input
                                            className="h-9"
                                            placeholder="No. Segel"
                                            value={field.fieldValue}
                                            onChange={(e) => handleSegelChange(index, "fieldValue", e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSegelFields(segelFields.filter((_, i) => i !== index))}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button variant="outline" onClick={onCancel} disabled={loading}>
                    Batal
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Simpan Perubahan
                </Button>
            </div>
        </div>
    );
}
