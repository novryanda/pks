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
import { type PenggajianKaryawanData, type ColumnVisibility } from "./rekap-penggajian-pdf";

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
        padding: 20,
        fontSize: 8,
        fontFamily: "Roboto",
        backgroundColor: "#ffffff",
    },
    header: {
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: "#059669",
        paddingBottom: 8,
    },
    companyName: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#059669",
    },
    title: {
        fontSize: 12,
        fontWeight: "bold",
        marginTop: 4,
        color: "#374151",
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
        alignItems: "center",
    },
    tableRowHeader: {
        flexDirection: "row",
        minHeight: 25,
        backgroundColor: "#f3f4f6",
        borderBottomWidth: 1,
        borderBottomColor: "#d1d5db",
        alignItems: "center",
    },
    tableRowAlt: {
        flexDirection: "row",
        minHeight: 20,
        backgroundColor: "#f9fafb",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        alignItems: "center",
    },
    tableCell: {
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: "#e5e7eb",
        height: "100%",
        justifyContent: "center",
    },
    tableCellHeader: {
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: "#d1d5db",
        height: "100%",
        justifyContent: "center",
    },
    cellNo: { width: 25 },
    cellNama: { width: 120 },
    cellJabatan: { width: 90 },
    cellLembur: { width: 35, textAlign: "center" },
    cellTotalJam: { width: 45, textAlign: "center" },
    cellCurrency: { width: 70, textAlign: "right" },

    textHeader: {
        fontSize: 7,
        fontWeight: "bold",
        textAlign: "center",
    },
    textNormal: {
        fontSize: 7,
    },
    textNumber: {
        fontSize: 7,
        textAlign: "right",
    },
    textCenter: {
        fontSize: 7,
        textAlign: "center",
    },
    footerContainer: {
        position: "absolute",
        bottom: 15,
        left: 20,
        right: 20,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingTop: 5,
        fontSize: 7,
        color: "#6b7280",
    },
    // Signature Section
    signatureSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        paddingHorizontal: 10,
    },
    signatureBox: {
        alignItems: "center",
        width: 100,
    },
    signatureLabel: {
        fontSize: 7,
        marginBottom: 35,
    },
    signatureName: {
        fontSize: 7,
        fontWeight: "bold",
        textDecoration: "underline",
    },
    signatureRole: {
        fontSize: 6,
        marginTop: 2,
    },
});

interface RekapLemburPDFProps {
    data: any[]; // Using any because of lemburDetail structure
    periodeBulan: number;
    periodeTahun: number;
    userName?: string;
}

const bulanNames = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(Math.round(value));
};

