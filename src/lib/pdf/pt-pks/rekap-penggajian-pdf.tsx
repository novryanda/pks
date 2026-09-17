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

// Constants (avoid importing from logo.ts which uses fs)
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
        padding: 20,
        fontSize: 7,
        fontFamily: "Roboto",
        backgroundColor: "#ffffff",
        orientation: "landscape",
    },
    header: {
        flexDirection: "row",
        marginBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: "#059669",
        paddingBottom: 8,
    },
    logo: {
        width: 40,
        height: 40,
    },
    headerInfo: {
        marginLeft: 10,
        flex: 1,
    },
    companyName: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#059669",
    },
    documentTitle: {
        textAlign: "right",
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#059669",
    },
    periodeText: {
        fontSize: 9,
        marginTop: 2,
        color: "#374151",
    },
    printDate: {
        fontSize: 7,
        marginTop: 2,
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
        minHeight: 16,
    },
    tableRowHeader: {
        flexDirection: "row",
        minHeight: 20,
        backgroundColor: "#f3f4f6",
    },
    tableRowAlt: {
        flexDirection: "row",
        minHeight: 16,
        backgroundColor: "#f9fafb",
    },
    tableCell: {
        padding: 3,
        borderRightWidth: 1,
        borderRightColor: "#e5e7eb",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        justifyContent: "center",
    },
    tableCellHeader: {
        padding: 3,
        borderRightWidth: 1,
        borderRightColor: "#e5e7eb",
        borderBottomWidth: 1,
        borderBottomColor: "#d1d5db",
        justifyContent: "center",
        backgroundColor: "#e5e7eb",
    },
    cellNo: { width: 15 },
    cellNama: { width: 100 },
    cellJabatan: { width: 75 },
    cellRekening: { width: 45 },
    cellNumber: { width: 22, textAlign: "center" },
    cellDate: { width: 13, textAlign: "center" },
    cellCurrency: { width: 45, textAlign: "right" },
    cellCurrencyLarge: { width: 55, textAlign: "right" },
    textHeader: {
        fontSize: 6,
        fontWeight: "bold",
        textAlign: "center",
    },
    textNormal: {
        fontSize: 6,
    },
    textNumber: {
        fontSize: 6,
        textAlign: "right",
    },
    textGreen: {
        fontSize: 6,
        textAlign: "right",
        color: "#059669",
        fontWeight: "bold",
    },
    textRed: {
        fontSize: 5,
        textAlign: "right",
        color: "#dc2626",
    },
    textDate: {
        fontSize: 5,
        textAlign: "center",
    },
    // Signature Section
    signatureSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        paddingHorizontal: 30,
    },
    signatureBox: {
        alignItems: "center",
        width: 180,
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
        fontSize: 6,
        color: "#6b7280",
    },
});

// Types
export type PenggajianKaryawanData = {
    id: string;
    masterKaryawan?: {
        namaKaryawan: string;
        tktk: string | null;
        gol: string | null;
        nomorRekening: string | null;
        noBpjsTk: string | null;
        noBpjsKesehatan: string | null;
        divisi?: { nama: string } | null;
        jabatan?: { nama: string } | null;
    } | null;
    tanggalKerja?: Record<string, string> | null;
    hk: number;
    liburDibayar: number;
    hkTidakDibayar: number;
    hkDibayar: number;
    lemburHari: number;
    totalMenitDibayar: number;
    gajiPokok: number;
    tunjanganJabatan: number;
    tunjanganPerumahan: number;
    sppd: number;
    thr: number;
    tunjanganLainLain: number;
    overtime: number;
    totalSebelumPotongan: number;
    potKehadiran: number;
    potBpjsTkJht: number;
    potBpjsTkJn: number;
    potBpjsKesehatan: number;
    potPph21: number;
    potPinjaman: number;
    potLainLain: number;
    totalPotongan: number;
    upahDiterima: number;
};

export type ColumnVisibility = Record<string, boolean>;

interface RekapPenggajianPDFProps {
    data: PenggajianKaryawanData[];
    periodeBulan: number;
    periodeTahun: number;
    columnVisibility: ColumnVisibility;
    userName?: string;
}

const bulanNames = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value);
};

const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};

