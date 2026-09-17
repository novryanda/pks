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
    tableTitle: {
        fontSize: 12,
        fontFamily: "Roboto-Bold",
        marginBottom: 10,
        marginTop: 10,
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
        minHeight: 20,
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
    colSupplier: { width: "35%" },
    colCount: { width: "15%" },
    colWeight: { width: "20%" },
    colAvg: { width: "15%" },
    colPercent: { width: "10%" },
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

type SupplierData = {
    supplierId: string;
    supplier?: { ownerName: string; type: string };
    _sum: { beratNetto2: number | null };
    _count: { id: number };
};

type StockTBSData = {
    tbsHariIni: number;
    tbsBulanIni: number;
    tbsPeriode: number;
    tbsMasukTahunIni: number;
    stockTBS: number;
    tbsBySupplier: SupplierData[];
};

type StockTBSPDFProps = {
    data: StockTBSData;
    materialName: string;
    startDate: string;
    endDate: string;
    companyName?: string;
    companyAddress?: string;
    createdByName?: string;
};

const formatWeight = (val: number) => val.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const StockTBSDocument: React.FC<StockTBSPDFProps> = ({
    data,
    materialName,
    startDate,
    endDate,
    companyName,
    companyAddress,
    createdByName,
}) => {
    const isRange = startDate !== endDate;
    const formattedDate = isRange
        ? `${format(new Date(startDate), "dd MMM yyyy", { locale: idLocale })} s/d ${format(new Date(endDate), "dd MMM yyyy", { locale: idLocale })}`
        : format(new Date(startDate), "dd MMMM yyyy", { locale: idLocale });

    const totalWeightAll = data.tbsBySupplier.reduce((sum, s) => sum + (s._sum.beratNetto2 || 0), 0);

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
                <Text style={styles.title}>LAPORAN STOCK TBS</Text>
                <Text style={styles.subtitle}>Material: {materialName} | {isRange ? "Periode" : "Per Tanggal"}: {formattedDate}</Text>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{isRange ? "Stok Awal Periode" : "Sisa Stok Kemarin"}</Text>
                        <Text style={styles.summaryValue}>{formatWeight(data.tbsHariIni)}</Text>
                        <Text style={styles.summaryUnit}>Kilogram (kg)</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{isRange ? "TBS Masuk Periode" : "TBS Masuk Hari Ini"}</Text>
                        <Text style={styles.summaryValue}>{formatWeight(data.tbsBulanIni)}</Text>
                        <Text style={styles.summaryUnit}>Kilogram (kg)</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{isRange ? "Akumulasi Bulan (P)" : "TBS Masuk Bulan Ini"}</Text>
                        <Text style={styles.summaryValue}>{formatWeight(data.tbsPeriode)}</Text>
                        <Text style={styles.summaryUnit}>Kilogram (kg)</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{isRange ? "Akumulasi Tahun (P)" : "TBS MASUK sampai tahun ini"}</Text>
                        <Text style={styles.summaryValue}>{formatWeight(data.tbsMasukTahunIni || 0)}</Text>
                        <Text style={styles.summaryUnit}>Kilogram (kg)</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{isRange ? "Total Stok s/d Akhir" : "total stok TBS sampai saat ini"}</Text>
                        <Text style={styles.summaryValue}>{formatWeight(data.stockTBS)}</Text>
                        <Text style={styles.summaryUnit}>Kilogram (kg)</Text>
                    </View>
                </View>

                {/* Table Detail */}
                <Text style={styles.tableTitle}>Daftar Penerimaan per Supplier</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.tableCellHeader, styles.colNo]}>No</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader, styles.colSupplier]}>Nama Supplier</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader, styles.colCount]}>Jml Terima</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader, styles.colWeight]}>Total Berat (kg)</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader, styles.colAvg]}>Rata-rata</Text>
                        <Text style={[styles.tableCellLast, styles.tableCellHeader, styles.colPercent]}>%</Text>
                    </View>

                    {data.tbsBySupplier.map((item, index) => {
                        const weight = item._sum.beratNetto2 || 0;
                        const percentage = totalWeightAll > 0 ? (weight / totalWeightAll) * 100 : 0;
                        const avg = item._count.id > 0 ? weight / item._count.id : 0;

                        return (
                            <View key={item.supplierId} style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.tableCellText, styles.colNo, { textAlign: "center" }]}>{index + 1}</Text>
                                <Text style={[styles.tableCell, styles.tableCellText, styles.colSupplier]}>{item.supplier?.ownerName || "Unknown"}</Text>
                                <Text style={[styles.tableCell, styles.tableCellNumber, styles.colCount]}>{item._count.id}</Text>
                                <Text style={[styles.tableCell, styles.tableCellNumber, styles.colWeight]}>{formatWeight(weight)}</Text>
                                <Text style={[styles.tableCell, styles.tableCellNumber, styles.colAvg]}>{formatWeight(avg)}</Text>
                                <Text style={[styles.tableCellLast, styles.tableCellNumber, styles.colPercent]}>{percentage.toFixed(1)}%</Text>
                            </View>
                        );
                    })}

                    {/* Total Row */}
                    <View style={[styles.tableRow, { backgroundColor: "#f8f9fa" }]}>
                        <Text style={[styles.tableCell, styles.tableCellHeader, { width: "40%", textAlign: "right" }]}>TOTAL</Text>
                        <Text style={[styles.tableCell, styles.tableCellNumber, styles.colCount, { fontFamily: "Roboto-Bold" }]}>
                            {data.tbsBySupplier.reduce((sum, s) => sum + s._count.id, 0)}
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellNumber, styles.colWeight, { fontFamily: "Roboto-Bold" }]}>
                            {formatWeight(totalWeightAll)}
                        </Text>
                        <Text style={[styles.tableCell, styles.tableCellNumber, styles.colAvg]}>-</Text>
                        <Text style={[styles.tableCellLast, styles.tableCellNumber, styles.colPercent, { fontFamily: "Roboto-Bold" }]}>100%</Text>
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
};
