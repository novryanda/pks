"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Download,
  Eye,
  FileText,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { PurchaseOrderDetail } from "./purchase-order-detail";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { TablePagination } from "@/components/ui/table-pagination";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

interface PurchaseOrderItem {
  id: string;
  jumlahOrder: number;
  jumlahDiterima: number;
  hargaSatuan: number;
  subtotal: number;
  keterangan?: string;
  material: {
    id: string;
    partNumber: string;
    namaMaterial: string;
    satuanMaterial: {
      symbol: string;
    };
    kategoriMaterial: {
      namaKategori: string;
    };
  };
}

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  requestedBy: string;
  divisi?: string;
}

interface PenerimaanBarang {
  id: string;
  nomorPenerimaan: string;
  tanggalPenerimaan: string;
  receivedBy: string;
  status: string;
}

interface PurchaseOrder {
  id: string;
  nomorPO: string;
  tanggalPO: string;
  vendorName: string;
  vendorAddress?: string;
  vendorPhone?: string;
  tanggalKirimDiharapkan?: string;
  termPembayaran?: string;
  issuedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountType?: string;
  discountPercent: number;
  discountAmount: number;
  shipping: number;
  totalAmount: number;
  keterangan?: string;
  status: string;
  brosurPdfPath?: string;
  brosurPdfName?: string;
  purchaseRequest?: PurchaseRequest;
  items: PurchaseOrderItem[];
  penerimaanBarang: PenerimaanBarang[];
}

const ITEMS_PER_PAGE = 25;

