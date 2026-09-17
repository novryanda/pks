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
import path from "path";
import fs from "fs";
import { formatDateTimeInJakarta } from "@/lib/date-time";


// Register fonts
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

Font.register({
  family: "Roboto-Bold",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
});

// Paper size: 12cm x 13cm = 340pt x 368pt (1cm = 28.35pt)
const PAPER_WIDTH = 340;
const PAPER_HEIGHT = 368;

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 5,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 10,
    fontFamily: "Roboto",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  headerText: {
    flex: 1,
    textAlign: "center",
  },
  companyName: {
    fontSize: 12,
    fontFamily: "Roboto-Bold",
    marginBottom: 1,
  },
  companyAddress: {
    fontSize: 8,
    marginBottom: 1,
  },
  title: {
    fontSize: 11,
    fontFamily: "Roboto-Bold",
    marginTop: 1,
    marginBottom: 1,
    textDecoration: "underline",
    textAlign: "center",
  },
  infoSection: {
    marginBottom: 1,
  },
  row: {
    flexDirection: "row",
    marginBottom: 0.5,
  },
  label: {
    width: "28%",
    fontSize: 10,
  },
  colon: {
    width: "3%",
    fontSize: 10,
  },
  value: {
    width: "69%",
    fontSize: 10,
  },
  valueBold: {
    width: "69%",
    fontSize: 10,
    fontFamily: "Roboto-Bold",
  },
  weightSection: {
    marginTop: 1,
    marginBottom: 1,
  },
  weightRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  weightLabel: {
    width: "28%",
    fontSize: 11,
  },
  weightColon: {
    width: "3%",
    fontSize: 11,
  },
  weightValue: {
    width: "69%",
    fontSize: 11,
  },
  signature: {
    marginTop: 10,
    marginRight: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 3,
  },
  signatureBox: {
    width: "30%",
    textAlign: "center",
  },
  signatureLabel: {
    fontSize: 8,
    marginBottom: 30,
    fontFamily: "Roboto-Bold",
  },
  signatureName: {
    fontSize: 8,
    fontFamily: "Roboto-Bold",
  },
  signatureNameWrapper: {
    marginTop: 3,
  },
});

export type TiketTimbanganData = {
  nomorPengiriman: string;
  tanggalPengiriman: string;
  operatorPenimbang: string;
  vendorVehicle: {
    nomorKendaraan: string;
    namaSupir: string;
    noHpSupir?: string | null;
    vendor: {
      name: string;
      code: string;
    };
  };
  beratTarra: number;
  beratGross: number;
  beratNetto: number;
  metodeTarra: string;
  metodeGross: string;
  waktuTimbangTarra: string;
  waktuTimbangGross: string;
  // Fields for layout
  noTiket?: string;
  namaCustomer?: string;
  namaBarang?: string;
  company?: {
    name: string;
    code: string;
    address?: string;
  };
  // Product info from contract item
  contractItem?: {
    material: {
      name: string;
      code: string;
    };
  };
  // Buyer info
  buyer?: {
    name: string;
    code: string;
  };
};

type TiketTimbanganPDFProps = {
  data: TiketTimbanganData;
};

export const TiketTimbanganPDF: React.FC<TiketTimbanganPDFProps> = ({ data }) => {
  const formatDateTime = (dateString: string) => {
    return formatDateTimeInJakarta(dateString, { fallback: dateString, includeSeconds: true });
  };

  // Calculate Berat Netto (Gross - Tarra)
  const beratNetto = data.beratNetto || (data.beratGross - data.beratTarra);

  // Get product name from contractItem.material or fallback
  const namaBarang = data.contractItem?.material?.name || data.namaBarang || "-";

  // Get customer name from buyer or fallback to vendor name
  const namaCustomer = data.buyer?.name || data.namaCustomer || data.vendorVehicle.vendor.name;

  return (
    <Page size={{ width: PAPER_WIDTH, height: PAPER_HEIGHT }} style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.companyName}>
            {data.company?.name || "PT TARO RAKAYA TASYRA"}
          </Text>
          <Text style={styles.companyAddress}>
            {data.company?.address || "JL LINTAS KM. 3 DESA LUBUK OGONG KEC"}
          </Text>
          <Text style={styles.companyAddress}>
            BANDAR SEI KIJANG. KAB. PELALAWAN, RIAU
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>TIKET TIMBANGAN</Text>

      {/* Info Section 1: No Tiket, Jam Masuk, Jam Keluar */}
      <View style={styles.infoSection}>
        <View style={styles.row}>
          <Text style={styles.label}>No Tiket</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.noTiket || data.nomorPengiriman}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tgl/ Jam Masuk</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formatDateTime(data.waktuTimbangTarra)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tgl/ Jam Keluar</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formatDateTime(data.waktuTimbangGross)}</Text>
        </View>
      </View>

      {/* Info Section 2: Kendaraan & Customer */}
      <View style={styles.infoSection}>
        <View style={styles.row}>
          <Text style={styles.label}>No. Kendaraan</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.vendorVehicle.nomorKendaraan}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Customer</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{namaCustomer}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Barang</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.valueBold}>{namaBarang}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Sopir</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.vendorVehicle.namaSupir}</Text>
        </View>
      </View>

      {/* Weight Section */}
      <View style={styles.weightSection}>
        <View style={styles.weightRow}>
          <Text style={styles.weightLabel}>Berat Tarra</Text>
          <Text style={styles.weightColon}>:</Text>
          <Text style={styles.weightValue}>
            {data.beratTarra.toLocaleString("id-ID")} Kg
          </Text>
        </View>
        <View style={styles.weightRow}>
          <Text style={styles.weightLabel}>Berat Gross</Text>
          <Text style={styles.weightColon}>:</Text>
          <Text style={styles.weightValue}>
            {data.beratGross.toLocaleString("id-ID")} Kg
          </Text>
        </View>
        <View style={styles.weightRow}>
          <Text style={styles.weightLabel}>Berat Netto</Text>
          <Text style={styles.weightColon}>:</Text>
          <Text style={styles.weightValue}>
            {beratNetto.toLocaleString("id-ID")} Kg
          </Text>
        </View>
      </View>

      {/* Signature Section */}
      <View style={styles.signature}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Ditimbang Oleh :</Text>
          <View style={styles.signatureNameWrapper}>
            <Text style={styles.signatureName}>( {data.operatorPenimbang} )</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Diketahui Oleh :</Text>
          <View style={styles.signatureNameWrapper}>
            <Text style={styles.signatureName}>(                    )</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Pengemudi</Text>
          <View style={styles.signatureNameWrapper}>
            <Text style={styles.signatureName}>( {data.vendorVehicle.namaSupir} )</Text>
          </View>
        </View>
      </View>
    </Page>
  );
};

// Document wrapper untuk export
export const TiketTimbanganDocument: React.FC<TiketTimbanganPDFProps> = ({ data }) => {
  return (
    <Document>
      <TiketTimbanganPDF data={data} />
    </Document>
  );
};
