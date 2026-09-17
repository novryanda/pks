import { db } from "@/server/db";
import type {
  CreateContractInput,
  UpdateContractInput,
  ContractQueryInput,
} from "@/server/schema/contract";
import type { Prisma, StatusContract, TaxStatus } from "@prisma/client";

export class ContractRepository {
  /**
   * Get all contracts by companyId with pagination
   */
  async findByCompanyId(companyId: string, query?: ContractQueryInput) {
    const where: Prisma.ContractWhereInput = {
      buyer: {
        companyId,
      },
    };

    // Search filter
    if (query?.search) {
      where.OR = [
        { contractNumber: { contains: query.search, mode: "insensitive" } },
        {
          buyer: {
            name: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }

    // Buyer filter
    if (query?.buyerId) {
      where.buyerId = query.buyerId;
    }

    // Material filter
    if (query?.materialId) {
      where.contractItems = {
        some: {
          materialId: query.materialId,
        },
      };
    }

    // Status filter
    if (query?.status) {
      where.status = query.status as StatusContract;
    }

    // Multi-status filter (dipisah koma, mis. "ACTIVE,COMPLETED")
    if (query?.statuses) {
      const statuses = query.statuses
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length > 0) {
        where.status = { in: statuses as StatusContract[] };
      }
    }

    // Date range filter
    if (query?.startDate || query?.endDate) {
      where.deliveryDate = {};
      if (query.startDate) {
        where.deliveryDate.gte = query.startDate;
      }
      if (query.endDate) {
        where.deliveryDate.lte = query.endDate;
      }
    }

    // Filter exclude invoiced (kontrak yang sudah ada invoice aktif / lunas)
    if (query?.excludeInvoiced) {
      where.paymentStatus = {
        not: "PAID",
      };
      where.NOT = [
        {
          status: "COMPLETED",
          paymentMethod: "LUNAS_AWAL",
        },
        {
          paymentMethod: { not: "SEBAGIAN" },
          invoices: {
            some: {
              status: { not: "CANCELLED" },
            },
          },
        },
      ];
    }

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const [contracts, total] = await Promise.all([
      db.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: {
            select: {
              id: true,
              code: true,
              name: true,
              contactPerson: true,
              phone: true,
              taxStatus: true,
            },
          },
          contractItems: {
            where: query?.materialId
              ? {
                  materialId: query.materialId,
                }
              : undefined,
            include: {
              material: {
                include: {
                  satuan: true,
                },
              },
            },
          },
          invoices: {
            where: { status: { not: "CANCELLED" } },
            select: {
              id: true,
              nomorInvoice: true,
              status: true,
              totalBerat: true,
            },
          },
        },
      }),
      db.contract.count({ where }),
    ]);

    const data = contracts.map((contract) => {
      const totalContractQuantity = contract.contractItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      const totalInvoicedQuantity = contract.invoices?.reduce(
        (sum, inv) => sum + (inv.totalBerat || 0),
        0
      ) || 0;
      const remainingInvoiceQuantity = Math.max(0, totalContractQuantity - totalInvoicedQuantity);
      const hasActiveInvoice = (contract.invoices?.length || 0) > 0;
      const isFullyInvoiced =
        (hasActiveInvoice && remainingInvoiceQuantity <= 0) ||
        contract.paymentStatus === "PAID";

      return {
        ...contract,
        hasActiveInvoice,
        isFullyInvoiced,
        remainingInvoiceQuantity,
        totalInvoicedQuantity,
        contractItems: contract.contractItems.map((item) => ({
          ...item,
          remainingQuantity: Math.max(0, item.quantity - item.deliveredQuantity),
        })),
      };
    });

    const filteredData = query?.excludeInvoiced
      ? data.filter((contract) => {
          if (contract.paymentStatus === "PAID") return false;
          if (contract.isFullyInvoiced || contract.remainingInvoiceQuantity <= 0) return false;
          if (contract.hasActiveInvoice && contract.paymentMethod !== "SEBAGIAN") return false;
          if (contract.status === "COMPLETED" && contract.paymentMethod === "LUNAS_AWAL") return false;
          return true;
        })
      : data;

