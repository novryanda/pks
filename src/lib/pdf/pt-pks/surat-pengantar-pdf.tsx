import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import path from "path";
import fs from "fs";
import { formatDateTimeInJakarta } from "@/lib/date-time";

// Load logo as base64
const logoPath = path.join(process.cwd(), "public", "LOGO TRT.png");
let logoBase64 = "";
try {
  const logoBuffer = fs.readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
} catch (e) {
  console.error("Error loading logo:", e);
}

// Register fonts
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

Font.register({
  family: "Roboto-Bold",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
});

const PAPER_WIDTH = 683;
const PAPER_HEIGHT = 368.5;

const styles = StyleSheet.create({
  page: {
    paddingTop: 25,
    paddingBottom: 2,
    paddingLeft: 25,
    paddingRight: 25,
    fontSize: 9.5,
    fontFamily: "Roboto",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
    minHeight: 20,
  },
  logoWrapper: {
    marginBottom: 2,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  logo: {
    width: 30,
    height: 30,
  },
  headerText: {
    textAlign: "center",
  },
  companyName: {
    fontSize: 11,
    fontFamily: "Roboto",
    marginBottom: 0,
  },
  companyAddress: {
    fontSize: 8.5,
    marginBottom: 0,
  },
  titleSection: {
    textAlign: "center",
    marginVertical: 0,
  },
  title: {
    fontSize: 12,
    fontFamily: "Roboto",
    textDecoration: "underline",
    marginBottom: 1,
  },
  documentNumber: {
    fontSize: 9.5,
    fontFamily: "Roboto",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: -1,
  },
  infoColumn: {
    width: "42.5%",
  },
  row: {
    flexDirection: "row",
    marginBottom: 0,
  },
  label: {
    width: "35%",
    fontSize: 9.5,
  },
  colon: {
    width: "4%",
    fontSize: 9.5,
  },
  value: {
    width: "61%",
    fontSize: 9.5,
  },
  valueBold: {
    width: "61%",
    fontSize: 9.5,
    fontFamily: "Roboto",
  },
  logoRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  // Two column table section
  twoColumnSection: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 0,
    marginBottom: 0,
  },
  leftColumn: {
    width: "35%",
  },
  rightColumn: {
    width: "35%",
    marginLeft: "15%",
  },
  columnTitle: {
    fontSize: 9.5,
    fontFamily: "Roboto",
    marginBottom: 0,
    textAlign: "center",
    padding: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
  },
  // Table with borders
  table: {
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Roboto-Bold",
    padding: 1,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#000",
    borderRightStyle: "solid",
  },
  tableHeaderCellLast: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Roboto-Bold",
    padding: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableCell: {
    width: "45%",
    fontSize: 9.5,
    padding: 1,
    borderRightWidth: 1,
    borderRightColor: "#000",
    borderRightStyle: "solid",
  },
  tableCellRight: {
    width: "40%",
    fontSize: 9.5,
    padding: 1,
    textAlign: "left",
    borderRightWidth: 1,
    borderRightColor: "#000",
    borderRightStyle: "solid",
  },
  tableCellLast: {
    width: "15%",
    fontSize: 9.5,
    padding: 1,
    textAlign: "center",
  },
  tableCellBold: {
    width: "45%",
    fontSize: 9.5,
    padding: 1,
    fontFamily: "Roboto",
    borderRightWidth: 1,
    borderRightColor: "#000",
    borderRightStyle: "solid",
  },
  // Signature section
  signatureContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 5,
  },
  signature: {
    flexDirection: "row",
    justifyContent: "flex-start",
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    paddingTop: 1,
  },
  signatureBox: {
    width: "18%",
    textAlign: "center",
  },
  signatureLabel: {
    fontSize: 8,
    marginBottom: 30,
  },
  signatureName: {
    fontSize: 8,
    fontFamily: "Roboto",
    marginBottom: 0,
  },
  signatureRole: {
    fontSize: 7.5,
  },
  locationTextContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  locationText: {
    width: "48.5%",
    fontSize: 8,
    marginBottom: 0,
    textAlign: "left",
  },
});

type PengirimanData = {
  nomorPengiriman: string;
  tanggalPengiriman: string;
  operatorPenimbang: string;
  buyer: {
    name: string;
    code: string;
    address: string;
    contactPerson: string;
    phone: string;
  };
  contract: {
    contractNumber: string;
    deliveryDate: string | null;
    quantity?: number;
  };
  contractItem: {
    material: {
      name: string;
      code: string;
      satuan: {
        name: string;
        symbol: string;
      };
    };
  };
  vendorVehicle: {
    nomorKendaraan: string;
    namaSupir: string;
    noHpSupir?: string | null;
    noSim?: string | null;
    vendor: {
      name: string;
      code: string;
    };
  };
  beratTarra: number;
  beratGross: number;
  beratNetto: number;
  mutuCustomFields?: { fieldName: string; fieldValue: string }[] | null;
  contractCustomFields?: { fieldName: string; fieldValue: string }[] | null;
  waktuTimbangTarra: string;
  waktuTimbangGross: string;
  // New fields for updated layout
  noTicketTimbangan?: string;
  transportasi?: string;
  disetujuiOleh?: string;
  disetujuiJabatan?: string;
  diperiksaOleh?: string;
  diperiksaJabatan?: string;
  company?: {
    name: string;
    code: string;
    address?: string;
  };
};

