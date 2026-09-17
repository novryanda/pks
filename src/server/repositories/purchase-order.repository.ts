import { db } from "../db";
import type { PurchaseOrderInput, UpdatePurchaseOrderInput } from "../schema/purchase-order";
import { StatusPurchaseOrder, StatusPurchaseRequest } from "@prisma/client";

// Helper function to calculate PO totals
function calculatePOTotals(
  items: { jumlahOrder: number; hargaSatuan: number }[],
  taxPercent: number,
  discountType: string | undefined | null,
  discountPercent: number,
  discountAmount: number,
  shipping: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.jumlahOrder * item.hargaSatuan, 0);

  // Calculate discount
  let calculatedDiscountAmount = 0;
  if (discountType === "PERCENT") {
    calculatedDiscountAmount = (subtotal * discountPercent) / 100;
  } else if (discountType === "AMOUNT") {
    calculatedDiscountAmount = discountAmount;
  }

  // Subtotal after discount
  const subtotalAfterDiscount = subtotal - calculatedDiscountAmount;

  // Calculate tax
  const taxAmount = (subtotalAfterDiscount * taxPercent) / 100;

  // Total amount
  const totalAmount = subtotalAfterDiscount + taxAmount + shipping;

  return {
    subtotal,
    taxAmount,
    calculatedDiscountAmount,
    totalAmount,
  };
}

async function syncPurchaseRequestStatusTx(tx: any, purchaseRequestId: string, companyId: string) {
  const purchaseRequest = await tx.purchaseRequest.findFirst({
    where: { id: purchaseRequestId, companyId },
    include: {
      items: {
        select: {
          jumlahRequest: true,
          jumlahPOCreated: true,
        },
      },
    },
  });

  if (!purchaseRequest) {
    return;
  }

  const hasAllocatedPO = purchaseRequest.items.some(
    (item: { jumlahPOCreated: number }) => item.jumlahPOCreated > 0
  );

  await tx.purchaseRequest.update({
    where: { id: purchaseRequestId },
    data: {
      status: hasAllocatedPO
        ? StatusPurchaseRequest.PO_CREATED
        : StatusPurchaseRequest.APPROVED,
    },
  });
}

