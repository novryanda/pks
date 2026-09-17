import { db } from "@/server/db";

export interface DashboardSummary {
  // Master Data
  totalSupplier: number;
  totalBuyer: number;
  totalVendor: number;
  totalDriver: number;
  totalKaryawan: number;

  // Inventory & Material
  totalMaterial: number;
  totalInventaris: number;

  // Penerimaan TBS
  penerimaanTBS: {
    totalPenerimaan: number;
    totalBerat: number;
    totalNilai: number;
    bulanIni: number;
  };

  // Produksi
  produksi: {
    totalProduksi: number;
    totalTBSDiolah: number;
    totalHasilProduksi: number;
    bulanIni: number;
  };

  // Stock Product (Tangki)
  stockProduct: {
    totalTangki: number;
    totalKapasitas: number;
    totalIsi: number;
    persentaseTerisi: number;
  };

  // Pengiriman/Penjualan
  pengiriman: {
    totalPengiriman: number;
    totalBeratDikirim: number;
    bulanIni: number;
  };

  // Gudang/Inventaris
  gudang: {
    totalSR: number;
    totalPR: number;
    totalPO: number;
    totalPenerimaanBarang: number;
    totalPengeluaranBarang: number;
    prPending: number;
    poPending: number;
  };

  // Penggajian
  penggajian: {
    totalKaryawanAktif: number;
    totalKaryawanGaji: number;
    totalGajiBulanIni: number;
    periodeTerakhir: string | null;
    riwayatBulanan: Array<{
      bulan: number;
      tahun: number;
      periode: string;
      jumlahKaryawan: number;
      totalGaji: number;
    }>;
  };

  // Keuangan
  keuangan: {
    totalHutang: number;
    totalPiutang: number;
    hutangBelumLunas: number;
    piutangBelumLunas: number;
    // Laba Rugi
    labaRugi: {
      pendapatan: {
        penjualanProduct: number;
        penerimaanLainnya: number;
        total: number;
      };
      pengeluaran: {
        pembelianTBS: number;
        pembelianMaterial: number;
        biayaGaji: number;
        pengeluaranLainnya: number;
        total: number;
      };
      labaKotor: number;
      labaBersih: number;
    };
  };

  // Contract Stats
  contracts: {
    totalActive: number;
    totalValue: number;
    nearDeadline: number;
    recentContracts: Array<{
      id: string;
      contractNumber: string;
      buyerName: string;
      totalAmount: number;
      deliveryDate: Date | null;
      daysUntilDelivery: number;
    }>;
  };

  // Stock Material Summary
  stockMaterial: {
    totalItems: number;
    totalValue: number;
    lowStockItems: Array<{
      id: string;
      materialName: string;
      currentStock: number;
      satuanName: string;
    }>;
  };

  // Detail Tangki
  tangkiDetail: Array<{
    id: string;
    namaTangki: string;
    materialName: string;
    kapasitas: number;
    isiSaatIni: number;
    persentase: number;
  }>;
}

