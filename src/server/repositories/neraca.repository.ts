import { db } from "@/server/db";

// Filter date range type
export type DateFilter = {
  startDate?: Date;
  endDate?: Date;
};

// Repository untuk generate data neraca (balance sheet)
export const neracaRepository = {
  // Get klaim susut dan klaim mutu dari invoice sebagai kewajiban
  async getKlaimFromInvoices(companyId: string, filter?: DateFilter) {
    const whereClause: {
      companyId: string;
      status: { not: "CANCELLED" };
      tanggalInvoice?: { gte?: Date; lte?: Date };
    } = {
      companyId,
      status: { not: "CANCELLED" },
    };

    if (filter?.startDate || filter?.endDate) {
      whereClause.tanggalInvoice = {};
      if (filter.startDate) {
        whereClause.tanggalInvoice.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.tanggalInvoice.lte = filter.endDate;
      }
    }

    const invoices = await db.invoice.findMany({
      where: whereClause,
      select: {
        id: true,
        nomorInvoice: true,
        tanggalInvoice: true,
        klaimMutuPersen: true,
        klaimMutuNilai: true,
        klaimMutuKeterangan: true,
        klaimSusutPersen: true,
        klaimSusutNilai: true,
        klaimSusutKeterangan: true,
        buyer: {
          select: {
            name: true,
          },
        },
        contract: {
          select: {
            contractNumber: true,
          },
        },
      },
      orderBy: { tanggalInvoice: "desc" },
    });

    const totalKlaimMutu = invoices.reduce((sum, inv) => sum + inv.klaimMutuNilai, 0);
    const totalKlaimSusut = invoices.reduce((sum, inv) => sum + inv.klaimSusutNilai, 0);
    const totalKlaim = totalKlaimMutu + totalKlaimSusut;

    // Items with klaim only
    const itemsWithKlaim = invoices.filter(
      (inv) => inv.klaimMutuNilai > 0 || inv.klaimSusutNilai > 0
    );

    return {
      totalKlaimMutu,
      totalKlaimSusut,
      totalKlaim,
      items: itemsWithKlaim,
      count: itemsWithKlaim.length,
    };
  },

  // Get total aset lancar - Material Inventaris
  async getAsetLancarInventaris(companyId: string) {
    const materials = await db.materialInventaris.findMany({
      where: { companyId },
      select: {
        id: true,
        namaMaterial: true,
        partNumber: true,
        stockOnHand: true,
        hargaSatuan: true,
      },
    });

    const items = materials.map((m) => ({
      id: m.id,
      nama: m.namaMaterial,
      kode: m.partNumber,
      jumlah: m.stockOnHand,
      hargaSatuan: m.hargaSatuan || 0,
      nilai: m.stockOnHand * (m.hargaSatuan || 0),
    }));

    const total = items.reduce((sum, item) => sum + item.nilai, 0);

    return { items, total };
  },

  // Get total aset lancar - Piutang (Pembayaran Kontrak dari Invoice)
  async getAsetLancarPiutang(companyId: string, filter?: DateFilter) {
    const whereClause: {
      companyId: string;
      status: { not: "CANCELLED" };
      tanggalInvoice?: { gte?: Date; lte?: Date };
    } = {
      companyId,
      status: { not: "CANCELLED" },
    };

    if (filter?.startDate || filter?.endDate) {
      whereClause.tanggalInvoice = {};
      if (filter.startDate) {
        whereClause.tanggalInvoice.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.tanggalInvoice.lte = filter.endDate;
      }
    }

    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: {
        buyer: {
          select: {
            name: true,
          },
        },
        contract: {
          select: {
            contractNumber: true,
          },
        },
      },
      orderBy: { tanggalInvoice: "desc" },
    });

    // Only count ISSUED, PARTIAL_PAID invoices (not DRAFT)
    const activeInvoices = invoices.filter(inv => inv.status !== "DRAFT");

    const totalPiutang = activeInvoices.reduce((sum, inv) => sum + inv.totalNilai, 0);
    const totalDiterima = activeInvoices.reduce((sum, inv) => sum + inv.totalDibayar, 0);
    const sisaPiutang = activeInvoices.reduce((sum, inv) => sum + inv.sisaPembayaran, 0);

    // Group by status
    const byStatus = {
      unpaid: activeInvoices.filter((inv) => inv.status === "ISSUED"),
      partial: activeInvoices.filter((inv) => inv.status === "PARTIAL_PAID"),
      paid: activeInvoices.filter((inv) => inv.status === "PAID"),
    };

    // Transform to items format for detail view
    const items = activeInvoices.map((inv) => ({
      id: inv.id,
      referensiNomor: inv.nomorInvoice,
      buyerNama: inv.buyer?.name || "Unknown",
      contractNumber: inv.contract?.contractNumber || null,
      tanggalTransaksi: inv.tanggalInvoice,
      totalNilai: inv.totalNilai,
      totalDiterima: inv.totalDibayar,
      sisaPiutang: inv.sisaPembayaran,
      status: inv.status === "ISSUED" ? "UNPAID" : inv.status === "PARTIAL_PAID" ? "PARTIAL" : "PAID",
    }));

    return {
      totalPiutang,
      totalDiterima,
      sisaPiutang,
      byStatus,
      items,
    };
  },

  // Get total stock product di tangki
  async getAsetLancarStockProduct(companyId: string) {
    const tangkis = await db.tangki.findMany({
      where: { companyId },
      include: {
        material: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const items = [];
    let totalStock = 0;
    for (const t of tangkis) {
      const lastStock = await db.stockTangki.findFirst({
        where: { tangkiId: t.id },
        orderBy: { tanggalTransaksi: "desc" },
      });
      const isiSaatIni = lastStock ? lastStock.stockSesudah : 0;
      items.push({
        id: t.id,
        namaTangki: t.namaTangki,
        material: t.material.name,
        materialCode: t.material.code,
        kapasitas: t.kapasitas,
        isiSaatIni,
        // Note: Untuk nilai, idealnya perlu harga per material
        // Untuk sementara, kita return quantity saja
      });
      totalStock += isiSaatIni;
    }

    return { items, totalStock };
  },

  // Get total stock TBS (raw material)
  async getAsetLancarStockTBS(companyId: string) {
    const stockMaterials = await db.stockMaterial.findMany({
      where: { companyId },
      include: {
        material: {
          select: {
            name: true,
            code: true,
            kategori: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Filter hanya TBS/raw material
    const tbsStock = stockMaterials.filter(
      (sm) =>
        sm.material.kategori.name.toLowerCase().includes("tbs") ||
        sm.material.kategori.name.toLowerCase().includes("bahan baku")
    );

    const items = tbsStock.map((s) => ({
      id: s.id,
      material: s.material.name,
      materialCode: s.material.code,
      kategori: s.material.kategori.name,
      jumlah: s.jumlah,
    }));

    const totalStock = items.reduce((sum, item) => sum + item.jumlah, 0);

    return { items, totalStock };
  },

  // Get total kewajiban - Hutang with filter
  async getKewajibanHutang(companyId: string, filter?: DateFilter) {
    const whereClause: {
      companyId: string;
      tanggalTransaksi?: { gte?: Date; lte?: Date };
    } = { companyId };

    if (filter?.startDate || filter?.endDate) {
      whereClause.tanggalTransaksi = {};
      if (filter.startDate) {
        whereClause.tanggalTransaksi.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.tanggalTransaksi.lte = filter.endDate;
      }
    }

    const hutangs = await db.hutang.findMany({
      where: whereClause,
      orderBy: { tanggalTransaksi: "desc" },
    });

    const totalHutang = hutangs.reduce((sum, h) => sum + h.totalNilai, 0);
    const totalDibayar = hutangs.reduce((sum, h) => sum + h.totalDibayar, 0);
    const sisaHutang = hutangs.reduce((sum, h) => sum + h.sisaHutang, 0);

    // Group by tipe
    const byTipe = hutangs.reduce((acc, h) => {
      if (!acc[h.tipeTransaksi]) {
        acc[h.tipeTransaksi] = {
          total: 0,
          dibayar: 0,
          sisa: 0,
          count: 0,
        };
      }
      const tipe = acc[h.tipeTransaksi];
      if (tipe) {
        tipe.total += h.totalNilai;
        tipe.dibayar += h.totalDibayar;
        tipe.sisa += h.sisaHutang;
        tipe.count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; dibayar: number; sisa: number; count: number }>);

    return {
      totalHutang,
      totalDibayar,
      sisaHutang,
      byTipe,
      items: hutangs,
    };
  },

  // Get hutang dari penerimaan TBS yang belum ada record di tabel Hutang
  async getHutangPenerimaanTBS(companyId: string) {
    // Get completed penerimaan TBS
    const penerimaanTBS = await db.penerimaanTBS.findMany({
      where: {
        companyId,
        status: "COMPLETED",
      },
      include: {
        supplier: {
          select: {
            id: true,
            ownerName: true,
            companyName: true,
            type: true,
          },
        },
      },
      orderBy: { tanggalTerima: "desc" },
    });

    // Get existing hutang for penerimaan TBS
    const existingHutang = await db.hutang.findMany({
      where: {
        companyId,
        tipeTransaksi: "PENERIMAAN_TBS",
      },
      select: { referensiId: true },
    });

    const existingIds = new Set(existingHutang.map((h) => h.referensiId));

    // Filter yang belum ada di hutang
    const belumAdaHutang = penerimaanTBS.filter((p) => !existingIds.has(p.id));

    // Return all for summary
    return {
      all: penerimaanTBS,
      belumAdaHutang,
      sudahAdaHutang: penerimaanTBS.filter((p) => existingIds.has(p.id)),
    };
  },

  // Get total kewajiban dari penerimaan TBS langsung dengan filter tanggal
  async getKewajibanPenerimaanTBS(companyId: string, filter?: DateFilter) {
    const whereClause: {
      companyId: string;
      status: "COMPLETED";
      tanggalTerima?: { gte?: Date; lte?: Date };
    } = {
      companyId,
      status: "COMPLETED",
    };

    if (filter?.startDate || filter?.endDate) {
      whereClause.tanggalTerima = {};
      if (filter.startDate) {
        whereClause.tanggalTerima.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.tanggalTerima.lte = filter.endDate;
      }
    }

    const penerimaanTBS = await db.penerimaanTBS.findMany({
      where: whereClause,
      include: {
        supplier: {
          select: {
            ownerName: true,
          },
        },
      },
      orderBy: { tanggalTerima: "desc" },
    });

    // Total nilai yang harus dibayar ke supplier
    const totalHutangTBS = penerimaanTBS.reduce((sum, p) => sum + p.totalBayar, 0);

    // Total upah bongkar
    const totalUpahBongkar = penerimaanTBS.reduce((sum, p) => sum + p.totalUpahBongkar, 0);

    return {
      totalHutangTBS,
      totalUpahBongkar,
      total: totalHutangTBS + totalUpahBongkar,
      count: penerimaanTBS.length,
    };
  },

  // Get hutang dari Purchase Order yang belum ada record di tabel Hutang
  async getHutangPurchaseOrder(companyId: string) {
    const purchaseOrders = await db.purchaseOrder.findMany({
      where: {
        companyId,
        status: { in: ["ISSUED", "PARTIAL_RECEIVED", "COMPLETED"] },
      },
      orderBy: { tanggalPO: "desc" },
    });

    const existingHutang = await db.hutang.findMany({
      where: {
        companyId,
        tipeTransaksi: "PURCHASE_ORDER",
      },
      select: { referensiId: true },
    });

    const existingIds = new Set(existingHutang.map((h) => h.referensiId));

    return {
      all: purchaseOrders,
      belumAdaHutang: purchaseOrders.filter((p) => !existingIds.has(p.id)),
      sudahAdaHutang: purchaseOrders.filter((p) => existingIds.has(p.id)),
    };
  },

  // Get hutang dari PR Pembelian Langsung yang completed
  async getHutangPRLangsung(companyId: string) {
    const purchaseRequests = await db.purchaseRequest.findMany({
      where: {
        companyId,
        tipePembelian: "PEMBELIAN_LANGSUNG",
        status: "COMPLETED",
      },
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
      },
      orderBy: { tanggalRequest: "desc" },
    });

    const existingHutang = await db.hutang.findMany({
      where: {
        companyId,
        tipeTransaksi: "PEMBELIAN_LANGSUNG",
      },
      select: { referensiId: true },
    });

    const existingIds = new Set(existingHutang.map((h) => h.referensiId));

    return {
      all: purchaseRequests,
      belumAdaHutang: purchaseRequests.filter((p) => !existingIds.has(p.id)),
      sudahAdaHutang: purchaseRequests.filter((p) => existingIds.has(p.id)),
    };
  },

  // Get piutang dari pengiriman product yang belum ada di tabel Piutang
  async getPiutangPengiriman(companyId: string) {
    const pengiriman = await db.pengirimanProduct.findMany({
      where: {
        companyId,
        status: "COMPLETED",
      },
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
            totalAmount: true,
          },
        },
        contractItem: {
          select: {
            unitPrice: true,
            quantity: true,
          },
        },
      },
      orderBy: { tanggalPengiriman: "desc" },
    });

    const existingPiutang = await db.piutang.findMany({
      where: { companyId },
      select: { referensiId: true },
    });

    const existingIds = new Set(existingPiutang.map((p) => p.referensiId));

    return {
      all: pengiriman,
      belumAdaPiutang: pengiriman.filter((p) => !existingIds.has(p.id)),
      sudahAdaPiutang: pengiriman.filter((p) => existingIds.has(p.id)),
    };
  },

  // Get pembayaran PR Langsung dengan filter tanggal
  async getPembayaranPRLangsung(companyId: string, filter?: DateFilter) {
    const whereClause: {
      purchaseRequest: { companyId: string; tipePembelian: "PEMBELIAN_LANGSUNG" };
      tanggalBayar?: { gte?: Date; lte?: Date };
    } = {
      purchaseRequest: {
        companyId,
        tipePembelian: "PEMBELIAN_LANGSUNG",
      },
    };

    if (filter?.startDate || filter?.endDate) {
      whereClause.tanggalBayar = {};
      if (filter.startDate) {
        whereClause.tanggalBayar.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.tanggalBayar.lte = filter.endDate;
      }
    }

    const pembayaranPR = await db.pembayaranPR.findMany({
      where: whereClause,
      include: {
        purchaseRequest: {
          select: {
            nomorPR: true,
            vendorNameDirect: true,
          },
        },
      },
      orderBy: { tanggalBayar: "desc" },
    });

    const total = pembayaranPR.reduce((sum, p) => sum + p.jumlahBayar, 0);

    return {
      items: pembayaranPR,
      total,
      count: pembayaranPR.length,
    };
  },

  // Get pembayaran PO dengan filter tanggal
  async getPembayaranPO(companyId: string, filter?: DateFilter) {
    const whereClause: {
      purchaseOrder: { companyId: string };
      tanggalBayar?: { gte?: Date; lte?: Date };
    } = {
      purchaseOrder: {
        companyId,
      },
    };

    if (filter?.startDate || filter?.endDate) {
      whereClause.tanggalBayar = {};
      if (filter.startDate) {
        whereClause.tanggalBayar.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.tanggalBayar.lte = filter.endDate;
      }
    }

    const pembayaranPO = await db.pembayaranPO.findMany({
      where: whereClause,
      include: {
        purchaseOrder: {
          select: {
            nomorPO: true,
            vendorName: true,
          },
        },
      },
      orderBy: { tanggalBayar: "desc" },
    });

    const total = pembayaranPO.reduce((sum, p) => sum + p.jumlahBayar, 0);

    return {
      items: pembayaranPO,
      total,
      count: pembayaranPO.length,
    };
  },

  // Get laba dari pembayaran invoice kontrak dengan filter tanggal
  async getLabaPembayaranKontrak(companyId: string, filter?: DateFilter) {
    const whereClause: {
      invoice: { companyId: string };
      tanggalBayar?: { gte?: Date; lte?: Date };
    } = {
      invoice: {
        companyId,
      },
    };

    if (filter?.startDate || filter?.endDate) {
      whereClause.tanggalBayar = {};
      if (filter.startDate) {
        whereClause.tanggalBayar.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.tanggalBayar.lte = filter.endDate;
      }
    }

    const pembayaranInvoice = await db.pembayaranInvoice.findMany({
      where: whereClause,
      include: {
        invoice: {
          select: {
            nomorInvoice: true,
            buyer: {
              select: {
                name: true,
              },
            },
            contract: {
              select: {
                contractNumber: true,
              },
            },
          },
        },
      },
      orderBy: { tanggalBayar: "desc" },
    });

    const total = pembayaranInvoice.reduce((sum, p) => sum + p.jumlahBayar, 0);

    const items = pembayaranInvoice.map((p) => ({
      id: p.id,
      tanggalTerima: p.tanggalBayar,
      jumlahTerima: p.jumlahBayar,
      metodePembayaran: p.metodePembayaran,
      invoice: {
        nomorInvoice: p.invoice.nomorInvoice,
        buyerNama: p.invoice.buyer?.name || "Unknown",
        contractNumber: p.invoice.contract?.contractNumber || null,
      },
    }));

    return {
      items,
      total,
      count: pembayaranInvoice.length,
    };
  },

  // Get rugi dari hutang penerimaan TBS dengan filter tanggal
  async getRugiPenerimaanTBS(companyId: string, filter?: DateFilter) {
    const whereClause: {
      companyId: string;
      status: "COMPLETED";
      tanggalTerima?: { gte?: Date; lte?: Date };
    } = {
      companyId,
      status: "COMPLETED",
    };

    if (filter?.startDate || filter?.endDate) {
      whereClause.tanggalTerima = {};
      if (filter.startDate) {
        whereClause.tanggalTerima.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.tanggalTerima.lte = filter.endDate;
      }
    }

    const penerimaanTBS = await db.penerimaanTBS.findMany({
      where: whereClause,
      include: {
        supplier: {
          select: {
            ownerName: true,
          },
        },
      },
      orderBy: { tanggalTerima: "desc" },
    });

    // Total nilai pembelian TBS (totalBayar)
    const totalHutangTBS = penerimaanTBS.reduce((sum, p) => sum + p.totalBayar, 0);

    // Total upah bongkar
    const totalUpahBongkar = penerimaanTBS.reduce((sum, p) => sum + p.totalUpahBongkar, 0);

    const items = penerimaanTBS.map((p) => ({
      id: p.id,
      nomorPenerimaan: p.nomorPenerimaan,
      tanggalTerima: p.tanggalTerima,
      supplierNama: p.supplier.ownerName,
      beratNetto: p.beratNetto2,
      totalBayar: p.totalBayar,
      totalUpahBongkar: p.totalUpahBongkar,
    }));

    return {
      items,
      totalHutangTBS,
      totalUpahBongkar,
      totalRugi: totalHutangTBS + totalUpahBongkar,
      count: penerimaanTBS.length,
    };
  },

  // Get penggajian (upah diterima) berdasarkan periode filter
  async getPenggajianByFilter(filter?: DateFilter) {
    // Jika tidak ada filter, ambil semua penggajian
    // Jika ada filter tanggal, extract bulan dan tahun dari filter
    let whereClause: { periodeBulan?: number; periodeTahun?: number } = {};

    if (filter?.startDate && filter?.endDate) {
      // Ambil bulan dan tahun dari startDate atau endDate
      const startMonth = filter.startDate.getMonth() + 1;
      const startYear = filter.startDate.getFullYear();
      const endMonth = filter.endDate.getMonth() + 1;
      const endYear = filter.endDate.getFullYear();

      // Jika bulan dan tahun sama, filter tepat
      if (startMonth === endMonth && startYear === endYear) {
        whereClause = {
          periodeBulan: startMonth,
          periodeTahun: startYear,
        };
      } else {
        // Jika range berbeda bulan, ambil penggajian dalam range tahun tersebut
        // Untuk simplicity, kita ambil berdasarkan startDate
        whereClause = {
          periodeBulan: startMonth,
          periodeTahun: startYear,
        };
      }
    } else if (filter?.startDate) {
      whereClause = {
        periodeBulan: filter.startDate.getMonth() + 1,
        periodeTahun: filter.startDate.getFullYear(),
      };
    } else if (filter?.endDate) {
      whereClause = {
        periodeBulan: filter.endDate.getMonth() + 1,
        periodeTahun: filter.endDate.getFullYear(),
      };
    }

    const penggajian = await db.penggajianKaryawan.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        masterKaryawan: {
          include: {
            divisi: true,
            jabatan: true,
          },
        },
      },
      orderBy: [
        { periodeTahun: "desc" },
        { periodeBulan: "desc" },
      ],
    });

    // Calculate total
    const totalUpahDiterima = penggajian.reduce(
      (sum, p) => sum + Number(p.upahDiterima),
      0
    );

    // Group by periode
    const byPeriode = penggajian.reduce((acc, p) => {
      const key = `${p.periodeBulan}-${p.periodeTahun}`;
      if (!acc[key]) {
        acc[key] = {
          bulan: p.periodeBulan,
          tahun: p.periodeTahun,
          total: 0,
          count: 0,
        };
      }
      acc[key].total += Number(p.upahDiterima);
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { bulan: number; tahun: number; total: number; count: number }>);

    return {
      items: penggajian.map((p) => ({
        id: p.id,
        namaKaryawan: p.masterKaryawan?.namaKaryawan || "Unknown",
        devisi: p.masterKaryawan?.divisi?.nama || null,
        jabatan: p.masterKaryawan?.jabatan?.nama || null,
        periodeBulan: p.periodeBulan,
        periodeTahun: p.periodeTahun,
        upahDiterima: Number(p.upahDiterima),
      })),
      totalUpahDiterima,
      byPeriode: Object.values(byPeriode),
      count: penggajian.length,
    };
  },

  // Get hutang product dari kontrak yang sudah dibayar (lunas/sebagian) tapi belum semua dikirim
  // Hutang berkurang berdasarkan PENGIRIMAN (deliveredQuantity), bukan invoice
  // Hutang per material = (quantity - deliveredQuantity) / quantity * (proporsi * paidAmount)
  async getHutangProductKontrak(companyId: string, filter?: DateFilter) {
    // Where clause untuk filter tanggal pada kontrak
    const whereClause: {
      companyId: string;
      paymentStatus: { in: ("PAID" | "PARTIAL")[] };
      status: { not: "CANCELLED" };
      contractDate?: { gte?: Date; lte?: Date };
    } = {
      companyId,
      paymentStatus: { in: ["PAID", "PARTIAL"] }, // Kontrak yang sudah ada pembayaran
      status: { not: "CANCELLED" },
    };

    if (filter?.startDate || filter?.endDate) {
      whereClause.contractDate = {};
      if (filter.startDate) {
        whereClause.contractDate.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.contractDate.lte = filter.endDate;
      }
    }

    // Ambil semua kontrak yang sudah dibayar (lunas atau sebagian)
    const contracts = await db.contract.findMany({
      where: whereClause,
      include: {
        buyer: {
          select: {
            name: true,
            code: true,
          },
        },
        contractItems: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: { contractDate: "desc" },
    });

    // Group hutang by material (product type)
    const hutangByMaterial: Record<
      string,
      {
        materialId: string;
        materialName: string;
        materialCode: string;
        totalNilai: number;
        contracts: {
          contractNumber: string;
          buyerNama: string;
          quantity: number;
          delivered: number;
          sisa: number;
          nilaiHutang: number;
        }[];
      }
    > = {};

    // Proses setiap kontrak
    contracts.forEach((contract) => {
      // Hitung proporsi pembayaran (berapa persen dari totalAmount yang sudah dibayar)
      const paymentRatio = contract.totalAmount > 0
        ? contract.paidAmount / contract.totalAmount
        : 0;

      // Proses setiap item dalam kontrak
      contract.contractItems.forEach((item) => {
        // Hitung sisa quantity yang belum dikirim
        const sisaQuantity = item.quantity - item.deliveredQuantity;

        // Jika masih ada sisa yang belum dikirim
        if (sisaQuantity > 0 && paymentRatio > 0) {
          // Hitung nilai hutang untuk item ini
          // = (sisa / total quantity) * totalPrice item * (1 + tax rate)
          // Atau lebih simple: sisa * unitPrice * paymentRatio * (1 + taxRate)

          // Tax rate dari kontrak
          const taxRate = contract.subtotal > 0
            ? contract.taxAmount / contract.subtotal
            : 0;

          // Nilai hutang = sisa quantity * unit price * (1 + tax) * rasio pembayaran
          const nilaiHutang = sisaQuantity * item.unitPrice * (1 + taxRate) * paymentRatio;

          const materialId = item.material.id;
          const materialName = item.material.name;
          const materialCode = item.material.code;

          if (!hutangByMaterial[materialId]) {
            hutangByMaterial[materialId] = {
              materialId,
              materialName,
              materialCode,
              totalNilai: 0,
              contracts: [],
            };
          }

          hutangByMaterial[materialId].totalNilai += nilaiHutang;
          hutangByMaterial[materialId].contracts.push({
            contractNumber: contract.contractNumber,
            buyerNama: contract.buyer?.name || "Unknown",
            quantity: item.quantity,
            delivered: item.deliveredQuantity,
            sisa: sisaQuantity,
            nilaiHutang,
          });
        }
      });
    });

    // Convert to array dan filter yang punya hutang
    const itemsByMaterial = Object.values(hutangByMaterial).filter(
      (item) => item.totalNilai > 0
    );

    // Total hutang product semua material
    const totalHutangProduct = itemsByMaterial.reduce(
      (sum, item) => sum + item.totalNilai,
      0
    );

    return {
      items: itemsByMaterial,
      total: totalHutangProduct,
      count: itemsByMaterial.length,
    };
  },

  // Get laba rugi summary
  async getLabaRugiSummary(companyId: string, filter?: DateFilter) {
    const [laba, rugi, penggajian] = await Promise.all([
      this.getLabaPembayaranKontrak(companyId, filter),
      this.getRugiPenerimaanTBS(companyId, filter),
      this.getPenggajianByFilter(filter),
    ]);

    const totalLaba = laba.total;
    const totalRugiTBS = rugi.totalRugi;
    const totalPenggajian = penggajian.totalUpahDiterima;
    const totalRugi = totalRugiTBS + totalPenggajian;
    const labaRugiBersih = totalLaba - totalRugi;

    return {
      laba: {
        pembayaranKontrak: laba.total,
        total: totalLaba,
        items: laba.items,
        count: laba.count,
      },
      rugi: {
        hutangPenerimaanTBS: rugi.totalHutangTBS,
        upahBongkarTBS: rugi.totalUpahBongkar,
        penggajian: totalPenggajian,
        total: totalRugi,
        items: rugi.items,
        penggajianItems: penggajian.items,
        penggajianByPeriode: penggajian.byPeriode,
        penggajianCount: penggajian.count,
        count: rugi.count,
      },
      labaRugiBersih,
      isLaba: labaRugiBersih >= 0,
    };
  },

  // Get biaya pengeluaran yang belum dibayar (status ACTIVE) untuk kewajiban neraca
  async getBiayaPengeluaran(companyId: string, filter?: DateFilter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      companyId,
      status: "ACTIVE", // Hanya yang belum dibayar (bukan PAID atau CANCELLED)
    };

    if (filter?.startDate || filter?.endDate) {
      whereClause.tanggalBiaya = {};
      if (filter.startDate) {
        whereClause.tanggalBiaya.gte = filter.startDate;
      }
      if (filter.endDate) {
        whereClause.tanggalBiaya.lte = filter.endDate;
      }
    }

    const biaya = await db.biayaPengeluaran.findMany({
      where: whereClause,
      select: {
        id: true,
        nomorBiaya: true,
        tanggalBiaya: true,
        kategoriBiaya: true,
        deskripsi: true,
        jumlahBiaya: true,
      },
      orderBy: { tanggalBiaya: "desc" },
    });

    const total = biaya.reduce((sum, b) => sum + b.jumlahBiaya, 0);

    // Group by kategori
    const byKategori = biaya.reduce((acc, b) => {
      const key = b.kategoriBiaya;
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0 };
      }
      acc[key].total += b.jumlahBiaya;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return {
      total,
      byKategori,
      items: biaya,
      count: biaya.length,
    };
  },

  // Generate neraca summary with filter
  async getNeracaSummary(companyId: string, filter?: DateFilter) {
    // Get all data
    const [
      inventaris,
      piutang,
      stockProduct,
      stockTBS,
      hutang,
      kewajibanTBS,
      pembayaranPR,
      pembayaranPO,
      klaimInvoice,
      labaRugi,
      hutangProduct,
      biayaPengeluaran,
    ] = await Promise.all([
      this.getAsetLancarInventaris(companyId),
      this.getAsetLancarPiutang(companyId, filter),
      this.getAsetLancarStockProduct(companyId),
      this.getAsetLancarStockTBS(companyId),
      this.getKewajibanHutang(companyId, filter),
      this.getKewajibanPenerimaanTBS(companyId, filter),
      this.getPembayaranPRLangsung(companyId, filter),
      this.getPembayaranPO(companyId, filter),
      this.getKlaimFromInvoices(companyId, filter),
      this.getLabaRugiSummary(companyId, filter),
      this.getHutangProductKontrak(companyId, filter),
      this.getBiayaPengeluaran(companyId, filter),
    ]);

    // Calculate totals - gunakan totalPiutang (nilai kontrak) karena kontrak dianggap lunas
    // Klaim susut adalah piutang (receivable) karena buyer harus membayar klaim susut ke perusahaan
    const totalAsetLancar =
      inventaris.total + piutang.totalPiutang + klaimInvoice.totalKlaimSusut;

    // Kewajiban lancar: hutang TBS langsung + pembayaran PR + pembayaran PO + klaim mutu + hutang product + biaya pengeluaran
    // Tidak pakai hutang.sisaHutang karena itu dari tabel Hutang yang perlu direcord manual
    // Klaim susut dipindah ke aset karena merupakan piutang dari buyer
    const totalKewajibanLancar =
      kewajibanTBS.total +
      pembayaranPR.total +
      pembayaranPO.total +
      klaimInvoice.totalKlaimMutu +
      hutangProduct.total +
      biayaPengeluaran.total;

    return {
      aset: {
        lancar: {
          pembayaranKontrak: piutang.totalPiutang,
          inventaris: inventaris.total,
          stockProduct: stockProduct.totalStock,
          stockTBS: stockTBS.totalStock,
          klaimSusut: klaimInvoice.totalKlaimSusut,
        },
        totalAsetLancar,
        totalAset: totalAsetLancar,
      },
      kewajiban: {
        // Hutang dari tabel Hutang (jika ada yang sudah direcord)
        hutangUsaha: hutang.sisaHutang,
        hutangByTipe: hutang.byTipe,
        // Kewajiban dari Penerimaan TBS langsung
        hutangPenerimaanTBS: kewajibanTBS.totalHutangTBS,
        upahBongkarTBS: kewajibanTBS.totalUpahBongkar,
        totalKewajibanTBS: kewajibanTBS.total,
        // Pembayaran
        pembayaranPRLangsung: pembayaranPR.total,
        pembayaranPO: pembayaranPO.total,
        // Klaim Mutu dari Invoice (kewajiban perusahaan ke buyer)
        klaimMutu: klaimInvoice.totalKlaimMutu,
        // Hutang Product per material (kontrak yang sudah dibayar tapi belum dikirim)
        hutangProduct: hutangProduct.total,
        hutangProductItems: hutangProduct.items,
        // Biaya Pengeluaran yang belum dibayar (PLN, PPH, BPJS, dll)
        biayaPengeluaran: biayaPengeluaran.total,
        biayaPengeluaranByKategori: biayaPengeluaran.byKategori,
        biayaPengeluaranCount: biayaPengeluaran.count,
        totalKewajiban: totalKewajibanLancar,
      },
      labaRugi: {
        laba: labaRugi.laba.total,
        rugi: labaRugi.rugi.total,
        bersih: labaRugi.labaRugiBersih,
        isLaba: labaRugi.isLaba,
        detail: {
          pembayaranKontrak: labaRugi.laba.pembayaranKontrak,
          hutangPenerimaanTBS: labaRugi.rugi.hutangPenerimaanTBS,
          upahBongkarTBS: labaRugi.rugi.upahBongkarTBS,
          penggajian: labaRugi.rugi.penggajian,
        },
      },
    };
  },
};

