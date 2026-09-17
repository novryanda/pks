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

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 9,
        fontFamily: "Roboto",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#000",
        paddingBottom: 10,
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: 15,
    },
    headerText: {
        flex: 1,
    },
    companyName: {
        fontSize: 14,
        fontFamily: "Roboto-Bold",
        marginBottom: 2,
    },
    companyAddress: {
        fontSize: 9,
        color: "#444",
    },
    title: {
        fontSize: 16,
        fontFamily: "Roboto-Bold",
        textAlign: "center",
        marginBottom: 5,
        textDecoration: "underline",
    },
    subtitle: {
        fontSize: 10,
        textAlign: "center",
        marginBottom: 20,
        color: "#444",
    },
    summaryContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 20,
        gap: 10,
    },
    summaryCard: {
        width: "48%",
        padding: 10,
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#dee2e6",
        borderRadius: 4,
    },
    summaryLabel: {
        fontSize: 8,
        color: "#6c757d",
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 14,
        fontFamily: "Roboto-Bold",
        color: "#212529",
    },
    summaryUnit: {
        fontSize: 8,
        color: "#6c757d",
        marginTop: 2,
    },
    table: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#000",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#000",
        minHeight: 24,
        alignItems: "center",
    },
    tableHeader: {
        backgroundColor: "#e9ecef",
    },
    tableCell: {
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: "#000",
    },
    tableCellLast: {
        padding: 4,
        borderRightWidth: 0,
    },
    tableCellHeader: {
        fontFamily: "Roboto-Bold",
        fontSize: 9,
        textAlign: "center",
    },
    tableCellText: {
        fontSize: 8,
    },
    tableCellNumber: {
        fontSize: 8,
        textAlign: "right",
    },
    colNo: { width: "5%" },
    colMaterial: { width: "25%" },
    colStock: { width: "18%" },
    colHarga: { width: "22%" },
    colNilai: { width: "30%" },
    totalRow: {
        backgroundColor: "#d4edda",
        borderTopWidth: 2,
        borderTopColor: "#000",
    },
    footer: {
        position: "absolute",
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: "center",
        fontSize: 8,
        color: "#6c757d",
        borderTopWidth: 0.5,
        borderTopColor: "#dee2e6",
        paddingTop: 5,
    },
    signatureSection: {
        marginTop: 40,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    signatureBlock: {
        width: "30%",
        textAlign: "center",
    },
    signatureLabel: {
        fontSize: 10,
        marginBottom: 50,
    },
    signatureName: {
        fontSize: 10,
        fontFamily: "Roboto-Bold",
        textDecoration: "underline",
    },
});

type MaterialData = {
    materialId: string;
    materialName: string;
    satuan: string;
    netBalance: number;
    netPeriod: number;
    hargaPerUnit: number;
    nilaiTotal: number;
};

type StockProductPDFProps = {
    data: MaterialData[];
    startDate: string;
    endDate: string;
    companyName?: string;
    companyAddress?: string;
    createdByName?: string;
    stats?: {
        production: { period: number };
        shipping: { period: number };
        net: { period: number };
    };
};

const formatWeight = (val: number) =>
    val.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val);

