"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import debounce from "lodash.debounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

type SummaryItem = {
  buyerName: string;
  contractNumber: string;
  materialName: string;
  materialCode: string;
  satuan: string;
  contractQuantity: number;
  deliveredQuantity: number;
  hi: number;
  bi: number;
  ti: number;
  remaining: number;
  contractCustomFields?: any;
};

type DeliverySummaryTableProps = {
  startDate: string;
  endDate: string;
  materialId?: string;
  buyerId?: string;
  contractId?: string;
};

export function DeliverySummaryTable({
  startDate,
  endDate,
  materialId,
  buyerId,
  contractId,
}: DeliverySummaryTableProps) {
  const [data, setData] = useState<SummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    debouncedFetchData(startDate, endDate, materialId, buyerId, contractId);

    return () => {
      debouncedFetchData.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [startDate, endDate, materialId, buyerId, contractId]);

  const debouncedFetchData = useMemo(
    () =>
      debounce(
        (
          start: string,
          end: string,
          m: string | undefined,
          b: string | undefined,
          c: string | undefined,
        ) => {
          fetchData(start, end, m, b, c);
        },
        500,
      ),
    [],
  );

  const fetchData = async (
    currentStartDate: string = startDate,
    currentEndDate: string = endDate,
    currentMaterialId: string | undefined = materialId,
    currentBuyerId: string | undefined = buyerId,
    currentContractId: string | undefined = contractId,
  ) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentStartDate) params.append("startDate", currentStartDate);
      if (currentEndDate) params.append("endDate", currentEndDate);
      if (currentMaterialId && currentMaterialId !== "all")
        params.append("materialId", currentMaterialId);
      if (currentBuyerId) params.append("buyerId", currentBuyerId);
      if (currentContractId) params.append("contractId", currentContractId);

      const response = await fetch(
        `/api/pt-pks/pengiriman-product/consolidated-summary?${params.toString()}`,
        { signal: controller.signal },
      );
      if (response.ok) {
        const result = await response.json();
        const sortedData = (result.summary || []).sort((a: any, b: any) =>
          a.contractNumber.localeCompare(b.contractNumber),
        );
        setData(sortedData);
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Consolidated summary fetch aborted");
      } else {
        console.error("Error fetching consolidated summary:", error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const groupedData = useMemo(() => {
    const groups: Record<string, SummaryItem[]> = {};
    data.forEach((item) => {
      const materialName = item.materialName;
      if (!groups[materialName]) {
        groups[materialName] = [];
      }
      groups[materialName]!.push(item);
    });
    return groups;
  }, [data]);

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex animate-pulse justify-center p-8">
        Memuat rekapitulasi...
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedData).map(([materialName, items]) => {
        const groupTotals = items.reduce(
          (acc, item) => ({
            contractQuantity: acc.contractQuantity + item.contractQuantity,
            hi: acc.hi + item.hi,
            bi: acc.bi + item.bi,
            ti: acc.ti + item.ti,
            remaining: acc.remaining + item.remaining,
          }),
          { contractQuantity: 0, hi: 0, bi: 0, ti: 0, remaining: 0 },
        );

        return (
          <Card
            key={materialName}
            className="border-t-primary border-t-4 shadow-md"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="text-primary h-5 w-5" />
                Rekapitulasi Pengiriman: {materialName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Buyer</TableHead>
                      <TableHead>No. Kontrak</TableHead>
                      <TableHead className="text-right">Jml Kontrak</TableHead>
                      <TableHead className="bg-blue-50/30 text-right">
                        HI (Harian)
                      </TableHead>
                      <TableHead className="bg-green-50/30 text-right">
                        BI (Bulanan)
                      </TableHead>
                      <TableHead className="bg-orange-50/30 text-right">
                        TI (Tahunan)
                      </TableHead>
                      <TableHead className="text-primary text-right font-bold">
                        Sisa
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow
                        key={`${item.contractNumber}-${idx}`}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {item.buyerName}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[150px] space-y-0.5 text-[10px]">
                            <p className="font-medium">{item.contractNumber}</p>
                            {item.contractCustomFields &&
                              Array.isArray(item.contractCustomFields) && (
                                <>
                                  {item.contractCustomFields.find(
                                    (f: any) => f.fieldName === "Nomor PO",
                                  )?.fieldValue && (
                                    <p className="text-muted-foreground whitespace-nowrap">
                                      PO:{" "}
                                      {
                                        item.contractCustomFields.find(
                                          (f: any) =>
                                            f.fieldName === "Nomor PO",
                                        )?.fieldValue
                                      }
                                    </p>
                                  )}
                                  {item.contractCustomFields.find(
                                    (f: any) => f.fieldName === "Nomor DO",
                                  )?.fieldValue && (
                                    <p className="text-muted-foreground whitespace-nowrap">
                                      DO:{" "}
                                      {
                                        item.contractCustomFields.find(
                                          (f: any) =>
                                            f.fieldName === "Nomor DO",
                                        )?.fieldValue
                                      }
                                    </p>
                                  )}
                                </>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {item.contractQuantity.toLocaleString("id-ID")}{" "}
                          {item.satuan}
                        </TableCell>
                        <TableCell className="bg-blue-50/20 text-right">
                          {item.hi.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="bg-green-50/20 text-right">
                          {item.bi.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="bg-orange-50/20 text-right">
                          {item.ti.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right font-bold text-orange-600">
                          {item.remaining.toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-muted/80 font-bold">
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center tracking-wider uppercase"
                      >
                        Total {materialName}
                      </TableCell>
                      <TableCell className="text-right">
                        {groupTotals.contractQuantity.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="bg-blue-100/50 text-right">
                        {groupTotals.hi.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="bg-green-100/50 text-right">
                        {groupTotals.bi.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="bg-orange-100/50 text-right">
                        {groupTotals.ti.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-primary text-right font-extrabold">
                        {groupTotals.remaining.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <p className="text-muted-foreground mt-2 text-[10px] italic">
        * HI: Hari Ini, BI: Bulan Ini, TI: Tahun Ini. Angka dalam kg kecuali
        disebutkan lain.
      </p>
    </div>
  );
}
