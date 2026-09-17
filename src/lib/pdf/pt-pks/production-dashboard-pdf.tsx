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
        padding: 20,
        fontSize: 8,
        fontFamily: "Roboto",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#000",
        paddingBottom: 5,
    },
    logo: {
        width: 35,
        height: 35,
        marginRight: 10,
    },
    headerText: {
        flex: 1,
    },
    companyName: {
        fontSize: 12,
        fontFamily: "Roboto-Bold",
        marginBottom: 2,
    },
    companyAddress: {
        fontSize: 7,
        color: "#444",
    },
    title: {
        fontSize: 14,
        fontFamily: "Roboto-Bold",
        textAlign: "center",
        marginBottom: 2,
        textDecoration: "underline",
    },
    subtitle: {
        fontSize: 9,
        textAlign: "center",
        marginBottom: 10,
        color: "#444",
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: "Roboto-Bold",
        backgroundColor: "#f0f0f0",
        padding: 4,
        marginTop: 10,
        marginBottom: 5,
        borderLeftWidth: 3,
        borderLeftColor: "#2563eb",
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 5,
        marginBottom: 5,
    },
    card: {
        width: "24%",
        padding: 5,
        borderWidth: 0.5,
        borderColor: "#ccc",
        borderRadius: 2,
    },
    cardLabel: {
        fontSize: 6,
        color: "#666",
        marginBottom: 2,
    },
    cardValue: {
        fontSize: 10,
        fontFamily: "Roboto-Bold",
    },
    cardUnit: {
        fontSize: 6,
        color: "#666",
    },
    tankContainer: {
        marginTop: 4,
        borderTopWidth: 0.3,
        borderTopColor: "#eee",
        paddingTop: 2,
    },
    tankRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 5,
        color: "#555",
        marginBottom: 1,
    },
    table: {
        width: "100%",
        borderWidth: 0.5,
        borderColor: "#000",
        marginTop: 5,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: "#000",
        minHeight: 12,
        alignItems: "stretch",
    },
    tableHeader: {
        backgroundColor: "#e9ecef",
    },
    tableCell: {
        padding: 2,
        borderRightWidth: 0.5,
        borderRightColor: "#000",
        justifyContent: "center",
    },
    tableCellLast: {
        padding: 2,
        borderRightWidth: 0.5,
        borderRightColor: "#000",
        justifyContent: "center",
    },
    tableCellHeader: {
        fontFamily: "Roboto-Bold",
        fontSize: 7,
        textAlign: "center",
    },
    tableCellText: {
        fontSize: 7,
    },
    tableCellNumber: {
        fontSize: 7,
        textAlign: "right",
    },
    tableSubHeader: {
        backgroundColor: "#f8f9fa",
        fontFamily: "Roboto-Bold",
    },
    footer: {
        position: "absolute",
        bottom: 10,
        left: 20,
        right: 20,
        textAlign: "center",
        fontSize: 6,
        color: "#6c757d",
        borderTopWidth: 0.5,
        borderTopColor: "#dee2e6",
        paddingTop: 3,
    },
    signatureSection: {
        marginTop: 20,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    signatureBlock: {
        width: "25%",
        textAlign: "center",
    },
    signatureLabel: {
        fontSize: 8,
        marginBottom: 30,
    },
    signatureName: {
        fontSize: 8,
        fontFamily: "Roboto-Bold",
        textDecoration: "underline",
    },
    sideBySideContainer: {
        flexDirection: "row",
        gap: 10,
        marginTop: 5,
    },
    sideBySideSection: {
        flex: 1,
    },
});

