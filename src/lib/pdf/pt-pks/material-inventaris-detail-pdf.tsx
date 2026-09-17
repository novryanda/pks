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

type MaterialInventarisPDFMaterial = {
  partNumber: string;
  namaMaterial: string;
  kategoriMaterial: {
    name: string;
  };
  satuanMaterial: {
    name: string;
    symbol: string;
  };
  lokasiDigunakan?: string;
  spesifikasi?: string;
  stockOnHand: number;
  minStock: number;
  maxStock: number;
  hargaSatuan: number;
};

type MaterialInventarisPDFTransaction = {
  id: string;
  tanggalTransaksi: string;
  tipeTransaksi: "IN" | "OUT" | "ADJUSTMENT";
  referensi?: string;
  jumlahMasuk: number;
  jumlahKeluar: number;
  stockOnHand: number;
  hargaSatuan: number;
  totalHarga: number;
  keterangan?: string;
  operator: string;
  requestedBy?: string | null;
};

type MaterialInventarisDetailPDFProps = {
  material: MaterialInventarisPDFMaterial;
  transactions: MaterialInventarisPDFTransaction[];
  startDate?: string;
  endDate?: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
    paddingBottom: 10,
    marginBottom: 14,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
  },
  companyAddress: {
    fontSize: 9,
    color: "#52525b",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    color: "#52525b",
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  infoBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    padding: 6,
  },
  infoLabel: {
    fontSize: 8,
    color: "#71717a",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 700,
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
    justifyContent: "center",
  },
  cellLast: {
    borderRightWidth: 0,
  },
  headerText: {
    fontSize: 8,
    fontWeight: 700,
    textAlign: "center",
  },
  bodyText: {
    fontSize: 8,
  },
  bodyTextRight: {
    fontSize: 8,
    textAlign: "right",
  },
  emptyText: {
    padding: 10,
    textAlign: "center",
    color: "#71717a",
  },
  footer: {
    marginTop: 12,
    fontSize: 8,
    color: "#71717a",
    textAlign: "right",
  },
});

const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
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

const getTransactionPerson = (transaction: MaterialInventarisPDFTransaction) =>
  transaction.tipeTransaksi === "OUT"
    ? transaction.requestedBy || transaction.operator
    : transaction.operator;

