import { pengirimanProductRepository } from "@/server/repositories/pengiriman-product.repository";
import { contractRepository } from "@/server/repositories/contract.repository";
import { materialRepository } from "@/server/repositories/material.repository";
import { db } from "@/server/db";
import type { CreatePengirimanProductInput, UpdatePengirimanProductInput, CreatePengirimanTarraInput, UpdatePengirimanGrossInput, UpdatePengirimanKontrakMutuInput, UpdatePengirimanMutuInput, UpdatePengirimanKontrakInput } from "@/server/schema/pengiriman-product";

export class PengirimanProductService {
  // ============================================
  // ALUR BARU: Vendor → Tarra → Gross → Kontrak
  // ============================================

  // Method untuk create pengiriman tahap 1 & 2 (vendor + tarra)
  async createPengirimanTarra(
    companyId: string,
    data: CreatePengirimanTarraInput
  ) {
    // Validasi vendor vehicle exists
    const vendorVehicle = await db.vendorVehicle.findUnique({
      where: { id: data.vendorVehicleId },
      include: { vendor: true },
    });

    if (!vendorVehicle) {
      throw new Error("Kendaraan vendor tidak ditemukan");
    }

    // Create pengiriman dengan status TIMBANG_TARRA
    const pengiriman = await pengirimanProductRepository.createPengirimanTarra(companyId, data);

    return pengiriman;
  }

  // Method untuk update tahap 3 (timbang gross saja)
  async updatePengirimanGross(
    id: string,
    data: UpdatePengirimanGrossInput
  ) {
    const current = await pengirimanProductRepository.getPengirimanProductById(id);
    if (!current) {
      throw new Error("Pengiriman tidak ditemukan");
    }

    if (current.status !== "TIMBANG_TARRA") {
      throw new Error("Pengiriman tidak dalam status menunggu timbang gross");
    }

    // Validasi berat gross harus lebih besar dari berat tarra
    if (data.beratGross <= current.beratTarra) {
      throw new Error("Berat gross harus lebih besar dari berat tarra");
    }

    // Update pengiriman dengan data gross - status jadi TIMBANG_GROSS
    const pengiriman = await pengirimanProductRepository.updatePengirimanGross(id, data);

    return pengiriman;
  }

