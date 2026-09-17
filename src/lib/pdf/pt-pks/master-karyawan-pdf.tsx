"use client";

import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
    pdf,
} from "@react-pdf/renderer";

// Constants
const COMPANY_NAME = "PT. TARO RAKAYA TASYRA";

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
        padding: 30,
        fontSize: 8,
        fontFamily: "Roboto",
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: "#059669",
        paddingBottom: 10,
    },
    headerInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#059669",
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
    printDate: {
        fontSize: 8,
        marginTop: 4,
        color: "#6b7280",
    },
    // Table
    table: {
        display: "flex",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    tableRow: {
        flexDirection: "row",
        minHeight: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    tableRowHeader: {
        flexDirection: "row",
        minHeight: 25,
        backgroundColor: "#f3f4f6",
        borderBottomWidth: 2,
        borderBottomColor: "#d1d5db",
    },
    tableCell: {
        padding: 5,
        borderRightWidth: 1,
        borderRightColor: "#e5e7eb",
        justifyContent: "center",
    },
    cellNo: { width: "5%" },
    cellNama: { width: "25%" },
    cellDivisi: { width: "15%" },
    cellJabatan: { width: "15%" },
    cellGol: { width: "8%" },
    cellTktk: { width: "8%" },
    cellRekening: { width: "12%" },
    cellStatus: { width: "12%", textAlign: "center" },
    textHeader: {
        fontSize: 8,
        fontWeight: "bold",
        textAlign: "center",
    },
    textNormal: {
        fontSize: 8,
    },
    footer: {
        position: "absolute",
        bottom: 20,
        left: 30,
        right: 30,
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 8,
        color: "#6b7280",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 10,
    },
});

interface KaryawanData {
    id: string;
    namaKaryawan: string;
    divisi: { nama: string } | null;
    jabatan: { nama: string } | null;
    gol: string | null;
    tktk: string | null;
    nomorRekening: string | null;
    isActive: boolean;
}

interface MasterKaryawanPDFProps {
    data: KaryawanData[];
}

export function MasterKaryawanPDF({ data }: MasterKaryawanPDFProps) {
    const printDate = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <Document title="Data Karyawan">
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerInfo}>
                        <Text style={styles.companyName}>{COMPANY_NAME}</Text>
                        <Text style={{ fontSize: 8, color: "#4b5563", marginTop: 2 }}>Data Master Karyawan Keseluruhan</Text>
                    </View>
                    <View style={styles.documentTitle}>
                        <Text style={styles.title}>LAPORAN DATA KARYAWAN</Text>
                        <Text style={styles.printDate}>Dicetak pada: {printDate}</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.tableRowHeader}>
                        <View style={[styles.tableCell, styles.cellNo]}>
                            <Text style={styles.textHeader}>NO</Text>
                        </View>
                        <View style={[styles.tableCell, styles.cellNama]}>
                            <Text style={styles.textHeader}>NAMA KARYAWAN</Text>
                        </View>
                        <View style={[styles.tableCell, styles.cellDivisi]}>
                            <Text style={styles.textHeader}>DIVISI</Text>
                        </View>
                        <View style={[styles.tableCell, styles.cellJabatan]}>
                            <Text style={styles.textHeader}>JABATAN</Text>
                        </View>
                        <View style={[styles.tableCell, styles.cellGol]}>
                            <Text style={styles.textHeader}>GOL</Text>
                        </View>
                        <View style={[styles.tableCell, styles.cellTktk]}>
                            <Text style={styles.textHeader}>TK/K</Text>
                        </View>
                        <View style={[styles.tableCell, styles.cellRekening]}>
                            <Text style={styles.textHeader}>NO. REKENING</Text>
                        </View>
                        <View style={[styles.tableCell, styles.cellStatus]}>
                            <Text style={styles.textHeader}>STATUS</Text>
                        </View>
                    </View>

                    {/* Data Rows */}
                    {data.map((item, index) => (
                        <View key={item.id} style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.cellNo]}>
                                <Text style={[styles.textNormal, { textAlign: "center" }]}>{index + 1}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.cellNama]}>
                                <Text style={styles.textNormal}>{item.namaKaryawan}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.cellDivisi]}>
                                <Text style={styles.textNormal}>{item.divisi?.nama || "-"}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.cellJabatan]}>
                                <Text style={styles.textNormal}>{item.jabatan?.nama || "-"}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.cellGol]}>
                                <Text style={[styles.textNormal, { textAlign: "center" }]}>{item.gol || "-"}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.cellTktk]}>
                                <Text style={[styles.textNormal, { textAlign: "center" }]}>{item.tktk || "-"}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.cellRekening]}>
                                <Text style={styles.textNormal}>{item.nomorRekening || "-"}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.cellStatus]}>
                                <Text style={[styles.textNormal, { textAlign: "center", color: item.isActive ? "#059669" : "#dc2626" }]}>
                                    {item.isActive ? "Aktif" : "Non-Aktif"}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Total Karyawan: {data.length}</Text>
                    <Text render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
}

export async function downloadMasterKaryawanPDF(data: KaryawanData[]) {
    const blob = await pdf(<MasterKaryawanPDF data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Data_Karyawan_${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
