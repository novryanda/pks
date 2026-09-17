import { penerimaanBarangRepository } from "../../repositories/penerimaan-barang.repository";
import { purchaseOrderRepository } from "../../repositories/purchase-order.repository";
import { purchaseRequestRepository } from "../../repositories/purchase-request.repository";
import { materialInventarisRepository } from "../../repositories/material-inventaris.repository";
import type { PenerimaanBarangInput, UpdatePenerimaanBarangInput } from "../../schema/penerimaan-barang";
import { StatusPenerimaanBarang, StatusPurchaseOrder, StatusPurchaseRequest, TipeMovement } from "@prisma/client";
import { db } from "../../db";

type PenerimaanBarangItemSnapshot = {
  materialId: string;
  purchaseOrderItemId: string | null;
  jumlahDiterima: number;
  hargaSatuan: number;
  lokasiPenyimpanan: string | null;
  keterangan: string | null;
};

type PurchaseOrderItemSnapshot = {
  id: string;
  materialId: string;
  jumlahOrder: number;
  jumlahDiterima: number;
};

function aggregateByKey<T>(items: T[], getKey: (item: T) => string | null | undefined, getValue: (item: T) => number) {
  const totals = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;

    totals.set(key, (totals.get(key) ?? 0) + getValue(item));
  }

  return totals;
}

async function syncPurchaseOrderStatusTx(tx: any, purchaseOrderId: string) {
  const purchaseOrder = await tx.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: true },
  });

  if (!purchaseOrder) {
    return;
  }

  const allReceived = purchaseOrder.items.every((item: { jumlahDiterima: number; jumlahOrder: number }) => {
    return item.jumlahDiterima >= item.jumlahOrder;
  });
  const someReceived = purchaseOrder.items.some((item: { jumlahDiterima: number }) => item.jumlahDiterima > 0);

  let status = purchaseOrder.status;
  if (allReceived) {
    status = StatusPurchaseOrder.COMPLETED;
  } else if (someReceived) {
    status = StatusPurchaseOrder.PARTIAL_RECEIVED;
  } else {
    status = StatusPurchaseOrder.ISSUED;
  }

  await tx.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status },
  });
}

