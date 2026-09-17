import { StatusPembayaran } from "@prisma/client";

import { hutangRepository } from "@/server/repositories/hutang.repository";
import { neracaRepository, type DateFilter } from "@/server/repositories/neraca.repository";
import {
  inputHargaVendorTransportirSchema,
  type InputHargaVendorTransportirInput,
  type PembayaranHutangInput,
} from "@/server/schema/keuangan";
import { db } from "@/server/db";

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
};

type PayableFilters = DateFilter & {
  search?: string;
  name?: string;
  status?: StatusPembayaran;
};

type UnloadingFilters = PayableFilters & {
  sourceType?: "PENERIMAAN_TBS" | "PENGIRIMAN_PRODUCT";
  vendorName?: string;
  counterpartName?: string;
};

type TransporterPaymentFilters = DateFilter & {
  search?: string;
  status?: StatusPembayaran | "PENDING_PRICE";
};

type ReceivableFilters = DateFilter & {
  search?: string;
  status?: StatusPembayaran;
};

const paymentStatusOrder: StatusPembayaran[] = ["UNPAID", "PARTIAL", "PAID"];

function isBankAccount(value: unknown): value is BankAccount {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.bankName === "string" &&
    typeof candidate.accountNumber === "string" &&
    typeof candidate.accountName === "string"
  );
}

function parseBankAccounts(value: unknown): BankAccount[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isBankAccount);
}

function parseSelectedBank(value: unknown): BankAccount | null {
  return isBankAccount(value) ? value : null;
}

function resolveBankAccount(selected: unknown, fallbackAccounts: unknown): BankAccount | null {
  const selectedBank = parseSelectedBank(selected);
  if (selectedBank) {
    return selectedBank;
  }

  const accounts = parseBankAccounts(fallbackAccounts);
  if (accounts.length === 0) {
    return null;
  }

  return accounts.find((account) => account.isDefault) ?? accounts[0] ?? null;
}

function derivePaymentStatus(total: number, paid: number): StatusPembayaran {
  if (total <= 0) {
    return "PAID";
  }

  if (paid <= 0) {
    return "UNPAID";
  }

  if (paid >= total) {
    return "PAID";
  }

  return "PARTIAL";
}

function buildRangeFilter<T extends string>(field: T, filter?: DateFilter) {
  if (!filter?.startDate && !filter?.endDate) {
    return {};
  }

  return {
    [field]: {
      ...(filter.startDate ? { gte: filter.startDate } : {}),
      ...(filter.endDate ? { lte: filter.endDate } : {}),
    },
  } as Record<T, { gte?: Date; lte?: Date }>;
}

function sumPaymentStatus<T extends { totalNilai: number; totalDibayar: number; status: StatusPembayaran }>(
  items: T[]
) {
  return items.reduce(
    (acc, item) => {
      acc.totalNilai += item.totalNilai;
      acc.totalDibayar += item.totalDibayar;
      acc.sisaHutang += Math.max(0, item.totalNilai - item.totalDibayar);

      if (item.status === "UNPAID") acc.jumlahUnpaid += 1;
      if (item.status === "PARTIAL") acc.jumlahPartial += 1;
      if (item.status === "PAID") acc.jumlahPaid += 1;

      return acc;
    },
    {
      totalNilai: 0,
      totalDibayar: 0,
      sisaHutang: 0,
      jumlahUnpaid: 0,
      jumlahPartial: 0,
      jumlahPaid: 0,
    }
  );
}

function sortByStatus<T extends { status: StatusPembayaran; tanggal: Date }>(items: T[]) {
  return [...items].sort((a, b) => {
    const statusDiff = paymentStatusOrder.indexOf(a.status) - paymentStatusOrder.indexOf(b.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }

    return b.tanggal.getTime() - a.tanggal.getTime();
  });
}

async function ensureSupplierPayable(companyId: string, penerimaanId: string) {
  const penerimaan = await db.penerimaanTBS.findFirst({
    where: {
      id: penerimaanId,
      companyId,
      status: "COMPLETED",
    },
    include: {
      supplier: true,
    },
  });

  if (!penerimaan) {
    throw new Error("Penerimaan TBS tidak ditemukan");
  }

  if (penerimaan.jumlahBayarFinal <= 0) {
    throw new Error("Nilai hutang supplier belum tersedia");
  }

  const existing = await db.hutang.findFirst({
    where: {
      companyId,
      referensiId: penerimaan.id,
      tipeTransaksi: "PENERIMAAN_TBS",
      pihakKetigaTipe: "SUPPLIER",
    },
  });

  if (existing) {
    return existing;
  }

  return hutangRepository.create(companyId, {
    tipeTransaksi: "PENERIMAAN_TBS",
    referensiId: penerimaan.id,
    referensiNomor: penerimaan.nomorPenerimaan,
    tanggalTransaksi: penerimaan.tanggalTerima,
    tanggalJatuhTempo: null,
    pihakKetigaId: penerimaan.supplierId,
    pihakKetigaNama: penerimaan.supplier.companyName || penerimaan.supplier.ownerName,
    pihakKetigaTipe: "SUPPLIER",
    totalNilai: penerimaan.jumlahBayarFinal,
    keterangan: `Hutang supplier dari ${penerimaan.nomorPenerimaan}`,
  });
}

