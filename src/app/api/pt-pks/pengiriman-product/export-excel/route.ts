import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { parseJakartaDateBoundary } from "@/lib/date-time";
import { pengirimanProductService } from "@/server/services/pt-pks/pengiriman-product.service";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type CustomField = {
  fieldName: string;
  fieldValue: string;
};

type PengirimanExportFilters = {
  status?: string;
  buyerId?: string;
  contractId?: string;
  materialId?: string;
  startDate?: Date;
  endDate?: Date;
};

type PengirimanExportItem = {
  nomorPengiriman: string;
  tanggalPengiriman: string | Date;
  waktuTimbangTarra?: string | Date | null;
  waktuTimbangGross?: string | Date | null;
  buyer?: {
    name?: string | null;
    address?: string | null;
  } | null;
  contract?: {
    contractNumber?: string | null;
    customFields?: unknown;
  } | null;
  contractItem?: {
    material?: {
      name?: string | null;
      satuan?: {
        symbol?: string | null;
      } | null;
    } | null;
  } | null;
  vendorVehicle: {
    nomorKendaraan?: string | null;
    namaSupir?: string | null;
    noHpSupir?: string | null;
    noSim?: string | null;
    vendor: {
      name?: string | null;
    };
  };
  beratGross?: number | null;
  beratTarra?: number | null;
  beratNetto?: number | null;
  noSegel?: string | null;
  ffa?: string | number | null;
  air?: string | number | null;
  kotoran?: string | number | null;
  mutuCustomFields?: unknown;
  operatorPenimbang?: string | null;
  status?: string | null;
};

function toCustomFieldArray(value: unknown): CustomField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is CustomField => {
    if (typeof item !== "object" || item === null) {
      return false;
    }

    const field = item as Record<string, unknown>;
    return (
      typeof field.fieldName === "string" &&
      typeof field.fieldValue === "string"
    );
  });
}

function findFieldValue(fields: CustomField[], keywords: string[]) {
  return fields.find((field) =>
    keywords.every((keyword) =>
      field.fieldName.toLowerCase().includes(keyword.toLowerCase()),
    ),
  )?.fieldValue;
}