export const penerimaanBarangService = {
  async getAll(companyId: string, filters?: {
    status?: StatusPenerimaanBarang;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return penerimaanBarangRepository.findAll(companyId, filters);
  },

  async getById(id: string, companyId: string) {
    const gr = await penerimaanBarangRepository.findById(id, companyId);
    if (!gr) {
      throw new Error("Penerimaan Barang tidak ditemukan");
    }
    return gr;
  },

  async create(companyId: string, data: PenerimaanBarangInput) {
    // Validate materials
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
    }

    // If linked to PO, validate PO
    if (data.purchaseOrderId) {
      const po = await purchaseOrderRepository.findById(data.purchaseOrderId, companyId);
      if (!po) {
        throw new Error("Purchase Order tidak ditemukan");
      }
      if (po.status !== StatusPurchaseOrder.ISSUED && po.status !== StatusPurchaseOrder.PARTIAL_RECEIVED) {
        throw new Error("Purchase Order harus sudah diterbitkan");
      }
    }

    // If linked to PR (direct purchase), validate PR
    if (data.purchaseRequestId) {
      const pr = await purchaseRequestRepository.findById(data.purchaseRequestId, companyId);
      if (!pr) {
        throw new Error("Purchase Request tidak ditemukan");
      }
      if (pr.tipePembelian !== "PEMBELIAN_LANGSUNG") {
        throw new Error("Purchase Request harus bertipe PEMBELIAN_LANGSUNG");
      }
      if (pr.status !== StatusPurchaseRequest.APPROVED) {
        throw new Error("Purchase Request harus sudah approved");
      }
    }

    // Generate nomor penerimaan
    const nomorPenerimaan = await penerimaanBarangRepository.generateNomorPenerimaan(companyId);

    return penerimaanBarangRepository.create(companyId, nomorPenerimaan, data);
  },

  async update(id: string, companyId: string, data: UpdatePenerimaanBarangInput) {
    const gr = await this.getById(id, companyId);
    const editableStatuses = new Set<StatusPenerimaanBarang>([
      StatusPenerimaanBarang.DRAFT,
      StatusPenerimaanBarang.COMPLETED,
    ]);

    if (!editableStatuses.has(gr.status)) {
      throw new Error("Penerimaan Barang tidak dapat diubah pada status saat ini");
    }

    // Validate materials if items are provided
    if (data.items) {
      for (const item of data.items) {
        const material = await materialInventarisRepository.findById(item.materialId, companyId);
        if (!material) {
          throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
        }
      }
    }

    if (gr.status === StatusPenerimaanBarang.DRAFT) {
      return penerimaanBarangRepository.update(id, companyId, data);
    }

    return db.$transaction(async (tx) => {
      const currentGR = await tx.penerimaanBarang.findFirst({
        where: { id, companyId },
        include: {
          purchaseOrder: {
            include: {
              items: true,
            },
          },
          items: true,
        },
      });

      if (!currentGR) {
        throw new Error("Penerimaan Barang tidak ditemukan");
      }

      const currentItems = currentGR.items as PenerimaanBarangItemSnapshot[];
      const nextItems = data.items ?? currentItems.map((item) => ({
        materialId: item.materialId,
        purchaseOrderItemId: item.purchaseOrderItemId ?? undefined,
        jumlahDiterima: item.jumlahDiterima,
        hargaSatuan: item.hargaSatuan,
        lokasiPenyimpanan: item.lokasiPenyimpanan ?? undefined,
        keterangan: item.keterangan ?? undefined,
      }));

      if (nextItems.length === 0) {
        throw new Error("Minimal 1 item penerimaan barang wajib diisi");
      }

      const currentItemIds = new Set(currentItems.map((item) => item.materialId));
      for (const item of nextItems) {
        if (!currentItemIds.has(item.materialId)) {
          throw new Error("Material penerimaan barang tidak dapat diganti setelah completed");
        }
      }

      if (currentGR.purchaseOrderId) {
        const poItems = (currentGR.purchaseOrder?.items ?? []) as PurchaseOrderItemSnapshot[];
        const poItemsById = new Map(poItems.map((item) => [item.id, item]));
        const previousQtyByPoItem = aggregateByKey(
          currentItems,
          (item) => item.purchaseOrderItemId,
          (item) => item.jumlahDiterima,
        );
        const nextQtyByPoItem = aggregateByKey(
          nextItems,
          (item) => item.purchaseOrderItemId,
          (item) => item.jumlahDiterima,
        );

        for (const item of nextItems) {
          if (!item.purchaseOrderItemId) {
            throw new Error("Item penerimaan dari PO wajib terhubung ke item PO");
          }

          const poItem = poItemsById.get(item.purchaseOrderItemId);
          if (!poItem) {
            throw new Error("Item PO tidak ditemukan");
          }

          if (poItem.materialId !== item.materialId) {
            throw new Error("Material penerimaan harus sesuai dengan material pada PO");
          }
        }

        for (const [poItemId, nextQty] of nextQtyByPoItem.entries()) {
          const poItem = poItemsById.get(poItemId);
          if (!poItem) {
            throw new Error("Item PO tidak ditemukan");
          }

          const previousQty = previousQtyByPoItem.get(poItemId) ?? 0;
          const currentReceived = poItem.jumlahDiterima;
          const recalculatedReceived = currentReceived - previousQty + nextQty;

          if (recalculatedReceived < 0) {
            throw new Error(`Jumlah diterima untuk material ${poItem.materialId} tidak valid`);
          }

          if (recalculatedReceived > poItem.jumlahOrder) {
            throw new Error("Jumlah penerimaan melebihi jumlah order pada PO");
          }
        }
      }

      const previousQtyByMaterial = aggregateByKey(
        currentItems,
        (item) => item.materialId,
        (item) => item.jumlahDiterima,
      );
      const nextQtyByMaterial = aggregateByKey(
        nextItems,
        (item) => item.materialId,
        (item) => item.jumlahDiterima,
      );

      const materialIds = new Set([
        ...previousQtyByMaterial.keys(),
        ...nextQtyByMaterial.keys(),
      ]);

      for (const materialId of materialIds) {
        const material = await tx.materialInventaris.findUnique({
          where: { id: materialId },
        });

        if (!material) {
          throw new Error(`Material ${materialId} tidak ditemukan`);
        }

        const delta = (nextQtyByMaterial.get(materialId) ?? 0) - (previousQtyByMaterial.get(materialId) ?? 0);
        const nextStock = material.stockOnHand + delta;

        if (nextStock < 0) {
          throw new Error(`Stock material ${material.namaMaterial} tidak mencukupi untuk perubahan penerimaan`);
        }

        if (delta !== 0) {
          await tx.materialInventaris.update({
            where: { id: materialId },
            data: { stockOnHand: nextStock },
          });

          await tx.inventoryTransaction.create({
            data: {
              companyId,
              materialId,
              tipeTransaksi: TipeMovement.ADJUSTMENT,
              referensi: currentGR.nomorPenerimaan,
              vendorId: data.vendorId ?? currentGR.vendorId,
              vendorName: data.vendorName ?? currentGR.vendorName,
              jumlahMasuk: delta > 0 ? delta : 0,
              jumlahKeluar: delta < 0 ? Math.abs(delta) : 0,
              stockOnHand: nextStock,
              hargaSatuan: nextItems.find((item) => item.materialId === materialId)?.hargaSatuan ?? 0,
              totalHarga: 0,
              keterangan: `Penyesuaian edit penerimaan barang ${currentGR.nomorPenerimaan}`,
              operator: data.receivedBy ?? currentGR.receivedBy,
            },
          });
        }
      }

      if (currentGR.purchaseOrderId) {
        const previousQtyByPoItem = aggregateByKey(
          currentItems,
          (item) => item.purchaseOrderItemId,
          (item) => item.jumlahDiterima,
        );
        const nextQtyByPoItem = aggregateByKey(
          nextItems,
          (item) => item.purchaseOrderItemId,
          (item) => item.jumlahDiterima,
        );

        const poItemIds = new Set([
          ...previousQtyByPoItem.keys(),
          ...nextQtyByPoItem.keys(),
        ]);

        for (const poItemId of poItemIds) {
          const poItem = await tx.purchaseOrderItem.findUnique({
            where: { id: poItemId },
          });

          if (!poItem) {
            throw new Error("Item PO tidak ditemukan");
          }

          const previousQty = previousQtyByPoItem.get(poItemId) ?? 0;
          const nextQty = nextQtyByPoItem.get(poItemId) ?? 0;
          const recalculatedReceived = poItem.jumlahDiterima - previousQty + nextQty;

          await tx.purchaseOrderItem.update({
            where: { id: poItemId },
            data: { jumlahDiterima: recalculatedReceived },
          });
        }

        await syncPurchaseOrderStatusTx(tx, currentGR.purchaseOrderId);
      }

      await tx.penerimaanBarangItem.deleteMany({
        where: { penerimaanBarangId: id },
      });

      const updatedGR = await tx.penerimaanBarang.update({
        where: { id, companyId },
        data: {
          vendorId: data.vendorId ?? currentGR.vendorId,
          vendorName: data.vendorName ?? currentGR.vendorName,
          nomorSuratJalan: data.nomorSuratJalan ?? currentGR.nomorSuratJalan,
          tanggalSuratJalan: data.tanggalSuratJalan
            ? new Date(data.tanggalSuratJalan)
            : data.tanggalSuratJalan === ""
              ? null
              : currentGR.tanggalSuratJalan,
          nomorInvoice: data.nomorInvoice ?? currentGR.nomorInvoice,
          tanggalInvoice: data.tanggalInvoice
            ? new Date(data.tanggalInvoice)
            : data.tanggalInvoice === ""
              ? null
              : currentGR.tanggalInvoice,
          receivedBy: data.receivedBy ?? currentGR.receivedBy,
          checkedBy: data.checkedBy ?? currentGR.checkedBy,
          keterangan: data.keterangan ?? currentGR.keterangan,
          items: {
            create: nextItems.map((item) => ({
              materialId: item.materialId,
              purchaseOrderItemId: item.purchaseOrderItemId,
              jumlahDiterima: item.jumlahDiterima,
              hargaSatuan: item.hargaSatuan,
              totalHarga: item.jumlahDiterima * item.hargaSatuan,
              lokasiPenyimpanan: item.lokasiPenyimpanan,
              keterangan: item.keterangan,
            })),
          },
        },
        include: {
          purchaseOrder: {
            include: {
              items: true,
            },
          },
          purchaseRequest: true,
          items: {
            include: {
              material: {
                include: {
                  kategoriMaterial: true,
                  satuanMaterial: true,
                },
              },
              purchaseOrderItem: true,
            },
          },
        },
      });

      if (currentGR.purchaseRequestId) {
        const newTotalPembayaran = nextItems.reduce((sum, item) => {
          return sum + item.jumlahDiterima * item.hargaSatuan;
        }, 0);

        await tx.pembayaranPR.updateMany({
          where: {
            purchaseRequestId: currentGR.purchaseRequestId,
            nomorReferensi: currentGR.nomorPenerimaan,
          },
          data: {
            jumlahBayar: newTotalPembayaran,
            dibayarOleh: data.receivedBy ?? currentGR.receivedBy,
            keterangan: `Pembayaran otomatis untuk PR Pembelian Langsung ${currentGR.nomorPenerimaan}`,
          },
        });
      }

      return updatedGR;
    });
  },

  async complete(id: string, companyId: string, checkedBy: string, operator: string) {
    const gr = await this.getById(id, companyId);
    if (gr.status !== StatusPenerimaanBarang.DRAFT) {
      throw new Error("Penerimaan Barang tidak dapat dicomplete");
    }

    // Use transaction to ensure atomicity
    return db.$transaction(async (tx) => {
      // Update stock and create transactions for each item
      for (const item of gr.items) {
        // Get current stock
        const material = await tx.materialInventaris.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new Error(`Material ${item.materialId} tidak ditemukan`);
        }

        const newStock = material.stockOnHand + item.jumlahDiterima;

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
            tipeTransaksi: TipeMovement.IN,
            referensi: gr.nomorPenerimaan,
            vendorId: gr.vendorId,
            vendorName: gr.vendorName,
            jumlahMasuk: item.jumlahDiterima,
            jumlahKeluar: 0,
            stockOnHand: newStock,
            hargaSatuan: item.hargaSatuan,
            totalHarga: item.totalHarga,
            keterangan: `Penerimaan Barang dari ${gr.vendorName}`,
            operator,
          },
        });

        // Update PO item if linked
        if (item.purchaseOrderItemId) {
          const poItem = await tx.purchaseOrderItem.findUnique({
            where: { id: item.purchaseOrderItemId },
          });

          if (poItem) {
            await tx.purchaseOrderItem.update({
              where: { id: item.purchaseOrderItemId },
              data: {
                jumlahDiterima: poItem.jumlahDiterima + item.jumlahDiterima,
              },
            });
          }
        }
      }

      // Update GR status
      const updatedGR = await tx.penerimaanBarang.update({
        where: { id, companyId },
        data: {
          status: StatusPenerimaanBarang.COMPLETED,
          checkedBy,
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

      // Update PO status if all items received
      if (gr.purchaseOrderId) {
        await syncPurchaseOrderStatusTx(tx, gr.purchaseOrderId);
      }

      // Update PR status if linked (for direct purchase)
      if (gr.purchaseRequestId) {
        await tx.purchaseRequest.update({
          where: { id: gr.purchaseRequestId },
          data: { status: StatusPurchaseRequest.COMPLETED },
        });
      }

      return updatedGR;
    });
  },

  async delete(id: string, companyId: string) {
    const gr = await this.getById(id, companyId);
    if (gr.status !== StatusPenerimaanBarang.DRAFT) {
      throw new Error("Hanya Penerimaan Barang dengan status DRAFT yang dapat dihapus");
    }

    return penerimaanBarangRepository.delete(id, companyId);
  },

  // Create and complete penerimaan barang from PO in one step
  async createAndCompleteFromPO(
    companyId: string,
    data: PenerimaanBarangInput,
    operator: string
  ) {
    // Validate PO
    if (!data.purchaseOrderId) {
      throw new Error("Purchase Order ID wajib diisi");
    }

    const purchaseOrderId = data.purchaseOrderId;
    const po = await purchaseOrderRepository.findById(purchaseOrderId, companyId);
    if (!po) {
      throw new Error("Purchase Order tidak ditemukan");
    }
    if (po.status !== StatusPurchaseOrder.ISSUED && po.status !== StatusPurchaseOrder.PARTIAL_RECEIVED) {
      throw new Error("Purchase Order harus sudah diterbitkan (ISSUED)");
    }

    // Validate materials
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
    }

    // Generate nomor penerimaan
    const nomorPenerimaan = await penerimaanBarangRepository.generateNomorPenerimaan(companyId);

    // Use transaction to ensure atomicity
    return db.$transaction(async (tx) => {
      // Create penerimaan barang with COMPLETED status
      const penerimaanBarang = await tx.penerimaanBarang.create({
        data: {
          companyId,
          nomorPenerimaan,
          purchaseOrderId,
          vendorId: data.vendorId,
          vendorName: data.vendorName,
          tanggalPenerimaan: new Date(),
          nomorSuratJalan: data.nomorSuratJalan,
          tanggalSuratJalan: data.tanggalSuratJalan ? new Date(data.tanggalSuratJalan) : undefined,
          nomorInvoice: data.nomorInvoice,
          tanggalInvoice: data.tanggalInvoice ? new Date(data.tanggalInvoice) : undefined,
          receivedBy: data.receivedBy,
          checkedBy: operator,
          keterangan: data.keterangan,
          status: StatusPenerimaanBarang.COMPLETED,
          items: {
            create: data.items.map(item => ({
              materialId: item.materialId,
              purchaseOrderItemId: item.purchaseOrderItemId,
              jumlahDiterima: item.jumlahDiterima,
              hargaSatuan: item.hargaSatuan,
              totalHarga: item.jumlahDiterima * item.hargaSatuan,
              lokasiPenyimpanan: item.lokasiPenyimpanan,
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

      // Update stock and create inventory transactions for each item
      for (const item of data.items) {
        // Get current stock
        const material = await tx.materialInventaris.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new Error(`Material ${item.materialId} tidak ditemukan`);
        }

        const newStock = material.stockOnHand + item.jumlahDiterima;

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
            tipeTransaksi: TipeMovement.IN,
            referensi: nomorPenerimaan,
            vendorId: data.vendorId,
            vendorName: data.vendorName,
            jumlahMasuk: item.jumlahDiterima,
            jumlahKeluar: 0,
            stockOnHand: newStock,
            hargaSatuan: item.hargaSatuan,
            totalHarga: item.jumlahDiterima * item.hargaSatuan,
            keterangan: `Penerimaan Barang dari PO ${po.nomorPO} - ${data.vendorName}`,
            operator,
          },
        });

        // Update PO item received quantity
        if (item.purchaseOrderItemId) {
          const poItem = await tx.purchaseOrderItem.findUnique({
            where: { id: item.purchaseOrderItemId },
          });

          if (poItem) {
            const remaining = poItem.jumlahOrder - poItem.jumlahDiterima;
            if (item.jumlahDiterima > remaining) {
              throw new Error(
                `Jumlah penerimaan (${item.jumlahDiterima}) melebihi sisa order pada PO (${remaining}) untuk material ${material.namaMaterial}`
              );
            }

            await tx.purchaseOrderItem.update({
              where: { id: item.purchaseOrderItemId },
              data: {
                jumlahDiterima: poItem.jumlahDiterima + item.jumlahDiterima,
              },
            });
          }
        }
      }

      // Check and update PO status
      await syncPurchaseOrderStatusTx(tx, purchaseOrderId);

      return penerimaanBarang;
    });
  },

  async createFromPR(
    companyId: string,
    purchaseRequestId: string,
    additionalData: {
      receivedBy: string;
      nomorSuratJalan?: string;
      tanggalSuratJalan?: string;
      tanggalPenerimaan?: string;
      keterangan?: string;
    }
  ) {
    // Get PR with items
    const pr = await purchaseRequestRepository.findById(purchaseRequestId, companyId);
    if (!pr) {
      throw new Error("Purchase Request tidak ditemukan");
    }

    if (pr.tipePembelian !== "PEMBELIAN_LANGSUNG") {
      throw new Error("Hanya Purchase Request dengan tipe PEMBELIAN_LANGSUNG yang dapat diproses");
    }

    if (pr.status !== StatusPurchaseRequest.APPROVED) {
      throw new Error("Purchase Request harus sudah approved");
    }

    // Validate items exist
    if (!pr.items || pr.items.length === 0) {
      throw new Error("Purchase Request tidak memiliki items");
    }

    console.log("PR Items:", JSON.stringify(pr.items, null, 2));

    // Validate all items have jumlahRequest
    for (const item of pr.items) {
      console.log(`Item ${item.materialId}: jumlahRequest = ${item.jumlahRequest}`);
      if (typeof item.jumlahRequest !== 'number' || item.jumlahRequest <= 0) {
        throw new Error(`Item material ${item.materialId} tidak memiliki jumlah request yang valid (jumlahRequest: ${item.jumlahRequest})`);
      }
    }

    // Generate nomor penerimaan
    const nomorPenerimaan = await penerimaanBarangRepository.generateNomorPenerimaan(companyId);

    // Create penerimaan barang using transaction
    return db.$transaction(async (tx) => {
      // Create penerimaan barang
      const penerimaanBarang = await tx.penerimaanBarang.create({
        data: {
          companyId,
          nomorPenerimaan,
          purchaseRequestId,
          vendorId: "vendor-pr",
          vendorName: pr.vendorNameDirect || "Vendor Direct",
          tanggalPenerimaan: additionalData.tanggalPenerimaan 
            ? new Date(additionalData.tanggalPenerimaan) 
            : new Date(),
          receivedBy: additionalData.receivedBy,
          nomorSuratJalan: additionalData.nomorSuratJalan,
          tanggalSuratJalan: additionalData.tanggalSuratJalan 
            ? new Date(additionalData.tanggalSuratJalan) 
            : undefined,
          keterangan: additionalData.keterangan,
          status: StatusPenerimaanBarang.COMPLETED,
          items: {
            create: pr.items.map((item) => ({
              materialId: item.materialId,
              jumlahDiterima: item.jumlahRequest,
              hargaSatuan: item.estimasiHarga || 0,
              totalHarga: (item.estimasiHarga || 0) * item.jumlahRequest,
              lokasiPenyimpanan: "Gudang Utama",
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
      for (const item of pr.items) {
        const material = await tx.materialInventaris.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new Error(`Material ${item.materialId} tidak ditemukan`);
        }

        const newStock = material.stockOnHand + item.jumlahRequest;

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
            tipeTransaksi: TipeMovement.IN,
            referensi: nomorPenerimaan,
            vendorId: "vendor-pr",
            vendorName: pr.vendorNameDirect || "Vendor Direct",
            jumlahMasuk: item.jumlahRequest,
            jumlahKeluar: 0,
            stockOnHand: newStock,
            hargaSatuan: item.estimasiHarga || 0,
            totalHarga: (item.estimasiHarga || 0) * item.jumlahRequest,
            keterangan: `Penerimaan Barang dari PR ${pr.nomorPR} - ${pr.vendorNameDirect}`,
            operator: additionalData.receivedBy,
          },
        });
      }

      // Update PR status to COMPLETED
      await tx.purchaseRequest.update({
        where: { id: purchaseRequestId },
        data: { status: StatusPurchaseRequest.COMPLETED },
      });

      // Calculate total nilai PR
      const totalNilaiPR = pr.items.reduce((sum, item) => {
        return sum + (item.jumlahRequest * (item.estimasiHarga || 0));
      }, 0);

      // Auto-create pembayaran PR record (mark as fully paid)
      await tx.pembayaranPR.create({
        data: {
          purchaseRequestId,
          jumlahBayar: totalNilaiPR,
          metodePembayaran: "CASH",
          nomorReferensi: nomorPenerimaan,
          keterangan: `Pembayaran otomatis untuk PR Pembelian Langsung ${pr.nomorPR}`,
          dibayarOleh: additionalData.receivedBy,
        },
      });

      return penerimaanBarang;
    });
  },
};