type SuratPengantarPDFProps = {
  data: PengirimanData;
};

export const SuratPengantarPDF: React.FC<SuratPengantarPDFProps> = ({ data }) => {
  const formatDateTime = (dateString: string) => {
    return formatDateTimeInJakarta(dateString, { fallback: dateString, includeSeconds: true });
  };

  const formatDateShort = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  // Generate document number: urutan/TRT/PKS-LO/(product)/I/tahun
  const getDocumentNumber = () => {
    const materialName = data.contractItem?.material?.name?.toUpperCase() || "";
    let productLabel = "CPO";

    if (materialName.includes("KERNEL")) {
      productLabel = "KERNEL";
    } else if (materialName.includes("CANGKANG")) {
      productLabel = "CANGKANG";
    } else if (materialName.includes("CPO")) {
      productLabel = "CPO";
    } else if (materialName.includes("FIBER")) {
      productLabel = "FIBER";
    }

    // List of Roman numerals for months
    const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const dateObj = data.tanggalPengiriman ? new Date(data.tanggalPengiriman) : new Date();
    const monthRoman = romanMonths[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    // Extract sequence number from nomorPengiriman (e.g., DO-202601-00001 -> 001)
    let sequence = "001";
    const parts = data.nomorPengiriman.split("-");
    const lastPart = parts[parts.length - 1];

    if (lastPart && lastPart.length >= 3) {
      sequence = lastPart.slice(-3);
    }

    return `${sequence}/TRT/PKS-LO/${productLabel}/${monthRoman}/${year}`;
  };

  // Get location from company address or default
  const getLocation = () => {
    return `Lubuk Ogung : ${formatDateShort(data.tanggalPengiriman)}`;
  };

  const materialName = data.contractItem?.material?.name || "CPO";

  return (
    <Page size={{ width: PAPER_WIDTH, height: PAPER_HEIGHT }} style={styles.page}>
      {/* Header with Logo - Centered */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.companyName}>
            PKS - {data.company?.name || "PT. TARO RAKAYA TASYRA"}
          </Text>
          <Text style={styles.companyAddress}>
            Jl. Lintas Langgam KM 3 Desa Lubuk Ogung
          </Text>
          <Text style={styles.companyAddress}>
            Kec. Bandar Seikijang Kab. Pelalawan-Riau
          </Text>
        </View>
      </View>



      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          SURAT PENGANTAR {materialName.toUpperCase()}
        </Text>
        <Text style={styles.documentNumber}>{getDocumentNumber()}</Text>
      </View>

      {/* Location Text - Aligned with Left Column */}
      <View style={styles.locationTextContainer}>
        <View style={styles.locationText}>
          <Text>{getLocation()}</Text>
        </View>
        <View style={styles.infoColumn} />
      </View>
      <View style={styles.infoSection}>
        {/* Left Info Column */}
        <View style={styles.infoColumn}>
          <View style={styles.row}>
            <Text style={styles.label}>No. Kontrak</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{data.contract.contractNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>No. Tiket Timbangan</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.valueBold}>{data.nomorPengiriman}</Text>
          </View>
          {data.contractCustomFields?.find(f => f.fieldName.includes("PO")) && (
            <View style={styles.row}>
              <Text style={styles.label}>Nomor PO</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>
                {data.contractCustomFields.find(f => f.fieldName.includes("PO"))?.fieldValue}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Quantity</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.valueBold}>
              {data.contract.quantity != null && data.contract.quantity > 0
                ? `${data.contract.quantity.toLocaleString("id-ID")} kg`
                : "-"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nama Pembeli</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{data.buyer.name}</Text>
          </View>
        </View>

        {/* Right Info Column (Shifted Left) */}
        <View style={[styles.infoColumn, { marginLeft: "7.5%" }]}>
          <View style={styles.row}>
            <Text style={styles.label}>Transportasi</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{data.transportasi || data.vendorVehicle.vendor.name}</Text>
          </View>
          {data.contractCustomFields?.find(f => f.fieldName.includes("DO")) && (
            <View style={styles.row}>
              <Text style={styles.label}>Nomor DO</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>
                {data.contractCustomFields.find(f => f.fieldName.includes("DO"))?.fieldValue}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>No. Polisi</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{data.vendorVehicle.nomorKendaraan}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nama Supir</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{data.vendorVehicle.namaSupir}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>No. Hand Phone</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{data.vendorVehicle.noHpSupir || "-"}</Text>
          </View>
        </View>
      </View>

      {/* Two Column Tables: Jumlah & Mutu */}
      <View style={styles.twoColumnSection}>
        {/* Left Column: Jumlah */}
        <View style={styles.leftColumn}>
          <Text style={styles.columnTitle}>Jumlah {materialName}</Text>
          <View style={styles.table}>
            {/* Tarra */}
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Tarra</Text>
              <Text style={styles.tableCellRight}>{data.beratTarra.toLocaleString("id-ID")}</Text>
              <Text style={styles.tableCellLast}>Kg</Text>
            </View>
            {/* Gross */}
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Gross</Text>
              <Text style={styles.tableCellRight}>{data.beratGross.toLocaleString("id-ID")}</Text>
              <Text style={styles.tableCellLast}>Kg</Text>
            </View>
            {/* Netto */}
            <View style={styles.tableRow}>
              <Text style={styles.tableCellBold}>Netto</Text>
              <Text style={styles.tableCellRight}>{data.beratNetto.toLocaleString("id-ID")}</Text>
              <Text style={styles.tableCellLast}>Kg</Text>
            </View>
            {/* Jam Masuk */}
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Jam Masuk</Text>
              <Text style={[styles.tableCellRight, { width: "55%", textAlign: "left" }]}>{formatDateTime(data.waktuTimbangTarra)}</Text>
            </View>
            {/* Jam Keluar */}
            <View style={styles.tableRowLast}>
              <Text style={styles.tableCell}>Jam Keluar</Text>
              <Text style={[styles.tableCellRight, { width: "55%", textAlign: "left" }]}>{formatDateTime(data.waktuTimbangGross)}</Text>
            </View>
          </View>
        </View>

        {/* Right Column: Mutu */}
        <View style={styles.rightColumn}>
          <Text style={styles.columnTitle}>Mutu {materialName}</Text>
          <View style={styles.table}>
            {/* Dynamic Mutu Fields */}
            {data.mutuCustomFields && data.mutuCustomFields.length > 0 ? (
              data.mutuCustomFields.map((field, index) => {
                const getUnit = (name: string) => {
                  const n = name.toUpperCase();
                  if (
                    n.includes("FFA") ||
                    n.includes("M&I") ||
                    n.includes("DOBI") ||
                    n.includes("AIR") ||
                    n.includes("KOTORAN")
                  ) return "%";
                  if (n.includes("SUHU")) return "°C";
                  return "";
                };

                return (
                  <View key={index} style={index === data.mutuCustomFields!.length - 1 ? styles.tableRowLast : styles.tableRow}>
                    <Text style={styles.tableCell}>{field.fieldName}</Text>
                    <Text style={styles.tableCellRight}>{field.fieldValue || "-"}</Text>
                    <Text style={styles.tableCellLast}>{getUnit(field.fieldName)}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.tableRowLast}>
                <Text style={styles.tableCell}>-</Text>
                <Text style={styles.tableCellRight}>-</Text>
                <Text style={styles.tableCellLast}>-</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Signature Section */}
      <View style={styles.signatureContainer}>
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Disetujui</Text>
            <Text style={styles.signatureName}>{data.disetujuiOleh || "_______________"}</Text>
            <Text style={styles.signatureRole}>{data.disetujuiJabatan || "Mill Manager"}</Text>
          </View>
          <View style={[styles.signatureBox, { marginLeft: "5%" }]}>
            <Text style={styles.signatureLabel}>Diperiksa</Text>
            <Text style={styles.signatureName}>{data.diperiksaOleh || "_______________"}</Text>
            <Text style={styles.signatureRole}>{data.diperiksaJabatan || "KTU"}</Text>
          </View>
          <View style={[styles.signatureBox, { marginLeft: "5%" }]}>
            <Text style={styles.signatureLabel}>Dibuat</Text>
            <Text style={styles.signatureName}>{data.operatorPenimbang}</Text>
            <Text style={styles.signatureRole}>Kr. Timbangan</Text>
          </View>
          <View style={[styles.signatureBox, { marginLeft: "5%" }]}>
            <Text style={styles.signatureLabel}>Dibawa</Text>
            <Text style={styles.signatureName}>{data.vendorVehicle.namaSupir}</Text>
            <Text style={styles.signatureRole}>Supir</Text>
          </View>
        </View>
      </View>
    </Page>
  );
};

// Document wrapper untuk export
export const SuratPengantarDocument: React.FC<SuratPengantarPDFProps> = ({ data }) => {
  return (
    <Document>
      <SuratPengantarPDF data={data} />
    </Document>
  );
};
