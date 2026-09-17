"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, FileText, Plus, Building2, Package, Truck } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type ContractWithPendingInvoice = {
  id: string;
  contractNumber: string;
  contractDate: string;
  deliveryAddress: string;
  buyer: {
    id: string;
    name: string;
    code: string;
    taxStatus: string;
  };
  contractItems: {
    id: string;
    quantity: number;
    deliveredQuantity: number;
    unitPrice: number;
    material: {
      id: string;
      name: string;
      code: string;
    };
  }[];
  pengirimanProduct: {
    id: string;
    nomorPengiriman: string;
    tanggalPengiriman: string;
    beratNetto: number | null;
    ffa: number | null;
    air: number | null;
    kotoran: number | null;
    vendorVehicle: {
      nomorKendaraan: string;
      namaSupir: string;
      vendor: {
        name: string;
      };
    };
  }[];
};

type PendingInvoiceListProps = {
  onSelectContract?: (contract: ContractWithPendingInvoice) => void;
  onRefresh?: () => void;
};

export function PendingInvoiceList({ onSelectContract, onRefresh }: PendingInvoiceListProps) {
  const [contracts, setContracts] = useState<ContractWithPendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pt-pks/invoice/pending-contracts");
      if (res.ok) {
        const result = await res.json();
        setContracts(Array.isArray(result) ? result : []);
      } else {
        console.error("Failed to fetch pending contracts");
        setContracts([]);
      }
    } catch (error) {
      console.error("Error fetching pending contracts:", error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingContracts();
  }, []);

  const handleRefresh = () => {
    fetchPendingContracts();
    onRefresh?.();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Memuat data...</div>;
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Tidak Ada Kontrak Menunggu Invoice</h3>
        <p className="text-muted-foreground mb-4">
          Belum ada pengiriman yang selesai dan siap untuk di-invoice.
        </p>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Kontrak dengan Pengiriman Belum Di-Invoice</h3>
          <p className="text-sm text-muted-foreground">
            Pilih kontrak untuk membuat invoice
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {contracts.map((contract) => {
          const totalPendingKg = contract.pengirimanProduct.reduce(
            (sum, p) => sum + (p.beratNetto || 0),
            0
          );
          const harga = contract.contractItems[0]?.unitPrice || 0;
          const estimasiNilai = totalPendingKg * harga;

          return (
            <Card
              key={contract.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSelectContract?.(contract)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {contract.contractNumber}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(contract.contractDate), "d MMMM yyyy", { locale: localeId })}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {contract.pengirimanProduct.length} Pengiriman
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Buyer Info */}
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{contract.buyer.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {contract.buyer.taxStatus === "NON_PKP"
                      ? "Non PKP"
                      : contract.buyer.taxStatus === "PKP_11"
                      ? "PKP 11%"
                      : "PKP 1.1%"}
                  </Badge>
                </div>

                {/* Product Info */}
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {contract.contractItems.map((item) => item.material.name).join(", ")}
                  </span>
                  <span className="text-muted-foreground">
                    @ Rp {harga.toLocaleString("id-ID")}/kg
                  </span>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-muted-foreground">Total Berat</div>
                    <div className="font-bold text-blue-600">
                      {totalPendingKg.toLocaleString("id-ID")} kg
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-muted-foreground">Estimasi Nilai</div>
                    <div className="font-bold text-green-600">
                      Rp {estimasiNilai.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-xs text-muted-foreground">Jumlah DO</div>
                    <div className="font-bold text-amber-600">
                      {contract.pengirimanProduct.length}
                    </div>
                  </div>
                </div>

                {/* Pengiriman List Preview */}
                <div className="border rounded-lg">
                  <div className="bg-muted px-3 py-2 text-xs font-medium">
                    Daftar Pengiriman
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {contract.pengirimanProduct.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-2 border-t text-xs flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{p.nomorPengiriman}</span>
                          <span className="text-muted-foreground">
                            - {p.vendorVehicle.nomorKendaraan}
                          </span>
                        </div>
                        <span className="font-medium">
                          {(p.beratNetto || 0).toLocaleString("id-ID")} kg
                        </span>
                      </div>
                    ))}
                    {contract.pengirimanProduct.length > 3 && (
                      <div className="px-3 py-2 border-t text-xs text-center text-muted-foreground">
                        +{contract.pengirimanProduct.length - 3} pengiriman lainnya
                      </div>
                    )}
                  </div>
                </div>

                <Button className="w-full" variant="default">
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Invoice
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