const formatNum = (val: number, decimals = 0) =>
    val.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const ProductionDashboardDocument: React.FC<any> = ({
    data,
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

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    {logoBase64 ? <Image style={styles.logo} src={logoBase64} /> : null}
                    <View style={styles.headerText}>
                        <Text style={[styles.companyName, { textAlign: "center" }]}>{companyName || "PT TARO RAKAYA TASYRA"}</Text>
                        <Text style={[styles.companyAddress, { textAlign: "center" }]}>{companyAddress || "JL LINTAS LANGGAM KM. 3 DESA LUBUK OGONG"}</Text>
                        <Text style={[styles.companyAddress, { textAlign: "center" }]}>{companyAddress || "BANDAR SEI KIJANG. KAB. PELALAWAN, RIAU"}</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>{isRange ? "LAPORAN PRODUKSI PERIODE" : "LAPORAN HARIAN PRODUKSI"}</Text>
                <Text style={styles.subtitle}>{isRange ? "Periode" : "Per Tanggal"}: {formattedDate}</Text>

                {/* Section 1: Stock TBS */}
                <Text style={styles.sectionTitle}>I. RINGKASAN STOK TBS</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.tableCellHeader, { width: "20%" }]}>{isRange ? "Stok Awal Periode" : "Sisa Stok Kemarin"}</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader, { width: "20%" }]}>{isRange ? "Masuk Periode" : "Masuk Hari Ini"}</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader, { width: "20%" }]}>Total Stok s/d Akhir</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader, { width: "20%" }]}>{isRange ? "Akumulasi Bulan (P)" : "Masuk Bulan Ini"}</Text>
                        <Text style={[styles.tableCellLast, styles.tableCellHeader, { width: "20%" }]}>{isRange ? "Akumulasi Tahun (P)" : "Masuk Tahun Ini"}</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "20%" }]}>{formatNum(data.stockTbs.tbsHariIni)} kg</Text>
                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "20%" }]}>{formatNum(data.stockTbs.tbsBulanIni)} kg</Text>
                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "20%" }]}>{formatNum(data.stockTbs.stockTBS)} kg</Text>
                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "20%" }]}>{formatNum(data.stockTbs.tbsPeriode)} kg</Text>
                        <Text style={[styles.tableCellLast, styles.tableCellNumber, { width: "20%" }]}>{formatNum(data.stockTbs.tbsMasukTahunIni)} kg</Text>
                    </View>
                </View>

                <View style={styles.sideBySideContainer}>
                    {/* Section 2: Proses Produksi */}
                    <View style={styles.sideBySideSection}>
                        <Text style={styles.sectionTitle}>II. RINGKASAN PROSES PRODUKSI</Text>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <Text style={[styles.tableCell, styles.tableCellHeader, { width: "25%" }]}>Parameter</Text>
                                <Text style={[styles.tableCell, styles.tableCellHeader, { width: "25%" }]}>{isRange ? "Periode" : "HI"}</Text>
                                <Text style={[styles.tableCell, styles.tableCellHeader, { width: "25%" }]}>{isRange ? "Bulan (P)" : "BI"}</Text>
                                <Text style={[styles.tableCellLast, styles.tableCellHeader, { width: "25%" }]}>{isRange ? "Tahun (P)" : "TI"}</Text>
                            </View>

                            {/* TBS Input Row (Fixed) */}
                            <View style={[styles.tableRow, styles.tableSubHeader]}>
                                <Text style={[styles.tableCell, styles.tableCellText, { width: "25%" }]}>TBS Diolah (kg)</Text>
                                <Text style={[styles.tableCell, styles.tableCellNumber, { width: "25%" }]}>{formatNum((data.production.global || data.production).day.totalInput)}</Text>
                                <Text style={[styles.tableCell, styles.tableCellNumber, { width: "25%" }]}>{formatNum((data.production.global || data.production).month.totalInput)}</Text>
                                <Text style={[styles.tableCellLast, styles.tableCellNumber, { width: "25%" }]}>{formatNum((data.production.global || data.production).year.totalInput)}</Text>
                            </View>

                            {/* Product Rows */}
                            {data.production.products ? (
                                data.production.products.map((product: any, idx: number) => (
                                    <React.Fragment key={idx}>
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCell, styles.tableCellText, { width: "25%", fontFamily: "Roboto-Bold", fontSize: 6 }]}>{product.materialName}</Text>
                                            <Text style={[styles.tableCell, styles.tableCellNumber, { width: "25%", fontSize: 6 }]}>{formatNum(product.day.totalProduksi)}</Text>
                                            <Text style={[styles.tableCell, styles.tableCellNumber, { width: "25%", fontSize: 6 }]}>{formatNum(product.month.totalProduksi)}</Text>
                                            <Text style={[styles.tableCellLast, styles.tableCellNumber, { width: "25%", fontSize: 6 }]}>{formatNum(product.year.totalProduksi)}</Text>
                                        </View>
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCell, styles.tableCellText, { width: "25%", color: "#666", fontSize: 5 }]}>Rendemen (%)</Text>
                                            <Text style={[styles.tableCell, styles.tableCellNumber, { width: "25%", color: "#2563eb", fontSize: 5 }]}>{formatNum(product.day.totalRendemen, 2)} %</Text>
                                            <Text style={[styles.tableCell, styles.tableCellNumber, { width: "25%", color: "#2563eb", fontSize: 5 }]}>{formatNum(product.month.totalRendemen, 2)} %</Text>
                                            <Text style={[styles.tableCellLast, styles.tableCellNumber, { width: "25%", color: "#2563eb", fontSize: 5 }]}>{formatNum(product.year.totalRendemen, 2)} %</Text>
                                        </View>
                                    </React.Fragment>
                                ))
                            ) : (
                                <React.Fragment>
                                    <View style={styles.tableRow}>
                                        <Text style={[styles.tableCell, styles.tableCellText, { width: "25%", fontFamily: "Roboto-Bold" }]}>Produksi (kg)</Text>
                                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "25%" }]}>{formatNum(data.production.day.totalProduksi)}</Text>
                                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "25%" }]}>{formatNum(data.production.month.totalProduksi)}</Text>
                                        <Text style={[styles.tableCellLast, styles.tableCellNumber, { width: "25%" }]}>{formatNum(data.production.year.totalProduksi)}</Text>
                                    </View>
                                    <View style={styles.tableRow}>
                                        <Text style={[styles.tableCell, styles.tableCellText, { width: "25%", color: "#666", fontSize: 6 }]}>Rendemen (%)</Text>
                                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "25%", color: "#2563eb" }]}>{formatNum(data.production.day.totalRendemen, 2)} %</Text>
                                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "25%", color: "#2563eb" }]}>{formatNum(data.production.month.totalRendemen, 2)} %</Text>
                                        <Text style={[styles.tableCellLast, styles.tableCellNumber, { width: "25%", color: "#2563eb" }]}>{formatNum(data.production.year.totalRendemen, 2)} %</Text>
                                    </View>
                                </React.Fragment>
                            )}
                        </View>
                    </View>

                    {/* Section 3: Stock Product */}
                    <View style={styles.sideBySideSection}>
                        <Text style={styles.sectionTitle}>III. RINGKASAN STOK PRODUK & TANGKI</Text>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <Text style={[styles.tableCellLast, styles.tableCellHeader, { width: "100%", textAlign: "center" }]}>Detail Tangki / Keterangan</Text>
                            </View>

                            {data.stockProduct.materials.map((mat: any, mIdx: number) => (
                                <React.Fragment key={mIdx}>
                                    {/* Product Header Row */}
                                    <View style={[styles.tableRow, styles.tableSubHeader]}>
                                        <Text style={[styles.tableCellLast, styles.tableCellText, { width: "100%", fontFamily: "Roboto-Bold", backgroundColor: "#f0f7ff", fontSize: 6 }]}>
                                            {mat.materialName} ({formatNum(mat.netBalance)} {mat.satuan})
                                        </Text>
                                    </View>

                                    {/* Tank Rows for this material (Horizontal Layout) */}
                                    {mat.tanks && mat.tanks.length > 0 ? (
                                        <React.Fragment>
                                            {/* Tank Names Row */}
                                            <View style={[styles.tableRow, { backgroundColor: "#fafafa" }]}>
                                                {mat.tanks.map((tank: any, tIdx: number) => (
                                                    <Text key={`name-${tank.id}`} style={[styles.tableCell, { width: `${100 / mat.tanks.length}%`, fontSize: 5, fontFamily: "Roboto-Bold", textAlign: "center" }]}>
                                                        {tank.namaTangki}
                                                    </Text>
                                                ))}
                                            </View>
                                            {/* Tank Values Row */}
                                            <View style={styles.tableRow}>
                                                {mat.tanks.map((tank: any, tIdx: number) => (
                                                    <Text key={`val-${tank.id}`} style={[styles.tableCell, { width: `${100 / mat.tanks.length}%`, fontSize: 5, textAlign: "center", color: "#2563eb" }]}>
                                                        {formatNum(tank.isiPadaTanggal)}
                                                    </Text>
                                                ))}
                                            </View>
                                        </React.Fragment>
                                    ) : (
                                        <View style={[styles.tableRow, { height: "auto", padding: 2 }]}>
                                            <Text style={[styles.tableCellLast, { width: "100%", fontSize: 6, textAlign: "center", color: "#999" }]}>
                                                Stok: {formatNum(mat.netBalance)} kg
                                            </Text>
                                        </View>
                                    )}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                </View>
                {/* Section 4: Riwayat Pengiriman */}
                <Text style={styles.sectionTitle}>IV. REKAPITULASI PENGIRIMAN</Text>

                {(() => {
                    const groupedDelivery: Record<string, any[]> = {};
                    data.delivery.forEach((item: any) => {
                        if (!groupedDelivery[item.materialName]) {
                            groupedDelivery[item.materialName] = [];
                        }
                        (groupedDelivery[item.materialName] ?? []).push(item);
                    });

                    return Object.entries(groupedDelivery).map(([materialName, items], gIdx) => {
                        const groupTotals = items.reduce((acc, item) => ({
                            contractQuantity: acc.contractQuantity + (item.contractQuantity || 0),
                            hi: acc.hi + (item.hi || 0),
                            bi: acc.bi + (item.bi || 0),
                            ti: acc.ti + (item.ti || 0),
                            remaining: acc.remaining + (item.remaining || 0),
                        }), { contractQuantity: 0, hi: 0, bi: 0, ti: 0, remaining: 0 });

                        return (
                            <View key={gIdx} style={{ marginBottom: 10 }}>
                                <Text style={{ fontSize: 7, fontFamily: "Roboto-Bold", marginBottom: 2 }}>Produk: {materialName}</Text>
                                <View style={styles.table}>
                                    <View style={[styles.tableRow, styles.tableHeader]}>
                                        <Text style={[styles.tableCell, { width: "15%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>Buyer</Text>
                                        <Text style={[styles.tableCell, { width: "15%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>No. Kontrak</Text>
                                        <Text style={[styles.tableCell, { width: "10%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>No. PO</Text>
                                        <Text style={[styles.tableCell, { width: "10%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>No. DO</Text>
                                        <Text style={[styles.tableCell, { width: "10%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>Jml Kontrak</Text>
                                        <Text style={[styles.tableCell, { width: "8%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>{isRange ? "Periode" : "HI"}</Text>
                                        <Text style={[styles.tableCell, { width: "8%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>{isRange ? "Bulan(P)" : "BI"}</Text>
                                        <Text style={[styles.tableCell, { width: "8%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>{isRange ? "Tahun(P)" : "TI"}</Text>
                                        <Text style={[styles.tableCellLast, { width: "16%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>Sisa</Text>
                                    </View>
                                    {items.map((item, idx) => (
                                        <View key={idx} style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { width: "15%", fontSize: 5 }]}>{item.buyerName}</Text>
                                            <Text style={[styles.tableCell, { width: "15%", fontSize: 5 }]}>{item.contractNumber}</Text>
                                            <Text style={[styles.tableCell, { width: "10%", fontSize: 5 }]}>
                                                {item.contractCustomFields && Array.isArray(item.contractCustomFields)
                                                    ? (item.contractCustomFields.find((f: any) => f.fieldName === "Nomor PO")?.fieldValue || "-")
                                                    : "-"}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: "10%", fontSize: 5 }]}>
                                                {item.contractCustomFields && Array.isArray(item.contractCustomFields)
                                                    ? (item.contractCustomFields.find((f: any) => f.fieldName === "Nomor DO")?.fieldValue || "-")
                                                    : "-"}
                                            </Text>
                                            <Text style={[styles.tableCell, styles.tableCellNumber, { width: "10%", fontSize: 5 }]}>{formatNum(item.contractQuantity)}</Text>
                                            <Text style={[styles.tableCell, styles.tableCellNumber, { width: "8%", fontSize: 5 }]}>{formatNum(item.hi)}</Text>
                                            <Text style={[styles.tableCell, styles.tableCellNumber, { width: "8%", fontSize: 5 }]}>{formatNum(item.bi)}</Text>
                                            <Text style={[styles.tableCell, styles.tableCellNumber, { width: "8%", fontSize: 5 }]}>{formatNum(item.ti)}</Text>
                                            <Text style={[styles.tableCellLast, styles.tableCellNumber, { width: "16%", fontSize: 5 }]}>{formatNum(item.remaining)}</Text>
                                        </View>
                                    ))}

                                    {/* Total Row for this Product */}
                                    <View style={[styles.tableRow, { backgroundColor: "#f8f9fa" }]}>
                                        <Text style={[styles.tableCell, { width: "50%", textAlign: "right", fontSize: 5, fontFamily: "Roboto-Bold" }]}>TOTAL {materialName.toUpperCase()}</Text>
                                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "10%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>
                                            {formatNum(groupTotals.contractQuantity)}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "8%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>
                                            {formatNum(groupTotals.hi)}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "8%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>
                                            {formatNum(groupTotals.bi)}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.tableCellNumber, { width: "8%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>
                                            {formatNum(groupTotals.ti)}
                                        </Text>
                                        <Text style={[styles.tableCellLast, styles.tableCellNumber, { width: "16%", fontSize: 5, fontFamily: "Roboto-Bold" }]}>
                                            {formatNum(groupTotals.remaining)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    });
                })()}

                {/* Signatures */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Dibuat Oleh,</Text>
                        <Text style={styles.signatureName}>{createdByName || "-"}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Diperiksa Oleh,</Text>
                        <Text style={styles.signatureName}>Hawari</Text>
                        <Text style={{ fontSize: 6, marginTop: 2 }}>Asst. Laboratorium</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Diketahui Oleh,</Text>
                        <Text style={styles.signatureName}>Fajrian</Text>
                        <Text style={{ fontSize: 6, marginTop: 2 }}>KTU</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Disetujui Oleh,</Text>
                        <Text style={styles.signatureName}>Boslen Tamba</Text>
                        <Text style={{ fontSize: 6, marginTop: 2 }}>Mill Manager</Text>
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
