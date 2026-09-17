import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts if needed
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Roboto",
    lineHeight: 1.6,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    textDecoration: "underline",
  },
  introduction: {
    marginBottom: 15,
    textAlign: "justify",
  },
  introductionText: {
    fontSize: 11,
    marginBottom: 5,
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 5,
    fontSize: 11,
  },
  fieldLabel: {
    width: 80,
  },
  fieldColon: {
    width: 10,
  },
  fieldValue: {
    flex: 1,
  },
  statementSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  statementTitle: {
    fontSize: 11,
    marginBottom: 10,
  },
  statementList: {
    marginLeft: 0,
  },
  statementItem: {
    fontSize: 11,
    marginBottom: 10,
    textAlign: "justify",
    lineHeight: 1.6,
  },
  statementItemNumber: {
    marginRight: 5,
  },
  statementItemText: {
    flex: 1,
  },
  bankInfo: {
    marginLeft: 20,
    marginTop: 5,
    marginBottom: 5,
  },
  bankInfoRow: {
    flexDirection: "row",
    marginBottom: 3,
    fontSize: 11,
  },
  bankInfoLabel: {
    width: 120,
  },
  bankInfoColon: {
    width: 10,
  },
  bankInfoValue: {
    flex: 1,
  },
  closingText: {
    fontSize: 11,
    marginTop: 15,
    marginBottom: 30,
    textAlign: "justify",
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureBox: {
    width: 200,
    textAlign: "center",
  },
  signatureLocation: {
    fontSize: 11,
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 11,
    marginBottom: 60,
  },
  signerName: {
    fontSize: 11,
    fontWeight: "bold",
  },
});

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
};

type SupplierStatementPDFProps = {
  supplier: {
    ownerName: string;
    address: string;
    npwp: string | null;
    bankAccounts: BankAccount[];
  };
};

