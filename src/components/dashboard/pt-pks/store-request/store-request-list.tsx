"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Eye, Plus, RotateCcw, Search } from "lucide-react";
import { StoreRequestForm } from "./store-request-form";
import { StoreRequestDetail } from "./store-request-detail";
import { format } from "date-fns";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { TablePagination } from "@/components/ui/table-pagination";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";

type StatusBadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface StoreRequest {
  id: string;
  nomorSR: string;
  tanggalRequest: string;
  divisi: string;
  requestedBy: string;
  approvedBy?: string;
  status: string;
  items: Array<{
    id: string;
    jumlahRequest: number;
    keterangan?: string;
    material: {
      id: string;
      partNumber: string;
      namaMaterial: string;
      stockOnHand?: number;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

const ITEMS_PER_PAGE = 25;

export function StoreRequestList() {
  const { hasActionAccess } = useUserPermissions();
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedSR, setSelectedSR] = useState<StoreRequest | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchStoreRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const query = params.toString();
      const url = `/api/pt-pks/store-request${query ? `?${query}` : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = (await response.json()) as StoreRequest[];
        setStoreRequests(data);
      }
    } catch (error) {
      console.error("Error fetching store requests:", error);
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, statusFilter]);

  useEffect(() => {
    void fetchStoreRequests();
  }, [fetchStoreRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [endDate, searchTerm, startDate, statusFilter, storeRequests.length]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, StatusBadgeVariant> = {
      DRAFT: "secondary",
      PENDING: "default",
      APPROVED: "default",
      COMPLETED: "default",
      REJECTED: "destructive",
      NEED_PR: "default",
      CANCELLED: "secondary",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const filteredSRs = storeRequests.filter(
    (sr) =>
      sr.nomorSR.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sr.divisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sr.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSRs.length / ITEMS_PER_PAGE),
  );
  const paginatedSRs = filteredSRs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const pageStart =
    filteredSRs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredSRs.length);

  const handleSuccess = () => {
    setShowForm(false);
    setShowDetail(false);
    void fetchStoreRequests();
  };

  const handleResetDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleExportExcel = () => {
    const columns: ExportColumn[] = [
      { header: "Nomor SR", key: "nomorSR", width: 18 },
      { header: "Tanggal", key: "tanggalRequest", width: 14 },
      { header: "Divisi", key: "divisi", width: 18 },
      { header: "Pemohon", key: "requestedBy", width: 22 },
      { header: "Status", key: "status", width: 14 },
      { header: "Approver", key: "approvedBy", width: 22 },
      { header: "Part Number", key: "partNumber", width: 18 },
      { header: "Nama Material", key: "namaMaterial", width: 34 },
      { header: "Jumlah Request", key: "jumlahRequest", width: 16 },
      { header: "Satuan", key: "satuan", width: 12 },
      { header: "Keterangan Item", key: "keteranganItem", width: 28 },
    ];

    const dataToExport: Record<string, unknown>[] = filteredSRs.flatMap(
      (sr): Record<string, unknown>[] =>
        sr.items.length > 0
          ? sr.items.map((item) => ({
              nomorSR: sr.nomorSR,
              tanggalRequest: format(new Date(sr.tanggalRequest), "dd/MM/yyyy"),
              divisi: sr.divisi,
              requestedBy: sr.requestedBy,
              status: sr.status.replace("_", " "),
              approvedBy: sr.approvedBy ?? "-",
              partNumber: item.material.partNumber,
              namaMaterial: item.material.namaMaterial,
              jumlahRequest: item.jumlahRequest,
              satuan: item.material.satuanMaterial.symbol,
              keteranganItem: item.keterangan ?? "-",
            }))
          : [
              {
                nomorSR: sr.nomorSR,
                tanggalRequest: format(
                  new Date(sr.tanggalRequest),
                  "dd/MM/yyyy",
                ),
                divisi: sr.divisi,
                requestedBy: sr.requestedBy,
                status: sr.status.replace("_", " "),
                approvedBy: sr.approvedBy ?? "-",
                partNumber: "-",
                namaMaterial: "-",
                jumlahRequest: "",
                satuan: "-",
                keteranganItem: "-",
              },
            ],
    );

    exportToExcel(
      dataToExport,
      columns,
      "Daftar_Store_Request",
      "Store Request",
    );
  };

  if (showForm) {
    return (
      <StoreRequestForm
        onSuccess={handleSuccess}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (showDetail && selectedSR) {
    // Ensure selectedSR has all required fields for StoreRequestDetail
    const detailData = {
      ...selectedSR,
      items: selectedSR.items.map((item) => ({
        id: item.id,
        jumlahRequest: item.jumlahRequest ?? 0,
        keterangan:
          "keterangan" in item && typeof item.keterangan === "string"
            ? item.keterangan
            : "",
        material: {
          id: item.material.id,
          partNumber: item.material.partNumber ?? "",
          namaMaterial: item.material.namaMaterial ?? "",
          stockOnHand: item.material.stockOnHand ?? 0,
          satuanMaterial: {
            symbol: item.material.satuanMaterial?.symbol ?? "",
          },
        },
      })),
    };
    return (
      <StoreRequestDetail
        storeRequest={detailData}
        onClose={() => {
          setShowDetail(false);
          setSelectedSR(null);
        }}
        onSuccess={handleSuccess}
      />
    );
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Store Request</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={filteredSRs.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              {hasActionAccess("gudang.storeRequest", "create") && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat SR Baru
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Cari nomor SR, divisi, atau pemohon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
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
                <SelectItem value="NEED_PR">Need PR</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor SR</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSRs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Tidak ada data store request
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSRs.map((sr) => (
                    <TableRow key={sr.id}>
                      <TableCell className="font-medium">
                        {sr.nomorSR}
                      </TableCell>
                      <TableCell>
                        {format(new Date(sr.tanggalRequest), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{sr.divisi}</TableCell>
                      <TableCell>{sr.requestedBy}</TableCell>
                      <TableCell>{sr.items.length} item</TableCell>
                      <TableCell>{getStatusBadge(sr.status)}</TableCell>
                      <TableCell>{sr.approvedBy || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSR(sr);
                            setShowDetail(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSRs.length}
            pageStart={pageStart}
            pageEnd={pageEnd}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