export function RekapLemburPDF({ data, periodeBulan, periodeTahun, userName }: RekapLemburPDFProps) {
    // Group data by division
    const groupedData = data.reduce((acc, item) => {
        const divisionName = item.masterKaryawan?.divisi?.nama || "TANPA DIVISI";
        if (!acc[divisionName]) {
            acc[divisionName] = [];
        }
        acc[divisionName].push(item);
        return acc;
    }, {} as Record<string, any[]>);

    const divisions = Object.keys(groupedData).sort();

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.companyName}>PT. TARO RAKAYA TASYRA</Text>
                    <Text style={styles.title}>
                        Rekapitulasi Lembur Karyawan - {bulanNames[periodeBulan]} {periodeTahun}
                    </Text>
                </View>

                <View style={styles.table}>
                    {/* Header */}
                    <View style={styles.tableRowHeader}>
                        <View style={[styles.tableCellHeader, styles.cellNo]}>
                            <Text style={styles.textHeader}>NO</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellNama]}>
                            <Text style={styles.textHeader}>NAMA KARYAWAN</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellJabatan]}>
                            <Text style={styles.textHeader}>JABATAN</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellLembur]}>
                            <Text style={styles.textHeader}>x1.5</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellLembur]}>
                            <Text style={styles.textHeader}>x2</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellLembur]}>
                            <Text style={styles.textHeader}>x3</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellLembur]}>
                            <Text style={styles.textHeader}>x4</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellTotalJam]}>
                            <Text style={styles.textHeader}>TOT JAM</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellTotalJam]}>
                            <Text style={styles.textHeader}>TOT DIBAYAR</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                            <Text style={styles.textHeader}>UPAH/JAM</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellCurrency, { borderRightWidth: 0 }]}>
                            <Text style={styles.textHeader}>TOTAL UPAH</Text>
                        </View>
                    </View>

                    {divisions.map((division) => {
                        const divisionItems = groupedData[division] || [];

                        // Map items to include calculated values for consistency
                        const calculatedItems = divisionItems.map((item: any) => {
                            const lemburDetail = item.lemburDetail || {};
                            let x15 = 0, x2 = 0, x3 = 0, x4 = 0;

                            Object.values(lemburDetail).forEach((l: any) => {
                                if (l) {
                                    x15 += (Number(l.x15) || 0);
                                    x2 += (Number(l.x2) || 0);
                                    x3 += (Number(l.x3) || 0);
                                    x4 += (Number(l.x4) || 0);
                                }
                            });

                            const hourlyRate = (Number(item.gajiPokok) || 0) / 173;
                            const totalMenitDibayar = Number(item.totalMenitDibayar) || 0;
                            // Recalculate based on same logic as slip gaji to be sure
                            const computedOvertime = Math.round(hourlyRate * (totalMenitDibayar / 60));

                            return {
                                ...item,
                                x15, x2, x3, x4,
                                hourlyRate,
                                computedOvertime
                            };
                        });

                        const subtotalOvertimeValue = calculatedItems.reduce((acc: number, item: any) => acc + item.computedOvertime, 0);

                        return (
                            <React.Fragment key={division}>
                                <View style={{ backgroundColor: "#f3f4f6", padding: 4, borderBottomWidth: 1, borderBottomColor: "#d1d5db" }}>
                                    <Text style={{ fontSize: 7, fontWeight: "bold" }}>DIVISI: {division.toUpperCase()}</Text>
                                </View>

                                {calculatedItems.map((item: any, index: number) => (
                                    <View key={item.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                        <View style={[styles.tableCell, styles.cellNo]}>
                                            <Text style={styles.textCenter}>{index + 1}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellNama]}>
                                            <Text style={styles.textNormal}>{item.masterKaryawan?.namaKaryawan || "-"}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellJabatan]}>
                                            <Text style={styles.textNormal}>{item.masterKaryawan?.jabatan?.nama || "-"}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellLembur]}>
                                            <Text style={styles.textCenter}>{(item.x15 / 60).toFixed(1)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellLembur]}>
                                            <Text style={styles.textCenter}>{(item.x2 / 60).toFixed(1)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellLembur]}>
                                            <Text style={styles.textCenter}>{(item.x3 / 60).toFixed(1)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellLembur]}>
                                            <Text style={styles.textCenter}>{(item.x4 / 60).toFixed(1)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellTotalJam]}>
                                            <Text style={[styles.textCenter, { fontWeight: "bold" }]}>
                                                {(Number(item.totalMenit) / 60).toFixed(1)}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellTotalJam]}>
                                            <Text style={[styles.textCenter, { fontWeight: "bold", color: "#ea580c" }]}>
                                                {(Number(item.totalMenitDibayar) / 60).toFixed(1)}
                                            </Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency]}>
                                            <Text style={styles.textNumber}>{formatCurrency(item.hourlyRate)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightWidth: 0 }]}>
                                            <Text style={[styles.textNumber, { fontWeight: "bold", color: "#059669" }]}>
                                                {formatCurrency(item.computedOvertime)}
                                            </Text>
                                        </View>
                                    </View>
                                ))}

                                {/* Subtotal per Division */}
                                <View style={[styles.tableRow, { backgroundColor: "#f9fafb", fontWeight: "bold" }]}>
                                    <View style={[styles.tableCell, { width: 535 }]}>
                                        <Text style={[styles.textHeader, { textAlign: "right", paddingRight: 10 }]}>SUBTOTAL {division.toUpperCase()}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellCurrency, { borderRightWidth: 0 }]}>
                                        <Text style={[styles.textNumber, { fontWeight: "bold", color: "#059669" }]}>
                                            {formatCurrency(subtotalOvertimeValue)}
                                        </Text>
                                    </View>
                                </View>
                            </React.Fragment>
                        );
                    })}

                    {/* Grand Total */}
                    {(() => {
                        const grandTotalOvertime = data.reduce((acc: number, item: any) => {
                            const hr = (Number(item.gajiPokok) || 0) / 173;
                            const tm = Number(item.totalMenitDibayar) || 0;
                            return acc + Math.round(hr * (tm / 60));
                        }, 0);

                        return (
                            <View style={[styles.tableRow, { backgroundColor: "#f3f4f6", fontWeight: "bold" }]}>
                                <View style={[styles.tableCell, { width: 535 }]}>
                                    <Text style={[styles.textHeader, { textAlign: "right", paddingRight: 10 }]}>GRAND TOTAL</Text>
                                </View>
                                <View style={[styles.tableCell, styles.cellCurrency, { borderRightWidth: 0 }]}>
                                    <Text style={[styles.textNumber, { fontWeight: "bold", color: "#059669", fontSize: 8 }]}>
                                        {formatCurrency(grandTotalOvertime)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })()}
                </View>

                {/* Signature Section */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Dibuat Oleh:</Text>
                        <Text style={styles.signatureName}>{userName || ".........................."}</Text>
                        <Text style={styles.signatureRole}>Staff Administrasi</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Diperiksa Oleh:</Text>
                        <Text style={styles.signatureName}>MARJEFRI FAJRIYAN</Text>
                        <Text style={styles.signatureRole}>KTU</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Diketahui Oleh:</Text>
                        <Text style={styles.signatureName}>SOFRAN</Text>
                        <Text style={styles.signatureRole}>Mill Manager</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Diketahui Oleh:</Text>
                        <Text style={styles.signatureName}>BOSLEN TAMBAH</Text>
                        <Text style={styles.signatureRole}>Direktur Operasional</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>Disetujui Oleh:</Text>
                        <Text style={styles.signatureName}>Bambang Iswanto</Text>
                        <Text style={styles.signatureRole}>Jabatan : Head HR</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footerContainer}>
                    <View style={styles.footer}>
                        <Text>Total Karyawan: {data.length}</Text>
                        <Text>Halaman 1 dari 1</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

export async function downloadRekapLemburPDF(
    data: any[],
    periodeBulan: number,
    periodeTahun: number,
    userName?: string
): Promise<void> {
    const blob = await pdf(
        <RekapLemburPDF
            data={data}
            periodeBulan={periodeBulan}
            periodeTahun={periodeTahun}
            userName={userName}
        />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Lembur_${bulanNames[periodeBulan]}_${periodeTahun}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
