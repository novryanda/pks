import React from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { SuratPengantarPDF } from "./surat-pengantar-pdf";

type PengirimanData = {
  nomorPengiriman: string;
  tanggalPengiriman: string;
  operatorPenimbang: string;
  buyer: {
    name: string;
    code: string;
    address: string;
    contactPerson: string;
    phone: string;
  };
  contract: {
    contractNumber: string;
    deliveryDate: string | null;
    quantity?: number;
  };
  contractItem: {
    material: {
      name: string;
      code: string;
      satuan: {
        name: string;
        symbol: string;
      };
    };
  };
  vendorVehicle: {
    nomorKendaraan: string;
    namaSupir: string;
    noHpSupir?: string | null;
    noSim?: string | null;
    vendor: {
      name: string;
      code: string;
    };
  };
  beratTarra: number;
  beratGross: number;
  beratNetto: number;
  mutuCustomFields?: { fieldName: string; fieldValue: string }[] | null;
  contractCustomFields?: { fieldName: string; fieldValue: string }[] | null;
  waktuTimbangTarra: string;
  waktuTimbangGross: string;
  disetujuiOleh?: string;
  disetujuiJabatan?: string;
  diperiksaOleh?: string;
  diperiksaJabatan?: string;
  company?: {
    name: string;
    code: string;
  };
};

export async function generateSuratPengantarPDF(
  data: PengirimanData,
): Promise<Buffer> {
  const pdfElement = (
    <Document>
      <SuratPengantarPDF data={data} />
    </Document>
  );
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}
