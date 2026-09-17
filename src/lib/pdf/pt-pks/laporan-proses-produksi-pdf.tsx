import ReactPDF, {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
    fontSize: 9,
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: "#333",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 5,
  },
  companyName: {
    fontSize: 12,
    fontWeight: 500,
    textAlign: "center",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 10,
    textAlign: "center",
    color: "#666",
  },
  infoSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: "30%",
    fontWeight: 500,
  },
  infoValue: {
    width: "70%",
  },
  summarySection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#e3f2fd",
    borderRadius: 4,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: "#1976d2",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryItem: {
    width: "50%",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1976d2",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#333",
    color: "#fff",
    padding: 6,
    fontWeight: 700,
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    padding: 6,
    fontSize: 8,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    padding: 6,
    fontSize: 8,
    backgroundColor: "#f9f9f9",
  },
  col1: { width: "8%" },
  col2: { width: "12%" },
  col3: { width: "15%" },
  col4: { width: "12%" },
  col5: { width: "15%" },
  col6: { width: "10%" },
  col7: { width: "10%" },
  col8: { width: "18%" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
  breakdownSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: "#333",
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  breakdownCard: {
    width: "48%",
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    marginBottom: 8,
  },
  breakdownCardTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 6,
    color: "#333",
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  breakdownLabel: {
    fontSize: 8,
    color: "#666",
  },
  breakdownValue: {
    fontSize: 8,
    fontWeight: 500,
  },
});

interface ProsesProduksiData {
  id: string;
  nomorProduksi: string;
  tanggalProduksi: Date;
  materialInput: {
    name: string;
    code: string;
    kategori: { name: string };
    satuan: { name: string };
  };
  jumlahInput: number;
  operatorProduksi: string;
  status: string;
  hasilProduksi: Array<{
    materialOutput: {
      name: string;
      code: string;
      kategori: { name: string };
      satuan: { name: string };
    };
    jumlahOutput: number;
    rendemen: number;
  }>;
}

interface LaporanProsesProduksiPDFProps {
  data: ProsesProduksiData[];
  company?: {
    name: string;
    address?: string;
  };
  periode?: {
    tanggalMulai?: string;
    tanggalAkhir?: string;
  };
  materialOutputId?: string;
}

