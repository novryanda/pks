import React from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { COMPANY_NAME, getLogoBase64 } from "@/lib/pdf/logo";
import { formatDateTimeInJakarta } from "@/lib/date-time";

type StockMovementReportItem = {
  id: string;
  tipeMovement: "IN" | "OUT" | "ADJUSTMENT";
  jumlah: number;
  stockSebelum: number;
  stockSesudah: number;
  referensi: string | null;
  keterangan: string | null;
  operator: string;
  tanggalTransaksi: string;
  material: {
    code: string;
    name: string;
    satuan: {
      symbol: string;
    };
  };
};

type StockMovementReportPDFProps = {
  data: StockMovementReportItem[];
  startDate?: string;
  endDate?: string;
  materialLabel?: string;
  typeLabel?: string;
  search?: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
    paddingBottom: 10,
    marginBottom: 12,
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  companyName: {
    fontSize: 13,
    fontWeight: 700,
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    color: "#52525b",
    marginBottom: 10,
  },
  metaBox: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
    gap: 3,
  },
  metaText: {
    fontSize: 8,
    color: "#3f3f46",
  },
  table: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  tableHeader: {
    backgroundColor: "#f4f4f5",
  },
  cell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#e4e4e7",
  },
  cellLast: {
    borderRightWidth: 0,
  },
  headerText: {
    fontSize: 7,
    fontWeight: 700,
    textAlign: "center",
  },
  bodyText: {
    fontSize: 7,
  },
  bodyTextRight: {
    fontSize: 7,
    textAlign: "right",
  },
  emptyText: {
    padding: 10,
    textAlign: "center",
    color: "#71717a",
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    paddingHorizontal: 34,
  },
  signatureBox: {
    width: "28%",
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 42,
  },
  signatureName: {
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
  },
  signatureRole: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 2,
  },
  footer: {
    marginTop: 10,
    textAlign: "right",
    fontSize: 8,
    color: "#71717a",
  },
});

const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const getPeriodText = (startDate?: string, endDate?: string) => {
  if (startDate && endDate) {
    return `Periode: ${format(new Date(startDate), "dd MMMM yyyy", { locale: idLocale })} - ${format(new Date(endDate), "dd MMMM yyyy", { locale: idLocale })}`;
  }

  if (startDate) {
    return `Mulai: ${format(new Date(startDate), "dd MMMM yyyy", { locale: idLocale })}`;
  }

  if (endDate) {
    return `Sampai: ${format(new Date(endDate), "dd MMMM yyyy", { locale: idLocale })}`;
  }

  return "Semua Periode";
};

function StockMovementReportDocument({
  data,
  startDate,
  endDate,
  materialLabel,
  typeLabel,
  search,
}: StockMovementReportPDFProps) {
  const logoBase64 = getLogoBase64();

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          {logoBase64 ? <Image style={styles.logo} src={logoBase64} /> : null}
          <View>
            <Text style={styles.companyName}>{COMPANY_NAME}</Text>
            <Text style={styles.metaText}>JL LINTAS LANGGAM KM. 3 DESA LUBUK OGONG</Text>
          </View>
        </View>

        <Text style={styles.title}>LAPORAN STOCK MOVEMENT</Text>
        <Text style={styles.subtitle}>{getPeriodText(startDate, endDate)}</Text>

        <View style={styles.metaBox}>
          <Text style={styles.metaText}>Material: {materialLabel || "Semua Material"}</Text>
          <Text style={styles.metaText}>Tipe Movement: {typeLabel || "Semua Tipe"}</Text>
          <Text style={styles.metaText}>Pencarian: {search?.trim() || "-"}</Text>
          <Text style={styles.metaText}>Total Data: {data.length}</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.cell, { width: "14%" }]}>
              <Text style={styles.headerText}>Tanggal</Text>
            </View>
            <View style={[styles.cell, { width: "19%" }]}>
              <Text style={styles.headerText}>Material</Text>
            </View>
            <View style={[styles.cell, { width: "8%" }]}>
              <Text style={styles.headerText}>Tipe</Text>
            </View>
            <View style={[styles.cell, { width: "9%" }]}>
              <Text style={styles.headerText}>Jumlah</Text>
            </View>
            <View style={[styles.cell, { width: "10%" }]}>
              <Text style={styles.headerText}>Stock Sebelum</Text>
            </View>
            <View style={[styles.cell, { width: "10%" }]}>
              <Text style={styles.headerText}>Stock Sesudah</Text>
            </View>
            <View style={[styles.cell, { width: "12%" }]}>
              <Text style={styles.headerText}>Referensi</Text>
            </View>
            <View style={[styles.cell, { width: "8%" }]}>
              <Text style={styles.headerText}>Operator</Text>
            </View>
            <View style={[styles.cell, styles.cellLast, { width: "10%" }]}>
              <Text style={styles.headerText}>Keterangan</Text>
            </View>
          </View>
          {data.length === 0 ? (
            <Text style={styles.emptyText}>Tidak ada data stock movement pada filter ini.</Text>
          ) : (
            data.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <View style={[styles.cell, { width: "14%" }]}>
                  <Text style={styles.bodyText}>
                    {formatDateTimeInJakarta(item.tanggalTransaksi, {
                      fallback: item.tanggalTransaksi,
                    })}
                  </Text>
                </View>
                <View style={[styles.cell, { width: "19%" }]}>
                  <Text style={styles.bodyText}>{item.material.code}</Text>
                  <Text style={styles.bodyText}>{item.material.name}</Text>
                </View>
                <View style={[styles.cell, { width: "8%" }]}>
                  <Text style={styles.bodyText}>{item.tipeMovement}</Text>
                </View>
                <View style={[styles.cell, { width: "9%" }]}>
                  <Text style={styles.bodyTextRight}>
                    {formatNumber(item.jumlah)} {item.material.satuan.symbol}
                  </Text>
                </View>
                <View style={[styles.cell, { width: "10%" }]}>
                  <Text style={styles.bodyTextRight}>
                    {formatNumber(item.stockSebelum)} {item.material.satuan.symbol}
                  </Text>
                </View>
                <View style={[styles.cell, { width: "10%" }]}>
                  <Text style={styles.bodyTextRight}>
                    {formatNumber(item.stockSesudah)} {item.material.satuan.symbol}
                  </Text>
                </View>
                <View style={[styles.cell, { width: "12%" }]}>
                  <Text style={styles.bodyText}>{item.referensi || "-"}</Text>
                </View>
                <View style={[styles.cell, { width: "8%" }]}>
                  <Text style={styles.bodyText}>{item.operator}</Text>
                </View>
                <View style={[styles.cell, styles.cellLast, { width: "10%" }]}>
                  <Text style={styles.bodyText}>{item.keterangan || "-"}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Dibuat Oleh</Text>
            <Text style={styles.signatureName}>Febri Khairul</Text>
            <Text style={styles.signatureRole}>K.A Gudang</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Diperiksa Oleh</Text>
            <Text style={styles.signatureName}>Fajriyan</Text>
            <Text style={styles.signatureRole}>KTU</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Disetujui Oleh</Text>
            <Text style={styles.signatureName}>Boslen Tambah</Text>
            <Text style={styles.signatureRole}>Mill Manager</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Dicetak {format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })}
        </Text>
      </Page>
    </Document>
  );
}

export async function downloadStockMovementReportPDF(
  props: StockMovementReportPDFProps
) {
  const blob = await pdf(<StockMovementReportDocument {...props} />).toBlob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `stock-movement-${props.startDate || "all"}-${props.endDate || "all"}.pdf`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
}
