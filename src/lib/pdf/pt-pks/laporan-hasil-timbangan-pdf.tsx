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
import { formatDateInJakarta, formatTimeInJakarta } from "@/lib/date-time";

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
        paddingTop: 25,
        paddingBottom: 40,
        fontSize: 7,
        fontFamily: "Roboto",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#000",
        paddingBottom: 10,
    },
    logo: {
        width: 45,
        height: 45,
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
        fontSize: 8,
        color: "#444",
    },
    title: {
        fontSize: 14,
        fontFamily: "Roboto-Bold",
        textAlign: "center",
        marginBottom: 5,
    },
    period: {
        fontSize: 9,
        textAlign: "center",
        marginBottom: 15,
        color: "#444",
    },
    table: {
        display: "flex",
        width: "100%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#000",
    },
    tableRowLast: {
        flexDirection: "row",
    },
    tableHeader: {
        backgroundColor: "#e0e0e0",
    },
    tableCell: {
        borderRightWidth: 0.5,
        borderRightColor: "#000",
        padding: 2,
        fontSize: 6,
    },
    tableCellLast: {
        padding: 2,
        fontSize: 6,
    },
    tableCellHeader: {
        fontFamily: "Roboto-Bold",
        fontSize: 7,
        textAlign: "center",
    },
    tableCellRight: {
        textAlign: "right",
    },
    tableCellCenter: {
        textAlign: "center",
    },
    // Column widths
    // Column widths (Portrait: total 100%)
    colNo: { width: "3%" },
    colNomor: { width: "10%" },
    colTanggal: { width: "8%" },
    colJamMasuk: { width: "4%" },
    colJamKeluar: { width: "4%" },
    colSupplier: { width: "12%" },
    colKendaraan: { width: "7%" },
    colSupir: { width: "7%" },
    colLokasi: { width: "10%" },
    colBarang: { width: "4%" },
    // -- Total Text Columns: 69%
    colBruto: { width: "6.2%" },
    colTarra: { width: "6.2%" },
    colNetto1: { width: "6.2%" },
    colPotPersen: { width: "3%" },
    colPotKg: { width: "4.7%" },
    colNetto2: { width: "4.7%" },
    // -- Total Numeric Columns: 31%
    // Landscape additions (scaled correctly if needed)
    colVendorBongkar: { width: "10%" },
    colRekeningBongkar: { width: "12%" },
    colUpahBongkar: { width: "5%" },
    colTotalUpahBongkar: { width: "7%" },
    // Footer
    totalRow: {
        flexDirection: "row",
        backgroundColor: "#f0f0f0",
    },
    totalLabel: {
        flex: 1,
        padding: 4,
        fontFamily: "Roboto-Bold",
        fontSize: 8,
        textAlign: "right",
        paddingRight: 10,
    },
    totalValue: {
        padding: 4,
        fontFamily: "Roboto-Bold",
        fontSize: 8,
        textAlign: "right",
    },
    footer: {
        position: "absolute",
        bottom: 15,
        left: 20,
        right: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 7,
        color: "#666",
        borderTopWidth: 0.5,
        borderTopColor: "#999",
        paddingTop: 5,
    },
    signatureSection: {
        marginTop: 30,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    signatureBlock: {
        width: "30%",
        textAlign: "center",
    },
    signatureLabel: {
        fontSize: 9,
        marginBottom: 40,
    },
    signatureName: {
        fontSize: 9,
        fontFamily: "Roboto-Bold",
        textDecoration: "underline",
    },
    signatureTitle: {
        fontSize: 8,
        marginTop: 2,
    },
});

export type LaporanHasilTimbanganData = {
    id: string;
    nomorPenerimaan: string;
    tanggalTerima: string;
    waktuTimbangBruto?: string | null;
    waktuTimbangTarra?: string | null;
    supplier: {
        ownerName: string;
        companyName?: string | null;
        npwp: string;
    };
    transporter: {
        nomorKendaraan: string;
        namaSupir: string;
    };
    material: {
        name: string;
        kategori: { name: string };
        satuan: { name: string };
    };
    lokasiKebun?: string | null;
    jenisBuah?: string | null;
    beratBruto: number;
    beratTarra: number;
    beratNetto1: number;
    potonganPersen: number;
    potonganKg: number;
    beratNetto2: number;
    upahBongkar?: number;
    totalUpahBongkar?: number;
    vendorBongkar?: {
        name: string;
    } | null;
    selectedVendorBongkarBank?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    } | null;
    company?: {
        name: string;
        code: string;
        address?: string;
    };
};

type LaporanHasilTimbanganPDFProps = {
    data: LaporanHasilTimbanganData[];
    startDate?: string;
    endDate?: string;
    companyName?: string;
    companyAddress?: string;
    createdByName?: string;
    diperiksaOleh?: string;
    diperiksaJabatan?: string;
    diketahuiOleh?: string;
    diketahuiJabatan?: string;
    showBongkar?: boolean;
};

