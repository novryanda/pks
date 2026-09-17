"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PengirimanPageContent } from "@/components/dashboard/pt-pks/pengiriman-product/pengiriman-page-content";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  FileText,
  Trash2,
  Eye,
  List,
  Scale,
  Ban,
  Printer,
  AlertTriangle,
  Filter,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type PengirimanProduct = {
  id: string;
  nomorPengiriman: string;
  tanggalPengiriman: string;
  waktuTimbangTarra?: string;
  waktuTimbangGross?: string | null;
  buyer: {
    name: string;
    code: string;
  } | null;
  contract: {
    contractNumber: string;
    customFields?: { fieldName: string; fieldValue: string }[];
  } | null;
  contractItem: {
    material: {
      name: string;
      satuan: {
        symbol: string;
      };
    };
  } | null;
  vendorVehicle: {
    nomorKendaraan: string;
    namaSupir: string;
    noHpSupir?: string | null;
    noSim?: string | null;
    vendor: {
      name: string;
    };
  };
  beratTarra: number;
  beratGross: number | null;
  beratNetto: number | null;
  noSegel: string;
  ffa: number | null;
  air: number | null;
  status: string;
  mutuCustomFields?: { fieldName: string; fieldValue: string }[] | null;
  operatorPenimbang: string;
};

type CustomField = {
  fieldName: string;
  fieldValue: string;
};

function getCombinedCustomFields(pengiriman: PengirimanProduct): CustomField[] {
  return [
    ...(pengiriman.mutuCustomFields ?? []),
    ...(pengiriman.contract?.customFields ?? []),
  ];
}

function getSealDisplayValue(pengiriman: PengirimanProduct) {
  const allCustomFields = getCombinedCustomFields(pengiriman);
  const segelAtas = allCustomFields.find(
    (field) =>
      field.fieldName.toLowerCase().includes("segel") &&
      field.fieldName.toLowerCase().includes("atas"),
  )?.fieldValue;
  const segelBawah = allCustomFields.find(
    (field) =>
      field.fieldName.toLowerCase().includes("segel") &&
      field.fieldName.toLowerCase().includes("bawah"),
  )?.fieldValue;

  if (segelAtas || segelBawah) {
    return [
      segelAtas && `Atas: ${segelAtas}`,
      segelBawah && `Bawah: ${segelBawah}`,
    ]
      .filter(Boolean)
      .join(" | ");
  }

  return (
    pengiriman.noSegel ??
    allCustomFields.find(
      (field) =>
        field.fieldName.toLowerCase().includes("segel") &&
        !field.fieldName.toLowerCase().includes("atas") &&
        !field.fieldName.toLowerCase().includes("bawah"),
    )?.fieldValue ??
    "-"
  );
}

