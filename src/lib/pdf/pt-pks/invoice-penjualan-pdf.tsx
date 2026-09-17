import React from "react";
import {
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getLogoBase64, COMPANY_NAME } from "../logo";

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf" },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: "bold" },
  ],
});

// Company Address Info
const COMPANY_ADDRESS = "Jalan Maharaja Indra, Kelurahan Pangkalan Kerinci Timur";
const COMPANY_DISTRICT = "Kecamatan Pangkalan Kerinci, Kabupaten Pelalawan";
const COMPANY_PROVINCE = "Provinsi Riau, Kode Pos: 28381";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: "Roboto",
    backgroundColor: "#ffffff",
  },
  // Header Section
  header: {
    position: "relative",
    marginBottom: 10,
    alignItems: "center",
    paddingTop: 5,
  },
  logo: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 70,
    height: 70,
  },
  headerCenter: {
    width: "100%",
    alignItems: "center",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a5f",
    textAlign: "center",
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 10,
    color: "#374151",
    textAlign: "center",
    lineHeight: 1.5,
  },
  // Invoice Title
  invoiceTitle: {
    textAlign: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000000",
    paddingVertical: 6,
    marginBottom: 10,
    marginTop: 10,
  },
  invoiceTitleText: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  // Invoice Info Section
  invoiceInfoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  invoiceInfoLeft: {
    flex: 1,
  },
  invoiceInfoRight: {
    width: 150,
    alignItems: "flex-end",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    width: 80,
    fontSize: 8,
    color: "#374151",
  },
  infoLabelColon: {
    width: 10,
    fontSize: 8,
    color: "#374151",
  },
  infoValue: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
  },
  dateText: {
    fontSize: 8,
    color: "#374151",
  },
  // Detail Box
  detailBox: {
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 10,
    padding: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  detailLabel: {
    width: 80,
    fontSize: 8,
    color: "#374151",
  },
  detailLabelColon: {
    width: 10,
    fontSize: 8,
  },
  detailValue: {
    flex: 1,
    fontSize: 8,
    color: "#000000",
  },
  // Table
  table: {
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    justifyContent: "center",
  },
  tableCellLast: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 8,
    justifyContent: "center",
  },
  tableCellHeader: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#000000",
  },
  tableCellHeaderLast: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  colNo: { width: 25 },
  colDesc: { width: 170, flex: 1 },
  colUnit: { width: 40 },
  colQty: { width: 60 },
  colHarga: { width: 50 },
  colSatuan: { width: 50 },
  colAmount: { width: 90 },
  textCenter: { textAlign: "center" },
  textRight: { textAlign: "right" },
  // Summary Section
  summarySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  summaryBox: {
    width: 250,
  },
  summaryRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#000000",
  },
  summaryRowFirst: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000000",
  },
  summaryLabel: {
    width: 120,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: "#000000",
  },
  summaryValue: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 8,
    textAlign: "right",
    fontWeight: "bold",
  },
  // PPN Disclaimer
  ppnDisclaimer: {
    fontSize: 7,
    color: "#6b7280",
    marginBottom: 15,
  },
  // Note Section
  noteSection: {
    marginTop: 15,
    flexDirection: "row",
  },
  noteContent: {
    flex: 1,
  },
  noteLabel: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
  },
  noteText: {
    fontSize: 8,
    color: "#374151",
    lineHeight: 1.4,
  },
  // Stamp Section
  stampSection: {
    width: 120,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  stamp: {
    width: 80,
    height: 80,
  },
  // Watermark
  watermark: {
    position: "absolute",
    top: "40%",
    left: "20%",
    fontSize: 60,
    fontWeight: "bold",
    color: "#fca5a5",
    opacity: 0.3,
    transform: "rotate(-30deg)",
  },
});

// Types
export type InvoicePenjualanItem = {
  id: string;
  nomorPengiriman: string;
  tanggalPengiriman: string | null;
  beratNetto: number;
  nomorKendaraan: string | null;
  namaDriver: string | null;
  vendorName: string | null;
};

