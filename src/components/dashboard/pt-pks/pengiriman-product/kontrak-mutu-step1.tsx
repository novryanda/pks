"use client";

import { useCallback, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Plus } from "lucide-react";
import { format } from "date-fns";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { KontrakMutuFormData, PendingKontrakPengiriman } from "./kontrak-mutu-wizard";

type Buyer = {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
};

type Contract = {
  id: string;
  contractNumber: string;
  contractDate: string;
  deliveryDate: string;
  status: string;
  buyer: Buyer;
  contractItems: ContractItem[];
  customFields?: { fieldName: string; fieldValue: string }[] | null;
};

type ContractItem = {
  id: string;
  quantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  totalPrice: number;
  material: {
    id: string;
    name: string;
    code: string;
    kategori: { name: string };
    satuan: { name: string; symbol: string };
  };
};

type KontrakMutuStep1Props = {
  data: Partial<KontrakMutuFormData>;
  pengiriman: PendingKontrakPengiriman;
  onUpdate: (data: Partial<KontrakMutuFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onCreateContract: (buyerId: string) => void;
  loading?: boolean;
  submitLabel?: string;
};

export function KontrakMutuStep1({
  data,
  pengiriman,
  onUpdate,
  onNext,
  onBack,
  onCreateContract,
  loading: isSubmitting,
  submitLabel = "Lanjut",
}: KontrakMutuStep1Props) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractItems, setContractItems] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    buyerId: data.buyerId || "",
    contractId: data.contractId || "",
    contractItemId: data.contractItemId || "",
    // Split fields
    isSplit: data.isSplit || false,
    splitContractId: data.splitContractId || "",
    splitContractItemId: data.splitContractItemId || "",
  });

  const [secondContractItems, setSecondContractItems] = useState<ContractItem[]>([]);

  const beratNetto = pengiriman.beratNetto || 0;
  const materialId = pengiriman.materialId || "";
  const materialLabel = pengiriman.material
    ? `${pengiriman.material.code} - ${pengiriman.material.name}`
    : "Produk pengiriman";

  const fetchBuyers = useCallback(async () => {
    try {
      const res = await fetch("/api/pt-pks/buyer?dropdown=true&status=ACTIVE");
      if (res.ok) {
        const result = (await res.json()) as { buyers?: Buyer[] };
        setBuyers(result.buyers ?? []);
      }
    } catch (error) {
      console.error("Error fetching buyers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContracts = useCallback(async (buyerId: string) => {
    try {
      const params = new URLSearchParams({
        buyerId,
        status: "ACTIVE",
        dropdown: "true",
        limit: "100",
      });

      if (materialId) {
        params.set("materialId", materialId);
      }

      const res = await fetch(`/api/pt-pks/contract?${params.toString()}`);
      if (res.ok) {
        const result = (await res.json()) as { data?: Contract[] };
        setContracts(result.data ?? []);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
    }
  }, [materialId]);

  const fetchContractItems = useCallback(async (contractId: string) => {
    try {
      const params = new URLSearchParams();
      if (materialId) {
        params.set("materialId", materialId);
      }

      const queryString = params.toString();
      const res = await fetch(`/api/pt-pks/contract/${contractId}/items${queryString ? `?${queryString}` : ""}`);
      if (res.ok) {
        const result = (await res.json()) as ContractItem[];
        setContractItems(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error("Error fetching contract items:", error);
    }
  }, [materialId]);

  const fetchSecondContractItems = useCallback(async (contractId: string) => {
    try {
      const params = new URLSearchParams();
      if (materialId) {
        params.set("materialId", materialId);
      }

      const queryString = params.toString();
      const res = await fetch(`/api/pt-pks/contract/${contractId}/items${queryString ? `?${queryString}` : ""}`);
      if (res.ok) {
        const result = (await res.json()) as ContractItem[];
        setSecondContractItems(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error("Error fetching second contract items:", error);
    }
  }, [materialId]);

  useEffect(() => {
    void fetchBuyers();
  }, [fetchBuyers]);

  useEffect(() => {
    if (formData.buyerId) {
      void fetchContracts(formData.buyerId);
      setFormData((prev) => ({ ...prev, contractId: "", contractItemId: "" }));
      setContractItems([]);
    }
  }, [fetchContracts, formData.buyerId]);

  useEffect(() => {
    if (formData.contractId) {
      void fetchContractItems(formData.contractId);
      setFormData((prev) => ({ ...prev, contractItemId: "" }));
    }
  }, [fetchContractItems, formData.contractId]);

  useEffect(() => {
    if (formData.splitContractId) {
      void fetchSecondContractItems(formData.splitContractId);
      setFormData((prev) => ({ ...prev, splitContractItemId: "" }));
    }
  }, [fetchSecondContractItems, formData.splitContractId]);

  useEffect(() => {
    if (formData.contractItemId) {
      const selectedItem = contractItems.find((i) => i.id === formData.contractItemId);
      if (selectedItem) {
        const remaining = selectedItem.remainingQuantity;
        if (beratNetto > remaining) {
          setCapacityWarning(
            `Berat netto (${beratNetto.toLocaleString()} kg) melebihi sisa kapasitas kontrak (${remaining.toLocaleString()} kg). ` +
            `Silakan buat kontrak baru atau pilih kontrak lain.`
          );
        } else {
          setCapacityWarning(null);
          setFormData(prev => ({ ...prev, isSplit: false, splitContractId: "", splitContractItemId: "" }));
        }
      }
    } else {
      setCapacityWarning(null);
    }
  }, [formData.contractItemId, contractItems, beratNetto]);

  const handleNext = () => {
    if (!formData.buyerId) {
      alert("Buyer harus dipilih");
      return;
    }
    if (!formData.contractId) {
      alert("Kontrak harus dipilih");
      return;
    }
    if (!formData.contractItemId) {
      alert("Item kontrak harus dipilih");
      return;
    }

    if (formData.isSplit) {
      if (!formData.splitContractId || !formData.splitContractItemId) {
        alert("Kontrak kedua harus dipilih untuk split");
        return;
      }
    }

    onUpdate(formData);
    onNext();
  };

  const selectedBuyer = buyers.find((b) => b.id === formData.buyerId);
  const selectedContract = contracts.find((c) => c.id === formData.contractId);
  const selectedItem = contractItems.find((i) => i.id === formData.contractItemId);

  if (loading) {
    return <div className="flex justify-center p-8">Memuat data buyer...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Pemilihan Kontrak</h3>
        <p className="text-sm text-blue-800">
          Pilih buyer dan kontrak untuk pengiriman ini. Sistem akan memvalidasi kapasitas kontrak.
        </p>
      </div>

      <div className="bg-muted/50 border rounded-lg p-4">
        <h4 className="font-semibold mb-2">Data Pengiriman</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">No. Pengiriman:</div>
          <div className="font-medium">{pengiriman.nomorPengiriman}</div>
          <div className="text-muted-foreground">Produk:</div>
          <div className="font-medium">{materialLabel}</div>
          <div className="text-muted-foreground">Kendaraan:</div>
          <div className="font-medium">{pengiriman.vendorVehicle.nomorKendaraan}</div>
          <div className="text-muted-foreground">Supir:</div>
          <div className="font-medium">{pengiriman.vendorVehicle.namaSupir}</div>
          <div className="text-muted-foreground">Berat Netto:</div>
          <div className="font-bold text-green-600">{beratNetto.toLocaleString()} kg</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="buyerId">Buyer *</Label>
          <SearchableSelect
            value={formData.buyerId}
            onValueChange={(value) => setFormData({ ...formData, buyerId: value })}
            options={buyers.map((buyer) => ({
              value: buyer.id,
              label: `${buyer.code} - ${buyer.name}`,
              sublabel: buyer.address
            }))}
            placeholder="Pilih buyer"
            searchPlaceholder="Cari buyer..."
          />
          {selectedBuyer && (
            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
              <p>Contact: {selectedBuyer.contactPerson}</p>
              <p>Telp: {selectedBuyer.phone}</p>
              <p>Alamat: {selectedBuyer.address}</p>
            </div>
          )}
        </div>

        {formData.buyerId && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="contractId">Kontrak *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateContract(formData.buyerId)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Buat Kontrak Baru
                </Button>
              </div>
              <SearchableSelect
                value={formData.contractId}
                onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                options={contracts.map((contract) => {
                  const po = contract.customFields?.find(f => f.fieldName.includes("PO"))?.fieldValue;
                  const remainingCapacity = contract.contractItems.reduce(
                    (sum, item) => sum + item.remainingQuantity,
                    0
                  );
                  return {
                    value: contract.id,
                    label: `${contract.contractNumber} ${po ? `(PO: ${po})` : ""}`,
                    sublabel: contract.deliveryDate
                      ? `Estimasi: ${format(new Date(contract.deliveryDate), "d MMM yyyy")} | Sisa: ${remainingCapacity.toLocaleString()} kg`
                      : `Tgl: ${format(new Date(contract.contractDate), "d MMM yyyy")} | Sisa: ${remainingCapacity.toLocaleString()} kg`
                  };
                })}
                placeholder="Pilih kontrak"
                searchPlaceholder="Cari nomor kontrak..."
                emptyMessage={contracts.length === 0 ? `Tidak ada kontrak aktif untuk produk ${materialLabel}. Silakan buat kontrak baru.` : "Tidak ada data ditemukan."}
              />
              {selectedContract && (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <p>Tanggal Kontrak: {new Date(selectedContract.contractDate).toLocaleDateString("id-ID")}</p>
                    <Badge variant={selectedContract.status === "ACTIVE" ? "default" : "secondary"}>
                      {selectedContract.status}
                    </Badge>
                  </div>

                  {/* Informasi PO/DO jika ada */}
                  {(selectedContract.customFields?.some(f => f.fieldName.includes("PO") || f.fieldName.includes("DO"))) && (
                    <div className="flex gap-4 pt-1 border-t border-muted-foreground/10">
                      {selectedContract.customFields.find(f => f.fieldName.includes("PO")) && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Nomor PO</span>
                          <span className="text-blue-700 font-semibold">{selectedContract.customFields.find(f => f.fieldName.includes("PO"))?.fieldValue}</span>
                        </div>
                      )}
                      {selectedContract.customFields.find(f => f.fieldName.includes("DO")) && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Nomor DO</span>
                          <span className="text-purple-700 font-semibold">{selectedContract.customFields.find(f => f.fieldName.includes("DO"))?.fieldValue}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedContract.deliveryDate && (
                    <p className="text-xs italic">Estimasi Kirim: {new Date(selectedContract.deliveryDate).toLocaleDateString("id-ID")}</p>
                  )}
                </div>
              )}
            </div>

            {formData.contractId && (
              <div className="space-y-2">
                <Label htmlFor="contractItemId">Item Kontrak (Produk) *</Label>
                <Select
                  value={formData.contractItemId}
                  onValueChange={(value) => setFormData({ ...formData, contractItemId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih item kontrak" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.material.name} - Sisa: {item.remainingQuantity.toLocaleString()} {item.material.satuan.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedItem && (
                  <div className="text-sm p-3 bg-muted rounded space-y-1">
                    <p><strong>Produk:</strong> {selectedItem.material.name}</p>
                    <p><strong>Kategori:</strong> {selectedItem.material.kategori.name}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center p-2 bg-background rounded">
                        <div className="text-xs text-muted-foreground">Kuantitas Kontrak</div>
                        <div className="font-semibold">{selectedItem.quantity.toLocaleString()} {selectedItem.material.satuan.symbol}</div>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <div className="text-xs text-muted-foreground">Sudah Dikirim</div>
                        <div className="font-semibold">{selectedItem.deliveredQuantity.toLocaleString()} {selectedItem.material.satuan.symbol}</div>
                      </div>
                      <div className="text-center p-2 bg-background rounded">
                        <div className="text-xs text-muted-foreground">Sisa</div>
                        <div className={`font-semibold ${selectedItem.remainingQuantity < beratNetto ? "text-red-600" : "text-green-600"}`}>
                          {selectedItem.remainingQuantity.toLocaleString()} {selectedItem.material.satuan.symbol}
                        </div>
                      </div>
                    </div>
                    <p><strong>Harga:</strong> Rp {selectedItem.unitPrice.toLocaleString()} / {selectedItem.material.satuan.symbol}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {capacityWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Kapasitas Kontrak Tidak Mencukupi</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{capacityWarning}</p>

            <div className="flex flex-col gap-3">
              {!formData.isSplit ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setFormData({ ...formData, isSplit: true })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Gunakan Kontrak Lain untuk Kelebihan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onCreateContract(formData.buyerId)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Buat Kontrak Baru
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-background/50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-center">
                    <h5 className="font-semibold text-sm">Pilih Kontrak Kedua (Overflow)</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, isSplit: false, splitContractId: "", splitContractItemId: "" })}
                    >
                      Batal Split
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Kontrak Aktif Lainnya</Label>
                      <SearchableSelect
                        value={formData.splitContractId}
                        onValueChange={(val) => setFormData({ ...formData, splitContractId: val })}
                        options={contracts
                          .filter(c => c.id !== formData.contractId)
                          .map((contract) => {
                            const po = contract.customFields?.find(f => f.fieldName.includes("PO"))?.fieldValue;
                            return {
                              value: contract.id,
                              label: `${contract.contractNumber} ${po ? `(PO: ${po})` : ""}`,
                              sublabel: `Sisa kapasitas: ${contract.contractItems.reduce((sum, item) => sum + item.remainingQuantity, 0).toLocaleString()} kg`
                            };
                          })}
                        placeholder="Pilih kontrak kedua"
                        searchPlaceholder="Cari kontrak..."
                        className="h-9"
                      />

                      {/* Info PO/DO untuk Kontrak Kedua */}
                      {formData.splitContractId && (
                        <div className="mt-2 p-2 bg-background/80 rounded border border-dashed text-xs space-y-1">
                          {contracts.find(c => c.id === formData.splitContractId)?.customFields?.map((f, i) => (
                            (f.fieldName.includes("PO") || f.fieldName.includes("DO")) && (
                              <div key={i} className="flex justify-between">
                                <span className="text-muted-foreground">{f.fieldName}:</span>
                                <span className="font-semibold">{f.fieldValue}</span>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>

                    {formData.splitContractId && (
                      <div className="space-y-1">
                        <Label className="text-xs">Item Kontrak</Label>
                        <Select
                          value={formData.splitContractItemId}
                          onValueChange={(val) => setFormData({ ...formData, splitContractItemId: val })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Pilih item" />
                          </SelectTrigger>
                          <SelectContent>
                            {secondContractItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.material.name} - Sisa: {item.remainingQuantity.toLocaleString()} {item.material.satuan.symbol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {formData.splitContractItemId && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-xs space-y-2">
                        <p className="font-semibold text-blue-900">Rencana Pembagian Bobot:</p>
                        <div className="flex justify-between">
                          <span>Kontrak 1 ({selectedContract?.contractNumber}):</span>
                          <span className="font-bold">{(selectedItem?.remainingQuantity || 0).toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kontrak 2 ({contracts.find(c => c.id === formData.splitContractId)?.contractNumber}):</span>
                          <span className="font-bold">{(beratNetto - (selectedItem?.remainingQuantity || 0)).toLocaleString()} kg</span>
                        </div>
                        <div className="border-t border-blue-200 pt-1 flex justify-between font-bold">
                          <span>Total Netto:</span>
                          <span>{beratNetto.toLocaleString()} kg</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Kembali ke List
        </Button>
        <Button
          onClick={handleNext}
          disabled={!formData.buyerId || !formData.contractId || !formData.contractItemId || isSubmitting}
        >
          {isSubmitting ? "Menyimpan..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