export function PurchaseOrderList() {
  const { hasActionAccess } = useUserPermissions();
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `/api/pt-pks/purchase-order?${params.toString()}`,
      );
      if (response.ok) {
        const data = (await response.json()) as PurchaseOrder[];
        setPurchaseOrders(data);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, statusFilter]);

  useEffect(() => {
    void fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [endDate, purchaseOrders.length, searchTerm, startDate, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      DRAFT: "secondary",
      ISSUED: "default",
      PARTIAL_RECEIVED: "outline",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };

    const labels: Record<string, string> = {
      DRAFT: "Draft",
      ISSUED: "Diterbitkan",
      PARTIAL_RECEIVED: "Diterima Sebagian",
      COMPLETED: "Selesai",
      CANCELLED: "Dibatalkan",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPurchaseOrders.length / ITEMS_PER_PAGE),
  );
  const paginatedPurchaseOrders = filteredPurchaseOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const pageStart =
    filteredPurchaseOrders.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredPurchaseOrders.length,
  );

  const handleResetDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleExportExcel = () => {
    const statusLabels: Record<string, string> = {
      DRAFT: "Draft",
      ISSUED: "Diterbitkan",
      PARTIAL_RECEIVED: "Diterima Sebagian",
      COMPLETED: "Selesai",
      CANCELLED: "Dibatalkan",
    };

    const columns: ExportColumn[] = [
      { header: "Nomor PO", key: "nomorPO", width: 18 },
      { header: "Tanggal PO", key: "tanggalPO", width: 14 },
      { header: "Vendor", key: "vendorName", width: 30 },
      { header: "Ref. PR", key: "nomorPR", width: 18 },
      { header: "Status", key: "status", width: 20 },
      { header: "Issued By", key: "issuedBy", width: 22 },
      { header: "Approved By", key: "approvedBy", width: 22 },
      { header: "Part Number", key: "partNumber", width: 18 },
      { header: "Nama Material", key: "namaMaterial", width: 34 },
      { header: "Kategori", key: "kategori", width: 22 },
      { header: "Jumlah Order", key: "jumlahOrder", width: 16 },
      { header: "Jumlah Diterima", key: "jumlahDiterima", width: 18 },
      { header: "Satuan", key: "satuan", width: 12 },
      { header: "Harga Satuan", key: "hargaSatuan", width: 18 },
      { header: "Subtotal Item", key: "subtotalItem", width: 18 },
      { header: "Subtotal PO", key: "subtotalPO", width: 18 },
      { header: "Diskon", key: "discountAmount", width: 16 },
      { header: "Pajak", key: "taxAmount", width: 16 },
      { header: "Ongkir", key: "shipping", width: 16 },
      { header: "Total PO", key: "totalAmount", width: 18 },
      { header: "Keterangan Item", key: "keteranganItem", width: 28 },
    ];

    const dataToExport: Record<string, unknown>[] =
      filteredPurchaseOrders.flatMap((po): Record<string, unknown>[] =>
        po.items.length > 0
          ? po.items.map((item) => ({
              nomorPO: po.nomorPO,
              tanggalPO: format(new Date(po.tanggalPO), "dd/MM/yyyy"),
              vendorName: po.vendorName,
              nomorPR: po.purchaseRequest?.nomorPR ?? "-",
              status: statusLabels[po.status] ?? po.status,
              issuedBy: po.issuedBy,
              approvedBy: po.approvedBy ?? "-",
              partNumber: item.material.partNumber,
              namaMaterial: item.material.namaMaterial,
              kategori: item.material.kategoriMaterial.namaKategori,
              jumlahOrder: item.jumlahOrder,
              jumlahDiterima: item.jumlahDiterima,
              satuan: item.material.satuanMaterial.symbol,
              hargaSatuan: item.hargaSatuan,
              subtotalItem: item.subtotal,
              subtotalPO: po.subtotal,
              discountAmount: po.discountAmount,
              taxAmount: po.taxAmount,
              shipping: po.shipping,
              totalAmount: po.totalAmount,
              keteranganItem: item.keterangan ?? "-",
            }))
          : [
              {
                nomorPO: po.nomorPO,
                tanggalPO: format(new Date(po.tanggalPO), "dd/MM/yyyy"),
                vendorName: po.vendorName,
                nomorPR: po.purchaseRequest?.nomorPR ?? "-",
                status: statusLabels[po.status] ?? po.status,
                issuedBy: po.issuedBy,
                approvedBy: po.approvedBy ?? "-",
                partNumber: "-",
                namaMaterial: "-",
                kategori: "-",
                jumlahOrder: "",
                jumlahDiterima: "",
                satuan: "-",
                hargaSatuan: "",
                subtotalItem: "",
                subtotalPO: po.subtotal,
                discountAmount: po.discountAmount,
                taxAmount: po.taxAmount,
                shipping: po.shipping,
                totalAmount: po.totalAmount,
                keteranganItem: "-",
              },
            ],
      );

    exportToExcel(
      dataToExport,
      columns,
      "Daftar_Purchase_Order",
      "Purchase Order",
    );
  };

  const handleViewDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/pt-pks/purchase-order/${id}`);
      if (response.ok) {
        const data = (await response.json()) as PurchaseOrder;
        setSelectedPO(data);
      }
    } catch (error) {
      console.error("Error fetching PO detail:", error);
    }
  };

  const handleRefresh = async () => {
    await fetchPurchaseOrders();
    if (selectedPO) {
      await handleViewDetail(selectedPO.id);
    }
  };

  if (selectedPO) {
    return (
      <PurchaseOrderDetail
        purchaseOrder={selectedPO}
        onBack={() => {
          setSelectedPO(null);
          void fetchPurchaseOrders();
        }}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Order
            </CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Daftar order pembelian ke vendor
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={filteredPurchaseOrders.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {hasActionAccess("gudang.purchaseOrder", "create") && (
              <Button
                onClick={() =>
                  router.push("/dashboard/pt-pks/gudang/purchase-order/create")
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat PO Baru
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4">
          <Input
            placeholder="Cari nomor PO atau vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ISSUED">Diterbitkan</SelectItem>
              <SelectItem value="PARTIAL_RECEIVED">
                Diterima Sebagian
              </SelectItem>
              <SelectItem value="COMPLETED">Selesai</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[170px]"
            aria-label="Dari tanggal"
          />
          <Input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[170px]"
            aria-label="Sampai tanggal"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleResetDateFilter}
            disabled={!startDate && !endDate}
            title="Reset filter tanggal"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <RefreshCw className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
            <p className="text-muted-foreground mt-2">Memuat data...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor PO</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Ref. PR</TableHead>
                  <TableHead className="text-center">Jumlah Item</TableHead>
                  <TableHead className="text-right">Total Nilai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center">
                      <FileText className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                      <p className="text-muted-foreground">
                        Tidak ada data Purchase Order
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPurchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">
                        {po.nomorPO}
                      </TableCell>
                      <TableCell>
                        {format(new Date(po.tanggalPO), "dd MMM yyyy", {
                          locale: localeId,
                        })}
                      </TableCell>
                      <TableCell>{po.vendorName}</TableCell>
                      <TableCell>
                        {po.purchaseRequest ? (
                          <Badge variant="outline">
                            {po.purchaseRequest.nomorPR}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {po.items.length} item
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {po.totalAmount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {po.status === "DRAFT" &&
                            hasActionAccess("gudang.purchaseOrder", "edit") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/pt-pks/gudang/purchase-order/${po.id}/edit`,
                                  )
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          {(po.status === "ISSUED" || po.status === "PARTIAL_RECEIVED") &&
                            hasActionAccess("gudang.penerimaanBarang", "create") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title={po.status === "PARTIAL_RECEIVED" ? "Penerimaan Lanjutan" : "Terima Barang"}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/pt-pks/gudang/penerimaan-barang/create?poId=${po.id}`,
                                  )
                                }
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(po.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPurchaseOrders.length}
          pageStart={pageStart}
          pageEnd={pageEnd}
          onPageChange={setCurrentPage}
        />
      </CardContent>
    </Card>
  );
}