export const purchaseOrderRepository = {
  async findAll(companyId: string, filters?: {
    status?: StatusPurchaseOrder;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { companyId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
      where.tanggalPO = {};
      if (filters.startDate) {
        where.tanggalPO.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalPO.lte = filters.endDate;
      }
    }

    return db.purchaseOrder.findMany({
      where,
      include: {
        purchaseRequest: true,
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
        penerimaanBarang: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string, companyId: string) {
    return db.purchaseOrder.findFirst({
      where: { id, companyId },
      include: {
        purchaseRequest: {
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
            prItemMappings: {
              include: {
                purchaseRequestItem: {
                  include: {
                    material: {
                      include: {
                        satuanMaterial: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        penerimaanBarang: {
          include: {
            items: true,
          },
        },
      },
    });
  },

  async create(companyId: string, nomorPO: string, data: PurchaseOrderInput) {
    // Calculate totals
    const itemsWithSubtotal = data.items.map(item => ({
      materialId: item.materialId,
      jumlahOrder: item.jumlahOrder,
      hargaSatuan: item.hargaSatuan,
      keterangan: item.keterangan,
      subtotal: item.jumlahOrder * item.hargaSatuan,
    }));

    const { subtotal, taxAmount, calculatedDiscountAmount, totalAmount } = calculatePOTotals(
      data.items,
      data.taxPercent ?? 0,
      data.discountType,
      data.discountPercent ?? 0,
      data.discountAmount ?? 0,
      data.shipping ?? 0
    );

    // Create PO with items
    const po = await db.purchaseOrder.create({
      data: {
        companyId,
        nomorPO,
        purchaseRequestId: data.purchaseRequestId,
        vendorMaterialId: data.vendorMaterialId,
        vendorName: data.vendorName,
        vendorAddress: data.vendorAddress,
        vendorPhone: data.vendorPhone,
        tanggalKirimDiharapkan: data.tanggalKirimDiharapkan ? new Date(data.tanggalKirimDiharapkan) : undefined,
        termPembayaran: data.termPembayaran,
        issuedBy: data.issuedBy,
        subtotal,
        taxPercent: data.taxPercent ?? 0,
        taxAmount,
        discountType: data.discountType,
        discountPercent: data.discountPercent ?? 0,
        discountAmount: calculatedDiscountAmount,
        shipping: data.shipping ?? 0,
        totalAmount,
        keterangan: data.keterangan,
        items: {
          create: itemsWithSubtotal,
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

    // Create PR Item mappings if provided
    for (let i = 0; i < data.items.length; i++) {
      const dataItem = data.items[i];
      const poItem = po.items[i];

      if (dataItem?.prItemMappings && dataItem.prItemMappings.length > 0 && poItem) {
        for (const mapping of dataItem.prItemMappings) {
          // Create mapping
          await db.pOItemPRItemMapping.create({
            data: {
              purchaseOrderItemId: poItem.id,
              purchaseRequestItemId: mapping.purchaseRequestItemId,
              quantity: mapping.quantity,
            },
          });

          // Update PR Item's jumlahPOCreated
          await db.purchaseRequestItem.update({
            where: { id: mapping.purchaseRequestItemId },
            data: {
              jumlahPOCreated: {
                increment: mapping.quantity,
              },
            },
          });
        }
      }
    }

    return po;
  },

  async update(id: string, companyId: string, data: UpdatePurchaseOrderInput) {
    return db.$transaction(async (tx) => {
      const existingPO = await tx.purchaseOrder.findFirst({
        where: { id, companyId },
        include: {
          items: {
            include: {
              prItemMappings: true,
            },
          },
        },
      });

      if (!existingPO) {
        throw new Error("Purchase Order tidak ditemukan");
      }

      const updateData: any = {};

      if (data.vendorMaterialId !== undefined) updateData.vendorMaterialId = data.vendorMaterialId;
      if (data.vendorName) updateData.vendorName = data.vendorName;
      if (data.vendorAddress !== undefined) updateData.vendorAddress = data.vendorAddress;
      if (data.vendorPhone !== undefined) updateData.vendorPhone = data.vendorPhone;
      if (data.tanggalKirimDiharapkan) updateData.tanggalKirimDiharapkan = new Date(data.tanggalKirimDiharapkan);
      if (data.termPembayaran !== undefined) updateData.termPembayaran = data.termPembayaran;
      if (data.issuedBy !== undefined) updateData.issuedBy = data.issuedBy;
      if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;
      if (data.brosurPdfPath !== undefined) updateData.brosurPdfPath = data.brosurPdfPath;
      if (data.brosurPdfName !== undefined) updateData.brosurPdfName = data.brosurPdfName;

      // If items are provided, recalculate totals and rebuild mappings
      if (data.items) {
        const existingMappings = existingPO.items.flatMap((item) => item.prItemMappings);

        for (const mapping of existingMappings) {
          await tx.purchaseRequestItem.update({
            where: { id: mapping.purchaseRequestItemId },
            data: {
              jumlahPOCreated: {
                decrement: mapping.quantity,
              },
            },
          });
        }

        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });

        const taxPercent = data.taxPercent ?? 0;
        const discountType = data.discountType;
        const discountPercent = data.discountPercent ?? 0;
        const discountAmount = data.discountAmount ?? 0;
        const shipping = data.shipping ?? 0;

        const { subtotal, taxAmount, calculatedDiscountAmount, totalAmount } = calculatePOTotals(
          data.items,
          taxPercent,
          discountType,
          discountPercent,
          discountAmount,
          shipping
        );

        updateData.subtotal = subtotal;
        updateData.taxPercent = taxPercent;
        updateData.taxAmount = taxAmount;
        updateData.discountType = discountType;
        updateData.discountPercent = discountPercent;
        updateData.discountAmount = calculatedDiscountAmount;
        updateData.shipping = shipping;
        updateData.totalAmount = totalAmount;

        const createdItems = [];
        for (const item of data.items) {
          const createdItem = await tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: id,
              materialId: item.materialId,
              jumlahOrder: item.jumlahOrder,
              hargaSatuan: item.hargaSatuan,
              keterangan: item.keterangan,
              subtotal: item.jumlahOrder * item.hargaSatuan,
            },
          });

          createdItems.push(createdItem);

          if (item.prItemMappings?.length) {
            for (const mapping of item.prItemMappings) {
              await tx.pOItemPRItemMapping.create({
                data: {
                  purchaseOrderItemId: createdItem.id,
                  purchaseRequestItemId: mapping.purchaseRequestItemId,
                  quantity: mapping.quantity,
                },
              });

              await tx.purchaseRequestItem.update({
                where: { id: mapping.purchaseRequestItemId },
                data: {
                  jumlahPOCreated: {
                    increment: mapping.quantity,
                  },
                },
              });
            }
          }
        }
      } else if (data.taxPercent !== undefined || data.shipping !== undefined || data.discountType !== undefined || data.discountPercent !== undefined || data.discountAmount !== undefined) {
        const taxPercent = data.taxPercent ?? existingPO.taxPercent;
        const discountType = data.discountType ?? existingPO.discountType;
        const discountPercent = data.discountPercent ?? existingPO.discountPercent;
        const discountAmount = data.discountAmount ?? existingPO.discountAmount;
        const shipping = data.shipping ?? existingPO.shipping;

        let calculatedDiscountAmount = 0;
        if (discountType === "PERCENT") {
          calculatedDiscountAmount = (existingPO.subtotal * discountPercent) / 100;
        } else if (discountType === "AMOUNT") {
          calculatedDiscountAmount = discountAmount;
        }

        const subtotalAfterDiscount = existingPO.subtotal - calculatedDiscountAmount;
        const taxAmount = (subtotalAfterDiscount * taxPercent) / 100;
        const totalAmount = subtotalAfterDiscount + taxAmount + shipping;

        updateData.taxPercent = taxPercent;
        updateData.taxAmount = taxAmount;
        updateData.discountType = discountType;
        updateData.discountPercent = discountPercent;
        updateData.discountAmount = calculatedDiscountAmount;
        updateData.shipping = shipping;
        updateData.totalAmount = totalAmount;
      }

      const updatedPO = await tx.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            include: {
              material: {
                include: {
                  kategoriMaterial: true,
                  satuanMaterial: true,
                },
              },
              prItemMappings: true,
            },
          },
        },
      });

      if (existingPO.purchaseRequestId) {
        await syncPurchaseRequestStatusTx(tx, existingPO.purchaseRequestId, companyId);
      }

      return updatedPO;
    });
  },

  async updateStatus(id: string, companyId: string, status: StatusPurchaseOrder, additionalData?: any) {
    return db.purchaseOrder.update({
      where: { id, companyId },
      data: {
        status,
        ...additionalData,
      },
    });
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    return db.purchaseOrder.update({
      where: { id, companyId },
      data: {
        approvedBy,
        tanggalApproval: new Date(),
      },
    });
  },

  async issue(id: string, companyId: string) {
    return db.purchaseOrder.update({
      where: { id, companyId },
      data: {
        status: StatusPurchaseOrder.ISSUED,
      },
    });
  },

  async updateItemReceived(itemId: string, jumlahDiterima: number) {
    const item = await db.purchaseOrderItem.findUnique({
      where: { id: itemId },
      select: { jumlahDiterima: true },
    });

    if (!item) {
      throw new Error("PO Item tidak ditemukan");
    }

    return db.purchaseOrderItem.update({
      where: { id: itemId },
      data: {
        jumlahDiterima: item.jumlahDiterima + jumlahDiterima,
      },
    });
  },

  async checkAndUpdatePOStatus(poId: string) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true,
      },
    });

    if (!po) return;

    const allReceived = po.items.every(item => item.jumlahDiterima >= item.jumlahOrder);
    const someReceived = po.items.some(item => item.jumlahDiterima > 0);

    if (allReceived) {
      await db.purchaseOrder.update({
        where: { id: poId },
        data: { status: StatusPurchaseOrder.COMPLETED },
      });
    } else if (someReceived) {
      await db.purchaseOrder.update({
        where: { id: poId },
        data: { status: StatusPurchaseOrder.PARTIAL_RECEIVED },
      });
    }
  },

  // Update PO item received quantities without changing the original PO order values.
  async updatePOItemsAndTotals(poId: string, receivedItems: { purchaseOrderItemId: string; jumlahDiterima: number; hargaSatuan: number }[]) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });

    if (!po) {
      throw new Error("PO tidak ditemukan");
    }

    // Update each PO item with received quantities and recalculate subtotals
    for (const receivedItem of receivedItems) {
      if (receivedItem.purchaseOrderItemId) {
        const poItem = po.items.find(item => item.id === receivedItem.purchaseOrderItemId);
        if (poItem) {
          await db.purchaseOrderItem.update({
            where: { id: receivedItem.purchaseOrderItemId },
            data: {
              jumlahDiterima: poItem.jumlahDiterima + receivedItem.jumlahDiterima,
            },
          });
        }
      }
    }

    await this.checkAndUpdatePOStatus(poId);

    return db.purchaseOrder.findUnique({
      where: { id: poId },
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
  },

  async delete(id: string, companyId: string) {
    return db.$transaction(async (tx) => {
      const existingPO = await tx.purchaseOrder.findFirst({
        where: { id, companyId },
        include: {
          items: {
            include: {
              prItemMappings: true,
            },
          },
        },
      });

      if (!existingPO) {
        throw new Error("Purchase Order tidak ditemukan");
      }

      const existingMappings = existingPO.items.flatMap((item) => item.prItemMappings);

      for (const mapping of existingMappings) {
        await tx.purchaseRequestItem.update({
          where: { id: mapping.purchaseRequestItemId },
          data: {
            jumlahPOCreated: {
              decrement: mapping.quantity,
            },
          },
        });
      }

      const deletedPO = await tx.purchaseOrder.delete({
        where: { id },
      });

      if (existingPO.purchaseRequestId) {
        await syncPurchaseRequestStatusTx(tx, existingPO.purchaseRequestId, companyId);
      }

      return deletedPO;
    });
  },

  // Method untuk mendapatkan PR yang approved dan siap untuk dijadikan PO
  async findPendingPRsForPO(companyId: string) {
    // Cari PR yang approved dan masih memiliki sisa quantity untuk di-PO
    const prs = await db.purchaseRequest.findMany({
      where: {
        companyId,
        tipePembelian: "PENGAJUAN_PO",
        status: {
          in: ["APPROVED", "PO_CREATED"], // Include PO_CREATED karena sekarang bisa partial
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
        purchaseOrders: {
          select: {
            id: true,
            nomorPO: true,
            vendorName: true,
            status: true,
          },
        },
      },
      orderBy: { tanggalRequest: "desc" },
    });

    // Filter hanya PR yang masih memiliki sisa quantity
    return prs.filter(pr => {
      return pr.items.some(item => {
        const remaining = item.jumlahRequest - item.jumlahPOCreated;
        return remaining > 0;
      });
    });
  },

  async generateNomorPO(companyId: string) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    const prefix = `PO/${year}${month}`;

    const lastPO = await db.purchaseOrder.findFirst({
      where: {
        companyId,
        nomorPO: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = 1;
    if (lastPO) {
      const lastNumber = parseInt(lastPO.nomorPO.split("/").pop() ?? "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}/${String(nextNumber).padStart(4, "0")}`;
  },
};
