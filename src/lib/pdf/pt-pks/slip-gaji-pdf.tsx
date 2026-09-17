import React from "react";
import {
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { getLogoBase64, COMPANY_NAME, COMPANY_SUBTITLE } from "../logo";
import { calculateTotalMenitDibayar, LEMBUR_TYPES, type LemburType } from "@/server/schema/penggajian";

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf" },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontSize: 9,
    fontFamily: "Roboto",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
    paddingBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
  },
  companySubtitle: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  documentTitle: {
    textAlign: "right",
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#059669",
  },
  periodeText: {
    fontSize: 10,
    marginTop: 4,
    color: "#374151",
  },
  // Info Section
  infoSection: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    padding: 8,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#6b7280",
    width: 75,
  },
  infoValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
  // Stats Section
  statsSection: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 6,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 7,
    color: "#6b7280",
    marginTop: 2,
  },
  statGreen: { color: "#059669" },
  statBlue: { color: "#3b82f6" },
  statRed: { color: "#dc2626" },
  statPurple: { color: "#7c3aed" },
  statOrange: { color: "#ea580c" },
  // Section Title
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  // Lembur Table
  lemburSection: {
    marginBottom: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 7,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
  },
  tableCell: {
    padding: 5,
    fontSize: 7,
    textAlign: "center",
    color: "#374151",
  },
  tableCellLeft: {
    padding: 5,
    fontSize: 7,
    textAlign: "left",
    color: "#374151",
  },
  tableCellOrange: {
    padding: 5,
    fontSize: 7,
    textAlign: "center",
    color: "#ea580c",
    fontWeight: "bold",
  },
  tableFooter: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
  },
  tableFooterCell: {
    padding: 6,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Salary Grid
  salarySection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  salaryBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
  },
  salaryTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
  },
  salaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  salaryLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
  salaryValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#111827",
  },
  salaryValuePositive: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#059669",
  },
  salaryValueNegative: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#dc2626",
  },
  salaryValueOrange: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#ea580c",
  },
  salaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  salaryTotalLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
  },
  salaryTotalValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#059669",
  },
  salaryTotalValueNegative: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#dc2626",
  },
  // Net Pay
  netPayBox: {
    backgroundColor: "#059669",
    padding: 12,
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  netPayLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  netPayValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  // Lembur Info
  lemburInfo: {
    backgroundColor: "#fef3c7",
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  lemburInfoTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 4,
  },
  lemburInfoText: {
    fontSize: 7,
    color: "#92400e",
    marginBottom: 2,
  },
  // Footer

  // Signature Section
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    marginBottom: 15,
  },
  signatureBox: {
    alignItems: "center",
    width: 150,
  },
  signatureTitle: {
    fontSize: 9,
    marginBottom: 38,
  },
  signatureName: {
    fontSize: 9,
    fontWeight: "bold",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingTop: 4,
    width: "100%",
    textAlign: "center",
  },
  signatureRole: {
    fontSize: 8,
    marginTop: 2,
    textAlign: "center",
  },
});

// Types
export type LemburDetailItem = {
  type?: LemburType | string;
  hours?: number;
  x15: number;
  x2: number;
  x3: number;
  x4: number;
  keterangan?: string | null;
};

export type SlipGajiPDFData = {
  periodeBulan: number;
  periodeTahun: number;
  namaKaryawan: string;
  jabatan: string | null;
  devisi: string | null;
  gol: string | null;
  nomorRekening: string | null;
  tktk: string | null;
  noBpjsTk: string | null;
  noBpjsKesehatan: string | null;
  // Attendance
  hk: number;
  liburDibayar: number;
  hkTidakDibayar: number;
  hkDibayar: number;
  totalMenitDibayar: number;
  lemburDetail: Record<string, LemburDetailItem> | null;
  // Salary
  gajiPokok: number;
  tunjanganJabatan: number;
  tunjanganPerumahan: number;
  sppd: number;
  thr: number;
  tunjanganLainLain: number;
  overtime: number;
  totalSebelumPotongan: number;
  // Deductions
  potKehadiran: number;
  potBpjsTkJht: number;
  potBpjsTkJn: number;
  potBpjsKesehatan: number;
  potPph21: number;
  potPinjaman: number;
  potLainLain: number;
  totalPotongan: number;
  upahDiterima: number;
  keteranganDetail?: {
    sppd?: string;
    tunjanganLainLain?: string;
  } | null;
};