export function RekapPenggajianPDF({ data, periodeBulan, periodeTahun, columnVisibility, userName }: RekapPenggajianPDFProps) {
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month, 0).getDate();
    };

    const days = getDaysInMonth(periodeTahun, periodeBulan);
    const dateArray = Array.from({ length: days }, (_, i) => i + 1);

    // Group data by division
    const groupedData = data.reduce((acc, item) => {
        const divisionName = item.masterKaryawan?.divisi?.nama || "TANPA DIVISI";
        if (!acc[divisionName]) {
            acc[divisionName] = [];
        }
        acc[divisionName].push(item);
        return acc;
    }, {} as Record<string, typeof data>);

    const divisions = Object.keys(groupedData).sort();

    return (
        <Document>
            <Page size="A3" orientation="landscape" style={styles.page}>
                {/* Header Section */}
                <View style={{ marginBottom: 15, borderBottomWidth: 2, borderBottomColor: '#059669', paddingBottom: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#059669' }}>PT. TARO RAKAYA TASYRA</Text>
                    <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                        Rekapitulasi Penggajian Karyawan - {bulanNames[periodeBulan]} {periodeTahun}
                    </Text>
                </View>

                {/* Main Table */}
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.tableRowHeader}>
                        <View style={[styles.tableCellHeader, styles.cellNo]}>
                            <Text style={styles.textHeader}>NO</Text>
                        </View>
                        <View style={[styles.tableCellHeader, styles.cellNama]}>
                            <Text style={styles.textHeader}>NAMA KARYAWAN</Text>
                        </View>

                        {/* Info Karyawan */}
                        {columnVisibility.info && (
                            <>
                                <View style={[styles.tableCellHeader, styles.cellJabatan]}>
                                    <Text style={styles.textHeader}>JABATAN</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellRekening]}>
                                    <Text style={styles.textHeader}>REKENING</Text>
                                </View>
                            </>
                        )}

                        {/* Tanggal Kerja */}
                        {columnVisibility.tanggalKerja && dateArray.map((d: number) => (
                            <View key={d} style={[styles.tableCellHeader, styles.cellDate]}>
                                <Text style={styles.textHeader}>{d}</Text>
                            </View>
                        ))}

                        {/* Hari Kerja */}
                        {columnVisibility.hariKerja && (
                            <>
                                <View style={[styles.tableCellHeader, styles.cellNumber]}>
                                    <Text style={styles.textHeader}>HK</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellNumber]}>
                                    <Text style={styles.textHeader}>LIB</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellNumber]}>
                                    <Text style={styles.textHeader}>TDK</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellNumber]}>
                                    <Text style={styles.textHeader}>DIB</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellNumber]}>
                                    <Text style={styles.textHeader}>LEM</Text>
                                </View>
                            </>
                        )}

                        {/* Gaji & Tunjangan */}
                        {columnVisibility.gajiTunjangan && (
                            <>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>GAPOK</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>T.JAB</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>T.PER</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>SPPD</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>THR</Text>
                                </View>
                            </>
                        )}

                        {/* Overtime */}
                        {columnVisibility.overtime && (
                            <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                <Text style={styles.textHeader}>OVERTIME</Text>
                            </View>
                        )}

                        {/* Total Sebelum Potongan */}
                        {columnVisibility.totalSebelumPotongan && (
                            <View style={[styles.tableCellHeader, styles.cellCurrencyLarge]}>
                                <Text style={styles.textHeader}>TOTAL</Text>
                            </View>
                        )}

                        {/* Potongan Detail */}
                        {columnVisibility.potongan && (
                            <>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>POT.ABS</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>JHT</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>JN</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>BPJS</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>PPH21</Text>
                                </View>
                                <View style={[styles.tableCellHeader, styles.cellCurrency]}>
                                    <Text style={styles.textHeader}>P.PINJ</Text>
                                </View>
                            </>
                        )}

                        {/* Total Potongan */}
                        {columnVisibility.totalPotongan && (
                            <View style={[styles.tableCellHeader, styles.cellCurrencyLarge]}>
                                <Text style={styles.textHeader}>TOT.POT</Text>
                            </View>
                        )}

                        {/* Upah Diterima */}
                        {columnVisibility.upahDiterima && (
                            <View style={[styles.tableCellHeader, styles.cellCurrencyLarge, { borderRightWidth: 0 }]}>
                                <Text style={styles.textHeader}>DITERIMA</Text>
                            </View>
                        )}
                    </View>

                    {/* Data Rows Grouped by Division */}
                    {divisions.map((division) => (
                        <React.Fragment key={division}>
                            {/* Division Header Row */}
                            <View style={{ backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#d1d5db', padding: '4px 8px', flexDirection: 'row' }}>
                                <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#111827' }}>DIVISI: {division.toUpperCase()}</Text>
                            </View>

                            {(groupedData[division] || []).map((item, index) => (
                                <View key={item.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                                    <View style={[styles.tableCell, styles.cellNo]}>
                                        <Text style={styles.textNormal}>{index + 1}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.cellNama]}>
                                        <Text style={styles.textNormal}>{item.masterKaryawan?.namaKaryawan || "-"}</Text>
                                    </View>

                                    {/* Info Karyawan */}
                                    {columnVisibility.info && (
                                        <>
                                            <View style={[styles.tableCell, styles.cellJabatan]}>
                                                <Text style={styles.textNormal}>{item.masterKaryawan?.jabatan?.nama || "-"}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellRekening]}>
                                                <Text style={styles.textNormal}>{item.masterKaryawan?.nomorRekening || "-"}</Text>
                                            </View>
                                        </>
                                    )}

                                    {/* Tanggal Kerja */}
                                    {columnVisibility.tanggalKerja && dateArray.map((d: number) => (
                                        <View key={d} style={[styles.tableCell, styles.cellDate]}>
                                            <Text style={styles.textDate}>{item.tanggalKerja?.[String(d)] || ""}</Text>
                                        </View>
                                    ))}

                                    {/* Hari Kerja */}
                                    {columnVisibility.hariKerja && (
                                        <>
                                            <View style={[styles.tableCell, styles.cellNumber]}>
                                                <Text style={styles.textNumber}>{item.hk || 0}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellNumber]}>
                                                <Text style={styles.textNumber}>{item.liburDibayar || 0}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellNumber]}>
                                                <Text style={styles.textRed}>{item.hkTidakDibayar || 0}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellNumber]}>
                                                <Text style={styles.textNumber}>{item.hkDibayar || 0}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellNumber]}>
                                                <Text style={[styles.textNumber, { color: "#2563eb", fontWeight: "bold" }]}>
                                                    {(item.totalMenitDibayar || 0) / 60}
                                                </Text>
                                            </View>
                                        </>
                                    )}

                                    {/* Gaji & Tunjangan */}
                                    {columnVisibility.gajiTunjangan && (
                                        <>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textNumber}>{formatCurrency(Number(item.gajiPokok || 0))}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textNumber}>{formatCurrency(Number(item.tunjanganJabatan || 0))}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textNumber}>{formatCurrency(Number(item.tunjanganPerumahan || 0))}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textNumber}>{formatCurrency(Number(item.sppd || 0))}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textNumber}>{formatCurrency(Number(item.thr || 0))}</Text>
                                            </View>
                                        </>
                                    )}

                                    {/* Overtime */}
                                    {columnVisibility.overtime && (
                                        <View style={[styles.tableCell, styles.cellCurrency]}>
                                            <Text style={styles.textNumber}>{formatCurrency(Number(item.overtime || 0))}</Text>
                                        </View>
                                    )}

                                    {/* Total Sebelum Potongan */}
                                    {columnVisibility.totalSebelumPotongan && (
                                        <View style={[styles.tableCell, styles.cellCurrencyLarge]}>
                                            <Text style={styles.textNumber}>{formatCurrency(Number(item.totalSebelumPotongan || 0))}</Text>
                                        </View>
                                    )}

                                    {/* Potongan Detail */}
                                    {columnVisibility.potongan && (
                                        <>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textRed}>{formatCurrency(Number(item.potKehadiran || 0))}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textRed}>{formatCurrency(Number(item.potBpjsTkJht || 0))}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textRed}>{formatCurrency(Number(item.potBpjsTkJn || 0))}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textRed}>{formatCurrency(Number(item.potBpjsKesehatan || 0))}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textRed}>{formatCurrency(Number(item.potPph21 || 0))}</Text>
                                            </View>
                                            <View style={[styles.tableCell, styles.cellCurrency]}>
                                                <Text style={styles.textRed}>{formatCurrency(Number(item.potPinjaman || 0))}</Text>
                                            </View>
                                        </>
                                    )}

                                    {/* Total Potongan */}
                                    {columnVisibility.totalPotongan && (
                                        <View style={[styles.tableCell, styles.cellCurrencyLarge]}>
                                            <Text style={styles.textRed}>{formatCurrency(Number(item.totalPotongan || 0))}</Text>
                                        </View>
                                    )}

                                    {/* Upah Diterima */}
                                    {columnVisibility.upahDiterima && (
                                        <View style={[styles.tableCell, styles.cellCurrencyLarge]}>
                                            <Text style={styles.textGreen}>{formatCurrency(Number(item.upahDiterima || 0))}</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </React.Fragment>
                    ))}

                    {/* Total Row */}
                    {(() => {
                        const totals = data.reduce((acc, item) => ({
                            hk: acc.hk + (item.hk || 0),
                            liburDibayar: acc.liburDibayar + (item.liburDibayar || 0),
                            hkTidakDibayar: acc.hkTidakDibayar + (item.hkTidakDibayar || 0),
                            hkDibayar: acc.hkDibayar + (item.hkDibayar || 0),
                            totalMenitDibayar: acc.totalMenitDibayar + (item.totalMenitDibayar || 0),
                            gajiPokok: acc.gajiPokok + Number(item.gajiPokok || 0),
                            tunjanganJabatan: acc.tunjanganJabatan + Number(item.tunjanganJabatan || 0),
                            tunjanganPerumahan: acc.tunjanganPerumahan + Number(item.tunjanganPerumahan || 0),
                            sppd: acc.sppd + Number(item.sppd || 0),
                            thr: acc.thr + Number(item.thr || 0),
                            tunjanganLainLain: acc.tunjanganLainLain + Number(item.tunjanganLainLain || 0),
                            overtime: acc.overtime + Number(item.overtime || 0),
                            totalSebelumPotongan: acc.totalSebelumPotongan + Number(item.totalSebelumPotongan || 0),
                            potKehadiran: acc.potKehadiran + Number(item.potKehadiran || 0),
                            potBpjsTkJht: acc.potBpjsTkJht + Number(item.potBpjsTkJht || 0),
                            potBpjsTkJn: acc.potBpjsTkJn + Number(item.potBpjsTkJn || 0),
                            potBpjsKesehatan: acc.potBpjsKesehatan + Number(item.potBpjsKesehatan || 0),
                            potPph21: acc.potPph21 + Number(item.potPph21 || 0),
                            potPinjaman: acc.potPinjaman + Number(item.potPinjaman || 0),
                            totalPotongan: acc.totalPotongan + Number(item.totalPotongan || 0),
                            upahDiterima: acc.upahDiterima + Number(item.upahDiterima || 0),
                        }), {
                            hk: 0, liburDibayar: 0, hkTidakDibayar: 0, hkDibayar: 0, totalMenitDibayar: 0,
                            gajiPokok: 0, tunjanganJabatan: 0, tunjanganPerumahan: 0, sppd: 0, thr: 0, tunjanganLainLain: 0,
                            overtime: 0, totalSebelumPotongan: 0, potKehadiran: 0, potBpjsTkJht: 0,
                            potBpjsTkJn: 0, potBpjsKesehatan: 0, potPph21: 0, potPinjaman: 0,
                            totalPotongan: 0, upahDiterima: 0
                        });

                        return (
                            <View style={[styles.tableRow, { backgroundColor: "#f3f4f6", borderTopWidth: 1, borderTopColor: "#d1d5db" }]}>
                                <View style={[styles.tableCell, styles.cellNo, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                    <Text style={styles.textHeader}></Text>
                                </View>
                                <View style={[styles.tableCell, styles.cellNama, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                    <Text style={styles.textHeader}>TOTAL</Text>
                                </View>

                                {columnVisibility.info && (
                                    <>
                                        <View style={[styles.tableCell, styles.cellJabatan, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}></View>
                                        <View style={[styles.tableCell, styles.cellRekening, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}></View>
                                    </>
                                )}

                                {columnVisibility.tanggalKerja && dateArray.map((d: number) => (
                                    <View key={d} style={[styles.tableCell, styles.cellDate, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}></View>
                                ))}

                                {columnVisibility.hariKerja && (
                                    <>
                                        <View style={[styles.tableCell, styles.cellNumber, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}></View>
                                        <View style={[styles.tableCell, styles.cellNumber, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}></View>
                                        <View style={[styles.tableCell, styles.cellNumber, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}></View>
                                        <View style={[styles.tableCell, styles.cellNumber, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}></View>
                                        <View style={[styles.tableCell, styles.cellNumber, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}></View>
                                    </>
                                )}

                                {columnVisibility.gajiTunjangan && (
                                    <>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={styles.textHeader}>{formatCurrency(totals.gajiPokok)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={styles.textHeader}>{formatCurrency(totals.tunjanganJabatan)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={styles.textHeader}>{formatCurrency(totals.tunjanganPerumahan)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={styles.textHeader}>{formatCurrency(totals.sppd)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={styles.textHeader}>{formatCurrency(totals.thr)}</Text>
                                        </View>
                                    </>
                                )}

                                {columnVisibility.overtime && (
                                    <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                        <Text style={styles.textHeader}>{formatCurrency(totals.overtime)}</Text>
                                    </View>
                                )}

                                {columnVisibility.totalSebelumPotongan && (
                                    <View style={[styles.tableCell, styles.cellCurrencyLarge, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                        <Text style={styles.textHeader}>{formatCurrency(totals.totalSebelumPotongan)}</Text>
                                    </View>
                                )}

                                {columnVisibility.potongan && (
                                    <>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={[styles.textHeader, { color: "#dc2626" }]}>{formatCurrency(totals.potKehadiran)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={[styles.textHeader, { color: "#dc2626" }]}>{formatCurrency(totals.potBpjsTkJht)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={[styles.textHeader, { color: "#dc2626" }]}>{formatCurrency(totals.potBpjsTkJn)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={[styles.textHeader, { color: "#dc2626" }]}>{formatCurrency(totals.potBpjsKesehatan)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={[styles.textHeader, { color: "#dc2626" }]}>{formatCurrency(totals.potPph21)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.cellCurrency, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                            <Text style={[styles.textHeader, { color: "#dc2626" }]}>{formatCurrency(totals.potPinjaman)}</Text>
                                        </View>
                                    </>
                                )}

                                {columnVisibility.totalPotongan && (
                                    <View style={[styles.tableCell, styles.cellCurrencyLarge, { borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                        <Text style={[styles.textHeader, { color: "#dc2626" }]}>{formatCurrency(totals.totalPotongan)}</Text>
                                    </View>
                                )}

                                {columnVisibility.upahDiterima && (
                                    <View style={[styles.tableCell, styles.cellCurrencyLarge, { borderRightWidth: 1, borderRightColor: "#d1d5db", borderBottomColor: "#d1d5db" }]}>
                                        <Text style={[styles.textHeader, { color: "#059669" }]}>{formatCurrency(totals.upahDiterima)}</Text>
                                    </View>
                                )}
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
                        <Text>Halaman 1</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

// Generate PDF blob
export async function generateRekapPenggajianPDF(
    data: PenggajianKaryawanData[],
    periodeBulan: number,
    periodeTahun: number,
    columnVisibility: ColumnVisibility,
    userName?: string
): Promise<Blob> {
    const blob = await pdf(
        <RekapPenggajianPDF
            data={data}
            periodeBulan={periodeBulan}
            periodeTahun={periodeTahun}
            columnVisibility={columnVisibility}
            userName={userName}
        />
    ).toBlob();
    return blob;
}

// Download PDF
export async function downloadRekapPenggajianPDF(
    data: PenggajianKaryawanData[],
    periodeBulan: number,
    periodeTahun: number,
    columnVisibility: ColumnVisibility,
    userName?: string
): Promise<void> {
    const blob = await generateRekapPenggajianPDF(data, periodeBulan, periodeTahun, columnVisibility, userName);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Penggajian_${bulanNames[periodeBulan]}_${periodeTahun}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
