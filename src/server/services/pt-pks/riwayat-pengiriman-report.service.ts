import { parseJakartaDateBoundary } from "@/lib/date-time";
import { db } from "@/server/db";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";

type ReportFilters = {
  date?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  materialId?: string | null;
  buyerId?: string | null;
  contractId?: string | null;
};

const DEFAULT_ADDRESS = "JL LINTAS LANGGAM KM. 3 DESA LUBUK OGONG";
const periodFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function getDefaultDateString() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const partMap = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return `${partMap.year}-${partMap.month}-${partMap.day}`;
}

function getJakartaReferenceDate(date: string) {
  return new Date(`${date}T12:00:00+07:00`);
}

function formatPeriodDate(date: string) {
  return periodFormatter.format(getJakartaReferenceDate(date));
}

function getPeriodLabel(startDate: string | null, endDate: string | null) {
  if (startDate && endDate) {
    if (startDate === endDate) {
      return formatPeriodDate(startDate);
    }

    return `${formatPeriodDate(startDate)} - ${formatPeriodDate(endDate)}`;
  }

  if (startDate) {
    return `Mulai ${formatPeriodDate(startDate)}`;
  }

  if (endDate) {
    return `Sampai ${formatPeriodDate(endDate)}`;
  }

  return "Semua Periode";
}

function getExportFileLabel(startDate: string | null, endDate: string | null) {
  if (startDate && endDate) {
    return startDate === endDate ? startDate : `${startDate}_sampai_${endDate}`;
  }

  if (startDate) {
    return `mulai_${startDate}`;
  }

  if (endDate) {
    return `sampai_${endDate}`;
  }

  return "semua-periode";
}

function extractContractField(customFields: unknown, fieldName: string) {
  if (!Array.isArray(customFields)) {
    return "-";
  }

  const field = customFields.find(
    (item) =>
      item &&
      typeof item === "object" &&
      "fieldName" in item &&
      "fieldValue" in item &&
      (item as { fieldName: string }).fieldName === fieldName,
  ) as { fieldValue?: string } | undefined;

  return field?.fieldValue || "-";
}

export async function getRiwayatPengirimanReport(
  companyId: string,
  filters: ReportFilters,
) {
  const singleDate = filters.date || null;
  const startDateKey = singleDate || filters.startDate || null;
  const endDateKey = singleDate || filters.endDate || null;
  const materialId =
    filters.materialId && filters.materialId !== "all"
      ? filters.materialId
      : undefined;
  const buyerId = filters.buyerId || undefined;
  const contractId = filters.contractId || undefined;

  const startDate = parseJakartaDateBoundary(startDateKey) || undefined;
  const endDate =
    parseJakartaDateBoundary(endDateKey, { endOfDay: true }) || undefined;
  const summaryReferenceDate =
    endDateKey || startDateKey || getDefaultDateString();
  const summaryDate = getJakartaReferenceDate(summaryReferenceDate);
  const periodLabel = getPeriodLabel(startDateKey, endDateKey);
  const exportFileLabel = getExportFileLabel(startDateKey, endDateKey);

  const [company, buyer, contract, material, summary, deliveries] =
    await Promise.all([
      db.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          code: true,
          name: true,
        },
      }),
      buyerId
        ? db.buyer.findFirst({
            where: { id: buyerId, companyId },
            select: {
              id: true,
              code: true,
              name: true,
            },
          })
        : null,
      contractId
        ? db.contract.findFirst({
            where: { id: contractId, companyId },
            select: {
              id: true,
              contractNumber: true,
            },
          })
        : null,
      materialId
        ? db.material.findFirst({
            where: { id: materialId, companyId },
            select: {
              id: true,
              code: true,
              name: true,
            },
          })
        : null,
      pengirimanProductService.getConsolidatedSummary(companyId, {
        ...(singleDate
          ? { date: summaryDate }
          : startDate || endDate
            ? { startDate, endDate }
            : { date: summaryDate }),
        materialId,
        buyerId,
        contractId,
      }),
      pengirimanProductService.getPengirimanProductByCompany(companyId, {
        buyerId,
        contractId,
        materialId,
        startDate,
        endDate,
      }),
    ]);

  const filteredDeliveries = deliveries
    .filter((item) => !contractId || item.contractId === contractId)
    .sort(
      (a, b) =>
        new Date(b.tanggalPengiriman).getTime() -
        new Date(a.tanggalPengiriman).getTime(),
    );

  const deliverySummary = {
    totalRecords: filteredDeliveries.length,
    totalCompleted: filteredDeliveries.filter(
      (item) => item.status === "COMPLETED",
    ).length,
    totalDraft: filteredDeliveries.filter((item) => item.status === "DRAFT")
      .length,
    totalCancelled: filteredDeliveries.filter(
      (item) => item.status === "CANCELLED",
    ).length,
    totalNettoCompleted: filteredDeliveries
      .filter((item) => item.status === "COMPLETED")
      .reduce((sum, item) => sum + (item.beratNetto || 0), 0),
  };

  const normalizedSummary = summary.map((item) => ({
    ...item,
    nomorPo: extractContractField(item.contractCustomFields, "Nomor PO"),
    nomorDo: extractContractField(item.contractCustomFields, "Nomor DO"),
  }));

  return {
    company: {
      code: company?.code || "PT-PKS",
      name: company?.name || "PT TARO RAKAYA TASYRA",
      address: DEFAULT_ADDRESS,
    },
    filters: {
      date: summaryReferenceDate,
      startDate: startDateKey,
      endDate: endDateKey,
      periodLabel,
      exportFileLabel,
      buyerId,
      contractId,
      materialId,
      buyerLabel: buyer ? `${buyer.code} - ${buyer.name}` : "Semua Buyer",
      contractLabel: contract?.contractNumber || "Semua Kontrak",
      materialLabel: material
        ? `${material.code} - ${material.name}`
        : "Semua Produk",
    },
    summary: normalizedSummary,
    deliveries: filteredDeliveries,
    deliverySummary,
  };
}