async function ensureUnloadingPayable(
  companyId: string,
  sourceType: "PENERIMAAN_TBS" | "PENGIRIMAN_PRODUCT",
  sourceId: string
) {
  if (sourceType === "PENERIMAAN_TBS") {
    const penerimaan = await db.penerimaanTBS.findFirst({
      where: {
        id: sourceId,
        companyId,
        status: "COMPLETED",
      },
      include: {
        vendorBongkar: true,
      },
    });

    if (!penerimaan || !penerimaan.vendorBongkar) {
      throw new Error("Data upah bongkar penerimaan TBS tidak ditemukan");
    }

    if (penerimaan.totalUpahBongkar <= 0) {
      throw new Error("Nilai upah bongkar belum tersedia");
    }

    const existing = await db.hutang.findFirst({
      where: {
        companyId,
        referensiId: penerimaan.id,
        tipeTransaksi: "PENERIMAAN_TBS",
        pihakKetigaTipe: "VENDOR_BONGKAR",
      },
    });

    if (existing) {
      return existing;
    }

    return hutangRepository.create(companyId, {
      tipeTransaksi: "PENERIMAAN_TBS",
      referensiId: penerimaan.id,
      referensiNomor: penerimaan.nomorPenerimaan,
      tanggalTransaksi: penerimaan.tanggalTerima,
      tanggalJatuhTempo: null,
      pihakKetigaId: penerimaan.vendorBongkarId,
      pihakKetigaNama: penerimaan.vendorBongkar.name,
      pihakKetigaTipe: "VENDOR_BONGKAR",
      totalNilai: penerimaan.totalUpahBongkar,
      keterangan: `Upah bongkar TBS ${penerimaan.nomorPenerimaan}`,
    });
  }

  const pengiriman = await db.pengirimanProduct.findFirst({
    where: {
      id: sourceId,
      companyId,
      status: { in: ["TIMBANG_GROSS", "COMPLETED"] },
    } as never,
    include: {
      vendorBongkar: true,
    },
  });

  if (!pengiriman || !pengiriman.vendorBongkar) {
    throw new Error("Data upah bongkar pengiriman product tidak ditemukan");
  }

  if (pengiriman.totalUpahBongkar <= 0) {
    throw new Error("Nilai upah bongkar belum tersedia");
  }

  const existing = await db.hutang.findFirst({
    where: {
      companyId,
      referensiId: pengiriman.id,
      tipeTransaksi: "PENGIRIMAN_PRODUCT",
      pihakKetigaTipe: "VENDOR_BONGKAR",
    },
  });

  if (existing) {
    return existing;
  }

  return hutangRepository.create(companyId, {
    tipeTransaksi: "PENGIRIMAN_PRODUCT",
    referensiId: pengiriman.id,
    referensiNomor: pengiriman.nomorPengiriman,
    tanggalTransaksi: pengiriman.tanggalPengiriman,
    tanggalJatuhTempo: null,
    pihakKetigaId: pengiriman.vendorBongkarId,
    pihakKetigaNama: pengiriman.vendorBongkar.name,
    pihakKetigaTipe: "VENDOR_BONGKAR",
    totalNilai: pengiriman.totalUpahBongkar,
    keterangan: `Upah bongkar pengiriman ${pengiriman.nomorPengiriman}`,
  });
}

async function ensureTransporterPayable(companyId: string, pengirimanId: string) {
  const pengiriman = await db.pengirimanProduct.findFirst({
    where: {
      id: pengirimanId,
      companyId,
      status: "COMPLETED",
    },
    include: {
      vendorVehicle: {
        include: {
          vendor: true,
        },
      },
      buyer: true,
    },
  });

  if (!pengiriman) {
    throw new Error("Data pengiriman tidak ditemukan");
  }

  if (pengiriman.totalHargaVendorTransportir < 0) {
    throw new Error("Harga vendor transportir tidak valid");
  }

  const existing = await db.hutang.findFirst({
    where: {
      companyId,
      referensiId: pengiriman.id,
      tipeTransaksi: "PENGIRIMAN_PRODUCT",
      pihakKetigaTipe: "VENDOR_TRANSPORTIR",
    },
  });

  if (existing) {
    return existing;
  }

  return hutangRepository.create(companyId, {
    tipeTransaksi: "PENGIRIMAN_PRODUCT",
    referensiId: pengiriman.id,
    referensiNomor: pengiriman.nomorPengiriman,
    tanggalTransaksi: pengiriman.tanggalPengiriman,
    tanggalJatuhTempo: null,
    pihakKetigaId: pengiriman.vendorVehicle.vendorId,
    pihakKetigaNama: pengiriman.vendorVehicle.vendor.name,
    pihakKetigaTipe: "VENDOR_TRANSPORTIR",
    totalNilai: pengiriman.totalHargaVendorTransportir,
    keterangan: `Tagihan transportir ${pengiriman.nomorPengiriman}${pengiriman.buyer?.name ? ` - ${pengiriman.buyer.name}` : ""}`,
  });
}