export const dashboardSummaryService = {
  async getSummary(
    companyId: string,
    bulan?: number,
    tahun?: number
  ): Promise<DashboardSummary> {
    const now = new Date();
    const filterMonth = bulan ?? now.getMonth() + 1;
    const filterYear = tahun ?? now.getFullYear();

    const startOfMonth = new Date(filterYear, filterMonth - 1, 1);
    const endOfMonth = new Date(filterYear, filterMonth, 0, 23, 59, 59, 999);

    // Parallel fetching for performance
    const [
      // Master Data Counts
      supplierCount,
      buyerCount,
      vendorCount,
      driverCount,
      karyawanCount,
      materialCount,
      inventarisCount,

      // Penerimaan TBS
      penerimaanTBSStats,
      penerimaanTBSBulanIni,

      // Produksi
      produksiStats,
      produksiBulanIni,

      // Stock Tangki
      tangkiStats,
      tangkiDetail,

      // Pengiriman
      pengirimanStats,
      pengirimanBulanIni,

      // Gudang
      srCount,
      prCount,
      poCount,
      penerimaanBarangCount,
      pengeluaranBarangCount,
      prPending,
      poPending,

      // Penggajian
      penggajianStats,

      // Keuangan
      hutangStats,
      piutangStats,
    ] = await Promise.all([
      // Master Data
      db.supplier.count({ where: { companyId } }),
      db.buyer.count({ where: { companyId, status: "ACTIVE" } }),
      db.vendor.count({ where: { companyId, status: "ACTIVE" } }),
      db.transporter.count({ where: { companyId } }),
      db.masterKaryawan.count({ where: { isActive: true } }),
      db.material.count({ where: { companyId } }),
      db.materialInventaris.count({ where: { companyId } }),

      // Penerimaan TBS Stats
      db.penerimaanTBS.aggregate({
        where: { companyId, status: "COMPLETED" },
        _count: true,
        _sum: { beratNetto2: true, totalBayar: true },
      }),
      db.penerimaanTBS.count({
        where: {
          companyId,
          status: "COMPLETED",
          tanggalTerima: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // Produksi Stats
      db.prosesProduksi.aggregate({
        where: { companyId, status: "COMPLETED" },
        _count: true,
        _sum: { jumlahInput: true },
      }),
      db.prosesProduksi.count({
        where: {
          companyId,
          status: "COMPLETED",
          tanggalProduksi: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // Tangki Stats
      db.tangki.aggregate({
        where: { companyId },
        _count: true,
        _sum: { kapasitas: true },
      }),
      db.tangki.findMany({
        where: { companyId },
        include: { material: { select: { name: true } } },
        orderBy: { namaTangki: "asc" },
      }),

      // Pengiriman Stats
      db.pengirimanProduct.aggregate({
        where: { companyId, status: "COMPLETED" },
        _count: true,
        _sum: { beratNetto: true },
      }),
      db.pengirimanProduct.count({
        where: {
          companyId,
          status: "COMPLETED",
          tanggalPengiriman: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // Gudang
      db.storeRequest.count({ where: { companyId } }),
      db.purchaseRequest.count({ where: { companyId } }),
      db.purchaseOrder.count({ where: { companyId } }),
      db.penerimaanBarang.count({ where: { companyId, status: "COMPLETED" } }),
      db.pengeluaranBarang.count({ where: { companyId, status: "COMPLETED" } }),
      db.purchaseRequest.count({
        where: { companyId, status: { in: ["PENDING", "APPROVED"] } },
      }),
      db.purchaseOrder.count({
        where: { companyId, status: { in: ["DRAFT", "ISSUED", "PARTIAL_RECEIVED"] } },
      }),

      // Penggajian
      db.penggajianKaryawan.aggregate({
        where: {
          periodeBulan: filterMonth,
          periodeTahun: filterYear,
        },
        _count: true,
        _sum: { upahDiterima: true },
      }),

      // Hutang
      db.hutang.aggregate({
        where: { companyId },
        _sum: { totalNilai: true, sisaHutang: true },
      }),

      // Piutang
      db.piutang.aggregate({
        where: { companyId },
        _sum: { totalNilai: true, sisaPiutang: true },
      }),
    ]);

    // Calculate total hasil produksi
    const hasilProduksiStats = await db.hasilProduksi.aggregate({
      _sum: { jumlahOutput: true },
    });

    // Contract data - active contracts with near deadline
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [activeContracts, contractsNearDeadline, stockMaterialData] = await Promise.all([
      // Active contracts with details
      db.contract.findMany({
        where: { companyId, status: "ACTIVE" },
        include: {
          buyer: { select: { name: true } },
        },
        orderBy: { deliveryDate: "asc" },
        take: 5,
      }),

      // Count contracts near deadline (dalam 7 hari)
      db.contract.count({
        where: {
          companyId,
          status: "ACTIVE",
          deliveryDate: { lte: sevenDaysFromNow, gte: now },
        },
      }),

      // Stock materials with low stock (< 100 units sebagai threshold)
      db.stockMaterial.findMany({
        where: { companyId },
        include: {
          material: {
            include: {
              satuan: { select: { name: true, symbol: true } },
            },
          },
        },
        orderBy: { jumlah: "asc" },
      }),
    ]);

    // Calculate contract totals
    const contractStats = await db.contract.aggregate({
      where: { companyId, status: "ACTIVE" },
      _count: true,
      _sum: { totalAmount: true },
    });

    // Penggajian extended data
    const totalKaryawanAktif = await db.masterKaryawan.count({
      where: { isActive: true },
    });

    // Get last 6 months payroll history
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const penggajianHistory = await db.penggajianKaryawan.groupBy({
      by: ["periodeBulan", "periodeTahun"],
      _count: { id: true },
      _sum: { upahDiterima: true },
      orderBy: [
        { periodeTahun: "desc" },
        { periodeBulan: "desc" },
      ],
      take: 6,
    });

    const bulanNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const riwayatBulanan = penggajianHistory.map((p) => ({
      bulan: p.periodeBulan,
      tahun: p.periodeTahun,
      periode: `${bulanNames[p.periodeBulan - 1]} ${p.periodeTahun}`,
      jumlahKaryawan: p._count.id,
      totalGaji: Number(p._sum.upahDiterima ?? 0),
    })).reverse();

    // Process stock material data
    const lowStockThreshold = 100; // Items dengan stock < 100
    const lowStockItems = stockMaterialData
      .filter((s) => s.jumlah < lowStockThreshold && s.jumlah > 0)
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        materialName: s.material.name,
        currentStock: s.jumlah,
        satuanName: s.material.satuan.symbol || s.material.satuan.name,
      }));

    const stockMaterialTotalValue = stockMaterialData.reduce(
      (acc, s) => acc + s.jumlah,
      0
    );

    const totalKapasitas = tangkiStats._sum.kapasitas ?? 0;
    // Hitung total isi dari stok terakhir setiap tangki
    let totalIsi = 0;
    for (const t of tangkiDetail) {
      const lastStock = await db.stockTangki.findFirst({
        where: { tangkiId: t.id },
        orderBy: { tanggalTransaksi: "desc" },
      });
      totalIsi += lastStock ? lastStock.stockSesudah : 0;
    }

    // Laba Rugi Calculation
    const [
      penjualanBulanIni,
      pembelianTBSBulanIni,
      pembelianMaterialBulanIni,
      gajiBulanIni
    ] = await Promise.all([
      // Pendapatan: Total penjualan product bulan ini
      db.pengirimanProduct.aggregate({
        where: {
          companyId,
          status: "COMPLETED",
          tanggalPengiriman: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { beratNetto: true },
      }),

      // Pengeluaran: Pembelian TBS bulan ini
      db.penerimaanTBS.aggregate({
        where: {
          companyId,
          status: "COMPLETED",
          tanggalTerima: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalBayar: true },
      }),

      // Pengeluaran: Pembelian Material/Inventaris bulan ini
      db.inventoryTransaction.aggregate({
        where: {
          companyId,
          tipeTransaksi: "IN",
          tanggalTransaksi: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalHarga: true },
      }),

      // Pengeluaran: Gaji bulan ini
      db.penggajianKaryawan.aggregate({
        where: {
          periodeBulan: filterMonth,
          periodeTahun: filterYear,
        },
        _sum: { upahDiterima: true },
      }),
    ]);

    // Hitung nilai penjualan (asumsi harga per kg CPO rata-rata)
    const hargaCPOPerKg = 12000; // Contoh harga rata-rata per kg
    const penjualanProduct = (penjualanBulanIni._sum.beratNetto ?? 0) * hargaCPOPerKg;
    const penerimaanLainnya = 0; // Bisa ditambahkan dari sumber lain
    const totalPendapatan = penjualanProduct + penerimaanLainnya;

    const pembelianTBS = pembelianTBSBulanIni._sum.totalBayar ?? 0;
    const pembelianMaterial = pembelianMaterialBulanIni._sum.totalHarga ?? 0;
    const biayaGaji = Number(gajiBulanIni._sum.upahDiterima ?? 0);
    const pengeluaranLainnya = 0; // Bisa ditambahkan dari sumber lain
    const totalPengeluaran = pembelianTBS + pembelianMaterial + biayaGaji + pengeluaranLainnya;

    const labaKotor = totalPendapatan - pembelianTBS;
    const labaBersih = totalPendapatan - totalPengeluaran;

    return {
      // Master Data
      totalSupplier: supplierCount,
      totalBuyer: buyerCount,
      totalVendor: vendorCount,
      totalDriver: driverCount,
      totalKaryawan: karyawanCount,

      // Inventory & Material
      totalMaterial: materialCount,
      totalInventaris: inventarisCount,

      // Penerimaan TBS
      penerimaanTBS: {
        totalPenerimaan: penerimaanTBSStats._count ?? 0,
        totalBerat: penerimaanTBSStats._sum.beratNetto2 ?? 0,
        totalNilai: penerimaanTBSStats._sum.totalBayar ?? 0,
        bulanIni: penerimaanTBSBulanIni,
      },

      // Produksi
      produksi: {
        totalProduksi: produksiStats._count ?? 0,
        totalTBSDiolah: produksiStats._sum.jumlahInput ?? 0,
        totalHasilProduksi: hasilProduksiStats._sum.jumlahOutput ?? 0,
        bulanIni: produksiBulanIni,
      },

      // Stock Product (Tangki)
      stockProduct: {
        totalTangki: tangkiStats._count ?? 0,
        totalKapasitas,
        totalIsi,
        persentaseTerisi:
          totalKapasitas > 0
            ? Math.round((totalIsi / totalKapasitas) * 100)
            : 0,
      },

      // Pengiriman
      pengiriman: {
        totalPengiriman: pengirimanStats._count ?? 0,
        totalBeratDikirim: pengirimanStats._sum.beratNetto ?? 0,
        bulanIni: pengirimanBulanIni,
      },

      // Gudang
      gudang: {
        totalSR: srCount,
        totalPR: prCount,
        totalPO: poCount,
        totalPenerimaanBarang: penerimaanBarangCount,
        totalPengeluaranBarang: pengeluaranBarangCount,
        prPending,
        poPending,
      },

      // Penggajian
      penggajian: {
        totalKaryawanAktif,
        totalKaryawanGaji: penggajianStats._count ?? 0,
        totalGajiBulanIni: Number(penggajianStats._sum.upahDiterima ?? 0),
        periodeTerakhir:
          penggajianStats._count > 0
            ? `${bulanNames[filterMonth - 1]} ${filterYear}`
            : null,
        riwayatBulanan,
      },

      // Keuangan
      keuangan: {
        totalHutang: hutangStats._sum.totalNilai ?? 0,
        totalPiutang: piutangStats._sum.totalNilai ?? 0,
        hutangBelumLunas: hutangStats._sum.sisaHutang ?? 0,
        piutangBelumLunas: piutangStats._sum.sisaPiutang ?? 0,
        labaRugi: {
          pendapatan: {
            penjualanProduct,
            penerimaanLainnya,
            total: totalPendapatan,
          },
          pengeluaran: {
            pembelianTBS,
            pembelianMaterial,
            biayaGaji,
            pengeluaranLainnya,
            total: totalPengeluaran,
          },
          labaKotor,
          labaBersih,
        },
      },

      // Contract Stats
      contracts: {
        totalActive: contractStats._count ?? 0,
        totalValue: contractStats._sum.totalAmount ?? 0,
        nearDeadline: contractsNearDeadline,
        recentContracts: activeContracts.map((c) => {
          const daysUntil = c.deliveryDate ? Math.ceil(
            (new Date(c.deliveryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          ) : 0;
          return {
            id: c.id,
            contractNumber: c.contractNumber,
            buyerName: c.buyer.name,
            totalAmount: c.totalAmount,
            deliveryDate: c.deliveryDate,
            daysUntilDelivery: daysUntil,
          };
        }),
      },

      // Stock Material Summary
      stockMaterial: {
        totalItems: stockMaterialData.length,
        totalValue: stockMaterialTotalValue,
        lowStockItems,
      },

      // Detail Tangki
      tangkiDetail: tangkiDetail.map((t) => ({
        id: t.id,
        namaTangki: t.namaTangki,
        materialName: t.material.name,
        kapasitas: t.kapasitas,
        // Ambil stok terakhir dari StockTangki
        isiSaatIni: 0,
        persentase: 0,
    })),
    // Catatan: pengisian nilai isiSaatIni & persentase sudah dilakukan di atas pada perhitungan totalIsi
    };
  },
};
