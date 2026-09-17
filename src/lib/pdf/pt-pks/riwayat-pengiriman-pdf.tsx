import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import fs from "fs";
import path from "path";

const logoPath = path.join(process.cwd(), "public", "LOGO TRT.png");
let logoBase64 = "";
try {
  const logoBuffer = fs.readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
} catch (error) {
  console.error("Error loading logo:", error);
}

Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

Font.register({
  family: "Roboto-Bold",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    paddingBottom: 34,
    fontSize: 8,
    fontFamily: "Roboto",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    paddingBottom: 10,
  },
  logo: {
    width: 42,
    height: 42,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  companyName: {
    fontSize: 12,
    fontFamily: "Roboto-Bold",
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 8,
    color: "#4b5563",
  },
  title: {
    fontSize: 13,
    fontFamily: "Roboto-Bold",
    textAlign: "center",
    marginBottom: 4,
    textDecoration: "underline",
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#4b5563",
    marginBottom: 12,
  },
  filterGrid: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 8,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  filterLabel: {
    width: "22%",
    fontFamily: "Roboto-Bold",
  },
  filterValue: {
    width: "78%",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statCard: {
    width: "24%",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#f9fafb",
  },
  statLabel: {
    fontSize: 7,
    color: "#6b7280",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 11,
    fontFamily: "Roboto-Bold",
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Roboto-Bold",
    marginBottom: 6,
    marginTop: 6,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableHeader: {
    backgroundColor: "#e5e7eb",
  },
  cell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
    fontSize: 7,
  },
  cellLast: {
    padding: 4,
    fontSize: 7,
  },
  cellHeader: {
    fontFamily: "Roboto-Bold",
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },
  textCenter: {
    textAlign: "center",
  },
  muted: {
    color: "#6b7280",
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 20,
    right: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#d1d5db",
    paddingTop: 4,
    fontSize: 7,
    color: "#6b7280",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emptyState: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 10,
    textAlign: "center",
    color: "#6b7280",
  },
});

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
  nomorPo: string;
  nomorDo: string;
};

type DeliveryItem = {
  id: string;
  nomorPengiriman: string;
  tanggalPengiriman: string | Date;
  beratNetto: number | null;
  status: string;
  operatorPenimbang?: string | null;
  buyer?: { name: string } | null;
  contract?: { contractNumber?: string | null } | null;
  contractItem?: { material?: { name?: string | null } | null } | null;
  vendorVehicle?: {
    nomorKendaraan?: string | null;
    namaSupir?: string | null;
    vendor?: { name?: string | null } | null;
  } | null;
};

type Props = {
  company: {
    name: string;
    address: string;
  };
  filters: {
    date: string;
    startDate?: string | null;
    endDate?: string | null;
    periodLabel: string;
    buyerLabel: string;
    contractLabel: string;
    materialLabel: string;
  };
  summary: SummaryItem[];
  deliveries: DeliveryItem[];
  deliverySummary: {
    totalRecords: number;
    totalCompleted: number;
    totalDraft: number;
    totalCancelled: number;
    totalNettoCompleted: number;
  };
  createdByName?: string;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string | Date) =>
  format(new Date(value), "dd MMM yyyy", { locale: idLocale });

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  COMPLETED: "Selesai",
  CANCELLED: "Batal",
  TIMBANG_TARRA: "Timbang Tarra",
  TIMBANG_GROSS: "Timbang Gross",
};