function findFieldValueByAlternatives(
  fields: CustomField[],
  alternatives: string[][],
) {
  for (const keywords of alternatives) {
    const value = findFieldValue(fields, keywords);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function getSpecificSealValue(
  mutuFields: CustomField[],
  fieldName: string,
  fallback?: string | null,
) {
  const normalizedFieldName = fieldName.trim().toLowerCase();
  const exactMatch = mutuFields.find(
    (field) => field.fieldName.trim().toLowerCase() === normalizedFieldName,
  )?.fieldValue;

  if (exactMatch) {
    return exactMatch;
  }

  return (
    (fallback && normalizedFieldName === "nomor segel"
      ? fallback
      : undefined) ?? "-"
  );
}

function formatTime(value?: string | Date | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function getMutuOptionValue(mutuFields: CustomField[], option: string) {
  const lowerOption = option.toLowerCase();

  const exactMatch = mutuFields.find(
    (field) => field.fieldName.trim().toLowerCase() === lowerOption,
  );
  if (exactMatch) {
    return exactMatch.fieldValue;
  }

  const containsMatch = mutuFields.find((field) =>
    field.fieldName.toLowerCase().includes(lowerOption),
  );
  if (containsMatch) {
    return containsMatch.fieldValue;
  }

  return "-";
}

function getSuratPengantarNumber(
  nomorPengiriman: string,
  tanggalPengiriman: string | Date,
  materialName?: string | null,
) {
  const normalizedMaterialName = materialName?.toUpperCase() ?? "";
  let productLabel = "CPO";

  if (normalizedMaterialName.includes("KERNEL")) {
    productLabel = "KERNEL";
  } else if (normalizedMaterialName.includes("CANGKANG")) {
    productLabel = "CANGKANG";
  } else if (normalizedMaterialName.includes("CPO")) {
    productLabel = "CPO";
  } else if (normalizedMaterialName.includes("FIBER")) {
    productLabel = "FIBER";
  }

  const romanMonths = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  const dateObj = tanggalPengiriman ? new Date(tanggalPengiriman) : new Date();
  const monthRoman =
    romanMonths[dateObj.getMonth()] ?? romanMonths[new Date().getMonth()];
  const year = dateObj.getFullYear();

  let sequence = "001";
  const parts = nomorPengiriman.split("-");
  const lastPart = parts[parts.length - 1];

  if (lastPart && lastPart.length >= 3) {
    sequence = lastPart.slice(-3);
  }

  return `${sequence}/TRT/PKS-LO/${productLabel}/${monthRoman}/${year}`;
}

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuthWithPermission(
    "pemasaran.pengirimanProduct",
    "view",
  );
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const buyerId = searchParams.get("buyerId");
    const contractId = searchParams.get("contractId");
    const materialId = searchParams.get("materialId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let pengirimanList: PengirimanExportItem[] = [];

    if (id) {
      const pengiriman =
        await pengirimanProductService.getPengirimanProductById(id);
      if (pengiriman) {
        pengirimanList = [pengiriman as PengirimanExportItem];
      }
    } else {
      const filters: PengirimanExportFilters = {};
      if (status) filters.status = status;
      if (buyerId) filters.buyerId = buyerId;
      if (contractId) filters.contractId = contractId;
      if (materialId) filters.materialId = materialId;
      if (date) {
        const start = parseJakartaDateBoundary(date);
        const end = parseJakartaDateBoundary(date, { endOfDay: true });
        if (start) {
          filters.startDate = start;
        }
        if (end) {
          filters.endDate = end;
        }
      } else {
        const parsedStartDate = parseJakartaDateBoundary(startDate);
        const parsedEndDate = parseJakartaDateBoundary(endDate, {
          endOfDay: true,
        });
        if (parsedStartDate) {
          filters.startDate = parsedStartDate;
        }
        if (parsedEndDate) {
          filters.endDate = parsedEndDate;
        }
      }

      pengirimanList =
        (await pengirimanProductService.getPengirimanProductByCompany(
          companyId,
          filters,
        )) as PengirimanExportItem[];
    }

    if (pengirimanList.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    const data = pengirimanList.map((pengiriman) => {
      const contractFields = toCustomFieldArray(
        pengiriman.contract?.customFields,
      );
      const mutuFields = toCustomFieldArray(pengiriman.mutuCustomFields);

      const poNum =
        findFieldValueByAlternatives(contractFields, [
          ["nomor", "po"],
          ["no", "po"],
          ["po"],
        ]) ?? "-";
      const doNum =
        findFieldValueByAlternatives(contractFields, [
          ["nomor", "do"],
          ["no", "do"],
          ["do"],
        ]) ?? "-";
      const nomorSpb = getSuratPengantarNumber(
        pengiriman.nomorPengiriman,
        pengiriman.tanggalPengiriman,
        pengiriman.contractItem?.material?.name,
      );
      const nomorSegel = getSpecificSealValue(
        mutuFields,
        "Nomor Segel",
        pengiriman.noSegel,
      );
      const nomorSegelAtas = getSpecificSealValue(
        mutuFields,
        "Nomor Segel Atas",
      );
      const nomorSegelBawah = getSpecificSealValue(
        mutuFields,
        "Nomor Segel Bawah",
      );

      const ffa = getMutuOptionValue(mutuFields, "FFA");
      const mi = getMutuOptionValue(mutuFields, "M&I");
      const dobi = getMutuOptionValue(mutuFields, "Dobi");
      const suhu = getMutuOptionValue(mutuFields, "Suhu");
      const air =
        getMutuOptionValue(mutuFields, "Air") !== "-"
          ? getMutuOptionValue(mutuFields, "Air")
          : (pengiriman.air?.toString() ?? "-");
      const kotoran =
        getMutuOptionValue(mutuFields, "Kotoran") !== "-"
          ? getMutuOptionValue(mutuFields, "Kotoran")
          : (pengiriman.kotoran?.toString() ?? "-");

      return {
        "No. Tiket": pengiriman.nomorPengiriman,
        Tanggal: format(new Date(pengiriman.tanggalPengiriman), "dd MMM yyyy", {
          locale: idLocale,
        }),
        "Jam Masuk": formatTime(pengiriman.waktuTimbangTarra),
        "Jam Keluar": formatTime(pengiriman.waktuTimbangGross),
        Buyer: pengiriman.buyer?.name ?? "-",
        "Alamat Buyer": pengiriman.buyer?.address ?? "-",
        "No. Kontrak": pengiriman.contract?.contractNumber ?? "-",
        "No. PO": poNum,
        "No. DO": doNum,
        "No. SPB": nomorSpb,
        Produk: pengiriman.contractItem?.material?.name ?? "-",
        Satuan: pengiriman.contractItem?.material?.satuan?.symbol ?? "kg",
        Vendor: pengiriman.vendorVehicle.vendor.name ?? "-",
        Kendaraan: pengiriman.vendorVehicle.nomorKendaraan ?? "-",
        "Nama Supir": pengiriman.vendorVehicle.namaSupir ?? "-",
        "No. HP Supir": pengiriman.vendorVehicle.noHpSupir ?? "-",
        "No. SIM Supir": pengiriman.vendorVehicle.noSim ?? "-",
        "Nomor Segel": nomorSegel,
        "Nomor Segel Atas": nomorSegelAtas,
        "Nomor Segel Bawah": nomorSegelBawah,
        "Berat Gross (kg)": pengiriman.beratGross ?? 0,
        "Berat Tarra (kg)": pengiriman.beratTarra ?? 0,
        "Berat Netto (kg)": pengiriman.beratNetto ?? 0,
        FFA: ffa,
        "M&I": mi,
        Dobi: dobi,
        Suhu: suhu,
        Air: air,
        Kotoran: kotoran,
        Operator: pengiriman.operatorPenimbang ?? "-",
        Status: pengiriman.status ?? "-",
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 40 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Pengiriman Product");

    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;

    const filename = id
      ? `Surat-Pengantar-${pengirimanList[0]?.nomorPengiriman ?? "Pengiriman"}.xlsx`
      : `Laporan-Pengiriman-Product-${format(new Date(), "yyyyMMdd")}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
