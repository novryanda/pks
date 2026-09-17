"use client";

import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, User, Truck } from "lucide-react";
import type { PenerimaanFormData } from "./penerimaan-wizard";

type Material = {
  id: string;
  name: string;
  code: string;
  kategori: { name: string };
  satuan: { name: string; symbol: string };
};

type Supplier = {
  id: string;
  ownerName: string;
  type: string;
  address: string;
  companyName?: string | null;
};

const getSupplierDisplayName = (supplier?: Supplier) => {
  if (!supplier) return "Supplier Terpilih";
  return supplier.companyName?.trim() || supplier.ownerName;
};

type Transporter = {
  id: string;
  nomorKendaraan: string;
  namaSupir: string;
  telepon?: string | null;
};

type Step1Props = {
  data: Partial<PenerimaanFormData>;
  onUpdate: (data: Partial<PenerimaanFormData>) => void;
  onNext: () => void;
};

export function PenerimaanStep1({ data, onUpdate, onNext }: Step1Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [filteredTransporters, setFilteredTransporters] = useState<Transporter[]>([]);
  const [searchSupplier, setSearchSupplier] = useState("");
  const [searchTransporter, setSearchTransporter] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const [formData, setFormData] = useState({
    materialId: data.materialId || "",
    supplierId: data.supplierId || "",
    lokasiKebun: data.lokasiKebun || "",
    transporterType: data.transporterType || "existing" as "existing" | "new",
    transporterId: data.transporterId,
    nomorKendaraan: data.nomorKendaraan || "",
    namaSupir: data.namaSupir || "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const url = searchSupplier
          ? `/api/pt-pks/penerimaan-tbs/suppliers?search=${encodeURIComponent(searchSupplier)}`
          : "/api/pt-pks/penerimaan-tbs/suppliers";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSuppliers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchSuppliers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchSupplier]);

  useEffect(() => {
    if (searchTransporter) {
      const filtered = transporters.filter(
        (t) =>
          t.nomorKendaraan.toLowerCase().includes(searchTransporter.toLowerCase()) ||
          t.namaSupir.toLowerCase().includes(searchTransporter.toLowerCase())
      );
      setFilteredTransporters(filtered);
    } else {
      setFilteredTransporters(transporters);
    }
  }, [searchTransporter, transporters]);

  const fetchData = async () => {
    try {
      const [materialsRes, suppliersRes, transportersRes] = await Promise.all([
        fetch("/api/pt-pks/penerimaan-tbs/materials"),
        fetch("/api/pt-pks/penerimaan-tbs/suppliers"),
        fetch("/api/pt-pks/penerimaan-tbs/transporters"),
      ]);

      if (materialsRes.ok) {
        const materialsData: Material[] = await materialsRes.json();
        const tbsMaterials = materialsData.filter(m =>
          m.name.toUpperCase().includes("TBS")
        );
        setMaterials(tbsMaterials);
      } else if (materialsRes.status === 403) {
        console.error("Permission denied: Cannot view materials");
      }

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      } else if (suppliersRes.status === 403) {
        console.error("Permission denied: Cannot view suppliers");
      }

      if (transportersRes.ok) {
        const transportersData = await transportersRes.json();
        setTransporters(transportersData);
        setFilteredTransporters(transportersData);
      } else if (transportersRes.status === 403) {
        console.error("Permission denied: Cannot view transporters");
      }

      // Get current user from session
      const sessionRes = await fetch("/api/auth/session");
      if (sessionRes.ok) {
        const session = await sessionRes.json();
        if (session?.user?.name) {
          setUserName(session.user.name);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierSelect = (supplierId: string) => {
    setFormData({ ...formData, supplierId });
  };

  const handleNext = () => {
    if (!formData.materialId) {
      alert("Produk harus dipilih");
      return;
    }

    if (!formData.supplierId) {
      alert("Supplier harus dipilih");
      return;
    }

    if (formData.transporterType === "existing" && !formData.transporterId) {
      alert("Transporter harus dipilih");
      return;
    }

    if (formData.transporterType === "new") {
      if (!formData.nomorKendaraan || !formData.namaSupir) {
        alert("Nomor kendaraan dan nama supir harus diisi");
        return;
      }
    }

    if (!formData.lokasiKebun) {
      alert("Lokasi kebun harus diisi");
      return;
    }

    const now = new Date();
    onUpdate({
      ...formData,
      tanggalTerima: now,
      operatorPenimbang: userName || "Operator",
    });
    onNext();
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Auto Generate Section */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
        <div>
          <Label className="text-sm text-muted-foreground">No. Penerimaan</Label>
          <div className="font-mono font-semibold">Auto Generate</div>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground">Tanggal & Jam Terima</Label>
          <div className="font-medium">{new Date().toLocaleString("id-ID")}</div>
        </div>
      </div>

      {/* Produk Selection */}
      <div className="space-y-2">
        <Label htmlFor="material">Produk *</Label>
        <Select value={formData.materialId} onValueChange={(value) => setFormData({ ...formData, materialId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih produk" />
          </SelectTrigger>
          <SelectContent>
            {materials.map((material) => (
              <SelectItem key={material.id} value={material.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{material.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {material.code} - {material.kategori.name} ({material.satuan.symbol})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator Penimbang */}
      <div className="space-y-2">
        <Label htmlFor="operator">Operator Penimbang</Label>
        <Input
          id="operator"
          value={userName || "Loading..."}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Operator otomatis diambil dari user yang sedang login
        </p>
      </div>

      {/* Supplier Selection */}
      <div className="space-y-2">
        <Label htmlFor="supplier" className="text-base font-semibold">Supplier *</Label>

        {formData.supplierId ? (
          <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-sm">
                  {(() => {
                    const s = suppliers.find(s => s.id === formData.supplierId);
                    return getSupplierDisplayName(s);
                  })()}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {(() => {
                    const s = suppliers.find(s => s.id === formData.supplierId);
                    return s?.type || "-";
                  })()}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData({ ...formData, supplierId: "" });
                setSearchSupplier("");
              }}
            >
              Ubah Supplier
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchSupplier"
                placeholder="Cari nama supplier, perusahaan, atau alamat..."
                value={searchSupplier}
                onChange={(e) => setSearchSupplier(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="border rounded-md max-h-80 overflow-y-auto">
              {suppliers.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {searchSupplier ? "Supplier tidak ditemukan" : "Belum ada supplier terdaftar"}
                </div>
              ) : (
                <div className="grid gap-1 p-1">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent rounded-sm transition-colors"
                      onClick={() => handleSupplierSelect(supplier.id)}
                    >
                      <div className="font-semibold text-sm">{getSupplierDisplayName(supplier)}</div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>{supplier.type}</span>
                        <span className="opacity-70">{supplier.address}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Lokasi Kebun Section */}
      {formData.supplierId && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <h3 className="font-semibold">Informasi Kebun</h3>
          <div className="space-y-2">
            <Label htmlFor="lokasiKebun">Lokasi Kebun *</Label>
            <Input
              id="lokasiKebun"
              placeholder="Contoh: Kebun Blok A, Desa Suka Maju"
              value={formData.lokasiKebun}
              onChange={(e) =>
                setFormData({ ...formData, lokasiKebun: e.target.value })
              }
            />
          </div>
        </div>
      )}

      {/* Kendaraan & Supir Section */}
      {formData.supplierId && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">Kendaraan & Supir</h3>

          <RadioGroup
            value={formData.transporterType}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                transporterType: value as "existing" | "new",
                transporterId: value === "new" ? undefined : "",
                nomorKendaraan: "",
                namaSupir: "",
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="font-normal cursor-pointer">
                Pilih dari data yang ada
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="font-normal cursor-pointer">
                Tambah data baru
              </Label>
            </div>
          </RadioGroup>

          {formData.transporterType === "existing" && (
            <div className="space-y-2 pt-2">
              {formData.transporterId ? (
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      {(() => {
                        const selected = transporters.find((t) => t.id === formData.transporterId);
                        return selected ? (
                          <>
                            <div className="font-bold text-sm">{selected.nomorKendaraan}</div>
                            <div className="text-xs text-muted-foreground">Supir: {selected.namaSupir}</div>
                          </>
                        ) : (
                          <div className="font-medium text-sm">Kendaraan Terpilih</div>
                        );
                      })()}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, transporterId: "" });
                    }}
                  >
                    Ubah Kendaraan
                  </Button>
                </div>
              ) : (
                <>
                  <Label htmlFor="transporter">Cari Transporter</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="searchTransporter"
                      placeholder="Cari nomor kendaraan atau nama supir..."
                      value={searchTransporter}
                      onChange={(e) => setSearchTransporter(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {searchTransporter && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {filteredTransporters.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          Transporter tidak ditemukan
                        </div>
                      ) : (
                        filteredTransporters.map((transporter) => (
                          <div
                            key={transporter.id}
                            className="p-3 cursor-pointer hover:bg-muted border-b last:border-b-0"
                            onClick={() => {
                              setFormData({ ...formData, transporterId: transporter.id });
                              setSearchTransporter("");
                            }}
                          >
                            <div className="font-medium">{transporter.nomorKendaraan}</div>
                            <div className="text-sm text-muted-foreground">
                              Supir: {transporter.namaSupir}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {formData.transporterType === "new" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="nomorKendaraan">Nomor Kendaraan *</Label>
                <Input
                  id="nomorKendaraan"
                  placeholder="B 1234 XYZ"
                  value={formData.nomorKendaraan}
                  onChange={(e) =>
                    setFormData({ ...formData, nomorKendaraan: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaSupir">Nama Supir *</Label>
                <Input
                  id="namaSupir"
                  placeholder="Nama supir"
                  value={formData.namaSupir}
                  onChange={(e) =>
                    setFormData({ ...formData, namaSupir: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} size="lg">
          Lanjut ke Timbangan Bruto
        </Button>
      </div>
    </div>
  );
}