export default function PengirimanProductPage() {
  const [activeMainTab, setActiveMainTab] = useState("input");
  const [pengirimanList, setPengirimanList] = useState<PengirimanProduct[]>([]);
  const [selectedPengiriman, setSelectedPengiriman] =
    useState<PengirimanProduct | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch("/api/pt-pks/material");
      if (res.ok) {
        const data = await res.json();
        const filteredData = Array.isArray(data)
          ? data.filter((m: any) => !m.name.toUpperCase().includes("TBS"))
          : [];
        setProducts(filteredData);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  }, []);

  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (filterStartDate) params.append("startDate", filterStartDate);
    if (filterEndDate) params.append("endDate", filterEndDate);
    if (filterProduct !== "all") params.append("materialId", filterProduct);
    return params;
  }, [filterEndDate, filterProduct, filterStartDate]);

  const fetchPengiriman = useCallback(async () => {
    try {
      setLoading(true);
      const url = "/api/pt-pks/pengiriman-product?";
      const params = buildFilterParams();

      const res = await fetch(url + params.toString());
      if (res.ok) {
        const data = await res.json();
        setPengirimanList(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch pengiriman:", res.statusText);
        setPengirimanList([]);
      }
    } catch (error) {
      console.error("Error fetching pengiriman:", error);
      setPengirimanList([]);
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams]);

  useEffect(() => {
    void fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    void fetchPengiriman();
  }, [fetchPengiriman, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pt-pks/pengiriman-product?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Pengiriman berhasil dihapus");
        void fetchPengiriman();
      } else {
        const data = await res.json();
        alert(`Gagal menghapus: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting pengiriman:", error);
      alert("Terjadi kesalahan saat menghapus data");
    } finally {
      setDeleteId(null);
    }
  };

  const handleViewDetail = (pengiriman: PengirimanProduct) => {
    setSelectedPengiriman(pengiriman);
    setShowDetail(true);
  };

  const handlePrintSuratPengantar = (pengiriman: PengirimanProduct) => {
    // Open PDF in new window
    window.open(
      `/api/pt-pks/pengiriman-product/surat-pengantar?id=${pengiriman.id}`,
      "_blank",
    );
  };

  const handlePrintTiketTimbangan = (pengiriman: PengirimanProduct) => {
    window.open(
      `/api/pt-pks/pengiriman-product/${pengiriman.id}/tiket-timbangan`,
      "_blank",
    );
  };

  const handleCancelDelivery = async (id: string) => {
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/pt-pks/pengiriman-product/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "CANCELLED",
        }),
      });

      if (response.ok) {
        toast.success("Pengiriman berhasil dibatalkan");
        void fetchPengiriman();
      } else {
        const error = await response.json();
        toast.error(`Gagal membatalkan: ${error.error || "Terjadi kesalahan"}`);
      }
    } catch (error) {
      console.error("Error cancelling delivery:", error);
      toast.error("Terjadi kesalahan saat membatalkan pengiriman");
    } finally {
      setIsCancelling(false);
      setCancelId(null);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = buildFilterParams();

      const url = `/api/pt-pks/pengiriman-product/export-excel?${params.toString()}`;
      window.open(url, "_blank");
      toast.success("Mengekspor data ke Excel...");
    } catch (error) {
      console.error("Error exporting excel:", error);
      toast.error("Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSingleExcel = (id: string) => {
    window.open(
      `/api/pt-pks/pengiriman-product/export-excel?id=${id}`,
      "_blank",
    );
    toast.success("Mengekspor surat pengantar ke Excel...");
  };

  const resetFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterProduct("all");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Selesai</Badge>;
      case "TIMBANG_TARRA":
        return <Badge className="bg-blue-500">Menunggu Gross</Badge>;
      case "TIMBANG_GROSS":
        return <Badge className="bg-yellow-500">Menunggu Kontrak</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="px-1 sm:px-0">
        <h1 className="text-2xl font-bold md:text-3xl">Pengiriman Product</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Kelola pengiriman product ke buyer dengan alur dua tahap
        </p>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
        <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Input Pengiriman
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Daftar Pengiriman
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="mt-6">
          <PengirimanPageContent onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <CardTitle>Daftar Pengiriman Product</CardTitle>
                  <CardDescription>
                    Daftar semua pengiriman product yang telah dilakukan
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium">
                      Dari
                    </p>
                    <div className="relative">
                      <Input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-[160px] pl-9"
                        aria-label="Dari tanggal"
                      />
                      <Filter className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
                      {filterStartDate && (
                        <button
                          onClick={() => setFilterStartDate("")}
                          className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium">
                      Sampai
                    </p>
                    <div className="relative">
                      <Input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-[160px]"
                        aria-label="Sampai tanggal"
                      />
                    </div>
                  </div>
                  <Select
                    value={filterProduct}
                    onValueChange={setFilterProduct}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Semua Produk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Produk</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleExportExcel}
                    disabled={isExporting || pengirimanList.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    {isExporting ? "Mengekspor..." : "Excel"}
                  </Button>
                  {(filterStartDate ||
                    filterEndDate ||
                    filterProduct !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-muted-foreground h-9 px-2"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center">Loading...</div>
              ) : pengirimanList.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  Belum ada data pengiriman product
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Pengiriman</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Kendaraan</TableHead>
                        <TableHead className="text-right">
                          Berat Netto
                        </TableHead>
                        <TableHead>No. Segel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pengirimanList.map((pengiriman) => (
                        <TableRow key={pengiriman.id}>
                          <TableCell className="font-medium">
                            {pengiriman.nomorPengiriman}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(pengiriman.tanggalPengiriman),
                              "dd MMM yyyy",
                              {
                                locale: idLocale,
                              },
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {pengiriman.buyer?.name || "-"}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {pengiriman.contract?.contractNumber || "-"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {pengiriman.contractItem?.material.name || "-"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {pengiriman.vendorVehicle.vendor.name}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {pengiriman.vendorVehicle.namaSupir}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {pengiriman.vendorVehicle.nomorKendaraan}
                          </TableCell>
                          <TableCell className="text-right">
                            {pengiriman.beratNetto?.toLocaleString("id-ID") ||
                              "-"}{" "}
                            {pengiriman.contractItem?.material.satuan.symbol ||
                              "kg"}
                          </TableCell>
                          <TableCell>
                            {getSealDisplayValue(pengiriman)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(pengiriman.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(pengiriman)}
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handlePrintSuratPengantar(pengiriman)
                                }
                                title="Cetak Surat Pengantar"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleExportSingleExcel(pengiriman.id)
                                }
                                title="Ekspor Excel"
                              >
                                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                              </Button>
                              {(pengiriman.status === "TIMBANG_GROSS" ||
                                pengiriman.status === "COMPLETED") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handlePrintTiketTimbangan(pengiriman)
                                  }
                                  title="Cetak Tiket Timbangan"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              )}
                              {pengiriman.status === "COMPLETED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setCancelId(pengiriman.id)}
                                  title="Batalkan Pengiriman"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                              {pengiriman.status === "DRAFT" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteId(pengiriman.id)}
                                  title="Hapus"
                                >
                                  <Trash2 className="text-destructive h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengiriman Product</DialogTitle>
            <DialogDescription>
              {selectedPengiriman?.nomorPengiriman}
            </DialogDescription>
          </DialogHeader>

          {selectedPengiriman && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 font-semibold">Informasi Pengiriman</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Nomor:</strong>{" "}
                      {selectedPengiriman.nomorPengiriman}
                    </p>
                    <p>
                      <strong>Tanggal:</strong>{" "}
                      {format(
                        new Date(selectedPengiriman.tanggalPengiriman),
                        "dd MMMM yyyy",
                        { locale: idLocale },
                      )}
                    </p>
                    <p>
                      <strong>Operator:</strong>{" "}
                      {selectedPengiriman.operatorPenimbang}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {getStatusBadge(selectedPengiriman.status)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold">Buyer & Kontrak</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Buyer:</strong>{" "}
                      {selectedPengiriman.buyer?.name || "-"}
                    </p>
                    <p>
                      <strong>Kode:</strong>{" "}
                      {selectedPengiriman.buyer?.code || "-"}
                    </p>
                    <p>
                      <strong>No. Kontrak:</strong>{" "}
                      {selectedPengiriman.contract?.contractNumber || "-"}
                    </p>
                    {selectedPengiriman.contract?.customFields?.map(
                      (field, idx) => (
                        <p key={idx}>
                          <strong>{field.fieldName}:</strong>{" "}
                          {field.fieldValue || "-"}
                        </p>
                      ),
                    )}
                    <p>
                      <strong>Product:</strong>{" "}
                      {selectedPengiriman.contractItem?.material.name || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-2 font-semibold">Vendor & Kendaraan</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Vendor:</strong>{" "}
                      {selectedPengiriman.vendorVehicle.vendor.name}
                    </p>
                    <p>
                      <strong>Supir:</strong>{" "}
                      {selectedPengiriman.vendorVehicle.namaSupir}
                    </p>
                    <p>
                      <strong>No. HP Supir:</strong>{" "}
                      {selectedPengiriman.vendorVehicle.noHpSupir || "-"}
                    </p>
                    <p>
                      <strong>No. SIM:</strong>{" "}
                      {selectedPengiriman.vendorVehicle.noSim || "-"}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Kendaraan:</strong>{" "}
                      {selectedPengiriman.vendorVehicle.nomorKendaraan}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-2 font-semibold">Penimbangan</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Berat Tarra</p>
                    <p className="font-medium">
                      {selectedPengiriman.beratTarra.toLocaleString("id-ID")} Kg
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Berat Gross</p>
                    <p className="font-medium">
                      {selectedPengiriman.beratGross?.toLocaleString("id-ID") ||
                        "-"}{" "}
                      Kg
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Berat Netto</p>
                    <p className="text-primary font-bold">
                      {selectedPengiriman.beratNetto?.toLocaleString("id-ID") ||
                        "-"}{" "}
                      Kg
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-2 font-semibold">Mutu</h4>
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  {selectedPengiriman.mutuCustomFields &&
                  selectedPengiriman.mutuCustomFields.length > 0 ? (
                    selectedPengiriman.mutuCustomFields
                      .filter(
                        (f: any) =>
                          !f.fieldName.toLowerCase().includes("segel"),
                      )
                      .map((field, idx) => (
                        <div key={idx}>
                          <p className="text-muted-foreground">
                            {field.fieldName}
                          </p>
                          <p className="font-medium">
                            {field.fieldValue || "-"}%
                          </p>
                        </div>
                      ))
                  ) : (
                    <>
                      <div>
                        <p className="text-muted-foreground">FFA</p>
                        <p className="font-medium">
                          {selectedPengiriman.ffa ?? "-"}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Kadar Air</p>
                        <p className="font-medium">
                          {selectedPengiriman.air ?? "-"}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Kadar Kotoran</p>
                        <p className="font-medium">
                          {(() => {
                            const kotoranField =
                              selectedPengiriman.mutuCustomFields?.find(
                                (f: any) =>
                                  f.fieldName.toLowerCase().includes("kotoran"),
                              );
                            return kotoranField?.fieldValue ?? "-";
                          })()}
                          %
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-2 font-semibold">No. Segel</h4>
                <div className="space-y-4">
                  {(() => {
                    const allCustomFields =
                      getCombinedCustomFields(selectedPengiriman);

                    const segelAtas = allCustomFields.find(
                      (f) =>
                        f.fieldName.toLowerCase().includes("segel") &&
                        f.fieldName.toLowerCase().includes("atas"),
                    )?.fieldValue;

                    const segelBawah = allCustomFields.find(
                      (f) =>
                        f.fieldName.toLowerCase().includes("segel") &&
                        f.fieldName.toLowerCase().includes("bawah"),
                    )?.fieldValue;

                    const genericSegel =
                      selectedPengiriman.noSegel ||
                      allCustomFields.find(
                        (f) =>
                          f.fieldName.toLowerCase().includes("segel") &&
                          !f.fieldName.toLowerCase().includes("atas") &&
                          !f.fieldName.toLowerCase().includes("bawah"),
                      )?.fieldValue;

                    if (segelAtas || segelBawah) {
                      return (
                        <div className="grid grid-cols-2 gap-4">
                          {segelAtas && (
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                                Segel Atas
                              </p>
                              <p className="text-primary font-mono text-lg font-bold">
                                {segelAtas}
                              </p>
                            </div>
                          )}
                          {segelBawah && (
                            <div>
                              <p className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
                                Segel Bawah
                              </p>
                              <p className="text-primary font-mono text-lg font-bold">
                                {segelBawah}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <p className="font-mono text-lg font-bold">
                        {genericSegel || "-"}
                      </p>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengiriman ini? Aksi ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={!!cancelId}
        onOpenChange={() => !isCancelling && setCancelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
              Konfirmasi Pembatalan
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Apakah Anda yakin ingin membatalkan pengiriman ini?
                <br />
                <br />
                Tindakan ini akan:
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
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
                if (cancelId) {
                  void handleCancelDelivery(cancelId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
            >
              {isCancelling ? "Memproses..." : "Ya, Batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