export type PembayaranItem = {
  id: string;
  tanggalBayar: string;
  jumlahBayar: number;
  metodePembayaran: string | null;
  nomorReferensi: string | null;
};

export type InvoicePenjualanPDFData = {
  nomorInvoice: string;
  tanggalInvoice: string;
  tanggalJatuhTempo: string | null;
  status: string;
  buyer: {
    name: string;
    code: string;
    alamat: string | null;
    telepon: string | null;
    npwp: string | null;
  };
  contract: {
    contractNumber: string;
    materialName: string;
    hargaPerKg: number;
  };
  items: InvoicePenjualanItem[];
  totalBerat: number;
  hargaPerKg: number;
  subtotalBruto: number;
  klaimMutuPersen: number;
  klaimMutuNilai: number;
  klaimSusutPersen: number;
  klaimSusutNilai: number;
  totalPotongan: number;
  subtotalNetto: number;
  ppnPersen: number;
  ppnNilai: number;
  pphPersen: number;
  pphNilai: number;
  totalNilai: number;
  totalDibayar: number;
  sisaPembayaran: number;
  pembayaran: PembayaranItem[];
  catatan: string | null;
  showPpnDisclaimer?: boolean;
  namaPenandatangan?: string | null;
  jabatanPenandatangan?: string | null;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.round(value));
}

function formatNumber(value: number, maxDecimals = 2): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "d MMMM yyyy", { locale: idLocale });
  } catch {
    return dateStr;
  }
}

