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
import { Download, Eye, Plus, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { TablePagination } from "@/components/ui/table-pagination";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  tipePembelian: string;
  divisi: string;
  requestedBy: string;
  approvedBy?: string;
  vendorNameDirect?: string;
  status: string;
  items: Array<{
    jumlahRequest: number;
    estimasiHarga?: number | null;
    keterangan?: string | null;
    material: {
      partNumber: string;
      namaMaterial: string;
      satuanMaterial?: {
        symbol: string;
      };
    };
  }>;
}

interface PurchaseRequestListProps {
  onCreateNew?: () => void;
  onViewDetail?: (id: string) => void;
}

const ITEMS_PER_PAGE = 25;

export function PurchaseRequestList({
  onCreateNew,
  onViewDetail,
}: PurchaseRequestListProps) {
  const { hasActionAccess } = useUserPermissions();
  const router = useRouter();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPurchaseRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `/api/pt-pks/purchase-request?${params.toString()}`,
      );
      if (response.ok) {
        const data = (await response.json()) as PurchaseRequest[];
        setPurchaseRequests(data);
      }
    } catch (error) {
      console.error("Error fetching purchase requests:", error);
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, statusFilter]);

  useEffect(() => {
    void fetchPurchaseRequests();
  }, [fetchPurchaseRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [endDate, purchaseRequests.length, searchTerm, startDate, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      PENDING: "default",
      APPROVED: "default",
      COMPLETED: "default",
      REJECTED: "destructive",
      CANCELLED: "secondary",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPurchaseRequests = normalizedSearch
    ? purchaseRequests.filter((pr) => {
        const searchableValues = [
          pr.nomorPR,
          pr.divisi,
          pr.requestedBy,
          pr.vendorNameDirect,
          ...pr.items.flatMap((item) => [
            item.material.partNumber,
            item.material.namaMaterial,
          ]),
        ];

        return searchableValues.some((value) =>
          value?.toLowerCase().includes(normalizedSearch),
        );
      })
    : purchaseRequests;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPurchaseRequests.length / ITEMS_PER_PAGE),
  );
  const paginatedPurchaseRequests = filteredPurchaseRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const pageStart =
    filteredPurchaseRequests.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredPurchaseRequests.length,
  );

  const handleResetDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleExportExcel = () => {
    const columns: ExportColumn[] = [
      { header: "Nomor PR", key: "nomorPR", width: 18 },
      { header: "Tanggal", key: "tanggalRequest", width: 14 },
      { header: "Tipe Pembelian", key: "tipePembelian", width: 18 },
      { header: "Divisi", key: "divisi", width: 18 },
      { header: "Pemohon", key: "requestedBy", width: 22 },
      { header: "Vendor", key: "vendorNameDirect", width: 28 },
      { header: "Status", key: "status", width: 16 },
      { header: "Approver", key: "approvedBy", width: 22 },
      { header: "Part Number", key: "partNumber", width: 18 },
      { header: "Nama Material", key: "namaMaterial", width: 34 },
      { header: "Jumlah Request", key: "jumlahRequest", width: 16 },
      { header: "Satuan", key: "satuan", width: 12 },
      { header: "Estimasi Harga", key: "estimasiHarga", width: 18 },
      { header: "Estimasi Subtotal", key: "estimasiSubtotal", width: 18 },
      { header: "Keterangan Item", key: "keteranganItem", width: 28 },
    ];

    const dataToExport: Record<string, unknown>[] =
      filteredPurchaseRequests.flatMap((pr): Record<string, unknown>[] =>
        pr.items.length > 0
          ? pr.items.map((item) => ({
              nomorPR: pr.nomorPR,
              tanggalRequest: format(new Date(pr.tanggalRequest), "dd/MM/yyyy"),
              tipePembelian:
                pr.tipePembelian === "PEMBELIAN_LANGSUNG"
                  ? "Beli Langsung"
                  : "Pengajuan PO",
              divisi: pr.divisi,
              requestedBy: pr.requestedBy,
              vendorNameDirect: pr.vendorNameDirect ?? "-",
              status: pr.status.replace("_", " "),
              approvedBy: pr.approvedBy ?? "-",
              partNumber: item.material.partNumber,
              namaMaterial: item.material.namaMaterial,
              jumlahRequest: item.jumlahRequest,
              satuan: item.material.satuanMaterial?.symbol ?? "-",
              estimasiHarga: item.estimasiHarga ?? 0,
              estimasiSubtotal: item.jumlahRequest * (item.estimasiHarga ?? 0),
              keteranganItem: item.keterangan ?? "-",
            }))
          : [
              {
                nomorPR: pr.nomorPR,
                tanggalRequest: format(
                  new Date(pr.tanggalRequest),
                  "dd/MM/yyyy",
                ),
                tipePembelian:
                  pr.tipePembelian === "PEMBELIAN_LANGSUNG"
                    ? "Beli Langsung"
                    : "Pengajuan PO",
                divisi: pr.divisi,
                requestedBy: pr.requestedBy,
                vendorNameDirect: pr.vendorNameDirect ?? "-",
                status: pr.status.replace("_", " "),
                approvedBy: pr.approvedBy ?? "-",
                partNumber: "-",
                namaMaterial: "-",
                jumlahRequest: "",
                satuan: "-",
                estimasiHarga: "",
                estimasiSubtotal: "",
                keteranganItem: "-",
              },
            ],
      );

    exportToExcel(
      dataToExport,
      columns,
      "Daftar_Purchase_Request",
      "Purchase Request",
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Purchase Request</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={filteredPurchaseRequests.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            {hasActionAccess("gudang.purchaseRequest", "create") && (
              <Button
                onClick={() =>
                  router.push(
                    "/dashboard/pt-pks/gudang/purchase-request/create",
                  )
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Buat PR Baru
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4">
          <Input
            placeholder="Cari nomor PR, divisi, pemohon, atau nama barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
          <div className="py-8 text-center">Loading...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor PR</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPurchaseRequests.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell className="font-medium">
                        {pr.nomorPR}
                      </TableCell>
                      <TableCell>
                        {format(new Date(pr.tanggalRequest), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pr.tipePembelian === "PEMBELIAN_LANGSUNG"
                              ? "default"
                              : "outline"
                          }
                        >
                          {pr.tipePembelian === "PEMBELIAN_LANGSUNG"
                            ? "Beli Langsung"
                            : "Pengajuan PO"}
                        </Badge>
                      </TableCell>
                      <TableCell>{pr.divisi}</TableCell>
                      <TableCell>{pr.requestedBy}</TableCell>
                      <TableCell>{pr.vendorNameDirect || "-"}</TableCell>
                      <TableCell>{pr.items.length} item</TableCell>
                      <TableCell>{getStatusBadge(pr.status)}</TableCell>
                      <TableCell>{pr.approvedBy || "-"}</TableCell>
                      <TableCell className="text-right">
                        {onViewDetail && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(pr.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
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
          totalItems={filteredPurchaseRequests.length}
          pageStart={pageStart}
          pageEnd={pageEnd}
          onPageChange={setCurrentPage}
        />
      </CardContent>
    </Card>
  );
}