function MaterialInventarisDetailDocument({
  material,
  transactions,
  startDate,
  endDate,
}: MaterialInventarisDetailPDFProps) {
  const logoBase64 = getLogoBase64();
  const totalMasuk = transactions.reduce((sum, item) => sum + item.jumlahMasuk, 0);
  const totalKeluar = transactions.reduce((sum, item) => sum + item.jumlahKeluar, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logoBase64 ? <Image style={styles.logo} src={logoBase64} /> : null}
          <View>
            <Text style={styles.companyName}>{COMPANY_NAME}</Text>
            <Text style={styles.companyAddress}>JL LINTAS LANGGAM KM. 3 DESA LUBUK OGONG</Text>
          </View>
        </View>

        <Text style={styles.title}>DETAIL MATERIAL INVENTARIS</Text>
        <Text style={styles.subtitle}>{getPeriodText(startDate, endDate)}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Material</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Part Number</Text>
              <Text style={styles.infoValue}>{material.partNumber}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Nama Material</Text>
              <Text style={styles.infoValue}>{material.namaMaterial}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Kategori</Text>
              <Text style={styles.infoValue}>{material.kategoriMaterial.name}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Satuan</Text>
              <Text style={styles.infoValue}>
                {material.satuanMaterial.name} ({material.satuanMaterial.symbol})
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Lokasi</Text>
              <Text style={styles.infoValue}>{material.lokasiDigunakan || "-"}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Harga Satuan</Text>
              <Text style={styles.infoValue}>{formatCurrency(material.hargaSatuan || 0)}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Stock On Hand</Text>
              <Text style={styles.infoValue}>
                {formatNumber(material.stockOnHand)} {material.satuanMaterial.symbol}
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Total Nilai Stock</Text>
              <Text style={styles.infoValue}>
                {formatCurrency((material.stockOnHand || 0) * (material.hargaSatuan || 0))}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Periode</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Total Masuk</Text>
              <Text style={styles.infoValue}>
                {formatNumber(totalMasuk)} {material.satuanMaterial.symbol}
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Total Keluar</Text>
              <Text style={styles.infoValue}>
                {formatNumber(totalKeluar)} {material.satuanMaterial.symbol}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={[styles.cell, { width: "19%" }]}>
                <Text style={styles.headerText}>Tanggal</Text>
              </View>
              <View style={[styles.cell, { width: "10%" }]}>
                <Text style={styles.headerText}>Tipe</Text>
              </View>
              <View style={[styles.cell, { width: "17%" }]}>
                <Text style={styles.headerText}>Referensi</Text>
              </View>
              <View style={[styles.cell, { width: "10%" }]}>
                <Text style={styles.headerText}>Masuk</Text>
              </View>
              <View style={[styles.cell, { width: "10%" }]}>
                <Text style={styles.headerText}>Keluar</Text>
              </View>
              <View style={[styles.cell, { width: "10%" }]}>
                <Text style={styles.headerText}>Stock</Text>
              </View>
              <View style={[styles.cell, { width: "12%" }]}>
                <Text style={styles.headerText}>Harga</Text>
              </View>
              <View style={[styles.cell, styles.cellLast, { width: "12%" }]}>
                <Text style={styles.headerText}>Pemohon/Operator</Text>
              </View>
            </View>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>Tidak ada transaksi pada periode ini.</Text>
            ) : (
              transactions.map((transaction) => (
                <View key={transaction.id} style={styles.tableRow}>
                  <View style={[styles.cell, { width: "19%" }]}>
                    <Text style={styles.bodyText}>
                      {formatDateTimeInJakarta(transaction.tanggalTransaksi, {
                        fallback: transaction.tanggalTransaksi,
                      })}
                    </Text>
                  </View>
                  <View style={[styles.cell, { width: "10%" }]}>
                    <Text style={styles.bodyText}>{transaction.tipeTransaksi}</Text>
                  </View>
                  <View style={[styles.cell, { width: "17%" }]}>
                    <Text style={styles.bodyText}>{transaction.referensi || "-"}</Text>
                  </View>
                  <View style={[styles.cell, { width: "10%" }]}>
                    <Text style={styles.bodyTextRight}>
                      {transaction.jumlahMasuk > 0 ? formatNumber(transaction.jumlahMasuk) : "-"}
                    </Text>
                  </View>
                  <View style={[styles.cell, { width: "10%" }]}>
                    <Text style={styles.bodyTextRight}>
                      {transaction.jumlahKeluar > 0 ? formatNumber(transaction.jumlahKeluar) : "-"}
                    </Text>
                  </View>
                  <View style={[styles.cell, { width: "10%" }]}>
                    <Text style={styles.bodyTextRight}>{formatNumber(transaction.stockOnHand)}</Text>
                  </View>
                  <View style={[styles.cell, { width: "12%" }]}>
                    <Text style={styles.bodyTextRight}>{formatCurrency(transaction.hargaSatuan || 0)}</Text>
                  </View>
                  <View style={[styles.cell, styles.cellLast, { width: "12%" }]}>
                    <Text style={styles.bodyText}>{getTransactionPerson(transaction)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <Text style={styles.footer}>
          Dicetak {format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })}
        </Text>
      </Page>
    </Document>
  );
}

export async function downloadMaterialInventarisDetailPDF(
  props: MaterialInventarisDetailPDFProps
) {
  const blob = await pdf(<MaterialInventarisDetailDocument {...props} />).toBlob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `material-inventaris-${props.material.partNumber}-${props.startDate || "all"}-${props.endDate || "all"}.pdf`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
}
