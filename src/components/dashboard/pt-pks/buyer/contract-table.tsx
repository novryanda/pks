"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Pencil, FileText, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportToExcel, type ExportColumn } from "@/lib/export-excel";
import { toast } from "sonner";

type Contract = {
  id: string;
  contractNumber: string;
  contractDate: string;
  deliveryDate: string | null;
  deliveryAddress?: string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  buyer: {
    id: string;
    code: string;
    name: string;
    taxStatus: string;
  };
  contractItems: Array<{
    id: string;
    quantity: number;
    deliveredQuantity: number;
    remainingQuantity: number;
    unitPrice: number;
    totalPrice: number;
    material: {
      name: string;
      satuan: {
        symbol: string;
      };
    };
  }>;
};

type ContractResponse = {
  data?: Contract[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

type ContractTableProps = {
  buyerId?: string;
  basePath?: string;
  enableExport?: boolean;
};

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ACTIVE: { label: "Aktif", variant: "default" },
  COMPLETED: { label: "Selesai", variant: "outline" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

export function ContractTable({
  buyerId,
  basePath = "/dashboard/pt-pks/master/contract",
  enableExport = false,
}: ContractTableProps) {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const buildQueryParams = useCallback(
    (targetPage: number, targetLimit: number) => {
      const params = new URLSearchParams();
      const trimmedSearch = searchTerm.trim();

      if (trimmedSearch) params.append("search", trimmedSearch);
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (buyerId) params.append("buyerId", buyerId);
      params.append("page", targetPage.toString());
      params.append("limit", targetLimit.toString());

      return params;
    },
    [buyerId, searchTerm, statusFilter]
  );

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/pt-pks/contract?${buildQueryParams(page, 10).toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch contracts");

      const result = (await response.json()) as ContractResponse;
      setContracts(result.data ?? []);
      setTotalPages(result.pagination?.totalPages ?? 1);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, page]);

  useEffect(() => {
    void fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    setPage(1);
  }, [buyerId]);

  const handleView = (id: string) => {
    router.push(`${basePath}/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`${basePath}/${id}/edit`);
  };

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString("id-ID") : "-";

  const formatCurrency = (value: number) =>
    `Rp ${value.toLocaleString("id-ID")}`;

  const getContractDeliverySummary = (contract: Contract) => {
    return contract.contractItems.reduce(
      (summary, item) => ({
        deliveredQuantity: summary.deliveredQuantity + (item.deliveredQuantity ?? 0),
        remainingQuantity: summary.remainingQuantity + (item.remainingQuantity ?? 0),
      }),
      {
        deliveredQuantity: 0,
        remainingQuantity: 0,
      }
    );
  };

  const handleExportExcel = async () => {
    setIsExporting(true);

    try {
      const firstResponse = await fetch(
        `/api/pt-pks/contract?${buildQueryParams(1, 100).toString()}`
      );
      if (!firstResponse.ok) {
        throw new Error("Failed to fetch contracts for export");
      }

      const firstResult = (await firstResponse.json()) as ContractResponse;
      const allContracts = [...(firstResult.data ?? [])];
      const exportTotalPages = firstResult.pagination?.totalPages ?? 1;

      for (let currentPage = 2; currentPage <= exportTotalPages; currentPage += 1) {
        const response = await fetch(
          `/api/pt-pks/contract?${buildQueryParams(currentPage, 100).toString()}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch additional contract pages");
        }

        const result = (await response.json()) as ContractResponse;
        allContracts.push(...(result.data ?? []));
      }

      if (allContracts.length === 0) {
        toast.error("Tidak ada data kontrak untuk diexport");
        return;
      }

      const columns: ExportColumn[] = [
        { header: "No. Kontrak", key: "contractNumber", width: 22 },
        { header: "Buyer", key: "buyerName", width: 30 },
        { header: "Kode Buyer", key: "buyerCode", width: 16 },
        { header: "Tanggal Kontrak", key: "contractDate", width: 18 },
        { header: "Tanggal Kirim", key: "deliveryDate", width: 18 },
        { header: "Status", key: "statusLabel", width: 14 },
        { header: "Jumlah Item", key: "itemCount", width: 14 },
        { header: "Total Terkirim", key: "deliveredQuantity", width: 18 },
        { header: "Sisa Pengiriman", key: "remainingQuantity", width: 18 },
        { header: "Subtotal", key: "subtotal", width: 18 },
        { header: "Pajak", key: "taxAmount", width: 18 },
        { header: "Total", key: "totalAmount", width: 18 },
        { header: "Alamat Pengiriman", key: "deliveryAddress", width: 35 },
        { header: "Detail Item", key: "itemSummary", width: 80 },
      ];

      const dataToExport = allContracts.map((contract) => {
        const deliverySummary = getContractDeliverySummary(contract);
        const itemSummary = contract.contractItems
          .map(
            (item) =>
              `${item.material.name} (${item.quantity.toLocaleString("id-ID")} ${item.material.satuan.symbol}; terkirim ${item.deliveredQuantity.toLocaleString("id-ID")}; sisa ${item.remainingQuantity.toLocaleString("id-ID")})`
          )
          .join("; ");

        return {
          contractNumber: contract.contractNumber,
          buyerName: contract.buyer.name,
          buyerCode: contract.buyer.code,
          contractDate: formatDate(contract.contractDate),
          deliveryDate: formatDate(contract.deliveryDate),
          statusLabel: statusLabels[contract.status]?.label ?? contract.status,
          itemCount: contract.contractItems.length,
          deliveredQuantity: deliverySummary.deliveredQuantity,
          remainingQuantity: deliverySummary.remainingQuantity,
          subtotal: contract.subtotal,
          taxAmount: contract.taxAmount,
          totalAmount: contract.totalAmount,
          deliveryAddress: contract.deliveryAddress ?? "-",
          itemSummary: itemSummary.length > 0 ? itemSummary : "-",
        };
      });

      exportToExcel(dataToExport, columns, "Daftar_Kontrak_Pemasaran", "Kontrak");
      toast.success(`Berhasil export ${allContracts.length} kontrak`);
    } catch (error) {
      console.error("Error exporting contracts:", error);
      toast.error("Gagal export data kontrak");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kontrak (nomor kontrak, nama buyer)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="COMPLETED">Selesai</SelectItem>
            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        {enableExport && (
          <Button
            variant="outline"
            onClick={() => void handleExportExcel()}
            disabled={isExporting || loading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Mengekspor..." : "Export Excel"}
          </Button>
        )}
        {!buyerId && (
          <Button onClick={() => router.push(`${basePath}/new`)}>
            <FileText className="mr-2 h-4 w-4" />
            Buat Kontrak
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Kontrak</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Tanggal Kontrak</TableHead>
              <TableHead>Tanggal Kirim</TableHead>
              <TableHead>Jumlah Item</TableHead>
              <TableHead className="text-right">Total Terkirim</TableHead>
              <TableHead className="text-right">Sisa</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  Tidak ada data kontrak
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => {
                const deliverySummary = getContractDeliverySummary(contract);

                return (
                  <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.contractNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contract.buyer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.buyer.code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(contract.contractDate)}
                  </TableCell>
                  <TableCell>{formatDate(contract.deliveryDate)}</TableCell>
                  <TableCell>{contract.contractItems.length} item</TableCell>
                  <TableCell className="text-right font-medium">
                    {deliverySummary.deliveredQuantity.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {deliverySummary.remainingQuantity.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatCurrency(contract.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        + pajak {formatCurrency(contract.taxAmount)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[contract.status]?.variant}>
                      {statusLabels[contract.status]?.label ?? contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(contract.id)}
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(contract.id)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
