import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    Image,
    pdf,
} from "@react-pdf/renderer";
import { getLogoBase64, COMPANY_NAME, COMPANY_SUBTITLE } from "../logo";
import { calculateTotalMenitDibayar, LEMBUR_TYPES, type LemburType } from "@/server/schema/penggajian";
import { type SlipGajiPDFData } from "./slip-gaji-pdf";

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
        marginBottom: 15,
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
    // Net Pay
    netPayBox: {
        backgroundColor: "#ea580c",
        padding: 12,
        borderRadius: 4,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
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
    // Signature Section
    signatureSection: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 30,
    },
    signatureBox: {
        alignItems: "center",
        width: 150,
    },
    signatureTitle: {
        fontSize: 9,
        marginBottom: 45,
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
});

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

export function SlipLemburPDF({ data }: { data: SlipGajiPDFData }) {
    const logo = getLogoBase64();

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Image src={logo} style={styles.logo} />
                    <View style={styles.headerInfo}>
                        <Text style={styles.companyName}>{COMPANY_NAME}</Text>
                        <Text style={styles.companySubtitle}>{COMPANY_SUBTITLE}</Text>
                    </View>
                    <View style={styles.documentTitle}>
                        <Text style={styles.title}>SLIP LEMBUR</Text>
                        <Text style={styles.periodeText}>
                            Periode: {getMonthName(data.periodeBulan)} {data.periodeTahun}
                        </Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoBox}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nama</Text>
                            <Text style={styles.infoValue}>: {data.namaKaryawan}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Jabatan</Text>
                            <Text style={styles.infoValue}>: {data.jabatan || "-"}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Divisi</Text>
                            <Text style={styles.infoValue}>: {data.devisi || "-"}</Text>
                        </View>
                    </View>
                    <View style={styles.infoBox}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Golongan</Text>
                            <Text style={styles.infoValue}>: {data.gol || "-"}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Rekening</Text>
                            <Text style={styles.infoValue}>: {data.nomorRekening || "-"}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tgl Cetak</Text>
                            <Text style={styles.infoValue}>: {new Date().toLocaleDateString("id-ID")}</Text>
                        </View>
                    </View>
                </View>

                {/* Lembur Table */}
                <View style={styles.lemburSection}>
                    <Text style={styles.sectionTitle}>RINCIAN JAM LEMBUR</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <View style={[styles.tableHeaderCell, { width: 30 }]}><Text>TGL</Text></View>
                            <View style={[styles.tableHeaderCell, { flex: 1 }]}><Text>Keterangan</Text></View>
                            <View style={[styles.tableHeaderCell, { width: 50 }]}><Text>UPAH/JAM</Text></View>
                            <View style={[styles.tableHeaderCell, { width: 30 }]}><Text>J.P</Text></View>
                            <View style={[styles.tableHeaderCell, { width: 35 }]}><Text>x1.5</Text></View>
                            <View style={[styles.tableHeaderCell, { width: 35 }]}><Text>x2</Text></View>
                            <View style={[styles.tableHeaderCell, { width: 35 }]}><Text>x3</Text></View>
                            <View style={[styles.tableHeaderCell, { width: 35 }]}><Text>x4</Text></View>
                            <View style={[styles.tableHeaderCell, { width: 50 }]}><Text>TOT (J)</Text></View>
                            <View style={[styles.tableHeaderCell, { width: 55 }]}><Text>BAYAR (J)</Text></View>
                        </View>
                        {data.lemburDetail && Object.entries(data.lemburDetail)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([day, item], index, array) => {
                                const totalMinutes = item.x15 + item.x2 + item.x3 + item.x4;
                                const paidMinutes = calculateTotalMenitDibayar(item);
                                const hourlyRate = Math.round(data.gajiPokok / 173);
                                const isLast = index === array.length - 1;
                                const keterangan = item.keterangan?.trim() || getLemburTypeLabel(item.type);
                                return (
                                    <View key={day} style={isLast ? styles.tableRowLast : styles.tableRow}>
                                        <View style={[styles.tableCell, { width: 30 }]}><Text>{day}</Text></View>
                                        <View style={[styles.tableCellLeft, { flex: 1 }]}><Text>{keterangan}</Text></View>
                                        <View style={[styles.tableCell, { width: 50, fontWeight: 'bold' }]}><Text>{formatCurrency(hourlyRate)}</Text></View>
                                        <View style={[styles.tableCell, { width: 30 }]}><Text>{item.hours || "-"}</Text></View>
                                        <View style={[styles.tableCell, { width: 35 }]}><Text>{(item.x15 / 60).toFixed(1)}</Text></View>
                                        <View style={[styles.tableCell, { width: 35 }]}><Text>{(item.x2 / 60).toFixed(1)}</Text></View>
                                        <View style={[styles.tableCell, { width: 35 }]}><Text>{(item.x3 / 60).toFixed(1)}</Text></View>
                                        <View style={[styles.tableCell, { width: 35 }]}><Text>{(item.x4 / 60).toFixed(1)}</Text></View>
                                        <View style={[styles.tableCell, { width: 50 }]}><Text>{(totalMinutes / 60).toFixed(1)}</Text></View>
                                        <View style={[styles.tableCellOrange, { width: 55 }]}><Text>{(paidMinutes / 60).toFixed(1)}</Text></View>
                                    </View>
                                );
                            })}
                        <View style={styles.tableFooter}>
                            <View style={[styles.tableFooterCell, { flex: 1 + 30 / 100 + 50 / 100, textAlign: 'right', paddingRight: 10 }]}><Text>TOTAL</Text></View>
                            <View style={[styles.tableFooterCell, { width: 30 }]}><Text>{(Object.values(data.lemburDetail || {}).reduce((acc, i) => acc + (i.hours || 0), 0))}</Text></View>
                            <View style={[styles.tableFooterCell, { width: 35 }]}><Text>{(Object.values(data.lemburDetail || {}).reduce((acc, i) => acc + i.x15, 0) / 60).toFixed(1)}</Text></View>
                            <View style={[styles.tableFooterCell, { width: 35 }]}><Text>{(Object.values(data.lemburDetail || {}).reduce((acc, i) => acc + i.x2, 0) / 60).toFixed(1)}</Text></View>
                            <View style={[styles.tableFooterCell, { width: 35 }]}><Text>{(Object.values(data.lemburDetail || {}).reduce((acc, i) => acc + i.x3, 0) / 60).toFixed(1)}</Text></View>
                            <View style={[styles.tableFooterCell, { width: 35 }]}><Text>{(Object.values(data.lemburDetail || {}).reduce((acc, i) => acc + i.x4, 0) / 60).toFixed(1)}</Text></View>
                            <View style={[styles.tableHeaderCell, { width: 50, backgroundColor: '#f3f4f6' }]}><Text>{(Object.values(data.lemburDetail || {}).reduce((acc, i) => acc + (i.x15 + i.x2 + i.x3 + i.x4), 0) / 60).toFixed(1)}</Text></View>
                            <View style={[styles.tableHeaderCell, { width: 55, backgroundColor: '#ea580c', color: '#ffffff' }]}><Text>{(data.totalMenitDibayar / 60).toFixed(1)}</Text></View>
                        </View>
                    </View>
                </View>

                {/* Upah Lembur */}
                <View style={styles.netPayBox}>
                    <Text style={styles.netPayLabel}>TOTAL UPAH LEMBUR</Text>
                    <Text style={styles.netPayValue}>Rp {formatCurrency(data.overtime)}</Text>
                </View>

                {/* Signature Section
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureTitle}>Disetujui Oleh,</Text>
                        <Text style={styles.signatureName}>HRD</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureTitle}>Diterima Oleh,</Text>
                        <Text style={styles.signatureName}>{data.namaKaryawan}</Text>
                    </View>
                </View> */}
            </Page>
        </Document>
    );
}

export async function downloadSlipLemburPDF(data: SlipGajiPDFData): Promise<void> {
    const blob = await pdf(<SlipLemburPDF data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `slip-lembur-${data.namaKaryawan.replace(/\s+/g, "-")}-${data.periodeBulan}-${data.periodeTahun}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