export function StockProductDocument({
    data,
    startDate,
    endDate,
    companyName,
    companyAddress,
    createdByName,
    stats,
}: StockProductPDFProps) {
    const isRange = startDate !== endDate;
    const formattedDate = isRange
        ? `${format(new Date(startDate), "dd MMM yyyy", { locale: idLocale })} s/d ${format(new Date(endDate), "dd MMM yyyy", { locale: idLocale })}`
        : format(new Date(startDate), "dd MMMM yyyy", { locale: idLocale });

    const totalNilai = data.reduce((sum, item) => sum + (item.nilaiTotal || 0), 0);
    const totalStock = data.reduce((sum, item) => sum + (item.netBalance || 0), 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    {logoBase64 && <Image style={styles.logo} src={logoBase64} />}
                    <View style={styles.headerText}>
                        <Text style={styles.companyName}>{companyName || "PT TARO RAKAYA TASYRA"}</Text>
                        <Text style={styles.companyAddress}>{companyAddress || "JL LINTAS LANGGAM KM. 3 DESA LUBUK OGONG"}</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>LAPORAN STOCK PRODUCT & NILAI</Text>
                <Text style={styles.subtitle}>{isRange ? "Periode" : "Per Tanggal"}: {formattedDate}</Text>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    {isRange ? (
                        <>
                            <View style={[styles.summaryCard, { width: "31%" }]}>
                                <Text style={styles.summaryLabel}>Produksi Periode</Text>
                                <Text style={[styles.summaryValue, { color: "#2563eb", fontSize: 11 }]}>{formatWeight(stats?.production.period || 0)}</Text>
                                <Text style={styles.summaryUnit}>Kilogram (kg)</Text>
                            </View>
                            <View style={[styles.summaryCard, { width: "31%", backgroundColor: "#fff9f2" }]}>
                                <Text style={styles.summaryLabel}>Pengiriman Periode</Text>
                                <Text style={[styles.summaryValue, { color: "#ea580c", fontSize: 11 }]}>{formatWeight(stats?.shipping.period || 0)}</Text>
                                <Text style={styles.summaryUnit}>Kilogram (kg)</Text>
                            </View>
                            <View style={[styles.summaryCard, { width: "31%", backgroundColor: "#f0fdfa" }]}>
                                <Text style={styles.summaryLabel}>Sisa Stok (Net) Periode</Text>
                                <Text style={[styles.summaryValue, { color: "#0891b2", fontSize: 11 }]}>{formatWeight(stats?.net.period || 0)}</Text>
                                <Text style={styles.summaryUnit}>Kilogram (kg)</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Total Stok Produk</Text>
                                <Text style={styles.summaryValue}>{formatWeight(totalStock)}</Text>
                                <Text style={styles.summaryUnit}>Kilogram (kg)</Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: "#d4edda" }]}>
                                <Text style={styles.summaryLabel}>Total Nilai Stok</Text>
                                <Text style={[styles.summaryValue, { color: "#155724" }]}>{formatCurrency(totalNilai)}</Text>
                                <Text style={styles.summaryUnit}>Rupiah</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.tableCellHeader, styles.colNo]}>No</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader, styles.colMaterial]}>Material</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader, styles.colStock]}>Stok (kg)</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader, styles.colHarga]}>Harga/kg</Text>
                        <Text style={[styles.tableCellLast, styles.tableCellHeader, styles.colNilai]}>Nilai Total</Text>
                    </View>

                    {data.map((item, index) => (
                        <React.Fragment key={item.materialId}>
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.tableCellText, styles.colNo, { textAlign: "center" }]}>
                                    {index + 1}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCellText, styles.colMaterial]}>
                                    {item.materialName}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCellNumber, styles.colStock]}>
                                    {formatWeight(item.netBalance || 0)}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCellNumber, styles.colHarga]}>
                                    {formatCurrency(item.hargaPerUnit || 0)}
                                </Text>
                                <Text style={[styles.tableCellLast, styles.tableCellNumber, styles.colNilai]}>
                                    {formatCurrency(item.nilaiTotal || 0)}
                                </Text>
                            </View>
                            {isRange && (
                                <View style={[styles.tableRow, { backgroundColor: "#fff9f2", borderBottomColor: "#dee2e6" }]}>
                                    <Text style={[styles.tableCell, { width: "5%", borderRightWidth: 1, borderRightColor: "#000" }]}></Text>
                                    <Text style={[styles.tableCell, { width: "25%", fontSize: 7, color: "#ea580c", borderRightWidth: 1, borderRightColor: "#000" }]}>
                                        {"  "}Pergerakan Net Periode:
                                    </Text>
                                    <Text style={[styles.tableCell, styles.tableCellNumber, { width: "18%", color: "#ea580c", borderRightWidth: 1, borderRightColor: "#000" }]}>
                                        {formatWeight(item.netPeriod || 0)} kg
                                    </Text>
                                    <Text style={[styles.tableCellLast, { width: "52%" }]}></Text>
                                </View>
                            )}
                        </React.Fragment>
                    ))}

                    {/* Total Row */}
                    <View style={[styles.tableRow, styles.totalRow]}>
                        <Text style={[styles.tableCell, styles.tableCellHeader, { width: "30%", textAlign: "right" }]}>
                            TOTAL
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellNumber, styles.colStock, { fontFamily: "Roboto-Bold" }]}>
                            {formatWeight(totalStock)}
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellNumber, styles.colHarga]}>-</Text>
                        <Text style={[styles.tableCellLast, styles.tableCellNumber, styles.colNilai, { fontFamily: "Roboto-Bold" }]}>
                            {formatCurrency(totalNilai)}
                        </Text>
                    </View>
                </View>

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Dibuat Oleh,</Text>
                        <Text style={styles.signatureName}>{createdByName || "-"}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Diperiksa Oleh,</Text>
                        <Text style={styles.signatureName}>Fajrian</Text>
                        <Text style={{ fontSize: 8, marginTop: 2 }}>KTU</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Diketahui Oleh,</Text>
                        <Text style={styles.signatureName}>Boslen Tamba</Text>
                        <Text style={{ fontSize: 8, marginTop: 2 }}>Mill Manager</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Dicetak pada: {format(new Date(), "dd/MM/yyyy HH:mm:ss")} | HT-Group App
                </Text>
            </Page>
        </Document>
    );
}