const LaporanProsesProduksiPDF = ({
  data,
  company,
  periode,
}: LaporanProsesProduksiPDFProps) => {
  // Calculate summary
  let totalProduksi = 0;
  let totalInput = 0;
  let totalRendemen = 0;
  let countProses = 0;
  let countHasil = 0;

  const productionByMaterial: Record<
    string,
    {
      materialName: string;
      materialCode: string;
      kategoriName: string;
      totalOutput: number;
      totalRendemen: number;
      count: number;
    }
  > = {};

  data.forEach((proses) => {
    totalInput += proses.jumlahInput;
    countProses++;

    proses.hasilProduksi.forEach((hasil) => {
      totalProduksi += hasil.jumlahOutput;
      totalRendemen += hasil.rendemen;
      countHasil++;

      const key = hasil.materialOutput.code;
      if (!productionByMaterial[key]) {
        productionByMaterial[key] = {
          materialName: hasil.materialOutput.name,
          materialCode: hasil.materialOutput.code,
          kategoriName: hasil.materialOutput.kategori.name,
          totalOutput: 0,
          totalRendemen: 0,
          count: 0,
        };
      }

      productionByMaterial[key].totalOutput += hasil.jumlahOutput;
      productionByMaterial[key].totalRendemen += hasil.rendemen;
      productionByMaterial[key].count++;
    });
  });

  const rataRataProduksi = countProses > 0 ? totalProduksi / countProses : 0;
  const rataRataRendemen = countHasil > 0 ? totalRendemen / countHasil : 0;

  const productionBreakdown = Object.values(productionByMaterial);

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Header */}
        <View style={styles.header}>
          {company && (
            <Text style={styles.companyName}>{company.name}</Text>
          )}
          <Text style={styles.title}>LAPORAN PROSES PRODUKSI</Text>
          {periode?.tanggalMulai && periode?.tanggalAkhir && (
            <Text style={styles.subtitle}>
              Periode:{" "}
              {format(new Date(periode.tanggalMulai), "dd MMMM yyyy", {
                locale: idLocale,
              })}{" "}
              s/d{" "}
              {format(new Date(periode.tanggalAkhir), "dd MMMM yyyy", {
                locale: idLocale,
              })}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Dicetak: {format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })}
          </Text>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>RINGKASAN PRODUKSI</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Input (TBS)</Text>
              <Text style={styles.summaryValue}>
                {totalInput.toLocaleString("id-ID", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                kg
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Produksi (Output)</Text>
              <Text style={styles.summaryValue}>
                {totalProduksi.toLocaleString("id-ID", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                kg
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Rata-rata Produksi/Proses</Text>
              <Text style={styles.summaryValue}>
                {rataRataProduksi.toLocaleString("id-ID", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                kg
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Rata-rata Rendemen</Text>
              <Text style={styles.summaryValue}>
                {rataRataRendemen.toLocaleString("id-ID", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                %
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Proses</Text>
              <Text style={styles.summaryValue}>{countProses}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Rendemen</Text>
              <Text style={styles.summaryValue}>
                {totalRendemen.toLocaleString("id-ID", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                %
              </Text>
            </View>
          </View>
        </View>

        {/* Production Breakdown by Material */}
        {productionBreakdown.length > 0 && (
          <View style={styles.breakdownSection}>
            <Text style={styles.breakdownTitle}>BREAKDOWN PER PRODUK</Text>
            <View style={styles.breakdownGrid}>
              {productionBreakdown.map((item, index) => (
                <View key={index} style={styles.breakdownCard}>
                  <Text style={styles.breakdownCardTitle}>
                    {item.materialName} ({item.materialCode})
                  </Text>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Total Output:</Text>
                    <Text style={styles.breakdownValue}>
                      {item.totalOutput.toLocaleString("id-ID", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      kg
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Rata-rata Output:</Text>
                    <Text style={styles.breakdownValue}>
                      {(item.totalOutput / item.count).toLocaleString("id-ID", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      kg
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Rata-rata Rendemen:</Text>
                    <Text style={styles.breakdownValue}>
                      {(item.totalRendemen / item.count).toLocaleString("id-ID", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      %
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Jumlah Proses:</Text>
                    <Text style={styles.breakdownValue}>{item.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>No</Text>
            <Text style={styles.col2}>No. Produksi</Text>
            <Text style={styles.col3}>Tanggal</Text>
            <Text style={styles.col4}>Material Input</Text>
            <Text style={styles.col5}>Material Output</Text>
            <Text style={styles.col6}>Input (kg)</Text>
            <Text style={styles.col6}>Output (kg)</Text>
            <Text style={styles.col7}>Rendemen (%)</Text>
            <Text style={styles.col8}>Operator</Text>
          </View>
          {data.map((proses, prosesIndex) =>
            proses.hasilProduksi.map((hasil, hasilIndex) => (
              <View
                key={`${proses.id}-${hasilIndex}`}
                style={prosesIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.col1}>
                  {hasilIndex === 0 ? prosesIndex + 1 : ""}
                </Text>
                <Text style={styles.col2}>
                  {hasilIndex === 0 ? proses.nomorProduksi : ""}
                </Text>
                <Text style={styles.col3}>
                  {hasilIndex === 0
                    ? format(new Date(proses.tanggalProduksi), "dd/MM/yyyy")
                    : ""}
                </Text>
                <Text style={styles.col4}>
                  {hasilIndex === 0 ? proses.materialInput.name : ""}
                </Text>
                <Text style={styles.col5}>
                  {hasil.materialOutput.name} ({hasil.materialOutput.code})
                </Text>
                <Text style={styles.col6}>
                  {hasilIndex === 0
                    ? proses.jumlahInput.toLocaleString("id-ID", {
                        minimumFractionDigits: 2,
                      })
                    : ""}
                </Text>
                <Text style={styles.col6}>
                  {hasil.jumlahOutput.toLocaleString("id-ID", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text style={styles.col7}>
                  {hasil.rendemen.toLocaleString("id-ID", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text style={styles.col8}>
                  {hasilIndex === 0 ? proses.operatorProduksi : ""}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Laporan Proses Produksi - Halaman 1 - Dicetak pada{" "}
          {format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })}
        </Text>
      </Page>
    </Document>
  );
};

export async function generateLaporanProsesProduksiPDF(
  props: LaporanProsesProduksiPDFProps
): Promise<Buffer> {
  const stream = await ReactPDF.renderToStream(
    <LaporanProsesProduksiPDF {...props} />
  );

  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export default LaporanProsesProduksiPDF;
