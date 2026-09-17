import { pengeluaranBarangRepository } from "../../repositories/pengeluaran-barang.repository";
import { storeRequestRepository } from "../../repositories/store-request.repository";
import { materialInventarisRepository } from "../../repositories/material-inventaris.repository";
import { inventoryTransactionRepository } from "../../repositories/inventory-transaction.repository";
import type { PengeluaranBarangInput, UpdatePengeluaranBarangInput } from "../../schema/pengeluaran-barang";
import { StatusPengeluaranBarang, StatusStoreRequest, TipeMovement } from "@prisma/client";
import { db } from "../../db";

export const pengeluaranBarangService = {
  async getAll(companyId: string, filters?: {
    status?: StatusPengeluaranBarang;
    divisi?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return pengeluaranBarangRepository.findAll(companyId, filters);
  },

  async getById(id: string, companyId: string) {
    const gi = await pengeluaranBarangRepository.findById(id, companyId);
    if (!gi) {
      throw new Error("Pengeluaran Barang tidak ditemukan");
    }
    return gi;
  },

  async create(companyId: string, data: PengeluaranBarangInput) {
    // Validate materials and stock
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
      if (material.stockOnHand < item.jumlahKeluar) {
        throw new Error(`Stock ${material.namaMaterial} tidak mencukupi. Stock tersedia: ${material.stockOnHand}`);
      }
    }

    // If linked to SR, validate SR
    if (data.storeRequestId) {
      const sr = await storeRequestRepository.findById(data.storeRequestId, companyId);
      if (!sr) {
        throw new Error("Store Request tidak ditemukan");
      }
      if (sr.status !== StatusStoreRequest.APPROVED) {
        throw new Error("Store Request harus approved terlebih dahulu");
      }
    }

    // Generate nomor pengeluaran
    const nomorPengeluaran = await pengeluaranBarangRepository.generateNomorPengeluaran(companyId);

    // Calculate harga satuan from current stock (weighted average or FIFO)
    const gi = await pengeluaranBarangRepository.create(companyId, nomorPengeluaran, data);

    // Update item prices based on latest transaction
    for (const item of gi.items) {
      // Get average price from last transactions
      const transactions = await inventoryTransactionRepository.findByMaterial(item.materialId, companyId, 10);
      const avgPrice = transactions.length > 0
        ? transactions.reduce((sum: number, t: any) => sum + t.hargaSatuan, 0) / transactions.length
        : 0;

      await pengeluaranBarangRepository.updateItemPrice(item.id, avgPrice);
    }

    return this.getById(gi.id, companyId);
  },

  async createAndIssue(companyId: string, data: PengeluaranBarangInput, issuedBy: string, operator: string) {
    // Validate materials and stock
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
      if (material.stockOnHand < item.jumlahKeluar) {
        throw new Error(`Stock ${material.namaMaterial} tidak mencukupi. Stock tersedia: ${material.stockOnHand}`);
      }
    }

    // If linked to SR, validate SR
    if (data.storeRequestId) {
      const sr = await storeRequestRepository.findById(data.storeRequestId, companyId);
      if (!sr) {
        throw new Error("Store Request tidak ditemukan");
      }
      if (sr.status !== StatusStoreRequest.APPROVED) {
        throw new Error("Store Request harus approved terlebih dahulu");
      }
    }

    // Generate nomor pengeluaran
    const nomorPengeluaran = await pengeluaranBarangRepository.generateNomorPengeluaran(companyId);
    const tanggalPengeluaran = data.tanggalPengeluaran
      ? new Date(data.tanggalPengeluaran)
      : new Date();
    const effectiveIssuedBy = data.requestedBy || issuedBy;

    // Use transaction to ensure atomicity
    return db.$transaction(async (tx: any) => {
      // Create pengeluaran barang with items
      const gi = await tx.pengeluaranBarang.create({
        data: {
          companyId,
          nomorPengeluaran,
          tanggalPengeluaran,
          divisi: data.divisi,
          requestedBy: data.requestedBy,
          issuedBy: effectiveIssuedBy,
          keterangan: data.keterangan,
          storeRequestId: data.storeRequestId,
          status: "COMPLETED",
          items: {
            create: data.items.map((item) => ({
              materialId: item.materialId,
              jumlahKeluar: item.jumlahKeluar,
              hargaSatuan: item.hargaSatuan || 0,
              totalHarga: item.jumlahKeluar * (item.hargaSatuan || 0),
              keterangan: item.keterangan,
            })),
          },
        },
        include: {
          items: {
            include: {
              material: {
                include: {
                  kategoriMaterial: true,
                  satuanMaterial: true,
                },
              },
            },
          },
        },
      });

      // Update stock and create transactions for each item
      for (const item of gi.items) {
        // Get current stock
        const material = await tx.materialInventaris.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new Error(`Material ${item.materialId} tidak ditemukan`);
        }

        if (material.stockOnHand < item.jumlahKeluar) {
          throw new Error(`Stock ${material.namaMaterial} tidak mencukupi`);
        }

        const newStock = material.stockOnHand - item.jumlahKeluar;

        // Update material stock
        await tx.materialInventaris.update({
          where: { id: item.materialId },
          data: { stockOnHand: newStock },
        });

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            companyId,
            materialId: item.materialId,
            tipeTransaksi: TipeMovement.OUT,
            referensi: nomorPengeluaran,
            jumlahMasuk: 0,
            jumlahKeluar: item.jumlahKeluar,
            stockOnHand: newStock,
            hargaSatuan: item.hargaSatuan,
            totalHarga: item.totalHarga,
            tanggalTransaksi: tanggalPengeluaran,
            keterangan: `Pengeluaran untuk ${data.divisi}`,
            operator,
          },
        });
      }

      // Update SR status if linked
      if (data.storeRequestId) {
        await tx.storeRequest.update({
          where: { id: data.storeRequestId },
          data: { status: StatusStoreRequest.COMPLETED },
        });
      }

      return gi;
    });
  },

  async update(id: string, companyId: string, data: UpdatePengeluaranBarangInput) {
    const gi = await this.getById(id, companyId);
    if (gi.status !== StatusPengeluaranBarang.DRAFT) {
      throw new Error("Pengeluaran Barang tidak dapat diubah");
    }

    // Validate materials and stock if items are provided
    if (data.items) {
      for (const item of data.items) {
        const material = await materialInventarisRepository.findById(item.materialId, companyId);
        if (!material) {
          throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
        }
        if (material.stockOnHand < item.jumlahKeluar) {
          throw new Error(`Stock ${material.namaMaterial} tidak mencukupi. Stock tersedia: ${material.stockOnHand}`);
        }
      }
    }

    return pengeluaranBarangRepository.update(id, companyId, data);
  },

  async submit(id: string, companyId: string) {
    const gi = await this.getById(id, companyId);
    if (gi.status !== StatusPengeluaranBarang.DRAFT) {
      throw new Error("Pengeluaran Barang tidak dapat disubmit");
    }

    return pengeluaranBarangRepository.updateStatus(id, companyId, StatusPengeluaranBarang.PENDING);
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    const gi = await this.getById(id, companyId);
    if (gi.status !== StatusPengeluaranBarang.PENDING) {
      throw new Error("Pengeluaran Barang tidak dapat diapprove");
    }

    // Check stock again before approval
    for (const item of gi.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material ${item.materialId} tidak ditemukan`);
      }
      if (material.stockOnHand < item.jumlahKeluar) {
        throw new Error(`Stock ${material.namaMaterial} tidak mencukupi. Stock tersedia: ${material.stockOnHand}`);
      }
    }

    return pengeluaranBarangRepository.approve(id, companyId, approvedBy);
  },

  async reject(id: string, companyId: string) {
    const gi = await this.getById(id, companyId);
    if (gi.status !== StatusPengeluaranBarang.PENDING) {
      throw new Error("Pengeluaran Barang tidak dapat direject");
    }

    return pengeluaranBarangRepository.reject(id, companyId);
  },

  async issue(id: string, companyId: string, issuedBy: string, operator: string) {
    const gi = await this.getById(id, companyId);
    if (gi.status !== StatusPengeluaranBarang.APPROVED) {
      throw new Error("Pengeluaran Barang harus approved terlebih dahulu");
    }
    const effectiveIssuedBy = gi.requestedBy || issuedBy;

    // Use transaction to ensure atomicity
    return db.$transaction(async (tx: any) => {
      // Update stock and create transactions for each item
      for (const item of gi.items) {
        // Get current stock
        const material = await tx.materialInventaris.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new Error(`Material ${item.materialId} tidak ditemukan`);
        }

        if (material.stockOnHand < item.jumlahKeluar) {
          throw new Error(`Stock ${material.namaMaterial} tidak mencukupi`);
        }

        const newStock = material.stockOnHand - item.jumlahKeluar;

        // Update material stock
        await tx.materialInventaris.update({
          where: { id: item.materialId },
          data: { stockOnHand: newStock },
        });

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            companyId,
            materialId: item.materialId,
            tipeTransaksi: TipeMovement.OUT,
            referensi: gi.nomorPengeluaran,
            jumlahMasuk: 0,
            jumlahKeluar: item.jumlahKeluar,
            stockOnHand: newStock,
            hargaSatuan: item.hargaSatuan,
            totalHarga: item.totalHarga,
            tanggalTransaksi: gi.tanggalPengeluaran,
            keterangan: `Pengeluaran untuk ${gi.divisi}`,
            operator,
          },
        });
      }

      // Update GI status
      const updatedGI = await tx.pengeluaranBarang.update({
        where: { id, companyId },
        data: {
          issuedBy: effectiveIssuedBy,
        },
        include: {
          items: {
            include: {
              material: {
                include: {
                  kategoriMaterial: true,
                  satuanMaterial: true,
                },
              },
            },
          },
        },
      });

      // Update SR status if linked
      if (gi.storeRequestId) {
        await tx.storeRequest.update({
          where: { id: gi.storeRequestId },
          data: { status: StatusStoreRequest.COMPLETED },
        });
      }

      return updatedGI;
    });
  },

  async complete(id: string, companyId: string, receivedByDivisi: string) {
    const gi = await this.getById(id, companyId);
    if (!gi.issuedBy) {
      throw new Error("Barang belum dikeluarkan dari gudang");
    }
    if (gi.status === StatusPengeluaranBarang.COMPLETED) {
      throw new Error("Pengeluaran Barang sudah completed");
    }

    return pengeluaranBarangRepository.complete(id, companyId, receivedByDivisi);
  },

  async delete(id: string, companyId: string) {
    const gi = await this.getById(id, companyId);
    if (gi.status !== StatusPengeluaranBarang.DRAFT) {
      throw new Error("Hanya Pengeluaran Barang dengan status DRAFT yang dapat dihapus");
    }

    return pengeluaranBarangRepository.delete(id, companyId);
  },

  async getApprovedStoreRequests(companyId: string) {
    return storeRequestRepository.findApprovedWithoutPengeluaran(companyId);
  },

  async createFromStoreRequest(
    companyId: string,
    storeRequestId: string,
    issuedBy: string,
    operator: string,
    tanggalPengeluaran?: string | Date
  ) {
    // Get SR data
    const sr = await storeRequestRepository.findById(storeRequestId, companyId);
    if (!sr) {
      throw new Error("Store Request tidak ditemukan");
    }
    if (sr.status !== StatusStoreRequest.APPROVED) {
      throw new Error("Store Request harus approved terlebih dahulu");
    }
    if (sr.pengeluaranBarang) {
      throw new Error("Store Request sudah memiliki pengeluaran barang");
    }

    // Validate materials and stock, get prices
    const items = [];
    for (const srItem of sr.items) {
      const material = await materialInventarisRepository.findById(srItem.materialId, companyId);
      if (!material) {
        throw new Error(`Material ${srItem.material.namaMaterial} tidak ditemukan`);
      }
      if (material.stockOnHand < srItem.jumlahRequest) {
        throw new Error(`Stock ${material.namaMaterial} tidak mencukupi. Stock tersedia: ${material.stockOnHand}, diminta: ${srItem.jumlahRequest}`);
      }

      // Get average price from last transactions or use hargaSatuan from material
      const transactions = await inventoryTransactionRepository.findByMaterial(srItem.materialId, companyId, 10);
      let avgPrice = material.hargaSatuan || 0;
      if (transactions.length > 0) {
        const totalPrice = transactions.reduce((sum: number, t: any) => sum + (t.hargaSatuan * t.jumlahMasuk), 0);
        const totalQty = transactions.reduce((sum: number, t: any) => sum + t.jumlahMasuk, 0);
        if (totalQty > 0) {
          avgPrice = totalPrice / totalQty;
        }
      }

      items.push({
        materialId: srItem.materialId,
        jumlahKeluar: srItem.jumlahRequest,
        hargaSatuan: avgPrice,
        keterangan: srItem.keterangan,
      });
    }

    // Create pengeluaran barang
    const pengeluaranData: PengeluaranBarangInput = {
      storeRequestId,
      tanggalPengeluaran,
      divisi: sr.divisi,
      requestedBy: sr.requestedBy,
      keterangan: sr.keterangan ?? undefined,
      items: items.map(item => ({
        ...item,
        keterangan: item.keterangan ?? undefined,
      })),
    };

    return this.createAndIssue(companyId, pengeluaranData, issuedBy, operator);
  },
};
