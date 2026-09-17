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
        fontSize: 12,
        fontFamily: "Roboto-Bold",
        textAlign: "center",
        marginBottom: 5,
        textDecoration: "underline",
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
        padding: 3,
        fontSize: 6,
    },
    tableCellLast: {
        padding: 3,
        fontSize: 6,
    },
    tableCellHeader: {
        fontFamily: "Roboto-Bold",
        fontSize: 7,
        textAlign: "center",
        justifyContent: "center",
    },
    tableCellRight: {
        textAlign: "right",
    },
    tableCellCenter: {
        textAlign: "center",
    },
    // Column widths (Total 100%)
    colNo: { width: "2.5%" },
    colNomor: { width: "7.5%" },
    colTanggal: { width: "5%" },
    colJamMasuk: { width: "4.5%" },
    colJamKeluar: { width: "4.5%" },
    colSupplier: { width: "8%" },
    colKendaraan: { width: "6.5%" },
    colLokasiKebun: { width: "6.5%" },
    colJenisBuah: { width: "4%" },
    colMaterial: { width: "4%" },
    colTotalLabel: { width: "53%" },
    colBruto: { width: "4.5%" },
    colTarra: { width: "4.5%" },
    colNetto2: { width: "4.5%" },
    colHarga: { width: "4.5%" },
    colTotal: { width: "5.5%" },
    colPpn: { width: "4.5%" },
    colPph: { width: "4.5%" },
    colJumlahBayar: { width: "5.5%" },
    colUpah: { width: "5%" },
    colTotUpah: { width: "5%" },

    // Footer
    totalRow: {
        flexDirection: "row",
        backgroundColor: "#f0f0f0",
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
        justifyContent: "space-around",
    },
    signatureBlock: {
        width: "25%",
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

export type PembayaranSupplierData = {
    id: string;
    nomorPenerimaan: string;
    tanggalTerima: string;
    waktuTimbangBruto?: string | null;
    waktuTimbangTarra?: string | null;
    lokasiKebun?: string | null;
    jenisBuah?: string | null;
    supplier: {
        ownerName: string;
        type: string;
    };
    transporter?: {
        nomorKendaraan: string;
    };
    material: {
        name: string;
    };
    beratBruto: number;
    beratTarra: number;
    beratNetto2: number;
    hargaPerKg: number;
    totalBayar: number;
    nilaiPpn: number;
    nilaiPph: number;
    jumlahBayarFinal: number;
    upahBongkar: number;
    totalUpahBongkar: number;
    company?: {
        name: string;
        address?: string;
    };
};

type Props = {
    data: PembayaranSupplierData[];
    startDate?: string;
    endDate?: string;
    createdByName?: string;
    diperiksaOleh?: string;
    diperiksaJabatan?: string;
    diketahuiOleh?: string;
    diketahuiJabatan?: string;
};

const formatNumber = (num: number) => num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const formatCurrency = (num: number) => num.toLocaleString("id-ID", { minimumFractionDigits: 0 });

const formatDate = (dateString: string) => {
    return formatDateInJakarta(dateString, { year: "2-digit" });
};

const formatTime = (dateString?: string | null) => formatTimeInJakarta(dateString);
const formatJenisBuah = (value?: string | null) => value?.replace("TBS-", "") ?? "-";

export const PembayaranSupplierPDF: React.FC<Props> = ({
    data,
    startDate,
    endDate,
    createdByName,
    diperiksaOleh,
    diperiksaJabatan,
    diketahuiOleh,
    diketahuiJabatan,
}) => {
    const totalBruto = data.reduce((sum, item) => sum + item.beratBruto, 0);
    const totalTarra = data.reduce((sum, item) => sum + item.beratTarra, 0);
    const totalNetto2 = data.reduce((sum, item) => sum + item.beratNetto2, 0);
    const totalPembayaran = data.reduce((sum, item) => sum + item.totalBayar, 0);
    const totalPpn = data.reduce((sum, item) => sum + item.nilaiPpn, 0);
    const totalPph = data.reduce((sum, item) => sum + item.nilaiPph, 0);
    const totalJumlahBayar = data.reduce((sum, item) => sum + item.jumlahBayarFinal, 0);
    const totalUpahBongkar = data.reduce((sum, item) => sum + item.totalUpahBongkar, 0);

    const periodText = startDate && endDate
        ? `Periode: ${format(new Date(startDate), "dd MMMM yyyy", { locale: idLocale })} - ${format(new Date(endDate), "dd MMMM yyyy", { locale: idLocale })}`
        : startDate
            ? `Mulai: ${format(new Date(startDate), "dd MMMM yyyy", { locale: idLocale })}`
            : endDate
                ? `Sampai: ${format(new Date(endDate), "dd MMMM yyyy", { locale: idLocale })}`
                : "Semua Periode";

    const companyName = data[0]?.company?.name ?? "PT TARO RAKAYA TASYRA";
    const companyAddress = data[0]?.company?.address ?? "JL LINTAS LANGGAM KM. 3 DESA LUBUK OGONG";

    return (
        <Page size="A4" orientation="landscape" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                {logoBase64 && (
                    <Image style={styles.logo} src={logoBase64} />
                )}
                <View style={styles.headerText}>
                    <Text style={styles.companyName}>{companyName}</Text>
                    <Text style={styles.companyAddress}>{companyAddress}</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>LAPORAN PEMBAYARAN SUPPLIER TBS</Text>
            <Text style={styles.period}>{periodText}</Text>

            {/* Table */}
            <View style={styles.table}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colNo]}>No</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colNomor]}>No Penerimaan</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colTanggal]}>Tgl</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colJamMasuk]}>Jam Masuk</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colJamKeluar]}>Jam Keluar</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colSupplier]}>Supplier</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colKendaraan]}>No Kendaraan</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colLokasiKebun]}>Lokasi Kebun</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colJenisBuah]}>Jenis</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.colMaterial]}>Material</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colBruto]}>Bruto</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colTarra]}>Tarra</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colNetto2]}>Netto 2</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colHarga]}>Harga</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colTotal]}>Total Bayar</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colPpn]}>PPN</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colPph]}>PPH</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colJumlahBayar]}>Jml Bayar</Text>
                    <Text style={[styles.tableCell, styles.tableCellHeader, styles.tableCellRight, styles.colUpah]}>Upah</Text>
                    <Text style={[styles.tableCellLast, styles.tableCellHeader, styles.tableCellRight, styles.colTotUpah]}>Tot Upah</Text>
                </View>

                {/* Table Body */}
                {data.map((item, index) => (
                    <View key={item.id} style={index === data.length - 1 ? styles.tableRowLast : styles.tableRow}>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colNo]}>{index + 1}</Text>
                        <Text style={[styles.tableCell, styles.colNomor]}>{item.nomorPenerimaan}</Text>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colTanggal]}>{formatDate(item.tanggalTerima)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colJamMasuk]}>{formatTime(item.waktuTimbangBruto)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colJamKeluar]}>{formatTime(item.waktuTimbangTarra)}</Text>
                        <Text style={[styles.tableCell, styles.colSupplier]}>{item.supplier.ownerName}</Text>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colKendaraan]}>{item.transporter?.nomorKendaraan ?? "-"}</Text>
                        <Text style={[styles.tableCell, styles.colLokasiKebun]}>{item.lokasiKebun ?? "-"}</Text>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colJenisBuah]}>{formatJenisBuah(item.jenisBuah)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellCenter, styles.colMaterial]}>{item.material.name}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colBruto]}>{formatNumber(item.beratBruto)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colTarra]}>{formatNumber(item.beratTarra)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colNetto2]}>{formatNumber(item.beratNetto2)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colHarga]}>{formatNumber(item.hargaPerKg)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colTotal]}>{formatCurrency(item.totalBayar)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colPpn]}>{formatCurrency(item.nilaiPpn)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colPph]}>{formatCurrency(item.nilaiPph)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colJumlahBayar]}>{formatCurrency(item.jumlahBayarFinal)}</Text>
                        <Text style={[styles.tableCell, styles.tableCellRight, styles.colUpah]}>{formatNumber(item.upahBongkar)}</Text>
                        <Text style={[styles.tableCellLast, styles.tableCellRight, styles.colTotUpah]}>{formatCurrency(item.totalUpahBongkar)}</Text>
                    </View>
                ))}

                {/* Total Row */}
                <View style={[styles.tableRow, styles.totalRow]}>
                    <Text
                        style={[
                            styles.tableCell,
                            styles.colTotalLabel,
                            { fontFamily: "Roboto-Bold", textAlign: "right" },
                        ]}
                    >
                        TOTAL ({data.length} Transaksi)
                    </Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colBruto, { fontFamily: "Roboto-Bold" }]}>{formatNumber(totalBruto)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colTarra, { fontFamily: "Roboto-Bold" }]}>{formatNumber(totalTarra)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colNetto2, { fontFamily: "Roboto-Bold" }]}>{formatNumber(totalNetto2)}</Text>
                    <View style={[styles.tableCell, styles.colHarga]} />
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colTotal, { fontFamily: "Roboto-Bold" }]}>{formatCurrency(totalPembayaran)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colPpn, { fontFamily: "Roboto-Bold" }]}>{formatCurrency(totalPpn)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colPph, { fontFamily: "Roboto-Bold" }]}>{formatCurrency(totalPph)}</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight, styles.colJumlahBayar, { fontFamily: "Roboto-Bold" }]}>{formatCurrency(totalJumlahBayar)}</Text>
                    <View style={[styles.tableCell, styles.colUpah]} />
                    <Text style={[styles.tableCellLast, styles.tableCellRight, styles.colTotUpah, { fontFamily: "Roboto-Bold" }]}>{formatCurrency(totalUpahBongkar)}</Text>
                </View>
            </View>

            {/* Signatures */}
            <View style={styles.signatureSection}>
                <View style={styles.signatureBlock}>
                    <Text style={styles.signatureLabel}>Dibuat Oleh,</Text>
                    <Text style={styles.signatureName}>{createdByName ?? "-"}</Text>
                    <Text style={styles.signatureTitle}>Admin</Text>
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
                <Text>Halaman 1 dari 1</Text>
            </View>
        </Page>
    );
};

export const PembayaranSupplierDocument: React.FC<Props> = (props) => (
    <Document>
        <PembayaranSupplierPDF {...props} />
    </Document>
);
