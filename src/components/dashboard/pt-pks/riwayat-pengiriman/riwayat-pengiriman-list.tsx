"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Truck,
  Package,
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  Eye,
  Ban,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { DeliverySummaryTable } from "./delivery-summary-table";

type Buyer = {
  id: string;
  code: string;
  name: string;
};

type Contract = {
  id: string;
  contractNumber: string;
  status: string;
  buyer: Buyer;
  startDate: string;
  endDate: string;
  customFields?: any;
};

type ItemSummary = {
  contractItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  satuan: { name: string; symbol: string };
  contractQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  deliveryPercentage: number;
  unitPrice: number;
  deliveryCount: number;
};

type Delivery = {
  id: string;
  nomorPengiriman: string;
  tanggalPengiriman: string;
  operatorPenimbang: string;
  status: string;
  beratTarra: number;
  beratGross: number;
  beratNetto: number;
  mutuCustomFields?: { fieldName: string; fieldValue: string }[] | null;
  waktuTimbangTarra: string;
  waktuTimbangGross: string;
  contractItemId: string;
  buyer: Buyer;
  contract: {
    contractNumber: string;
    buyer: Buyer;
  };
  contractItem: {
    material: {
      id: string;
      code: string;
      name: string;
      satuan: { name: string; symbol: string };
    };
  };
  vendorVehicle: {
    nomorKendaraan: string;
    namaSupir: string;
    noHpSupir?: string | null;
    vendor: { name: string; code: string };
  };
};

type ContractDeliveryData = {
  contract: Contract;
  itemSummaries: ItemSummary[];
  deliveries: Delivery[];
  overallSummary: {
    totalDeliveries: number;
    totalDeliveredWeight: number;
    pendingDeliveries: number;
  };
};

const statusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  COMPLETED: { label: "Selesai", variant: "default" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

const contractStatusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ACTIVE: { label: "Aktif", variant: "default" },
  COMPLETED: { label: "Selesai", variant: "outline" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

type Material = {
  id: string;
  code: string;
  name: string;
};

export function RiwayatPengirimanList({
  contractId,
  buyerId,
}: {
  contractId?: string;
  buyerId?: string;
}) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<string>(buyerId || "");
  const [selectedContract, setSelectedContract] = useState<string>(
    contractId || "",
  );
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [deliveryData, setDeliveryData] = useState<ContractDeliveryData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [shipSummary, setShipSummary] = useState<any>(null);
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [deliveryToCancel, setDeliveryToCancel] = useState<Delivery | null>(
    null,
  );
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch buyers
  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const response = await fetch("/api/pt-pks/buyer/active");
        if (response.ok) {
          const data = await response.json();
          setBuyers(data);
        }
      } catch (error) {
        console.error("Error fetching buyers:", error);
      }
    };
    fetchBuyers();
  }, []);

  // Fetch materials (products)
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch("/api/pt-pks/material?dropdown=true");
        if (response.ok) {
          const data = await response.json();
          setMaterials(data.materials || []);
        }
      } catch (error) {
        console.error("Error fetching materials:", error);
      }
    };
    fetchMaterials();
  }, []);

  // Fetch contracts when buyer changes
  useEffect(() => {
    const fetchContracts = async () => {
      if (!selectedBuyer) {
        setContracts([]);
        return;
      }
      try {
        const response = await fetch(
          `/api/pt-pks/contract?buyerId=${selectedBuyer}`,
        );
        if (response.ok) {
          const data = await response.json();
          setContracts(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
      }
    };
    fetchContracts();
  }, [selectedBuyer]);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    debouncedFetch(selectedContract, filterStartDate, filterEndDate);

    return () => {
      debouncedFetch.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedContract, filterEndDate, filterStartDate]);

  const debouncedFetch = useMemo(
    () =>
      debounce(
        (currentContractId: string, startDate: string, endDate: string) => {
          fetchDeliveryData(currentContractId, startDate, endDate);
          fetchShipSummary(endDate || startDate);
        },
        500,
      ),
    [],
  );

  // Auto-select contract if provided via URL
  useEffect(() => {
    if (contractId) {
      setSelectedContract(contractId);
      // Find the buyer from the contract
      const fetchContractDetails = async () => {
        try {
          const response = await fetch(
            `/api/pt-pks/contract/${contractId}/deliveries`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.contract?.buyer?.id) {
              setSelectedBuyer(data.contract.buyer.id);
            }
            setDeliveryData(data);
          }
        } catch (error) {
          console.error("Error fetching contract details:", error);
        }
      };
      fetchContractDetails();
    }
  }, [contractId]);

  const handlePrintSuratPengantar = (deliveryId: string) => {
    window.open(
      `/api/pt-pks/pengiriman-product/${deliveryId}/surat-pengantar`,
      "_blank",
    );
  };

  const handleViewDetail = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailOpen(true);
  };

  const buildDateParams = (startDate: string, endDate: string) => {
    const params = new URLSearchParams();

    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    return params.toString();
  };

  const fetchDeliveryData = async (
    contractId: string,
    startDate: string,
    endDate: string,
  ) => {
    if (!contractId) {
      setDeliveryData(null);
      return;
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const queryString = buildDateParams(startDate, endDate);
      const url = `/api/pt-pks/contract/${contractId}/deliveries${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        setDeliveryData(data);
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Delivery data fetch aborted");
      } else {
        console.error("Error fetching delivery data:", error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const fetchShipSummary = async (referenceDate: string) => {
    try {
      const params = new URLSearchParams();
      if (referenceDate) {
        params.set("date", referenceDate);
      }

      const url = `/api/pt-pks/pengiriman-product/summary${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, {
        signal: abortControllerRef.current?.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setShipSummary(data.summary);
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Ship summary fetch aborted");
      } else {
        console.error("Error fetching shipping summary:", error);
      }
    }
  };
  const handleCancelDelivery = async () => {
    if (!deliveryToCancel) return;

    setIsCancelling(true);
    try {
      const response = await fetch(
        `/api/pt-pks/pengiriman-product/${deliveryToCancel.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "CANCELLED",
          }),
        },
      );

      if (response.ok) {
        toast.success("Pengiriman berhasil dibatalkan");
        // Refresh data
        if (selectedContract) {
          await fetchDeliveryData(
            selectedContract,
            filterStartDate,
            filterEndDate,
          );
        }
        setIsCancelDialogOpen(false);
        setDeliveryToCancel(null);
        setIsDetailOpen(false);
      } else {
        const error = await response.json();
        toast.error(
          `Gagal membatalkan pengiriman: ${error.message || "Terjadi kesalahan"}`,
        );
      }
    } catch (error) {
      console.error("Error cancelling delivery:", error);
      toast.error("Terjadi kesalahan saat membatalkan pengiriman");
    } finally {
      setIsCancelling(false);
    }
  };

  const openCancelDialog = (delivery: Delivery) => {
    setDeliveryToCancel(delivery);
    setIsCancelDialogOpen(true);
  };

  const buildExportParams = () => {
    const params = new URLSearchParams();

    if (filterStartDate) params.set("startDate", filterStartDate);
    if (filterEndDate) params.set("endDate", filterEndDate);
    if (selectedProduct) params.set("materialId", selectedProduct);
    if (selectedBuyer) params.set("buyerId", selectedBuyer);
    if (selectedContract) params.set("contractId", selectedContract);

    return params.toString();
  };

  const resetFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setSelectedProduct("all");
    setSelectedBuyer(buyerId || "");
    setSelectedContract(contractId || "");
  };

  const handleExportExcel = () => {
    window.open(
      `/api/pt-pks/riwayat-pengiriman/export-excel?${buildExportParams()}`,
      "_blank",
    );
  };

  const handleExportPdf = () => {
    window.open(
      `/api/pt-pks/riwayat-pengiriman/export-pdf?${buildExportParams()}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          onClick={handleExportExcel}
          variant="outline"
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
        <Button
          onClick={handleExportPdf}
          variant="outline"
          className="border-red-600 text-red-600 hover:bg-red-50"
        >
          <FileText className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Pengiriman
          </CardTitle>
          <CardDescription>
            Kosongkan periode jika ingin melihat seluruh histori pengiriman.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <Label>Dari Tanggal</Label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sampai Tanggal</Label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Produk</SelectItem>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} - {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Buyer</Label>
              <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Buyer" />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map((buyer) => (
                    <SelectItem key={buyer.id} value={buyer.id}>
                      {buyer.code} - {buyer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kontrak</Label>
              <Select
                value={selectedContract}
                onValueChange={setSelectedContract}
                disabled={!selectedBuyer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kontrak" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contractNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={resetFilters}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-100 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pengiriman Hari Ini
            </CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {(shipSummary?.today?.totalBerat || 0).toLocaleString("id-ID")}
            </div>
            <p className="text-muted-foreground text-xs">kg produk dikirim</p>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pengiriman Bulan Ini
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {(shipSummary?.month?.totalBerat || 0).toLocaleString("id-ID")}
            </div>
            <p className="text-muted-foreground text-xs">
              kg akumulasi bulan ini
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pengiriman Tahun Ini
            </CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {(shipSummary?.year?.totalBerat || 0).toLocaleString("id-ID")}
            </div>
            <p className="text-muted-foreground text-xs">
              kg akumulasi tahun ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table (Consolidated) */}
      <DeliverySummaryTable
        startDate={filterStartDate}
        endDate={filterEndDate}
        buyerId={selectedBuyer}
        contractId={selectedContract}
        materialId={selectedProduct}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-2">Memuat data...</p>
        </div>
      )}

      {/* No Selection State */}
      {!selectedContract && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="text-lg font-medium">Pilih Kontrak</h3>
            <p className="text-muted-foreground">
              Pilih buyer dan kontrak untuk melihat riwayat pengiriman
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contract Summary */}
      {deliveryData && !isLoading && (
        <>
          {/* Contract Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {deliveryData.contract.contractNumber}
                  </CardTitle>
                  <CardDescription className="space-y-1">
                    <p>{deliveryData.contract.buyer.name}</p>
                    {deliveryData.contract.customFields &&
                      Array.isArray(deliveryData.contract.customFields) && (
                        <div className="flex gap-3 text-xs">
                          {deliveryData.contract.customFields.find(
                            (f: any) => f.fieldName === "Nomor PO",
                          )?.fieldValue && (
                            <span className="bg-muted rounded px-1.5 py-0.5">
                              PO:{" "}
                              {
                                deliveryData.contract.customFields.find(
                                  (f: any) => f.fieldName === "Nomor PO",
                                ).fieldValue
                              }
                            </span>
                          )}
                          {deliveryData.contract.customFields.find(
                            (f: any) => f.fieldName === "Nomor DO",
                          )?.fieldValue && (
                            <span className="bg-muted rounded px-1.5 py-0.5">
                              DO:{" "}
                              {
                                deliveryData.contract.customFields.find(
                                  (f: any) => f.fieldName === "Nomor DO",
                                ).fieldValue
                              }
                            </span>
                          )}
                        </div>
                      )}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    contractStatusLabels[deliveryData.contract.status]
                      ?.variant || "default"
                  }
                >
                  {contractStatusLabels[deliveryData.contract.status]?.label ||
                    deliveryData.contract.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950">
                  <p className="text-2xl font-bold text-blue-600">
                    {deliveryData.overallSummary.totalDeliveries}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Total Pengiriman
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
                  <p className="text-2xl font-bold text-green-600">
                    {deliveryData.overallSummary.totalDeliveredWeight.toLocaleString(
                      "id-ID",
                      {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      },
                    )}{" "}
                    kg
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Total Terkirim
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-950">
                  <p className="text-2xl font-bold text-yellow-600">
                    {deliveryData.overallSummary.pendingDeliveries}
                  </p>
                  <p className="text-muted-foreground text-sm">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Progress Pengiriman Per Item
              </CardTitle>
              <CardDescription>
                Kuantitas kontrak dan sisa yang harus dikirim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveryData.itemSummaries
                  .filter(
                    (item) =>
                      selectedProduct === "all" ||
                      item.materialId === selectedProduct,
                  )
                  .map((item) => (
                    <div
                      key={item.contractItemId}
                      className="space-y-3 rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.materialName}</p>
                          <p className="text-muted-foreground text-sm">
                            {item.materialCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {item.deliveryCount} pengiriman
                          </Badge>
                        </div>
                      </div>

                      <Progress
                        value={item.deliveryPercentage}
                        className="h-3"
                      />

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Kuantitas Kontrak
                          </p>
                          <p className="font-medium">
                            {item.contractQuantity.toLocaleString("id-ID")}{" "}
                            {item.satuan.symbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Sudah Terkirim
                          </p>
                          <p className="font-medium text-green-600">
                            {item.deliveredQuantity.toLocaleString("id-ID")}{" "}
                            {item.satuan.symbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Sisa Pengiriman
                          </p>
                          <p className="font-medium text-orange-600">
                            {item.remainingQuantity.toLocaleString("id-ID")}{" "}
                            {item.satuan.symbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Persentase</p>
                          <p className="font-medium">
                            {item.deliveryPercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Daftar Pengiriman
              </CardTitle>
              <CardDescription>
                Riwayat semua pengiriman untuk kontrak ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryData.deliveries.filter(
                (d) =>
                  selectedProduct === "all" ||
                  d.contractItem.material.id === selectedProduct,
              ).length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. DO</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">
                          Berat Netto
                        </TableHead>
                        <TableHead>Kendaraan</TableHead>
                        <TableHead>Supir</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryData.deliveries
                        .filter(
                          (d) =>
                            selectedProduct === "all" ||
                            d.contractItem.material.id === selectedProduct,
                        )
                        .map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell className="font-medium">
                              {delivery.nomorPengiriman}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                delivery.tanggalPengiriman,
                              ).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {delivery.contractItem.material.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {delivery.contractItem.material.code}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {delivery.beratNetto.toLocaleString("id-ID")} kg
                            </TableCell>
                            <TableCell>
                              <div>
                                <p>{delivery.vendorVehicle.nomorKendaraan}</p>
                                <p className="text-muted-foreground text-xs">
                                  {delivery.vendorVehicle.vendor.name}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {delivery.vendorVehicle.namaSupir}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  statusLabels[delivery.status]?.variant ||
                                  "default"
                                }
                              >
                                {statusLabels[delivery.status]?.label ||
                                  delivery.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetail(delivery)}
                                  title="Lihat Detail"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handlePrintSuratPengantar(delivery.id)
                                  }
                                  title="Cetak Surat Pengantar"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                {delivery.status === "COMPLETED" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => openCancelDialog(delivery)}
                                    title="Batalkan Pengiriman"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Truck className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <h3 className="text-lg font-medium">Belum Ada Pengiriman</h3>
                  <p className="text-muted-foreground">
                    Belum ada pengiriman yang tercatat untuk kontrak ini
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengiriman</DialogTitle>
            <DialogDescription>
              {selectedDelivery?.nomorPengiriman}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">No. DO</p>
                  <p className="font-medium">
                    {selectedDelivery.nomorPengiriman}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Status</p>
                  <p className="font-medium">{selectedDelivery.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Tanggal</p>
                  <p className="font-medium">
                    {new Date(
                      selectedDelivery.tanggalPengiriman,
                    ).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Operator</p>
                  <p className="font-medium">
                    {selectedDelivery.operatorPenimbang}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-2 font-semibold">Informasi Produk</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Produk</p>
                    <p className="font-medium">
                      {selectedDelivery.contractItem.material.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Kode</p>
                    <p className="font-medium">
                      {selectedDelivery.contractItem.material.code}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-2 font-semibold">Detail Timbangan</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Berat Tarra</p>
                    <p className="font-medium">
                      {selectedDelivery.beratTarra.toLocaleString("id-ID")} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Berat Gross</p>
                    <p className="font-medium">
                      {selectedDelivery.beratGross.toLocaleString("id-ID")} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Berat Netto</p>
                    <p className="font-medium text-green-600">
                      {selectedDelivery.beratNetto.toLocaleString("id-ID")} kg
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-2 font-semibold">Data Mutu</h4>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {selectedDelivery.mutuCustomFields &&
                  selectedDelivery.mutuCustomFields.length > 0 ? (
                    selectedDelivery.mutuCustomFields.map((field, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-lg p-2">
                        <p className="text-muted-foreground text-xs">
                          {field.fieldName}
                        </p>
                        <p className="font-medium">{field.fieldValue}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground col-span-full text-sm italic">
                      Data mutu tidak tersedia
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-2 font-semibold">Informasi Kendaraan</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Vendor</p>
                    <p className="font-medium">
                      {selectedDelivery.vendorVehicle.vendor.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      No. Kendaraan
                    </p>
                    <p className="font-medium">
                      {selectedDelivery.vendorVehicle.nomorKendaraan}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Nama Supir</p>
                    <p className="font-medium">
                      {selectedDelivery.vendorVehicle.namaSupir}
                    </p>
                  </div>
                  {selectedDelivery.vendorVehicle.noHpSupir && (
                    <div>
                      <p className="text-muted-foreground text-sm">
                        No. HP Supir
                      </p>
                      <p className="font-medium">
                        {selectedDelivery.vendorVehicle.noHpSupir}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => handlePrintSuratPengantar(selectedDelivery.id)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak Surat Pengantar
                </Button>
                {selectedDelivery.status === "COMPLETED" && (
                  <Button
                    variant="destructive"
                    onClick={() => openCancelDialog(selectedDelivery)}
                    disabled={isCancelling}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Batalkan Pengiriman
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
              Konfirmasi Pembatalan
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Apakah Anda yakin ingin membatalkan pengiriman{" "}
                <strong>{deliveryToCancel?.nomorPengiriman}</strong>?
                <br />
                <br />
                Tindakan ini akan:
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Mengembalikan stok material ke gudang</li>
                  <li>Mengembalikan isi stok ke dalam tangki</li>
                  <li>Mengurangi jumlah terkirim pada kontrak</li>
                  <li>Mengubah status pengiriman menjadi Dibatalkan</li>
                </ul>
                <br />
                Tindakan ini tidak dapat dibatalkan.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelDelivery();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
            >
              {isCancelling ? "Memproses..." : "Ya, Batalkan Pengiriman"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