function SummaryPage({
  company,
  filters,
  summary,
  deliverySummary,
  createdByName,
}: Omit<Props, "deliveries">) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        {logoBase64 ? <Image style={styles.logo} src={logoBase64} /> : null}
        <View style={styles.headerText}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyAddress}>{company.address}</Text>
        </View>
      </View>

      <Text style={styles.title}>LAPORAN RIWAYAT PENGIRIMAN</Text>
      <Text style={styles.subtitle}>Periode: {filters.periodLabel}</Text>

      <View style={styles.filterGrid}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Buyer</Text>
          <Text style={styles.filterValue}>: {filters.buyerLabel}</Text>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Kontrak</Text>
          <Text style={styles.filterValue}>: {filters.contractLabel}</Text>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Produk</Text>
          <Text style={styles.filterValue}>: {filters.materialLabel}</Text>
        </View>
        <View style={[styles.filterRow, { marginBottom: 0 }]}>
          <Text style={styles.filterLabel}>Dicetak Oleh</Text>
          <Text style={styles.filterValue}>: {createdByName || "-"}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rekap Kontrak</Text>
          <Text style={styles.statValue}>{summary.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Detail Pengiriman</Text>
          <Text style={styles.statValue}>{deliverySummary.totalRecords}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pengiriman Selesai</Text>
          <Text style={styles.statValue}>{deliverySummary.totalCompleted}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Netto Selesai (kg)</Text>
          <Text style={styles.statValue}>
            {formatNumber(deliverySummary.totalNettoCompleted)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Rekap Kontrak dan Sisa Pengiriman</Text>
      {summary.length === 0 ? (
        <Text style={styles.emptyState}>
          Tidak ada data rekap kontrak untuk filter ini.
        </Text>
      ) : (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.cellHeader, { width: "5%" }]}>
              No
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "17%" }]}>
              Buyer
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "16%" }]}>
              Kontrak
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "16%" }]}>
              Produk
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "10%" }]}>
              Kontrak
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "10%" }]}>
              Terkirim
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "7%" }]}>
              HI
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "7%" }]}>
              BI
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "7%" }]}>
              TI
            </Text>
            <Text style={[styles.cellLast, styles.cellHeader, { width: "5%" }]}>
              Sisa
            </Text>
          </View>

          {summary.map((item, index) => (
            <View
              key={`${item.contractNumber}-${item.materialCode}-${index}`}
              style={styles.tableRow}
            >
              <Text style={[styles.cell, styles.textCenter, { width: "5%" }]}>
                {index + 1}
              </Text>
              <Text style={[styles.cell, { width: "17%" }]}>
                {item.buyerName}
              </Text>
              <Text style={[styles.cell, { width: "16%" }]}>
                {item.contractNumber}
                {"\n"}
                <Text style={styles.muted}>PO: {item.nomorPo}</Text>
              </Text>
              <Text style={[styles.cell, { width: "16%" }]}>
                {item.materialName}
                {"\n"}
                <Text style={styles.muted}>{item.materialCode}</Text>
              </Text>
              <Text style={[styles.cell, styles.textRight, { width: "10%" }]}>
                {formatNumber(item.contractQuantity)}
              </Text>
              <Text style={[styles.cell, styles.textRight, { width: "10%" }]}>
                {formatNumber(item.deliveredQuantity)}
              </Text>
              <Text style={[styles.cell, styles.textRight, { width: "7%" }]}>
                {formatNumber(item.hi)}
              </Text>
              <Text style={[styles.cell, styles.textRight, { width: "7%" }]}>
                {formatNumber(item.bi)}
              </Text>
              <Text style={[styles.cell, styles.textRight, { width: "7%" }]}>
                {formatNumber(item.ti)}
              </Text>
              <Text
                style={[styles.cellLast, styles.textRight, { width: "5%" }]}
              >
                {formatNumber(item.remaining)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text>
          Dicetak:{" "}
          {format(new Date(), "dd MMM yyyy HH:mm", { locale: idLocale })}
        </Text>
        <Text>HT Group App</Text>
      </View>
    </Page>
  );
}

function DetailPage({
  company,
  deliveries,
}: Pick<Props, "company" | "deliveries">) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        {logoBase64 ? <Image style={styles.logo} src={logoBase64} /> : null}
        <View style={styles.headerText}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyAddress}>{company.address}</Text>
        </View>
      </View>

      <Text style={styles.title}>DETAIL PENGIRIMAN</Text>
      <Text style={styles.subtitle}>
        Daftar pengiriman sesuai filter riwayat pengiriman
      </Text>

      {deliveries.length === 0 ? (
        <Text style={styles.emptyState}>
          Tidak ada detail pengiriman pada filter ini.
        </Text>
      ) : (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.cellHeader, { width: "5%" }]}>
              No
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "16%" }]}>
              No. Pengiriman
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "10%" }]}>
              Tanggal
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "15%" }]}>
              Buyer
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "16%" }]}>
              Produk
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "10%" }]}>
              Netto
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "11%" }]}>
              Kendaraan
            </Text>
            <Text style={[styles.cell, styles.cellHeader, { width: "9%" }]}>
              Supir
            </Text>
            <Text style={[styles.cellLast, styles.cellHeader, { width: "8%" }]}>
              Status
            </Text>
          </View>

          {deliveries.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.cell, styles.textCenter, { width: "5%" }]}>
                {index + 1}
              </Text>
              <Text style={[styles.cell, { width: "16%" }]}>
                {item.nomorPengiriman}
                {"\n"}
                <Text style={styles.muted}>
                  {item.contract?.contractNumber || "-"}
                </Text>
              </Text>
              <Text style={[styles.cell, styles.textCenter, { width: "10%" }]}>
                {formatDate(item.tanggalPengiriman)}
              </Text>
              <Text style={[styles.cell, { width: "15%" }]}>
                {item.buyer?.name || "-"}
              </Text>
              <Text style={[styles.cell, { width: "16%" }]}>
                {item.contractItem?.material?.name || "-"}
              </Text>
              <Text style={[styles.cell, styles.textRight, { width: "10%" }]}>
                {formatNumber(item.beratNetto || 0)}
              </Text>
              <Text style={[styles.cell, { width: "11%" }]}>
                {item.vendorVehicle?.nomorKendaraan || "-"}
                {"\n"}
                <Text style={styles.muted}>
                  {item.vendorVehicle?.vendor?.name || "-"}
                </Text>
              </Text>
              <Text style={[styles.cell, { width: "9%" }]}>
                {item.vendorVehicle?.namaSupir || "-"}
              </Text>
              <Text
                style={[styles.cellLast, styles.textCenter, { width: "8%" }]}
              >
                {statusLabels[item.status] || item.status}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text>
          Dicetak:{" "}
          {format(new Date(), "dd MMM yyyy HH:mm", { locale: idLocale })}
        </Text>
        <Text>HT Group App</Text>
      </View>
    </Page>
  );
}

export const RiwayatPengirimanDocument: React.FC<Props> = (props) => (
  <Document>
    <SummaryPage
      company={props.company}
      filters={props.filters}
      summary={props.summary}
      deliverySummary={props.deliverySummary}
      createdByName={props.createdByName}
    />
    <DetailPage company={props.company} deliveries={props.deliveries} />
  </Document>
);