  // Method untuk update tahap 4 & 5 (pilih kontrak + mutu kernel)
  async updatePengirimanKontrakMutu(
    id: string,
    companyId: string,
    data: UpdatePengirimanKontrakMutuInput
  ) {
    const current = await pengirimanProductRepository.getPengirimanProductById(id);
    if (!current) {
      throw new Error("Pengiriman tidak ditemukan");
    }

    if ((current.status as string) !== "TIMBANG_GROSS") {
      throw new Error("Pengiriman tidak dalam status menunggu pilih kontrak");
    }

    // Validasi contract item
    const contractItem = await db.contractItem.findUnique({
      where: { id: data.contractItemId },
      include: {
        contract: true,
        material: true,
      },
    });

    if (!contractItem) {
      throw new Error("Item kontrak tidak ditemukan");
    }

    if (current.materialId && contractItem.materialId !== current.materialId) {
      throw new Error("Item kontrak tidak sesuai dengan produk yang dikirim");
    }

    const beratNetto = current.beratNetto || 0;

    // Validasi stock material
    const stock = await db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId: current.companyId,
          materialId: contractItem.materialId,
        },
      },
    });

    if (!stock || stock.jumlah < beratNetto) {
      throw new Error(`Stock material tidak mencukupi. Stock tersedia: ${stock?.jumlah || 0} kg`);
    }

    // Update pengiriman dengan kontrak dan mutu - status jadi COMPLETED
    const pengiriman = await pengirimanProductRepository.updatePengirimanKontrakMutu(id, data);

    // Process completed pengiriman (update stock, contract, dll)
    await this.processCompletedPengiriman(
      current.companyId,
      id,
      pengiriman.nomorPengiriman,
      current.operatorPenimbang
    );

    return pengiriman;
  }

  // Method untuk get pengiriman yang menunggu timbang gross
  async getPendingGross(companyId: string) {
    return pengirimanProductRepository.getPendingGross(companyId);
  }

  // Method untuk get pengiriman yang menunggu input mutu
  async getPendingMutu(companyId: string) {
    return pengirimanProductRepository.getPendingMutu(companyId);
  }

  // Method untuk get pengiriman yang menunggu pilih kontrak
  async getPendingKontrak(companyId: string) {
    return pengirimanProductRepository.getPendingKontrak(companyId);
  }

  // Method untuk update mutu kernel saja (alur terpisah)
  async updatePengirimanMutu(
    id: string,
    data: UpdatePengirimanMutuInput
  ) {
    const current = await pengirimanProductRepository.getPengirimanProductById(id);
    if (!current) {
      throw new Error("Pengiriman tidak ditemukan");
    }

    if ((current.status as string) !== "TIMBANG_GROSS") {
      throw new Error("Pengiriman tidak dalam status menunggu input mutu");
    }

    // Update pengiriman dengan data mutu - status tetap TIMBANG_GROSS
    const pengiriman = await pengirimanProductRepository.updatePengirimanMutu(id, data);

    return pengiriman;
  }

  // Method untuk update kontrak saja (alur terpisah, setelah mutu diisi)
  async updatePengirimanKontrak(
    id: string,
    companyId: string,
    data: UpdatePengirimanKontrakInput
  ) {
    const result = await db.$transaction(async (tx) => {
      const current = await tx.pengirimanProduct.findUnique({
        where: { id },
        include: { vendorVehicle: true }
      });

      if (!current) {
        throw new Error("Pengiriman tidak ditemukan");
      }

      if ((current.status as string) !== "TIMBANG_GROSS") {
        throw new Error("Pengiriman tidak dalam status menunggu pilih kontrak");
      }

      // Cek mutu
      const mutuFields = current.mutuCustomFields as { fieldName: string; fieldValue: string }[] | null;
      if (!mutuFields || mutuFields.length === 0) {
        throw new Error("Mutu kernel belum diisi. Silakan input mutu terlebih dahulu.");
      }

      // 1. Get Contract Item 1
      const contractItem1 = await tx.contractItem.findUnique({
        where: { id: data.contractItemId },
        include: { contract: true, material: true },
      });

      if (!contractItem1) {
        throw new Error("Item kontrak pertama tidak ditemukan");
      }

      if (current.materialId && contractItem1.materialId !== current.materialId) {
        throw new Error("Item kontrak pertama tidak sesuai dengan produk yang dikirim");
      }

      const totalNettoAsli = current.beratNetto || 0;
      const beratTarra = current.beratTarra;

      if (data.isSplit && data.splitContractItemId) {
        // --- LOGIKA SPLIT ---
        const remaining1 = contractItem1.quantity - contractItem1.deliveredQuantity;
        if (remaining1 <= 0) {
          throw new Error("Kontrak pertama sudah terpenuhi, tidak bisa melakukan split.");
        }

        const netto1 = remaining1; // Ambil sisa maksimal kontrak 1
        const netto2 = totalNettoAsli - netto1; // Sisanya ke kontrak 2

        if (netto2 <= 0) {
          throw new Error("Berat netto mencukupi untuk kontrak pertama, tidak perlu split.");
        }

        // A. Update Pengiriman 1 (Kontrak 1)
        const gross1 = netto1 + beratTarra;
        const pengiriman1 = await tx.pengirimanProduct.update({
          where: { id },
          data: {
            buyerId: data.buyerId,
            contractId: data.contractId,
            contractItemId: data.contractItemId,
            beratNetto: netto1,
            beratGross: gross1,
            totalUpahBongkar: (current.upahBongkar || 0) * netto1,
            totalHargaVendorTransportir: (current.hargaVendorTransportir || 0) * netto1,
            status: "COMPLETED",
          },
        });

        // B. Create Pengiriman 2 (Kontrak 2)
        const contractItem2 = await tx.contractItem.findUnique({
          where: { id: data.splitContractItemId },
          include: { contract: true },
        });

        if (!contractItem2) {
          throw new Error("Item kontrak kedua tidak ditemukan");
        }

        if (current.materialId && contractItem2.materialId !== current.materialId) {
          throw new Error("Item kontrak kedua tidak sesuai dengan produk yang dikirim");
        }

        const gross2 = netto2 + beratTarra;
        const nomor2 = await pengirimanProductRepository.generateNomorPengiriman(current.companyId);

        const pengiriman2 = await tx.pengirimanProduct.create({
          data: {
            companyId: current.companyId,
            nomorPengiriman: nomor2,
            tanggalPengiriman: current.tanggalPengiriman,
            operatorPenimbang: current.operatorPenimbang,
            materialId: current.materialId,
            buyerId: contractItem2.contract.buyerId,
            contractId: contractItem2.contractId,
            contractItemId: contractItem2.id,
            vendorVehicleId: current.vendorVehicleId,
            vendorBongkarId: current.vendorBongkarId,
            beratTarra: beratTarra,
            waktuTimbangTarra: current.waktuTimbangTarra,
            metodeTarra: current.metodeTarra,
            beratGross: gross2,
            waktuTimbangGross: current.waktuTimbangGross,
            metodeGross: current.metodeGross,
            beratNetto: netto2,
            upahBongkar: current.upahBongkar,
            totalUpahBongkar: (current.upahBongkar || 0) * netto2,
            hargaVendorTransportir: current.hargaVendorTransportir,
            totalHargaVendorTransportir: (current.hargaVendorTransportir || 0) * netto2,
            selectedVendorBongkarBank: current.selectedVendorBongkarBank as any,
            mutuCustomFields: current.mutuCustomFields as any,
            status: "COMPLETED",
          },
        });

        return { p1: pengiriman1, p2: pengiriman2, isSplit: true };
      } else {
        // --- LOGIKA NORMAL ---
        // Validasi stock material
        const stock = await tx.stockMaterial.findUnique({
          where: {
            companyId_materialId: {
              companyId: current.companyId,
              materialId: contractItem1.materialId,
            },
          },
        });

        if (!stock || stock.jumlah < totalNettoAsli) {
          throw new Error(`Stock material tidak mencukupi. Stock tersedia: ${stock?.jumlah || 0} kg`);
        }

        const pengiriman = await tx.pengirimanProduct.update({
          where: { id },
          data: {
            buyerId: data.buyerId,
            contractId: data.contractId,
            contractItemId: data.contractItemId,
            status: "COMPLETED",
          },
        });

        return { p1: pengiriman, isSplit: false };
      }
    });

    // 2. Process completion (update stock, movements, etc.)
    await this.processCompletedPengiriman(companyId, result.p1.id, result.p1.nomorPengiriman, result.p1.operatorPenimbang);

    if (result.isSplit && result.p2) {
      await this.processCompletedPengiriman(companyId, result.p2.id, result.p2.nomorPengiriman, result.p2.operatorPenimbang);
      return result.p1; // Return the main one for UI redirect
    }

    return result.p1;
  }

  // ============================================
  // LEGACY METHODS (untuk backward compatibility)
  // ============================================

  async createPengirimanProduct(
    companyId: string,
    data: CreatePengirimanProductInput
  ) {
    // Validasi contract item
    const contractItem = await db.contractItem.findUnique({
      where: { id: data.contractItemId },
      include: {
        contract: true,
        material: true,
      },
    });

    if (!contractItem) {
      throw new Error("Item kontrak tidak ditemukan");
    }

    // Validasi stock material
    const stock = await db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId: contractItem.materialId,
        },
      },
    });

    const beratNetto = data.beratGross - data.beratTarra;

    if (!stock || stock.jumlah < beratNetto) {
      throw new Error(`Stock material tidak mencukupi. Stock tersedia: ${stock?.jumlah || 0} kg`);
    }

    // Create pengiriman
    const pengiriman = await pengirimanProductRepository.createPengirimanProduct(companyId, data);

    // Update stock material dan contract jika status COMPLETED
    if (data.status === "COMPLETED") {
      await this.processCompletedPengiriman(companyId, pengiriman.id, pengiriman.nomorPengiriman, data.operatorPenimbang);
    }

    return pengiriman;
  }

  async processCompletedPengiriman(
    companyId: string,
    pengirimanId: string,
    nomorPengiriman: string,
    operator: string
  ) {
    const pengiriman = await pengirimanProductRepository.getPengirimanProductById(pengirimanId);

    if (!pengiriman) {
      throw new Error("Pengiriman tidak ditemukan");
    }

    if (!pengiriman.contractItem) {
      throw new Error("Item kontrak tidak ditemukan di pengiriman");
    }

    const materialId = pengiriman.contractItem.materialId;
    const beratNetto = pengiriman.beratNetto || 0;

    // 1. Update stock material (kurangi stock)
    const currentStock = await db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
    });

    if (!currentStock) {
      throw new Error("Stock material tidak ditemukan");
    }

    const newStock = currentStock.jumlah - beratNetto;

    if (newStock < 0) {
      throw new Error("Stock material tidak mencukupi");
    }

    await db.stockMaterial.update({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
      data: {
        jumlah: newStock,
      },
    });

    // 2. Create stock movement record
    await db.stockMovement.create({
      data: {
        companyId,
        materialId,
        tipeMovement: "OUT",
        jumlah: beratNetto,
        stockSebelum: currentStock.jumlah,
        stockSesudah: newStock,
        referensi: nomorPengiriman,
        keterangan: `Pengiriman ke buyer: ${pengiriman.buyer?.name || 'Unknown'}`,
        operator,
      },
    });

    // 3. Update contract item (tambah deliveredQuantity)
    if (!pengiriman.contractItemId) {
      return; // No contract item to update
    }

    const contractItem = await db.contractItem.findUnique({
      where: { id: pengiriman.contractItemId },
    });

    if (contractItem) {
      const newDeliveredQuantity = contractItem.deliveredQuantity + beratNetto;

      await db.contractItem.update({
        where: { id: pengiriman.contractItemId },
        data: {
          deliveredQuantity: newDeliveredQuantity,
        },
      });

      // 4. Check if contract should be completed (semua item sudah terkirim penuh)
      if (!pengiriman.contractId) {
        return; // No contract to update
      }

      const allContractItems = await db.contractItem.findMany({
        where: { contractId: pengiriman.contractId },
      });

      const allItemsCompleted = allContractItems.every((item: any) => {
        if (item.id === pengiriman.contractItemId) {
          return newDeliveredQuantity >= item.quantity;
        }
        return item.deliveredQuantity >= item.quantity;
      });

      if (allItemsCompleted) {
        await db.contract.update({
          where: { id: pengiriman.contractId },
          data: {
            status: "COMPLETED",
          },
        });
      }
    }

    // 5. Update stock tangki jika material ada di tangki
    const tangki = await db.tangki.findFirst({
      where: {
        companyId,
        materialId,
      },
    });

    if (tangki) {
      // Ambil stok terakhir dari StockTangki
      const lastStock = await db.stockTangki.findFirst({
        where: { tangkiId: tangki.id },
        orderBy: { tanggalTransaksi: "desc" },
      });
      const prevStock = lastStock ? lastStock.stockSesudah : 0;
      const newTangkiStock = prevStock - beratNetto;

      // Create stock tangki record
      await db.stockTangki.create({
        data: {
          tangkiId: tangki.id,
          tipeTransaksi: "KELUAR",
          jumlah: beratNetto,
          stockSebelum: prevStock,
          stockSesudah: newTangkiStock >= 0 ? newTangkiStock : 0,
          referensi: nomorPengiriman,
          keterangan: `Pengiriman ke buyer: ${pengiriman.buyer?.name || 'Unknown'}`,
          operator,
        },
      });
    }
  }

  async getPengirimanProductByCompany(companyId: string, filters?: {
    status?: string;
    buyerId?: string;
    contractId?: string;
    materialId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return pengirimanProductRepository.getPengirimanProductByCompany(companyId, filters);
  }

  async getPengirimanProductById(id: string) {
    const pengiriman = await pengirimanProductRepository.getPengirimanProductById(id);
    if (!pengiriman) {
      throw new Error("Pengiriman product tidak ditemukan");
    }
    return pengiriman;
  }

  async updatePengirimanProduct(id: string, data: UpdatePengirimanProductInput) {
    const current = await pengirimanProductRepository.getPengirimanProductById(id);
    if (!current) {
      throw new Error("Pengiriman product tidak ditemukan");
    }

    // If changing to COMPLETED status
    if (data.status === "COMPLETED" && current.status !== "COMPLETED") {
      // First update the pengiriman
      const updated = await pengirimanProductRepository.updatePengirimanProduct(id, data);

      // Then process the completion
      await this.processCompletedPengiriman(
        current.companyId,
        id,
        current.nomorPengiriman,
        current.operatorPenimbang
      );

      return updated;
    }

    // If changing from COMPLETED to other status, need to reverse the stock changes
    if (data.status !== "COMPLETED" && current.status === "COMPLETED") {
      await this.reverseCompletedPengiriman(current);
    }

    const updated = await pengirimanProductRepository.updatePengirimanProduct(id, data);
    return updated;
  }

  async reverseCompletedPengiriman(pengiriman: any) {
    const materialId = pengiriman.contractItem.materialId;
    const beratNetto = pengiriman.beratNetto;
    const companyId = pengiriman.companyId;

    // 1. Reverse stock material
    await materialRepository.updateStockMaterial(
      companyId,
      materialId,
      beratNetto,
      {
        referensi: pengiriman.nomorPengiriman,
        keterangan: `Pembatalan pengiriman ${pengiriman.nomorPengiriman}`,
        operator: pengiriman.operatorPenimbang,
      }
    );

    // 2. Reverse stock tangki jika material ada di tangki
    const tangki = await db.tangki.findFirst({
      where: {
        companyId,
        materialId,
      },
    });

    if (tangki) {
      // Ambil stok terakhir dari StockTangki
      const lastStock = await db.stockTangki.findFirst({
        where: { tangkiId: tangki.id },
        orderBy: { tanggalTransaksi: "desc" },
      });
      const prevStock = lastStock ? lastStock.stockSesudah : 0;
      const newTangkiStock = prevStock + beratNetto;

      // Create stock tangki record
      await db.stockTangki.create({
        data: {
          tangkiId: tangki.id,
          tipeTransaksi: "MASUK",
          jumlah: beratNetto,
          stockSebelum: prevStock,
          stockSesudah: newTangkiStock,
          referensi: pengiriman.nomorPengiriman,
          keterangan: `Pembatalan pengiriman ke buyer: ${pengiriman.buyer?.name || "Unknown"}`,
          operator: pengiriman.operatorPenimbang,
          tanggalTransaksi: new Date(),
        },
      });
    }

    // 3. Reverse contract item deliveredQuantity (kurangi yang sudah dikirim)
    const contractItem = await db.contractItem.findUnique({
      where: { id: pengiriman.contractItemId },
    });

    if (contractItem) {
      const newDeliveredQuantity = Math.max(0, contractItem.deliveredQuantity - beratNetto);
      await db.contractItem.update({
        where: { id: pengiriman.contractItemId },
        data: {
          deliveredQuantity: newDeliveredQuantity,
        },
      });
    }

    // Reverse contract status if needed (kembali ke ACTIVE karena ada pengiriman yang dibatalkan)
    await db.contract.update({
      where: { id: pengiriman.contractId },
      data: {
        status: "ACTIVE",
      },
    });
  }

  async deletePengirimanProduct(id: string) {
    const pengiriman = await pengirimanProductRepository.getPengirimanProductById(id);

    if (!pengiriman) {
      throw new Error("Pengiriman product tidak ditemukan");
    }

    // If it was completed, reverse the stock changes first
    if (pengiriman.status === "COMPLETED") {
      await this.reverseCompletedPengiriman(pengiriman);
    }

    return pengirimanProductRepository.deletePengirimanProduct(id);
  }

  async getStatistics(companyId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    return pengirimanProductRepository.getStatistics(companyId, filters);
  }

  /**
   * Get shipping summary statistics (Today, Month, Year)
   */
  async getSummary(
    companyId: string,
    materialId?: string,
    date?: Date
  ) {
    const { todayData, monthData, yearData } =
      await pengirimanProductRepository.getSummaryData(
        companyId,
        materialId,
        date
      );

    const calculateStats = (data: any[]) => {
      let totalBerat = 0;
      let totalPengiriman = data.length;

      data.forEach((p) => {
        totalBerat += p.beratNetto || 0;
      });

      return {
        totalPengiriman,
        totalBerat: Number(totalBerat.toFixed(2)),
      };
    };

    return {
      today: calculateStats(todayData),
      month: calculateStats(monthData),
      year: calculateStats(yearData),
    };
  }

  async getConsolidatedSummary(
    companyId: string,
    filters?: {
      date?: Date;
      startDate?: Date;
      endDate?: Date;
      materialId?: string;
      buyerId?: string;
      contractId?: string;
    }
  ) {
    return pengirimanProductRepository.getConsolidatedSummary(companyId, filters);
  }
}

export const pengirimanProductService = new PengirimanProductService();