export function InvoicePenjualanPDF({ data }: { data: InvoicePenjualanPDFData }) {
  const logoBase64 = getLogoBase64();

  // Group items by material for the table display
  // For now, we'll show each delivery as a line item
  // Create summary rows: Material + Pengurangan untuk Klaim Susut (if any)

  const subtotalAmount = data.subtotalBruto;
  const ppnAmount = data.ppnNilai;
  const totalBeforePpn = subtotalAmount;
  const totalWithPpn = data.totalNilai;

  return (
    <Page size="A4" style={styles.page}>
      {/* Watermark for cancelled */}
      {data.status === "CANCELLED" && (
        <Text style={styles.watermark}>DIBATALKAN</Text>
      )}

      {/* Header */}
      <View style={styles.header}>
        {logoBase64 && <Image style={styles.logo} src={logoBase64} />}
        <View style={styles.headerCenter}>
          <Text style={styles.companyName}>{COMPANY_NAME}</Text>
          <Text style={styles.companyAddress}>
            {COMPANY_ADDRESS}
          </Text>
          <Text style={styles.companyAddress}>
            {COMPANY_DISTRICT}
          </Text>
          <Text style={styles.companyAddress}>
            {COMPANY_PROVINCE}
          </Text>
        </View>
      </View>

      {/* Invoice Title */}
      <View style={styles.invoiceTitle}>
        <Text style={styles.invoiceTitleText}>INVOICE</Text>
      </View>

      {/* Invoice Info */}
      <View style={styles.invoiceInfoSection}>
        <View style={styles.invoiceInfoLeft}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Invoice Number</Text>
            <Text style={styles.infoLabelColon}>:</Text>
            <Text style={styles.infoValue}>{data.nomorInvoice}</Text>
          </View>
        </View>
        <View style={styles.invoiceInfoRight}>
          <Text style={styles.dateText}>Date : {formatDate(data.tanggalInvoice)}</Text>
        </View>
      </View>

      {/* Detail Box - Kepada, Alamat, No Kontrak, No NPVP */}
      <View style={styles.detailBox}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kepada</Text>
          <Text style={styles.detailLabelColon}>:</Text>
          <Text style={styles.detailValue}>{data.buyer.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Alamat</Text>
          <Text style={styles.detailLabelColon}>:</Text>
          <Text style={styles.detailValue}>{data.buyer.alamat || "-"}</Text>
        </View>
        <View style={{ height: 8 }} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>No Kontrak</Text>
          <Text style={styles.detailLabelColon}>:</Text>
          <Text style={styles.detailValue}>{data.contract.contractNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>No. NPWP</Text>
          <Text style={styles.detailLabelColon}>:</Text>
          <Text style={styles.detailValue}>{data.buyer.npwp || "-"}</Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, styles.colNo]}>NO</Text>
          <Text style={[styles.tableCellHeader, styles.colDesc]}>DESCRIPTION</Text>
          <Text style={[styles.tableCellHeader, styles.colUnit]}>UNIT</Text>
          <Text style={[styles.tableCellHeader, styles.colQty]}>QTY</Text>
          <Text style={[styles.tableCellHeader, styles.colHarga]}>HARGA</Text>
          <Text style={[styles.tableCellHeader, styles.colSatuan]}>SATUAN</Text>
          <Text style={[styles.tableCellHeaderLast, styles.colAmount]}>AMOUNT (IDR)</Text>
        </View>

        {/* Main Item Row - Material */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.colNo, styles.textCenter]}>1</Text>
          <Text style={[styles.tableCell, styles.colDesc]}>{data.contract.materialName}</Text>
          <Text style={[styles.tableCell, styles.colUnit, styles.textCenter]}>Kg</Text>
          <Text style={[styles.tableCell, styles.colQty, styles.textRight]}>{formatNumber(data.totalBerat, 2)}</Text>
          <Text style={[styles.tableCell, styles.colHarga, styles.textCenter]}>Rp</Text>
          <Text style={[styles.tableCell, styles.colSatuan, styles.textRight]}>{formatNumber(data.hargaPerKg, 0)}</Text>
          <Text style={[styles.tableCellLast, styles.colAmount, styles.textRight]}>Rp {formatCurrency(data.subtotalBruto)}</Text>
        </View>

        {/* Klaim Mutu row if exists */}
        {data.klaimMutuNilai > 0 && (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colNo, styles.textCenter]}>2</Text>
            <Text style={[styles.tableCell, styles.colDesc]}>Pengurangan Klaim Mutu ({formatNumber(data.hargaPerKg > 0 ? data.klaimMutuNilai / data.hargaPerKg : 0, 2)} kg)</Text>
            <Text style={[styles.tableCell, styles.colUnit, styles.textCenter]}>Kg</Text>
            <Text style={[styles.tableCell, styles.colQty, styles.textRight]}>{formatNumber(data.hargaPerKg > 0 ? data.klaimMutuNilai / data.hargaPerKg : 0, 2)}</Text>
            <Text style={[styles.tableCell, styles.colHarga, styles.textCenter]}>Rp</Text>
            <Text style={[styles.tableCell, styles.colSatuan, styles.textRight]}>{formatNumber(data.hargaPerKg, 0)}</Text>
            <Text style={[styles.tableCellLast, styles.colAmount, styles.textRight]}>Rp -{formatCurrency(data.klaimMutuNilai)}</Text>
          </View>
        )}

        {/* Klaim Susut row if exists */}
        {data.klaimSusutNilai > 0 && (
          <View style={data.klaimMutuNilai > 0 ? styles.tableRowLast : styles.tableRow}>
            <Text style={[styles.tableCell, styles.colNo, styles.textCenter]}>{data.klaimMutuNilai > 0 ? "3" : "2"}</Text>
            <Text style={[styles.tableCell, styles.colDesc]}>Pengurangan Klaim Susut ({formatNumber(data.hargaPerKg > 0 ? data.klaimSusutNilai / data.hargaPerKg : 0, 2)} kg)</Text>
            <Text style={[styles.tableCell, styles.colUnit, styles.textCenter]}>Kg</Text>
            <Text style={[styles.tableCell, styles.colQty, styles.textRight]}>{formatNumber(data.hargaPerKg > 0 ? data.klaimSusutNilai / data.hargaPerKg : 0, 2)}</Text>
            <Text style={[styles.tableCell, styles.colHarga, styles.textCenter]}>Rp</Text>
            <Text style={[styles.tableCell, styles.colSatuan, styles.textRight]}>{formatNumber(data.hargaPerKg, 0)}</Text>
            <Text style={[styles.tableCellLast, styles.colAmount, styles.textRight]}>Rp -{formatCurrency(data.klaimSusutNilai)}</Text>
          </View>
        )}
      </View>

      {/* Summary Table with PPN text on left */}
      <View style={{ flexDirection: "row", marginTop: 10 }}>
        {/* PPN Disclaimer on left side - only show if enabled */}
        <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 5 }}>
          {data.showPpnDisclaimer && (
            <Text style={{ fontSize: 8, color: "#000000" }}>
              PPN tidak dipungut sesuai PP tempat Penimbunan Berikat
            </Text>
          )}
        </View>

        {/* Summary Table on right side */}
        <View style={{ width: 280 }}>
          {/* Total Row */}
          <View style={{ flexDirection: "row", borderWidth: 1, borderColor: "#000000" }}>
            <Text style={{ width: 130, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8, fontWeight: "bold", borderRightWidth: 1, borderRightColor: "#000000" }}>Total</Text>
            <Text style={{ width: 30, paddingVertical: 5, paddingHorizontal: 4, fontSize: 8, textAlign: "center", borderRightWidth: 1, borderRightColor: "#000000" }}>Rp</Text>
            <Text style={{ flex: 1, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8, textAlign: "right", fontWeight: "bold" }}>{formatCurrency(data.subtotalNetto)}</Text>
          </View>

          {/* PPN Row */}
          {data.ppnNilai > 0 && (
            <View style={{ flexDirection: "row", borderWidth: 1, borderTopWidth: 0, borderColor: "#000000" }}>
              <Text style={{ width: 130, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8, borderRightWidth: 1, borderRightColor: "#000000" }}>PPN {data.ppnPersen}%</Text>
              <Text style={{ width: 30, paddingVertical: 5, paddingHorizontal: 4, fontSize: 8, textAlign: "center", borderRightWidth: 1, borderRightColor: "#000000" }}>Rp</Text>
              <Text style={{ flex: 1, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8, textAlign: "right" }}>{formatCurrency(data.ppnNilai)}</Text>
            </View>
          )}

          {/* Jumlah Total Row */}
          <View style={{ flexDirection: "row", borderWidth: 1, borderTopWidth: 0, borderColor: "#000000" }}>
            <Text style={{ width: 130, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8, fontWeight: "bold", borderRightWidth: 1, borderRightColor: "#000000" }}>Jumlah Total</Text>
            <Text style={{ width: 30, paddingVertical: 5, paddingHorizontal: 4, fontSize: 8, textAlign: "center", borderRightWidth: 1, borderRightColor: "#000000" }}>Rp</Text>
            <Text style={{ flex: 1, paddingVertical: 5, paddingHorizontal: 6, fontSize: 8, textAlign: "right", fontWeight: "bold" }}>{formatCurrency(data.totalNilai)}</Text>
          </View>
        </View>
      </View>

      {/* Note Section with Signature */}
      <View style={styles.noteSection}>
        <View style={styles.noteContent}>
          <Text style={styles.noteLabel}>Note :</Text>
          <Text style={styles.noteText}>Kindly remit payment to our Bank</Text>
          <Text style={styles.noteText}>PT. Taro Rakaya Tasyra</Text>
          <Text style={styles.noteText}>Bank BRI Cabang Pkl Kerinci</Text>
          <Text style={styles.noteText}>A/c No. : 0622-01-000918-30-8</Text>
        </View>
        <View style={styles.stampSection}>
          {/* Signature area */}
          <View style={{
            width: 120,
            alignItems: "center",
          }}>
            {/* Space for signature */}
            <View style={{ height: 50 }} />
            {/* Name */}
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#000000", textAlign: "center" }}>
              {data.namaPenandatangan || "TARA MIFTAHUR"}
            </Text>
            {/* Position */}
            <Text style={{ fontSize: 8, color: "#374151", textAlign: "center", marginTop: 2 }}>
              {data.jabatanPenandatangan || "Direktur"}
            </Text>
          </View>
        </View>
      </View>
    </Page>
  );
}
