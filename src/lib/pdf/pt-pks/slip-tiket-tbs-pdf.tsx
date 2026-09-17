import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from "@react-pdf/renderer";
import { formatDateTimeInJakarta } from "@/lib/date-time";


// Register bold font
Font.register({
    family: "Roboto",
    src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

Font.register({
    family: "Roboto-Bold",
    src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
});

// Paper size: 12cm x 13cm = 340pt x 368pt (1cm = 28.35pt)
const PAPER_WIDTH = 340;
const PAPER_HEIGHT = 368;

const styles = StyleSheet.create({
    page: {
        paddingTop: 20,
        paddingBottom: 15,
        paddingLeft: 20,
        paddingRight: 20,
        fontSize: 9,
        fontFamily: "Roboto",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 0,
    },
    headerText: {
        flex: 1,
        textAlign: "center",
    },
    companyName: {
        fontSize: 11,
        fontFamily: "Roboto-Bold",
        marginBottom: 0,
    },
    companyAddress: {
        fontSize: 8,
        marginBottom: 0,
    },
    title: {
        fontSize: 10,
        fontFamily: "Roboto-Bold",
        marginTop: 4,
        marginBottom: 4,
        textDecoration: "underline",
        textAlign: "center",
    },
    infoSection: {
        marginBottom: 4,
    },
    row: {
        flexDirection: "row",
        marginBottom: 1,
    },
    label: {
        width: "28%",
        fontSize: 9,
    },
    colon: {
        width: "3%",
        fontSize: 9,
    },
    value: {
        width: "69%",
        fontSize: 9,
    },
    weightSection: {
        marginTop: 4,
        marginBottom: 4,
    },
    weightRow: {
        flexDirection: "row",
        marginBottom: 2,
    },
    weightLabel: {
        width: "28%",
        fontSize: 10,
    },
    weightColon: {
        width: "3%",
        fontSize: 10,
    },
    weightValue: {
        width: "69%",
        fontSize: 10,
    },
    nettoBox: {
        marginTop: 4,
        padding: 3,
        borderWidth: 1,
        borderColor: "#000",
        borderStyle: "solid",
        borderRadius: 2,
    },
    nettoLabel: {
        fontSize: 8,
        textAlign: "center",
        marginBottom: 2,
    },
    nettoValue: {
        fontSize: 11,
        textAlign: "center",
    },
    signature: {
        marginTop: 8,
        marginRight: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 3,
    },
    signatureBox: {
        width: "30%",
        textAlign: "center",
    },
    signatureLabel: {
        fontSize: 8,
        marginBottom: 18,
    },
    signatureName: {
        fontSize: 8,
    },
    signatureNameWrapper: {
        marginTop: 2,
    },
    footer: {
        position: "absolute",
        bottom: 8,
        left: 12,
        right: 12,
        textAlign: "center",
        fontSize: 5,
        color: "#666",
    },
});

export type SlipTiketTBSData = {
    nomorPenerimaan: string;
    tanggalTerima: string;
    operatorPenimbang?: string | null;
    supplier: {
        ownerName: string;
        companyName?: string | null;
        nik: string;
        phone?: string | null;
    };
    transporter: {
        nomorKendaraan: string;
        namaSupir: string;
    };
    material: {
        nama: string;
        kategori: { nama: string };
        satuan: { nama: string };
    };
    lokasiKebun?: string | null;
    jenisBuah?: string | null;
    beratBruto: number;
    waktuTimbangBruto: string;
    beratTarra: number;
    waktuTimbangTarra?: string | null;
    beratNetto1: number;
    potonganPersen: number;
    potonganKg: number;
    beratNetto2: number;
    company?: {
        name: string;
        code: string;
        address?: string;
    };
};

type SlipTiketTBSPDFProps = {
    data: SlipTiketTBSData;
};

const formatNumber = (num: number) => num.toLocaleString("id-ID");

const formatDateTime = (dateString: string) => {
    return formatDateTimeInJakarta(dateString, { fallback: dateString, includeSeconds: true });
};

const getJenisBuahLabel = (jenis?: string | null) => {
    switch (jenis) {
        case "TBS-BB": return "Buah Besar";
        case "TBS-BS": return "Buah Biasa";
        case "TBS-BK": return "Buah Kecil";
        default: return jenis || "-";
    }
};

export const SlipTiketTBSPDF: React.FC<SlipTiketTBSPDFProps> = ({ data }) => {
    return (
        <Page size={{ width: PAPER_WIDTH, height: PAPER_HEIGHT }} style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.companyName}>
                        {data.company?.name || "PT TARO RAKAYA TASYRA"}
                    </Text>
                    <Text style={styles.companyAddress}>
                        {data.company?.address || "JL LINTAS LANGGAM KM. 3 DESA LUBUK OGONG KEC"}
                    </Text>
                    <Text style={styles.companyAddress}>
                        BANDAR SEI KIJANG. KAB. PELALAWAN, RIAU
                    </Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>TIKET TIMBANGAN TBS</Text>

            {/* Info Section 1: No Tiket, Jam Masuk, Jam Keluar */}
            <View style={styles.infoSection}>
                <View style={styles.weightRow}>
                    <Text style={styles.weightLabel}>No Tiket</Text>
                    <Text style={styles.weightColon}>:</Text>
                    <Text style={styles.weightValue}>{data.nomorPenerimaan}</Text>
                </View>
                <View style={styles.weightRow}>
                    <Text style={styles.weightLabel}>Tgl/ Jam Masuk</Text>
                    <Text style={styles.weightColon}>:</Text>
                    <Text style={styles.weightValue}>{formatDateTime(data.waktuTimbangBruto)}</Text>
                </View>
                <View style={styles.weightRow}>
                    <Text style={styles.weightLabel}>Tgl/ Jam Keluar</Text>
                    <Text style={styles.weightColon}>:</Text>
                    <Text style={styles.weightValue}>
                        {data.waktuTimbangTarra ? formatDateTime(data.waktuTimbangTarra) : "-"}
                    </Text>
                </View>
            </View>

            {/* Info Section 2: Kendaraan & Supplier */}
            <View style={styles.infoSection}>
                <View style={styles.row}>
                    <Text style={styles.label}>No. Kendaraan</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.value}>{data.transporter.nomorKendaraan}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Nama Supplier</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.value}>{data.supplier.companyName?.trim() || data.supplier.ownerName}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Nama Barang</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.value}>
                        {data.material.nama}{data.jenisBuah ? ` - ${getJenisBuahLabel(data.jenisBuah)}` : ""}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Nama Sopir</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.value}>{data.transporter.namaSupir}</Text>
                </View>
            </View>

            {/* Weight Section */}
            <View style={styles.weightSection}>
                <View style={styles.weightRow}>
                    <Text style={styles.weightLabel}>Berat Bruto</Text>
                    <Text style={styles.weightColon}>:</Text>
                    <Text style={styles.weightValue}>
                        {formatNumber(data.beratBruto)} Kg
                    </Text>
                </View>
                <View style={styles.weightRow}>
                    <Text style={styles.weightLabel}>Berat Tarra</Text>
                    <Text style={styles.weightColon}>:</Text>
                    <Text style={styles.weightValue}>
                        {formatNumber(data.beratTarra)} Kg
                    </Text>
                </View>
                <View style={styles.weightRow}>
                    <Text style={styles.weightLabel}>Berat Netto 1</Text>
                    <Text style={styles.weightColon}>:</Text>
                    <Text style={styles.weightValue}>
                        {formatNumber(data.beratNetto1)} Kg
                    </Text>
                </View>
                <View style={styles.weightRow}>
                    <Text style={styles.weightLabel}>Potongan {data.potonganPersen}%</Text>
                    <Text style={styles.weightColon}>:</Text>
                    <Text style={styles.weightValue}>
                        {formatNumber(data.potonganKg)} Kg
                    </Text>
                </View>
                {/* Berat Netto Final */}
                <View style={styles.weightRow}>
                    <Text style={styles.weightLabel}>Berat Netto 2</Text>
                    <Text style={styles.weightColon}>:</Text>
                    <Text style={styles.weightValue}>
                        {formatNumber(data.beratNetto2)} Kg
                    </Text>
                </View>
            </View>

            {/* Signature Section */}
            <View style={styles.signature}>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureLabel}>Ditimbang Oleh :</Text>
                    <View style={styles.signatureNameWrapper}>
                        <Text style={styles.signatureName}>( {data.operatorPenimbang || ".................."} )</Text>
                    </View>
                </View>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureLabel}>Diketahui Oleh :</Text>
                    <View style={styles.signatureNameWrapper}>
                        <Text style={styles.signatureName}>(                    )</Text>
                    </View>
                </View>
                <View style={styles.signatureBox}>
                    <Text style={styles.signatureLabel}>Pengemudi</Text>
                    <View style={styles.signatureNameWrapper}>
                        <Text style={styles.signatureName}>{data.transporter.namaSupir}</Text>
                    </View>
                </View>
            </View>


        </Page>
    );
};

// Document wrapper untuk export
export const SlipTiketTBSDocument: React.FC<SlipTiketTBSPDFProps> = ({ data }) => {
    return (
        <Document>
            <SlipTiketTBSPDF data={data} />
        </Document>
    );
};