export const keuanganDashboardService = {
  async getSupplierPayables(companyId: string, filters?: PayableFilters) {
    const penerimaan = await db.penerimaanTBS.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        ...buildRangeFilter("tanggalTerima", filters),
      },
      include: {
        supplier: true,
        material: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { tanggalTerima: "desc" },
    });

    const hutangIds = penerimaan.map((item) => item.id);
    const hutangs = hutangIds.length
      ? await db.hutang.findMany({
          where: {
            companyId,
            referensiId: { in: hutangIds },
            tipeTransaksi: "PENERIMAAN_TBS",
            pihakKetigaTipe: "SUPPLIER",
          },
          include: {
            pembayaranHutang: {
              orderBy: { tanggalBayar: "desc" },
            },
          },
        })
      : [];

    const hutangMap = new Map(hutangs.map((item) => [item.referensiId, item]));

    let items = penerimaan
      .map((item) => {
        const hutang = hutangMap.get(item.id);
        const totalNilai = item.jumlahBayarFinal || item.totalBayar + item.nilaiPpn - item.nilaiPph;
        const totalDibayar = hutang?.totalDibayar || 0;
        const status = hutang?.status || derivePaymentStatus(totalNilai, totalDibayar);
        const bank = resolveBankAccount(item.selectedBankAccount, item.supplier.bankAccounts);

        return {
          id: item.id,
          hutangId: hutang?.id || null,
          nomorReferensi: item.nomorPenerimaan,
          tanggal: item.tanggalTerima,
          supplierId: item.supplierId,
          supplierNama: item.supplier.companyName || item.supplier.ownerName,
          supplierTipe: item.supplier.type,
          materialNama: item.material.name,
          beratNetto: item.beratNetto2,
          hargaPerKg: item.hargaPerKg,
          totalNilai,
          totalDibayar,
          sisaHutang: Math.max(0, totalNilai - totalDibayar),
          status,
          bankName: bank?.bankName || null,
          accountNumber: bank?.accountNumber || null,
          accountName: bank?.accountName || null,
          pembayaranHutang: hutang?.pembayaranHutang || [],
        };
      })
      .filter((item) => item.totalNilai > 0);

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.nomorReferensi.toLowerCase().includes(search) ||
          item.supplierNama.toLowerCase().includes(search) ||
          item.materialNama.toLowerCase().includes(search) ||
          (item.accountNumber || "").toLowerCase().includes(search)
      );
    }

    if (filters?.name) {
      const name = filters.name.toLowerCase();
      items = items.filter((item) => item.supplierNama.toLowerCase().includes(name));
    }

    if (filters?.status) {
      items = items.filter((item) => item.status === filters.status);
    }

    const sortedItems = sortByStatus(items);
    const summary = sumPaymentStatus(sortedItems);

    return {
      items: sortedItems,
      summary: {
        totalNilai: summary.totalNilai,
        totalDibayar: summary.totalDibayar,
        sisaHutang: summary.sisaHutang,
        jumlahUnpaid: summary.jumlahUnpaid,
        jumlahPartial: summary.jumlahPartial,
        jumlahPaid: summary.jumlahPaid,
      },
    };
  },

  async paySupplierPayable(
    companyId: string,
    penerimaanId: string,
    data: PembayaranHutangInput,
    dibayarOleh: string
  ) {
    const hutang = await ensureSupplierPayable(companyId, penerimaanId);
    return hutangRepository.bayar(hutang.id, { ...data, hutangId: hutang.id }, dibayarOleh);
  },

  async markSupplierPayablePaid(companyId: string, penerimaanId: string, dibayarOleh: string) {
    const hutang = await ensureSupplierPayable(companyId, penerimaanId);
    return hutangRepository.markAsPaid(hutang.id, dibayarOleh);
  },

  async markSupplierPayablesPaid(
    companyId: string,
    penerimaanIds: string[],
    dibayarOleh: string,
  ) {
    const uniqueIds = Array.from(new Set(penerimaanIds));
    const results = [];

    for (const penerimaanId of uniqueIds) {
      results.push(await this.markSupplierPayablePaid(companyId, penerimaanId, dibayarOleh));
    }

    return {
      count: results.length,
    };
  },

  async cancelSupplierPayment(companyId: string, paymentId: string) {
    return hutangRepository.cancelPayment(paymentId, companyId);
  },

  async setTransporterPrice(companyId: string, payload: InputHargaVendorTransportirInput) {
    const data = inputHargaVendorTransportirSchema.parse(payload);

    const pengiriman = await db.pengirimanProduct.findFirst({
      where: {
        id: data.pengirimanId,
        companyId,
        status: "COMPLETED",
      },
      include: {
        buyer: true,
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!pengiriman) {
      throw new Error("Data pengiriman tidak ditemukan");
    }

    if (!pengiriman.beratNetto || pengiriman.beratNetto <= 0) {
      throw new Error("Berat netto pengiriman belum tersedia");
    }

    const dpp = pengiriman.beratNetto * data.hargaPerKg;
    const ppnPersen = data.ppnPersen || 0;
    const pphPersen = data.pphPersen || 0;
    const nilaiPpn = (dpp * ppnPersen) / 100;
    const nilaiPph = (dpp * pphPersen) / 100;
    const totalNilai = Math.round(dpp + nilaiPpn - nilaiPph);

    const taxDetails = [];
    if (ppnPersen > 0) taxDetails.push(`PPN ${ppnPersen}%: Rp ${Math.round(nilaiPpn).toLocaleString("id-ID")}`);
    if (pphPersen > 0) taxDetails.push(`PPh ${pphPersen}%: Rp ${Math.round(nilaiPph).toLocaleString("id-ID")}`);
    const taxNote = taxDetails.length > 0 ? ` (DPP: Rp ${Math.round(dpp).toLocaleString("id-ID")}, ${taxDetails.join(", ")})` : "";
    const keteranganHutang = `Tagihan transportir ${pengiriman.nomorPengiriman}${pengiriman.buyer?.name ? ` - ${pengiriman.buyer.name}` : ""}${taxNote}`;

    const existingHutang = await db.hutang.findFirst({
      where: {
        companyId,
        referensiId: pengiriman.id,
        tipeTransaksi: "PENGIRIMAN_PRODUCT",
        pihakKetigaTipe: "VENDOR_TRANSPORTIR",
      },
    });

    if (existingHutang && existingHutang.totalDibayar > 0 && existingHutang.totalNilai !== totalNilai) {
      throw new Error("Harga vendor transportir tidak bisa diubah karena pembayaran sudah berjalan");
    }

    const status = existingHutang
      ? derivePaymentStatus(totalNilai, existingHutang.totalDibayar)
      : derivePaymentStatus(totalNilai, 0);

    return db.$transaction(async (tx) => {
      const updatedPengiriman = await tx.pengirimanProduct.update({
        where: { id: pengiriman.id },
        data: {
          hargaVendorTransportir: data.hargaPerKg,
          ppnPersen,
          pphPersen,
          nilaiPpn,
          nilaiPph,
          totalHargaVendorTransportir: totalNilai,
        },
        include: {
          buyer: true,
          vendorVehicle: {
            include: {
              vendor: true,
            },
          },
        },
      });

      if (existingHutang) {
        await tx.hutang.update({
          where: { id: existingHutang.id },
          data: {
            referensiNomor: pengiriman.nomorPengiriman,
            tanggalTransaksi: pengiriman.tanggalPengiriman,
            pihakKetigaId: pengiriman.vendorVehicle.vendorId,
            pihakKetigaNama: pengiriman.vendorVehicle.vendor.name,
            totalNilai,
            sisaHutang: Math.max(0, totalNilai - existingHutang.totalDibayar),
            status,
            keterangan: keteranganHutang,
          },
        });
      } else {
        await tx.hutang.create({
          data: {
            companyId,
            tipeTransaksi: "PENGIRIMAN_PRODUCT",
            referensiId: pengiriman.id,
            referensiNomor: pengiriman.nomorPengiriman,
            tanggalTransaksi: pengiriman.tanggalPengiriman,
            tanggalJatuhTempo: null,
            pihakKetigaId: pengiriman.vendorVehicle.vendorId,
            pihakKetigaNama: pengiriman.vendorVehicle.vendor.name,
            pihakKetigaTipe: "VENDOR_TRANSPORTIR",
            totalNilai,
            totalDibayar: 0,
            sisaHutang: Math.max(0, totalNilai),
            status: totalNilai <= 0 ? "PAID" : "UNPAID",
            keterangan: keteranganHutang,
          },
        });
      }

      return updatedPengiriman;
    });
  },

  async getTransporterPayments(companyId: string, filters?: TransporterPaymentFilters) {
    const pengirimanProduct = await db.pengirimanProduct.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        ...buildRangeFilter("tanggalPengiriman", filters),
      },
      include: {
        buyer: true,
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: { tanggalPengiriman: "desc" },
    });

    const hutangs = pengirimanProduct.length
      ? await db.hutang.findMany({
          where: {
            companyId,
            referensiId: { in: pengirimanProduct.map((item) => item.id) },
            tipeTransaksi: "PENGIRIMAN_PRODUCT",
            pihakKetigaTipe: "VENDOR_TRANSPORTIR",
          },
          include: {
            pembayaranHutang: {
              orderBy: { tanggalBayar: "desc" },
            },
          },
        })
      : [];

    const hutangMap = new Map(hutangs.map((item) => [item.referensiId, item]));
    const statusOrder = ["PENDING_PRICE", "UNPAID", "PARTIAL", "PAID"] as const;

    let items = pengirimanProduct.map((item) => {
      const hutang = hutangMap.get(item.id);
      const hasHarga = Boolean(hutang || item.totalHargaVendorTransportir > 0 || item.hargaVendorTransportir > 0);
      const totalNilai = hutang ? hutang.totalNilai : (item.totalHargaVendorTransportir || 0);
      const totalDibayar = hutang?.totalDibayar || 0;
      const status = hasHarga
        ? hutang?.status || derivePaymentStatus(totalNilai, totalDibayar)
        : "PENDING_PRICE";

      const dpp = Math.round((item.beratNetto || 0) * (item.hargaVendorTransportir || 0));
      let ppnPersen = item.ppnPersen || 0;
      let pphPersen = item.pphPersen || 0;
      let nilaiPpn = item.nilaiPpn || 0;
      let nilaiPph = item.nilaiPph || 0;

      // Fallback parsing from hutang.keterangan if existing record had 0 stored in item
      if (hasHarga && ppnPersen === 0 && pphPersen === 0 && hutang?.keterangan) {
        const ppnMatch = hutang.keterangan.match(/PPN\s+([\d.]+)%:\s+Rp\s+([\d.,]+)/);
        if (ppnMatch?.[1]) {
          ppnPersen = parseFloat(ppnMatch[1]);
          nilaiPpn = (dpp * ppnPersen) / 100;
        }
        const pphMatch = hutang.keterangan.match(/PPh\s+([\d.]+)%:\s+Rp\s+([\d.,]+)/);
        if (pphMatch?.[1]) {
          pphPersen = parseFloat(pphMatch[1]);
          nilaiPph = (dpp * pphPersen) / 100;
        }
      }

      if (hasHarga && nilaiPpn === 0 && ppnPersen > 0) {
        nilaiPpn = (dpp * ppnPersen) / 100;
      }
      if (hasHarga && nilaiPph === 0 && pphPersen > 0) {
        nilaiPph = (dpp * pphPersen) / 100;
      }

      return {
        id: item.id,
        hutangId: hutang?.id || null,
        nomorReferensi: item.nomorPengiriman,
        tanggal: item.tanggalPengiriman,
        buyerNama: item.buyer?.name || "-",
        vendorNama: item.vendorVehicle.vendor.name,
        vendorId: item.vendorVehicle.vendorId,
        nomorKendaraan: item.vendorVehicle.nomorKendaraan,
        namaSupir: item.vendorVehicle.namaSupir,
        beratNetto: item.beratNetto || 0,
        hargaPerKg: item.hargaVendorTransportir,
        dpp,
        ppnPersen,
        pphPersen,
        nilaiPpn,
        nilaiPph,
        totalNilai,
        totalDibayar,
        sisaHutang: hasHarga ? Math.max(0, totalNilai - totalDibayar) : 0,
        status,
        hasHarga,
        bankName: item.vendorVehicle.vendor.bankName || null,
        accountNumber: item.vendorVehicle.vendor.accountNumber || null,
        accountName: item.vendorVehicle.vendor.accountName || null,
        pembayaranHutang: hutang?.pembayaranHutang || [],
      };
    });

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.nomorReferensi.toLowerCase().includes(search) ||
          item.vendorNama.toLowerCase().includes(search) ||
          item.buyerNama.toLowerCase().includes(search) ||
          item.nomorKendaraan.toLowerCase().includes(search) ||
          (item.accountNumber || "").toLowerCase().includes(search)
      );
    }

    if (filters?.status) {
      items = items.filter((item) => item.status === filters.status);
    }

    const sortedItems = [...items].sort((a, b) => {
      const statusDiff = statusOrder.indexOf(a.status as (typeof statusOrder)[number]) - statusOrder.indexOf(b.status as (typeof statusOrder)[number]);
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return b.tanggal.getTime() - a.tanggal.getTime();
    });

    const summary = sortedItems.reduce(
      (acc, item) => {
        acc.totalNilai += item.totalNilai;
        acc.totalDibayar += item.totalDibayar;
        acc.sisaHutang += item.sisaHutang;

        if (item.status === "PENDING_PRICE") acc.jumlahBelumInputHarga += 1;
        if (item.status === "UNPAID") acc.jumlahUnpaid += 1;
        if (item.status === "PARTIAL") acc.jumlahPartial += 1;
        if (item.status === "PAID") acc.jumlahPaid += 1;

        return acc;
      },
      {
        totalNilai: 0,
        totalDibayar: 0,
        sisaHutang: 0,
        jumlahBelumInputHarga: 0,
        jumlahUnpaid: 0,
        jumlahPartial: 0,
        jumlahPaid: 0,
      }
    );

    return {
      items: sortedItems,
      summary,
    };
  },

  async payTransporterPayment(
    companyId: string,
    pengirimanId: string,
    data: PembayaranHutangInput,
    dibayarOleh: string
  ) {
    const hutang = await ensureTransporterPayable(companyId, pengirimanId);
    return hutangRepository.bayar(hutang.id, { ...data, hutangId: hutang.id }, dibayarOleh);
  },

  async markTransporterPaymentPaid(companyId: string, pengirimanId: string, dibayarOleh: string) {
    const hutang = await ensureTransporterPayable(companyId, pengirimanId);
    return hutangRepository.markAsPaid(hutang.id, dibayarOleh);
  },

  async getUnloadingWages(companyId: string, filters?: UnloadingFilters) {
    const [penerimaanTbs, pengirimanProduct] = await Promise.all([
      db.penerimaanTBS.findMany({
        where: {
          companyId,
          status: "COMPLETED",
          vendorBongkarId: { not: null },
          totalUpahBongkar: { gt: 0 },
          ...buildRangeFilter("tanggalTerima", filters),
        },
        include: {
          supplier: true,
          vendorBongkar: true,
        },
        orderBy: { tanggalTerima: "desc" },
      }),
      db.pengirimanProduct.findMany({
        where: {
          companyId,
          status: { in: ["TIMBANG_GROSS", "COMPLETED"] },
          vendorBongkarId: { not: null },
          totalUpahBongkar: { gt: 0 },
          ...buildRangeFilter("tanggalPengiriman", filters),
        } as never,
        include: {
          buyer: true,
          vendorBongkar: true,
          vendorVehicle: {
            include: {
              vendor: true,
            },
          },
        },
        orderBy: { tanggalPengiriman: "desc" },
      }),
    ]);

    const hutangWhere = [];

    if (penerimaanTbs.length > 0) {
      hutangWhere.push({
        referensiId: { in: penerimaanTbs.map((item) => item.id) },
        tipeTransaksi: "PENERIMAAN_TBS",
      });
    }

    if (pengirimanProduct.length > 0) {
      hutangWhere.push({
        referensiId: { in: pengirimanProduct.map((item) => item.id) },
        tipeTransaksi: "PENGIRIMAN_PRODUCT",
      });
    }

    const hutangs = hutangWhere.length
      ? await db.hutang.findMany({
          where: {
            companyId,
            pihakKetigaTipe: "VENDOR_BONGKAR",
            OR: hutangWhere,
          } as never,
          include: {
            pembayaranHutang: {
              orderBy: { tanggalBayar: "desc" },
            },
          },
        })
      : [];

    const hutangMap = new Map(hutangs.map((item) => [`${item.tipeTransaksi}:${item.referensiId}`, item]));

    let items = [
      ...penerimaanTbs.map((item) => {
        const hutang = hutangMap.get(`PENERIMAAN_TBS:${item.id}`);
        const totalDibayar = hutang?.totalDibayar || 0;
        const status = hutang?.status || derivePaymentStatus(item.totalUpahBongkar, totalDibayar);
        const bank = resolveBankAccount(item.selectedVendorBongkarBank, item.vendorBongkar?.bankAccounts);

        return {
          id: `PENERIMAAN_TBS:${item.id}`,
          sourceId: item.id,
          sourceType: "PENERIMAAN_TBS" as const,
          hutangId: hutang?.id || null,
          nomorReferensi: item.nomorPenerimaan,
          tanggal: item.tanggalTerima,
          vendorBongkarNama: item.vendorBongkar?.name || "-",
          vendorBongkarTipe: item.vendorBongkar?.tipe || null,
          counterpart: item.supplier.companyName || item.supplier.ownerName,
          beratDasar: item.beratNetto2,
          hargaPerKg: item.upahBongkar,
          totalNilai: item.totalUpahBongkar,
          totalDibayar,
          sisaHutang: Math.max(0, item.totalUpahBongkar - totalDibayar),
          status,
          bankName: bank?.bankName || null,
          accountNumber: bank?.accountNumber || null,
          accountName: bank?.accountName || null,
          pembayaranHutang: hutang?.pembayaranHutang || [],
        };
      }),
      ...pengirimanProduct.map((item) => {
        const hutang = hutangMap.get(`PENGIRIMAN_PRODUCT:${item.id}`);
        const totalDibayar = hutang?.totalDibayar || 0;
        const status = hutang?.status || derivePaymentStatus(item.totalUpahBongkar, totalDibayar);
        const bank = resolveBankAccount(item.selectedVendorBongkarBank, item.vendorBongkar?.bankAccounts);

        return {
          id: `PENGIRIMAN_PRODUCT:${item.id}`,
          sourceId: item.id,
          sourceType: "PENGIRIMAN_PRODUCT" as const,
          hutangId: hutang?.id || null,
          nomorReferensi: item.nomorPengiriman,
          tanggal: item.tanggalPengiriman,
          vendorBongkarNama: item.vendorBongkar?.name || "-",
          vendorBongkarTipe: item.vendorBongkar?.tipe || null,
          counterpart: item.buyer?.name || item.vendorVehicle.vendor.name,
          beratDasar: item.beratNetto || 0,
          hargaPerKg: item.upahBongkar,
          totalNilai: item.totalUpahBongkar,
          totalDibayar,
          sisaHutang: Math.max(0, item.totalUpahBongkar - totalDibayar),
          status,
          bankName: bank?.bankName || null,
          accountNumber: bank?.accountNumber || null,
          accountName: bank?.accountName || null,
          pembayaranHutang: hutang?.pembayaranHutang || [],
        };
      }),
    ];

    if (filters?.sourceType) {
      items = items.filter((item) => item.sourceType === filters.sourceType);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.nomorReferensi.toLowerCase().includes(search) ||
          item.vendorBongkarNama.toLowerCase().includes(search) ||
          item.counterpart.toLowerCase().includes(search) ||
          (item.accountNumber || "").toLowerCase().includes(search)
      );
    }

    if (filters?.vendorName) {
      const vendorName = filters.vendorName.toLowerCase();
      items = items.filter(
        (item) => item.vendorBongkarNama.toLowerCase().includes(vendorName),
      );
    }

    if (filters?.counterpartName) {
      const counterpartName = filters.counterpartName.toLowerCase();
      items = items.filter((item) =>
        item.counterpart.toLowerCase().includes(counterpartName),
      );
    }

    if (filters?.status) {
      items = items.filter((item) => item.status === filters.status);
    }

    const sortedItems = sortByStatus(items);
    const summary = sumPaymentStatus(sortedItems);

    return {
      items: sortedItems,
      summary: {
        totalNilai: summary.totalNilai,
        totalDibayar: summary.totalDibayar,
        sisaHutang: summary.sisaHutang,
        jumlahUnpaid: summary.jumlahUnpaid,
        jumlahPartial: summary.jumlahPartial,
        jumlahPaid: summary.jumlahPaid,
      },
    };
  },

  async payUnloadingWage(
    companyId: string,
    sourceType: "PENERIMAAN_TBS" | "PENGIRIMAN_PRODUCT",
    sourceId: string,
    data: PembayaranHutangInput,
    dibayarOleh: string
  ) {
    const hutang = await ensureUnloadingPayable(companyId, sourceType, sourceId);
    return hutangRepository.bayar(hutang.id, { ...data, hutangId: hutang.id }, dibayarOleh);
  },

  async markUnloadingWagePaid(
    companyId: string,
    sourceType: "PENERIMAAN_TBS" | "PENGIRIMAN_PRODUCT",
    sourceId: string,
    dibayarOleh: string
  ) {
    const hutang = await ensureUnloadingPayable(companyId, sourceType, sourceId);
    return hutangRepository.markAsPaid(hutang.id, dibayarOleh);
  },

  async markUnloadingWagesPaid(
    companyId: string,
    sourceType: "PENERIMAAN_TBS" | "PENGIRIMAN_PRODUCT",
    sourceIds: string[],
    dibayarOleh: string,
  ) {
    const uniqueIds = Array.from(new Set(sourceIds));
    const results = [];

    for (const sourceId of uniqueIds) {
      results.push(await this.markUnloadingWagePaid(companyId, sourceType, sourceId, dibayarOleh));
    }

    return {
      count: results.length,
    };
  },

  async cancelUnloadingWagePayment(companyId: string, paymentId: string) {
    return hutangRepository.cancelPayment(paymentId, companyId);
  },

  async getPRPayments(companyId: string, filters?: PayableFilters) {
    const purchaseRequests = await db.purchaseRequest.findMany({
      where: {
        companyId,
        tipePembelian: "PEMBELIAN_LANGSUNG",
        status: { in: ["APPROVED", "COMPLETED"] },
        ...buildRangeFilter("tanggalRequest", filters),
      } as never,
      include: {
        items: {
          include: {
            material: {
              select: {
                namaMaterial: true,
                hargaSatuan: true,
              },
            },
          },
        },
        pembayaranPR: {
          orderBy: { tanggalBayar: "desc" },
        },
      },
      orderBy: { tanggalRequest: "desc" },
    });

    let items = purchaseRequests.map((item) => {
      const totalNilai = item.items.reduce((sum, prItem) => {
        const harga = prItem.estimasiHarga || prItem.material.hargaSatuan || 0;
        return sum + prItem.jumlahRequest * harga;
      }, 0);
      const totalDibayar = item.pembayaranPR.reduce((sum, payment) => sum + payment.jumlahBayar, 0);
      const status = derivePaymentStatus(totalNilai, totalDibayar);

      return {
        id: item.id,
        nomorReferensi: item.nomorPR,
        tanggal: item.tanggalRequest,
        vendorNama: item.vendorNameDirect || "Vendor Langsung",
        divisi: item.divisi,
        requestedBy: item.requestedBy,
        documentStatus: item.status,
        totalNilai,
        totalDibayar,
        sisaHutang: Math.max(0, totalNilai - totalDibayar),
        status,
        pembayaran: item.pembayaranPR,
      };
    });

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.nomorReferensi.toLowerCase().includes(search) ||
          item.vendorNama.toLowerCase().includes(search) ||
          (item.divisi || "").toLowerCase().includes(search)
      );
    }

    if (filters?.status) {
      items = items.filter((item) => item.status === filters.status);
    }

    const sortedItems = sortByStatus(items);
    const summary = sumPaymentStatus(sortedItems);

    return {
      items: sortedItems,
      summary: {
        totalNilai: summary.totalNilai,
        totalDibayar: summary.totalDibayar,
        sisaBelumBayar: summary.sisaHutang,
        jumlahUnpaid: summary.jumlahUnpaid,
        jumlahPartial: summary.jumlahPartial,
        jumlahPaid: summary.jumlahPaid,
      },
    };
  },

  async getPOPayments(companyId: string, filters?: PayableFilters) {
    const purchaseOrders = await db.purchaseOrder.findMany({
      where: {
        companyId,
        status: { in: ["ISSUED", "PARTIAL_RECEIVED", "COMPLETED"] },
        ...buildRangeFilter("tanggalPO", filters),
      } as never,
      include: {
        vendorMaterial: true,
        pembayaranPO: {
          orderBy: { tanggalBayar: "desc" },
        },
      },
      orderBy: { tanggalPO: "desc" },
    });

    let items = purchaseOrders.map((item) => {
      const totalDibayar = item.pembayaranPO.reduce((sum, payment) => sum + payment.jumlahBayar, 0);
      const status = derivePaymentStatus(item.totalAmount, totalDibayar);
      const bank = item.vendorMaterial?.accountNumber
        ? {
            bankName: item.vendorMaterial.bankName || "-",
            accountNumber: item.vendorMaterial.accountNumber,
            accountName: item.vendorMaterial.accountName || "-",
          }
        : null;

      return {
        id: item.id,
        nomorReferensi: item.nomorPO,
        tanggal: item.tanggalPO,
        vendorNama: item.vendorName,
        documentStatus: item.status,
        totalNilai: item.totalAmount,
        totalDibayar,
        sisaHutang: Math.max(0, item.totalAmount - totalDibayar),
        status,
        termPembayaran: item.termPembayaran,
        bankName: bank?.bankName || null,
        accountNumber: bank?.accountNumber || null,
        accountName: bank?.accountName || null,
        pembayaran: item.pembayaranPO,
      };
    });

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.nomorReferensi.toLowerCase().includes(search) ||
          item.vendorNama.toLowerCase().includes(search) ||
          (item.accountNumber || "").toLowerCase().includes(search)
      );
    }

    if (filters?.status) {
      items = items.filter((item) => item.status === filters.status);
    }

    const sortedItems = sortByStatus(items);
    const summary = sumPaymentStatus(sortedItems);

    return {
      items: sortedItems,
      summary: {
        totalNilai: summary.totalNilai,
        totalDibayar: summary.totalDibayar,
        sisaBelumBayar: summary.sisaHutang,
        jumlahUnpaid: summary.jumlahUnpaid,
        jumlahPartial: summary.jumlahPartial,
        jumlahPaid: summary.jumlahPaid,
      },
    };
  },

  async getCustomerReceivables(companyId: string, filters?: ReceivableFilters) {
    const invoiceStatus =
      filters?.status === "UNPAID"
        ? "ISSUED"
        : filters?.status === "PARTIAL"
          ? "PARTIAL_PAID"
          : filters?.status === "PAID"
            ? "PAID"
            : undefined;

    const invoices = await db.invoice.findMany({
      where: {
        companyId,
        status: invoiceStatus ?? { in: ["ISSUED", "PARTIAL_PAID", "PAID"] },
        ...buildRangeFilter("tanggalInvoice", filters),
      } as never,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            paymentMethod: true,
          },
        },
        pembayaranInvoice: {
          orderBy: { tanggalBayar: "desc" },
        },
      },
      orderBy: { tanggalInvoice: "desc" },
    });

    let items = invoices.map((item) => {
      const status =
        item.status === "PAID"
          ? "PAID"
          : item.status === "PARTIAL_PAID"
            ? "PARTIAL"
            : "UNPAID";

      return {
        id: item.id,
        nomorReferensi: item.nomorInvoice,
        tanggal: item.tanggalInvoice,
        buyerNama: item.buyer?.name || "-",
        buyerCode: item.buyer?.code || null,
        contractNumber: item.contract?.contractNumber || null,
        paymentMethod: item.contract?.paymentMethod || null,
        totalNilai: item.totalNilai,
        totalDibayar: item.totalDibayar,
        sisaPiutang: item.sisaPembayaran,
        status: status as StatusPembayaran,
        pembayaran: item.pembayaranInvoice,
      };
    });

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.nomorReferensi.toLowerCase().includes(search) ||
          item.buyerNama.toLowerCase().includes(search) ||
          (item.contractNumber || "").toLowerCase().includes(search)
      );
    }

    const summary = items.reduce(
      (acc, item) => {
        acc.totalNilai += item.totalNilai;
        acc.totalDibayar += item.totalDibayar;
        acc.sisaPiutang += item.sisaPiutang;

        if (item.status === "UNPAID") acc.jumlahUnpaid += 1;
        if (item.status === "PARTIAL") acc.jumlahPartial += 1;
        if (item.status === "PAID") acc.jumlahPaid += 1;

        return acc;
      },
      {
        totalNilai: 0,
        totalDibayar: 0,
        sisaPiutang: 0,
        jumlahUnpaid: 0,
        jumlahPartial: 0,
        jumlahPaid: 0,
      }
    );

    return {
      items: items.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime()),
      summary,
    };
  },

  async getNeracaOverview(companyId: string, filter?: DateFilter) {
    const [piutangCustomer, inventaris, stockProduct, stockTBS, hutangSupplier, upahBongkar, pembayaranTransportir, pembayaranPR, pembayaranPO, biayaPengeluaran, klaimInvoice] =
      await Promise.all([
        this.getCustomerReceivables(companyId, filter),
        neracaRepository.getAsetLancarInventaris(companyId),
        neracaRepository.getAsetLancarStockProduct(companyId),
        neracaRepository.getAsetLancarStockTBS(companyId),
        this.getSupplierPayables(companyId, filter),
        this.getUnloadingWages(companyId, {
          ...filter,
          sourceType: "PENERIMAAN_TBS",
        }),
        this.getTransporterPayments(companyId, filter),
        this.getPRPayments(companyId, filter),
        this.getPOPayments(companyId, filter),
        neracaRepository.getBiayaPengeluaran(companyId, filter),
        neracaRepository.getKlaimFromInvoices(companyId, filter),
      ]);

    const totalAsetLancar =
      piutangCustomer.summary.sisaPiutang +
      inventaris.total +
      klaimInvoice.totalKlaimSusut;

    const totalKewajibanLancar =
      hutangSupplier.summary.sisaHutang +
      upahBongkar.summary.sisaHutang +
      pembayaranTransportir.summary.sisaHutang +
      pembayaranPR.summary.sisaBelumBayar +
      pembayaranPO.summary.sisaBelumBayar +
      biayaPengeluaran.total +
      klaimInvoice.totalKlaimMutu;

    return {
      period: {
        startDate: filter?.startDate || null,
        endDate: filter?.endDate || null,
      },
      summary: {
        asetLancar: totalAsetLancar,
        kewajibanLancar: totalKewajibanLancar,
        modalKerja: totalAsetLancar - totalKewajibanLancar,
        piutangCustomer: piutangCustomer.summary.sisaPiutang,
        inventaris: inventaris.total,
        klaimSusut: klaimInvoice.totalKlaimSusut,
        hutangSupplier: hutangSupplier.summary.sisaHutang,
        upahBongkar: upahBongkar.summary.sisaHutang,
        pembayaranTransportir: pembayaranTransportir.summary.sisaHutang,
        pembayaranPR: pembayaranPR.summary.sisaBelumBayar,
        pembayaranPO: pembayaranPO.summary.sisaBelumBayar,
        biayaPengeluaran: biayaPengeluaran.total,
        klaimMutu: klaimInvoice.totalKlaimMutu,
      },
      aset: {
        piutangCustomer,
        inventaris,
        klaimSusut: {
          total: klaimInvoice.totalKlaimSusut,
          count: klaimInvoice.items.filter((item) => item.klaimSusutNilai > 0).length,
          items: klaimInvoice.items.filter((item) => item.klaimSusutNilai > 0),
        },
        stockProduct,
        stockTBS,
      },
      kewajiban: {
        hutangSupplier,
        upahBongkar,
        pembayaranTransportir,
        pembayaranPR,
        pembayaranPO,
        biayaPengeluaran,
        klaimMutu: {
          total: klaimInvoice.totalKlaimMutu,
          count: klaimInvoice.items.filter((item) => item.klaimMutuNilai > 0).length,
          items: klaimInvoice.items.filter((item) => item.klaimMutuNilai > 0),
        },
      },
      notes: [
        "Piutang customer dihitung dari sisa pembayaran invoice yang belum diterima.",
        "Kewajiban dihitung dari sisa hutang supplier, upah bongkar penerimaan TBS, pembayaran transportir, PR, PO, biaya pengeluaran aktif, dan klaim mutu.",
        "Stock product dan stock TBS ditampilkan sebagai informasi kuantitas operasional karena nilai persediaan belum dihitung di modul ini.",
      ],
    };
  },
};