export const SupplierStatementPDF: React.FC<SupplierStatementPDFProps> = ({
  supplier,
}) => {
  return (
    <Document>
      <Page size="A4" style={{ ...styles.page, padding: 32, fontSize: 10, lineHeight: 1.4 }}>
        <Text style={{ ...styles.title, fontSize: 13, marginBottom: 16 }}>SURAT PERNYATAAN</Text>

        <View style={styles.introduction}>
          <Text style={{ ...styles.introductionText, fontSize: 10, marginBottom: 3 }}>
            Saya yang bertanda tangan di bawah ini:
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nama</Text>
            <Text style={styles.fieldColon}>:</Text>
            <Text style={styles.fieldValue}>{supplier.ownerName}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Alamat</Text>
            <Text style={styles.fieldColon}>:</Text>
            <Text style={styles.fieldValue}>{supplier.address}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>NPWP</Text>
            <Text style={styles.fieldColon}>:</Text>
            <Text style={styles.fieldValue}>{supplier.npwp || "-"}</Text>
          </View>
        </View>

        <View style={{ ...styles.statementSection, marginTop: 10, marginBottom: 10 }}>
          <Text style={{ ...styles.statementTitle, fontSize: 10, marginBottom: 7 }}>
            Dengan ini saya sebagai Supplier TBS Sawit di PT. Taro Rakaya Tasyra menyatakan dengan sebenarnya:
          </Text>

          <View style={styles.statementList}>
            <View style={styles.statementItem}>
              <Text style={{ fontSize: 10, marginBottom: 2 }}>
                1. Bahwa Rekening Bank yang saya pakai selaku Supplier TBS Sawit untuk pembayaran TBS Sawit oleh PT. Taro Rakaya Tasyra, yaitu{supplier.bankAccounts.length > 1 ? ' menggunakan rekening-rekening sebagai berikut' : ' hanya menggunakan'}:
              </Text>
              {supplier.bankAccounts.length > 0 ? (
                supplier.bankAccounts.map((account, index) => (
                  <View key={index} style={{ ...styles.bankInfo, marginLeft: 10, marginTop: 4, marginBottom: 4, paddingBottom: 4, borderBottomWidth: index < supplier.bankAccounts.length - 1 ? 0.5 : 0, borderBottomColor: '#ccc' }}>
                    {supplier.bankAccounts.length > 1 && (
                      <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 2 }}>Rekening {index + 1}{account.isDefault ? ' (Utama)' : ''}:</Text>
                    )}
                    <View style={styles.bankInfoRow}>
                      <Text style={styles.bankInfoLabel}>Bank</Text>
                      <Text style={styles.bankInfoColon}>:</Text>
                      <Text style={styles.bankInfoValue}>{account.bankName}</Text>
                    </View>
                    <View style={styles.bankInfoRow}>
                      <Text style={styles.bankInfoLabel}>Nomor Rekening</Text>
                      <Text style={styles.bankInfoColon}>:</Text>
                      <Text style={styles.bankInfoValue}>{account.accountNumber}</Text>
                    </View>
                    <View style={styles.bankInfoRow}>
                      <Text style={styles.bankInfoLabel}>Atas Nama</Text>
                      <Text style={styles.bankInfoColon}>:</Text>
                      <Text style={styles.bankInfoValue}>{account.accountName || supplier.ownerName}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ ...styles.bankInfo, marginLeft: 10, marginTop: 2, marginBottom: 2 }}>
                  <Text style={{ fontSize: 10, fontStyle: 'italic' }}>Belum ada rekening terdaftar</Text>
                </View>
              )}
            </View>

            <Text style={{ ...styles.statementItem, fontSize: 10, marginBottom: 2 }}>
              2. Bahwa TBS Sawit yang dikirimkan ke PT. Taro Rakaya Tasyra adalah TBS Sawit resmi dari perkebunan saya sendiri dan/atau TBS yang saya beli secara sah, bukan TBS Sawit yang dibeli secara tidak resmi atau berlawanan dengan hukum yang berlaku, baik disengaja maupun tidak disengaja.
            </Text>

            <Text style={{ ...styles.statementItem, fontSize: 10, marginBottom: 2 }}>
              3. Bertindak selaku supplier TBS, dengan ini saya menyatakan kepada PT. Taro Rakaya Tasyra, bahwa saya Pengusaha Kena Pajak (PKP) sehingga akan menerbitkan faktur pajak dan menyerahkan PPN 1 1% atas penjualan.
            </Text>

            <Text style={{ ...styles.statementItem, fontSize: 10, marginBottom: 2 }}>
              4. Bahwa apabila terjadi penyalahgunaan terhadap Surat Pengantar Buah (SPB)/SP TBS yang diserahkan oleh PT. Taro Rakaya Tasyra, maka PT. Taro Rakaya Tasyra tidak bertanggung jawab terhadap masalah tersebut dan permasalahan tersebut menjadi tanggung jawab saya sebagai Supplier TBS Sawit.
            </Text>

            <Text style={{ ...styles.statementItem, fontSize: 10, marginBottom: 2 }}>
              5. Bahwa apabila terjadi permasalahan yang ditimbulkan oleh sebab yang tercantum pada Point 1 s/d 4 di atas, maka PT. Taro Rakaya Tasyra dibebaskan dari segala tuntutan hukum.
            </Text>
          </View>
        </View>

        <Text style={{ ...styles.closingText, fontSize: 10, marginTop: 10, marginBottom: 18 }}>
          Demikian Surat Pernyataan ini saya buat dengan sebenarnya dan untuk digunakan sebagaimana mestinya.
        </Text>

        <View style={{ ...styles.signatureSection, marginTop: 10 }}>
          <View style={styles.signatureBox}>
            <Text style={{ ...styles.signatureLocation, fontSize: 10, marginBottom: 2 }}>
              Lubuk Ogung, .....2025
            </Text>
            <Text style={{ ...styles.signatureName, fontSize: 10, marginBottom: 30 }}>Yang Menyatakan,</Text>
            <Text style={{ ...styles.signerName, fontSize: 10 }}>{supplier.ownerName}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