const formatNumber = (num: number) => num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const formatDate = (dateString: string) => {
    return formatDateInJakarta(dateString, { year: "2-digit" });
};

const formatTime = (dateString?: string | null) => {
    return formatTimeInJakarta(dateString);
};

const getJenisBuahShort = (jenis?: string | null) => {
    switch (jenis) {
        case "TBS-BB": return "BB";
        case "TBS-BS": return "BS";
        case "TBS-BK": return "BK";
        default: return jenis || "-";
    }
};

const getSupplierDisplayName = (supplier: LaporanHasilTimbanganData["supplier"]) =>
    supplier.companyName?.trim() || supplier.ownerName;

export const LaporanHasilTimbanganPDF: React.FC<LaporanHasilTimbanganPDFProps> = ({
    data,
    startDate,
    endDate,
    companyName,
    companyAddress,
    createdByName,
    diperiksaOleh,
    diperiksaJabatan,
    diketahuiOleh,
    diketahuiJabatan,
    showBongkar = false,
}) => {
    // Calculate totals
    const totalBruto = data.reduce((sum, item) => sum + item.beratBruto, 0);
    const totalTarra = data.reduce((sum, item) => sum + item.beratTarra, 0);
    const totalNetto1 = data.reduce((sum, item) => sum + item.beratNetto1, 0);
    const totalPotKg = data.reduce((sum, item) => sum + item.potonganKg, 0);
    const totalNetto2 = data.reduce((sum, item) => sum + item.beratNetto2, 0);

    // Format period text
    const periodText = startDate && endDate
        ? `Periode: ${format(new Date(startDate), "dd MMMM yyyy", { locale: idLocale })} - ${format(new Date(endDate), "dd MMMM yyyy", { locale: idLocale })}`
        : startDate
            ? `Mulai: ${format(new Date(startDate), "dd MMMM yyyy", { locale: idLocale })}`
            : endDate
                ? `Sampai: ${format(new Date(endDate), "dd MMMM yyyy", { locale: idLocale })}`
                : "Semua Periode";

    // Adjust column widths if showBongkar is true
    // In Portrait, we need to reduce some columns if we add 3 more
    // No: 3, NoP: 10, Tgl: 8, Mas: 4, Kel: 4, Sup: 11, Ken: 6, Supir: 8, Brg: 4, Bru: 5.5, Tar: 5.5, N1: 5.5, P%: 3, PKg: 5.5, N2: 5.5
    // Add: Vnd: 10, U/kg: 5, TU: 6 = 21% extra.
    // Switching to Landscape for Bongkar data is better

    return (
        <Page size="A4" orientation={showBongkar ? "landscape" : "portrait"} style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                {logoBase64 && (
                    <Image style={styles.logo} src={logoBase64} />
                )}
                <View style={styles.headerText}>
                    <Text style={styles.companyName}>
                        {companyName || data[0]?.company?.name || "PT TARO RAKAYA TASYRA"}
                    </Text>
                    <Text style={styles.companyAddress}>
                        {companyAddress || data[0]?.company?.address || "JL LINTAS LANGGAM KM. 3 DESA LUBUK OGONG"}
                    </Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>LAPORAN HASIL TIMBANGAN</Text>
            <Text style={styles.period}>{periodText}</Text>

            {/* Table */}
            <View style={styles.table}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colNo]}>No</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colNomor]}>No Penerimaan</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colTanggal]}>Tanggal</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colJamMasuk]}>Masuk</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colJamKeluar]}>Keluar</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colSupplier]}>Supplier</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colKendaraan]}>NO Kendaraan</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colSupir]}>Supir</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colLokasi]}>Lokasi Kebun</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colBarang]}>Jenis Buah</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colBruto]}>Bruto (Kg)</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colTarra]}>Tarra (Kg)</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colNetto1]}>Netto 1 (Kg)</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellCenter, styles.colPotPersen]}>Pot (%)</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colPotKg]}>Pot (Kg)</Text>
                    <Text style={[showBongkar ? styles.tableCell : styles.tableCellLast, styles.tableCellHeader, styles.tableCellRight, styles.colNetto2]}>Netto 2 (Kg)</Text>
                    {showBongkar && (
                        <>
                            <Text style={[styles.tableCell, styles.tableCellHeader, styles.colVendorBongkar]}>Vendor Bongkar</Text>
                            <Text style={[styles.tableCell, styles.tableCellHeader, styles.colRekeningBongkar]}>Rekening</Text>
                            <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colUpahBongkar]}>Upah/Kg</Text>
                            <Text style={[styles.tableCellLast, styles.tableCellHeader, styles.tableCellRight, styles.colTotalUpahBongkar]}>Total Upah</Text>
                        </>
                    )}
                </View>

                {/* Table Body */}
                {data.map((item, index) => (
                    <View key={item.id} style={index === data.length - 1 ? styles.tableRowLast : styles.tableRow}>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colNo]}>{index + 1}</Text>
                        <Text style={[styles.tableCell, styles.colNomor]}>{item.nomorPenerimaan}</Text>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colTanggal]}>{formatDate(item.tanggalTerima)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colJamMasuk]}>{formatTime(item.waktuTimbangBruto)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colJamKeluar]}>{formatTime(item.waktuTimbangTarra)}</Text>
                        <Text style={[styles.tableCell, styles.colSupplier]} {...({ numberOfLines: 1 } as any)}>{getSupplierDisplayName(item.supplier)}</Text>
                        <Text style={[styles.tableCell, styles.colKendaraan]}>{item.transporter.nomorKendaraan}</Text>
                        <Text style={[styles.tableCell, styles.colSupir]} {...({ numberOfLines: 1 } as any)}>{item.transporter.namaSupir}</Text>
                        <Text style={[styles.tableCell, styles.colLokasi]} {...({ numberOfLines: 1 } as any)}>{item.lokasiKebun || "-"}</Text>
                        <Text style={[styles.tableCell, styles.colBarang]}>{getJenisBuahShort(item.jenisBuah)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colBruto]}>{formatNumber(item.beratBruto)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colTarra]}>{formatNumber(item.beratTarra)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colNetto1]}>{formatNumber(item.beratNetto1)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colPotPersen]}>{item.potonganPersen}%</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colPotKg]}>{formatNumber(item.potonganKg)}</Text>
                        <Text style={[showBongkar ? styles.tableCell : styles.tableCellLast, styles.tableCellRight, styles.colNetto2]}>{formatNumber(item.beratNetto2)}</Text>
                        {showBongkar && (
                            <>
                                <Text style={[styles.tableCell, styles.colVendorBongkar]} {...({ numberOfLines: 1 } as any)}>{item.vendorBongkar?.name || "-"}</Text>
                                <Text style={[styles.tableCell, styles.colRekeningBongkar, { fontSize: 5 }]} {...({ numberOfLines: 1 } as any)}>
                                    {item.selectedVendorBongkarBank
                                        ? `(${item.selectedVendorBongkarBank.bankName}) ${item.selectedVendorBongkarBank.accountNumber}`
                                        : "-"}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCellRight, styles.colUpahBongkar]}>{formatNumber(item.upahBongkar || 0)}</Text>
                                <Text style={[styles.tableCellLast, styles.tableCellRight, styles.colTotalUpahBongkar, { fontFamily: "Roboto-Bold" }]}>{formatNumber(item.totalUpahBongkar || 0)}</Text>
                            </>
                        )}
                    </View>
                ))}

                {/* Total Row */}
                <View style={[styles.tableRow, styles.totalRow]}>
                    <Text style={[styles.tableCell, { width: "69%", fontFamily: "Roboto-Bold", textAlign: "right" }]}>
                        TOTAL ({data.length} Data)
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colBruto, { fontFamily: "Roboto-Bold" }]}>{formatNumber(totalBruto)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colTarra, { fontFamily: "Roboto-Bold" }]}>{formatNumber(totalTarra)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colNetto1, { fontFamily: "Roboto-Bold" }]}>{formatNumber(totalNetto1)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellCenter, styles.colPotPersen, { fontFamily: "Roboto-Bold" }]}>-</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colPotKg, { fontFamily: "Roboto-Bold" }]}>{formatNumber(totalPotKg)}</Text>
                    <Text style={[showBongkar ? styles.tableCell : styles.tableCellLast, styles.tableCellRight, styles.colNetto2, { fontFamily: "Roboto-Bold" }]}>{formatNumber(totalNetto2)}</Text>
                    {showBongkar && (
                        <>
                            <Text style={[styles.tableCell, styles.colVendorBongkar]}>-</Text>
                            <Text style={[styles.tableCell, styles.colRekeningBongkar]}>-</Text>
                            <Text style={[styles.tableCell, styles.colUpahBongkar]}>-</Text>
                            <Text style={[styles.tableCellLast, styles.tableCellRight, styles.colTotalUpahBongkar, { fontFamily: "Roboto-Bold" }]}>
                                {formatNumber(data.reduce((sum, item) => sum + (item.totalUpahBongkar || 0), 0))}
                            </Text>
                        </>
                    )}
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
                    <Text style={styles.signatureName}>{diperiksaOleh || "Marjefri Fajriyan"}</Text>
                    <Text style={styles.signatureTitle}>{diperiksaJabatan || "KTU Mill"}</Text>
                </View>

                <View style={styles.signatureBlock}>
                    <Text style={styles.signatureLabel}>Diketahui Oleh,</Text>
                    <Text style={styles.signatureName}>{diketahuiOleh || "BOSLEN TAMBAH"}</Text>
                    <Text style={styles.signatureTitle}>{diketahuiJabatan || "MILL MANAGER"}</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Dicetak: {format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })}</Text>
            </View>
        </Page>
    );
};

// Document wrapper untuk export
export const LaporanHasilTimbanganDocument: React.FC<LaporanHasilTimbanganPDFProps> = (props) => {
    return (
        <Document>
            <LaporanHasilTimbanganPDF {...props} />
        </Document>
    );
};