// Helpers
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID").format(value);
};

const getMonthName = (month: number) => {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return months[month - 1] || "";
};

const getLemburTypeLabel = (type?: LemburType | string) => {
  switch (type) {
    case LEMBUR_TYPES.HARI_BIASA: return "Hari Biasa";
    case LEMBUR_TYPES.HARI_LIBUR: return "Hari Libur";
    case LEMBUR_TYPES.HARI_BESAR: return "Hari Besar";
    default: return "Hari Biasa";
  }
};

export function SlipGajiPDF({ data }: { data: SlipGajiPDFData }) {
  const logoBase64 = getLogoBase64();

  // Calculate lembur totals
  const lemburDetail = data.lemburDetail || {};
  let totalMenitDibayar = 0;

  Object.values(lemburDetail).forEach(item => {
    if (item) {
      totalMenitDibayar += calculateTotalMenitDibayar(item);
    }
  });

  const lemburEntries = Object.entries(lemburDetail)
    .filter(([, item]) => item && (item.x15 > 0 || item.x2 > 0 || item.x3 > 0 || item.x4 > 0))
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Image src={logoBase64} style={styles.logo} />
        <View style={styles.headerInfo}>
          <Text style={styles.companyName}>{COMPANY_NAME}</Text>
          <Text style={styles.companySubtitle}>{COMPANY_SUBTITLE}</Text>
        </View>
        <View style={styles.documentTitle}>
          <Text style={styles.title}>SLIP GAJI</Text>
          <Text style={styles.periodeText}>
            Periode: {getMonthName(data.periodeBulan)} {data.periodeTahun}
          </Text>
        </View>
      </View>

      {/* Employee Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama</Text>
            <Text style={styles.infoValue}>{data.namaKaryawan}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Jabatan</Text>
            <Text style={styles.infoValue}>{data.jabatan || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Divisi</Text>
            <Text style={styles.infoValue}>{data.devisi || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Golongan</Text>
            <Text style={styles.infoValue}>{data.gol || "-"}</Text>
          </View>
        </View>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>No. Rekening</Text>
            <Text style={styles.infoValue}>{data.nomorRekening || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status Keluarga</Text>
            <Text style={styles.infoValue}>{data.tktk || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>BPJS TK</Text>
            <Text style={styles.infoValue}>{data.noBpjsTk || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>BPJS Kesehatan</Text>
            <Text style={styles.infoValue}>{data.noBpjsKesehatan || "-"}</Text>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, styles.statGreen]}>{data.hk}</Text>
          <Text style={styles.statLabel}>Hari Kerja</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, styles.statBlue]}>{data.liburDibayar}</Text>
          <Text style={styles.statLabel}>Libur Dibayar</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, styles.statRed]}>{data.hkTidakDibayar}</Text>
          <Text style={styles.statLabel}>Tidak Dibayar</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, styles.statPurple]}>{data.hkDibayar}</Text>
          <Text style={styles.statLabel}>HK Dibayar</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, styles.statOrange]}>{(totalMenitDibayar / 60).toFixed(1)}</Text>
          <Text style={styles.statLabel}>Jam Lembur</Text>
        </View>
      </View>

      {/* Lembur Recap - Split into two columns */}
      {lemburEntries.length > 0 && (
        <View style={styles.lemburSection}>
          <Text style={styles.sectionTitle}>Rekap Lembur</Text>

          {/* Two column layout */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {/* Left table (dates 1-15) */}
            <View style={{ flex: 1 }}>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 20 }]}>Tgl</Text>
                  <Text style={[styles.tableHeaderCell, { width: 40 }]}>Jenis</Text>
                  <Text style={[styles.tableHeaderCell, { width: 22 }]}>×1.5</Text>
                  <Text style={[styles.tableHeaderCell, { width: 22 }]}>×2</Text>
                  <Text style={[styles.tableHeaderCell, { width: 22 }]}>×3</Text>
                  <Text style={[styles.tableHeaderCell, { width: 22 }]}>×4</Text>
                  <Text style={[styles.tableHeaderCell, { width: 30 }]}>Total</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Keterangan</Text>
                </View>
                {lemburEntries
                  .filter(([day]) => parseInt(day) <= 15)
                  .map(([day, item], idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    const paid = item ? calculateTotalMenitDibayar(item) : 0;
                    return (
                      <View key={day} style={isLast ? styles.tableRowLast : styles.tableRow}>
                        <Text style={[styles.tableCell, { width: 20 }]}>{day}</Text>
                        <Text style={[styles.tableCellLeft, { width: 40, fontSize: 6 }]}>{getLemburTypeLabel(item?.type)}</Text>
                        <Text style={[styles.tableCell, { width: 22 }]}>{item?.x15 ? (item.x15 / 60).toFixed(1) : "-"}</Text>
                        <Text style={[styles.tableCell, { width: 22 }]}>{item?.x2 ? (item.x2 / 60).toFixed(1) : "-"}</Text>
                        <Text style={[styles.tableCell, { width: 22 }]}>{item?.x3 ? (item.x3 / 60).toFixed(1) : "-"}</Text>
                        <Text style={[styles.tableCell, { width: 22 }]}>{item?.x4 ? (item.x4 / 60).toFixed(1) : "-"}</Text>
                        <Text style={[styles.tableCellOrange, { width: 30 }]}>{(paid / 60).toFixed(1)}</Text>
                        <Text style={[styles.tableCellLeft, { flex: 1, fontSize: 5 }]}>{item?.keterangan || "-"}</Text>
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* Right table (dates 16-31) */}
            <View style={{ flex: 1 }}>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 20 }]}>Tgl</Text>
                  <Text style={[styles.tableHeaderCell, { width: 40 }]}>Jenis</Text>
                  <Text style={[styles.tableHeaderCell, { width: 22 }]}>×1.5</Text>
                  <Text style={[styles.tableHeaderCell, { width: 22 }]}>×2</Text>
                  <Text style={[styles.tableHeaderCell, { width: 22 }]}>×3</Text>
                  <Text style={[styles.tableHeaderCell, { width: 22 }]}>×4</Text>
                  <Text style={[styles.tableHeaderCell, { width: 30 }]}>Total</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Keterangan</Text>
                </View>
                {lemburEntries
                  .filter(([day]) => parseInt(day) > 15)
                  .map(([day, item], idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    const paid = item ? calculateTotalMenitDibayar(item) : 0;
                    return (
                      <View key={day} style={isLast ? styles.tableRowLast : styles.tableRow}>
                        <Text style={[styles.tableCell, { width: 20 }]}>{day}</Text>
                        <Text style={[styles.tableCellLeft, { width: 40, fontSize: 6 }]}>{getLemburTypeLabel(item?.type)}</Text>
                        <Text style={[styles.tableCell, { width: 22 }]}>{item?.x15 ? (item.x15 / 60).toFixed(1) : "-"}</Text>
                        <Text style={[styles.tableCell, { width: 22 }]}>{item?.x2 ? (item.x2 / 60).toFixed(1) : "-"}</Text>
                        <Text style={[styles.tableCell, { width: 22 }]}>{item?.x3 ? (item.x3 / 60).toFixed(1) : "-"}</Text>
                        <Text style={[styles.tableCell, { width: 22 }]}>{item?.x4 ? (item.x4 / 60).toFixed(1) : "-"}</Text>
                        <Text style={[styles.tableCellOrange, { width: 30 }]}>{(paid / 60).toFixed(1)}</Text>
                        <Text style={[styles.tableCellLeft, { flex: 1, fontSize: 5 }]}>{item?.keterangan || "-"}</Text>
                      </View>
                    );
                  })}
              </View>
            </View>
          </View>

        </View>
      )}

      {/* Salary Details */}
      <View style={styles.salarySection}>
        <View style={styles.salaryBox}>
          <Text style={styles.salaryTitle}>Pendapatan</Text>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Gaji Pokok</Text>
            <Text style={styles.salaryValue}>{data.gajiPokok > 0 ? `Rp ${formatCurrency(data.gajiPokok)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Tunj. Jabatan</Text>
            <Text style={styles.salaryValue}>{data.tunjanganJabatan > 0 ? `Rp ${formatCurrency(data.tunjanganJabatan)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Tunj. Perumahan</Text>
            <Text style={styles.salaryValue}>{data.tunjanganPerumahan > 0 ? `Rp ${formatCurrency(data.tunjanganPerumahan)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>SPPD</Text>
            <Text style={styles.salaryValue}>{data.sppd > 0 ? `Rp ${formatCurrency(data.sppd)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>THR</Text>
            <Text style={styles.salaryValue}>{data.thr > 0 ? `Rp ${formatCurrency(data.thr)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Lain-lain</Text>
            <Text style={styles.salaryValue}>{data.tunjanganLainLain > 0 ? `Rp ${formatCurrency(data.tunjanganLainLain)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Overtime</Text>
            <Text style={styles.salaryValueOrange}>{data.overtime > 0 ? `Rp ${formatCurrency(data.overtime)}` : "-"}</Text>
          </View>
          <View style={styles.salaryTotal}>
            <Text style={styles.salaryTotalLabel}>Total Pendapatan</Text>
            <Text style={styles.salaryTotalValue}>Rp {formatCurrency(data.totalSebelumPotongan)}</Text>
          </View>
        </View>

        <View style={styles.salaryBox}>
          <Text style={styles.salaryTitle}>Potongan</Text>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Pot. Kehadiran</Text>
            <Text style={styles.salaryValueNegative}>{data.potKehadiran > 0 ? `-Rp ${formatCurrency(data.potKehadiran)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>BPJS TK JHT</Text>
            <Text style={styles.salaryValueNegative}>{data.potBpjsTkJht > 0 ? `-Rp ${formatCurrency(data.potBpjsTkJht)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>BPJS TK JN</Text>
            <Text style={styles.salaryValueNegative}>{data.potBpjsTkJn > 0 ? `-Rp ${formatCurrency(data.potBpjsTkJn)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>BPJS Kesehatan</Text>
            <Text style={styles.salaryValueNegative}>{data.potBpjsKesehatan > 0 ? `-Rp ${formatCurrency(data.potBpjsKesehatan)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>PPH 21</Text>
            <Text style={styles.salaryValueNegative}>{data.potPph21 > 0 ? `-Rp ${formatCurrency(data.potPph21)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Pot. Pinjaman</Text>
            <Text style={styles.salaryValueNegative}>{data.potPinjaman > 0 ? `-Rp ${formatCurrency(data.potPinjaman)}` : "-"}</Text>
          </View>
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>Pot. Lain-lain</Text>
            <Text style={styles.salaryValueNegative}>{data.potLainLain > 0 ? `-Rp ${formatCurrency(data.potLainLain)}` : "-"}</Text>
          </View>
          <View style={styles.salaryTotal}>
            <Text style={styles.salaryTotalLabel}>Total Potongan</Text>
            <Text style={styles.salaryTotalValueNegative}>-Rp {formatCurrency(data.totalPotongan)}</Text>
          </View>
        </View>
      </View>

      {/* Remarks Section */}
      {(data.keteranganDetail?.sppd || data.keteranganDetail?.tunjanganLainLain) && (
        <View style={{ marginBottom: 8, padding: 8, backgroundColor: '#f9fafb', borderRadius: 4, borderLeftWidth: 3, borderLeftColor: '#059669' }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#374151', marginBottom: 4 }}>Catatan:</Text>
          {data.keteranganDetail?.sppd && (
            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ fontSize: 7, color: '#6b7280', width: 60 }}>• SPPD:</Text>
              <Text style={{ fontSize: 7, color: '#111827', flex: 1 }}>{data.keteranganDetail.sppd}</Text>
            </View>
          )}
          {data.keteranganDetail?.tunjanganLainLain && (
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontSize: 7, color: '#6b7280', width: 60 }}>• Lain-lain:</Text>
              <Text style={{ fontSize: 7, color: '#111827', flex: 1 }}>{data.keteranganDetail.tunjanganLainLain}</Text>
            </View>
          )}
        </View>
      )}

      {/* Net Pay */}
      <View style={styles.netPayBox}>
        <Text style={styles.netPayLabel}>UPAH DITERIMA</Text>
        <Text style={styles.netPayValue}>Rp {formatCurrency(data.upahDiterima)}</Text>
      </View>

      {/* Signature Section */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureTitle}>Disetujui Oleh,</Text>
          <Text style={styles.signatureName}>Bambang Iswanto</Text>
          <Text style={styles.signatureRole}>Jabatan : Head HR</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureTitle}>Diterima Oleh,</Text>
          <Text style={styles.signatureName}>{data.namaKaryawan}</Text>
        </View>
      </View>
    </Page>
  );
}

export async function downloadSlipGajiPDF(data: SlipGajiPDFData): Promise<void> {
  const { pdf, Document } = await import("@react-pdf/renderer");
  const blob = await pdf(
    <Document>
      <SlipGajiPDF data={data} />
    </Document>
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `slip-gaji-${data.namaKaryawan.replace(/\s+/g, "-")}-${data.periodeBulan}-${data.periodeTahun}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