    return {
      data: filteredData,
      pagination: {
        page,
        limit,
        total: query?.excludeInvoiced ? filteredData.length : total,
        totalPages: Math.ceil((query?.excludeInvoiced ? filteredData.length : total) / limit),
      },
    };
  }

  /**
   * Get contract by id
   */
  async findById(id: string, companyId: string) {
    return db.contract.findFirst({
      where: {
        id,
        buyer: {
          companyId,
        },
      },
      include: {
        buyer: true,
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
                kategori: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get contract by contract number
   */
  async findByContractNumber(contractNumber: string, companyId: string) {
    return db.contract.findFirst({
      where: {
        contractNumber,
        buyer: {
          companyId,
        },
      },
    });
  }

  /**
   * Check if contract number exists
   */
  async isContractNumberExists(
    contractNumber: string,
    companyId: string,
    excludeId?: string
  ) {
    const where: Prisma.ContractWhereInput = {
      contractNumber,
      buyer: {
        companyId,
      },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const contract = await db.contract.findFirst({ where });
    return !!contract;
  }

  /**
   * Calculate tax amount based on tax status
   */
  calculateTaxAmount(subtotal: number, taxStatus: TaxStatus): number {
    switch (taxStatus) {
      case "PKP_11":
        return subtotal * 0.11; // 11% tax
      case "PKP_1_1":
        return subtotal * 0.011; // 1.1% tax
      case "NON_PKP":
      default:
        return 0; // No tax
    }
  }

  /**
   * Create new contract with items
   */
  async create(companyId: string, data: CreateContractInput) {
    // Get buyer for tax calculation
    const buyer = await db.buyer.findUnique({
      where: { id: data.buyerId },
      select: { taxStatus: true, companyId: true },
    });

    if (!buyer || buyer.companyId !== companyId) {
      throw new Error("Buyer tidak ditemukan atau tidak sesuai dengan company");
    }

    // Calculate totals
    let subtotal = 0;
    const items = data.items.map((item) => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      return {
        ...item,
        totalPrice,
      };
    });

    const taxAmount = this.calculateTaxAmount(subtotal, buyer.taxStatus);
    const totalAmount = subtotal + taxAmount;

    // Generate contract number (gunakan dari input jika ada, atau auto-generate)
    const contractNumber = data.contractNumber || await this.generateContractNumber(companyId);

    // Cek apakah contractNumber sudah ada
    const existingContract = await this.isContractNumberExists(contractNumber, companyId);
    if (existingContract) {
      throw new Error(`Nomor kontrak "${contractNumber}" sudah digunakan`);
    }

    // Determine payment status based on payment method
    const paymentMethod = data.paymentMethod || "SETELAH_PENGIRIMAN";
    const paidAmount = data.paidAmount || 0;
    let paymentStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
    let paymentDate: Date | null = null;

    if (paymentMethod === "LUNAS_AWAL") {
      // Lunas di awal: status kontrak langsung PAID
      paymentStatus = "PAID";
      paymentDate = new Date();
    } else if (paymentMethod === "SEBAGIAN" && paidAmount > 0) {
      // Pembayaran sebagian: status PARTIAL
      paymentStatus = paidAmount >= totalAmount ? "PAID" : "PARTIAL";
      paymentDate = new Date();
    }

    // Create contract with items
    return db.contract.create({
      data: {
        companyId,
        buyerId: data.buyerId,
        contractNumber,
        contractDate: data.contractDate,
        startDate: data.startDate,
        endDate: data.endDate,
        deliveryDate: data.deliveryDate,
        deliveryAddress: data.deliveryAddress,
        subtotal,
        taxAmount,
        totalAmount,
        status: data.status || "DRAFT",
        paymentMethod,
        paymentStatus,
        paidAmount,
        paymentDate,
        notes: data.notes,
        customFields: data.customFields as any,
        contractItems: {
          create: items,
        },
      } as any,
      include: {
        buyer: true,
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update contract
   */
  async update(id: string, companyId: string, data: UpdateContractInput) {
    // Get existing contract
    const existingContract = await this.findById(id, companyId);
    if (!existingContract) {
      throw new Error("Kontrak tidak ditemukan");
    }

    // Get buyer (use existing or new buyerId)
    const buyerId = data.buyerId || existingContract.buyerId;
    const buyer = await db.buyer.findUnique({
      where: { id: buyerId },
      select: { taxStatus: true },
    });

    if (!buyer) {
      throw new Error("Buyer tidak ditemukan");
    }

    return db.$transaction(async (tx) => {
      const updateData: any = {
        ...data,
        items: undefined,
      };

      if (data.items) {
        const existingItems = await tx.contractItem.findMany({
          where: { contractId: id },
          orderBy: { createdAt: "asc" },
        });

        const existingItemMap = new Map(
          existingItems.map((item) => [item.id, item])
        );
        const incomingExistingIds = new Set(
          data.items
            .map((item) => item.contractItemId)
            .filter((itemId): itemId is string => Boolean(itemId))
        );

        let subtotal = 0;

        for (const item of data.items) {
          const totalPrice = item.quantity * item.unitPrice;
          subtotal += totalPrice;

          if (!item.contractItemId) {
            continue;
          }

          const existingItem = existingItemMap.get(item.contractItemId);
          if (!existingItem) {
            throw new Error("Item kontrak tidak ditemukan");
          }

          if (
            existingItem.deliveredQuantity > 0 &&
            existingItem.materialId !== item.materialId
          ) {
            throw new Error(
              "Material pada item kontrak yang sudah punya pengiriman tidak bisa diubah"
            );
          }

          if (item.quantity < existingItem.deliveredQuantity) {
            throw new Error(
              `Kuantitas item kontrak tidak boleh lebih kecil dari yang sudah terkirim (${existingItem.deliveredQuantity.toLocaleString("id-ID")} kg)`
            );
          }
        }

        const itemsToDelete = existingItems.filter(
          (item) => !incomingExistingIds.has(item.id)
        );

        const usedDeletedItem = itemsToDelete.find(
          (item) => item.deliveredQuantity > 0
        );

        if (usedDeletedItem) {
          throw new Error(
            "Item kontrak yang sudah dipakai pengiriman tidak bisa dihapus"
          );
        }

        const taxAmount = this.calculateTaxAmount(subtotal, buyer.taxStatus);
        const totalAmount = subtotal + taxAmount;

        updateData.subtotal = subtotal;
        updateData.taxAmount = taxAmount;
        updateData.totalAmount = totalAmount;

        const effectivePaymentMethod =
          data.paymentMethod ?? existingContract.paymentMethod;
        const effectivePaidAmount =
          data.paidAmount ?? existingContract.paidAmount;

        updateData.paymentStatus =
          effectivePaymentMethod === "LUNAS_AWAL"
            ? "PAID"
            : effectivePaymentMethod === "SEBAGIAN" && effectivePaidAmount > 0
              ? effectivePaidAmount >= totalAmount
                ? "PAID"
                : "PARTIAL"
              : "UNPAID";

        updateData.paymentDate =
          updateData.paymentStatus === "UNPAID"
            ? null
            : existingContract.paymentDate ?? new Date();

        for (const item of data.items) {
          const totalPrice = item.quantity * item.unitPrice;

          if (item.contractItemId) {
            await tx.contractItem.update({
              where: { id: item.contractItemId },
              data: {
                materialId: item.materialId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice,
                notes: item.notes,
              },
            });
            continue;
          }

          await tx.contractItem.create({
            data: {
              contractId: id,
              materialId: item.materialId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice,
              notes: item.notes,
            },
          });
        }

        if (itemsToDelete.length > 0) {
          await tx.contractItem.deleteMany({
            where: {
              id: {
                in: itemsToDelete.map((item) => item.id),
              },
            },
          });
        }
      }

      return tx.contract.update({
        where: { id },
        data: updateData,
        include: {
          buyer: true,
          contractItems: {
            include: {
              material: {
                include: {
                  satuan: true,
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Delete contract
   */
  async delete(id: string, companyId: string) {
    // Verify contract belongs to company
    const contract = await this.findById(id, companyId);
    if (!contract) {
      throw new Error("Kontrak tidak ditemukan");
    }

    return db.contract.delete({
      where: { id },
    });
  }

  /**
   * Update contract status
   */
  async updateStatus(id: string, companyId: string, status: StatusContract) {
    return db.contract.update({
      where: {
        id,
        buyer: {
          companyId,
        },
      },
      data: { status },
    });
  }

  /**
   * Generate contract number
   */
  async generateContractNumber(companyId: string): Promise<string> {
    const lastContract = await db.contract.findFirst({
      where: {
        buyer: {
          companyId,
        },
      },
      orderBy: { createdAt: "desc" },
      select: { contractNumber: true },
    });

    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    if (!lastContract) {
      return `CTR/${year}${month}/0001`;
    }

    // Extract number from contract number (e.g., "CTR/202411/0001" -> 1)
    const match = lastContract.contractNumber.match(/CTR\/\d{6}\/(\d+)/);
    if (match) {
      const lastNumber = parseInt(match[1]!, 10);
      const nextNumber = lastNumber + 1;
      return `CTR/${year}${month}/${nextNumber.toString().padStart(4, "0")}`;
    }

    return `CTR/${year}${month}/0001`;
  }

  /**
   * Get contracts by buyer
   */
  async findByBuyerId(buyerId: string, companyId: string) {
    return db.contract.findMany({
      where: {
        buyerId,
        buyer: {
          companyId,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update contract attachments
   */
  async updateAttachments(id: string, companyId: string, attachments: any[]) {
    return db.contract.update({
      where: {
        id,
        buyer: {
          companyId,
        },
      },
      data: {
        attachments: attachments as any,
      },
    });
  }
}

export const contractRepository = new ContractRepository();
