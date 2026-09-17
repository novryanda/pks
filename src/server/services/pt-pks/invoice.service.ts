import { db } from "@/server/db";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  PembayaranInvoiceInput,
  InvoiceQueryInput,
} from "@/server/schema/invoice";

export class InvoiceService {
  /**
   * Generate nomor invoice
   */
  async generateNomorInvoice(companyId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Get last invoice number of this month
    const lastInvoice = await db.invoice.findFirst({
      where: {
        companyId,
        nomorInvoice: {
          startsWith: `INV/${year}/${month}/`,
        },
      },
      orderBy: {
        nomorInvoice: "desc",
      },
    });

    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.nomorInvoice.split("/");
      const lastSequence = parseInt(parts[3] || "0");
      sequence = lastSequence + 1;
    }

    return `INV/${year}/${month}/${String(sequence).padStart(4, "0")}`;
  }

  /**
   * Get next invoice number for preview / editable default
   */
  async getNextNomorInvoice(companyId: string): Promise<string> {
    return this.generateNomorInvoice(companyId);
  }

  /**
   * Get all invoices for a company with pagination and filters
   */
  async getInvoices(companyId: string, query?: InvoiceQueryInput) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
    };

    if (query?.search) {
      where.OR = [
        { nomorInvoice: { contains: query.search, mode: "insensitive" } },
        { buyer: { name: { contains: query.search, mode: "insensitive" } } },
        { contract: { contractNumber: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    if (query?.contractId) {
      where.contractId = query.contractId;
    }

    if (query?.buyerId) {
      where.buyerId = query.buyerId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.startDate || query?.endDate) {
      where.tanggalInvoice = {};
      if (query?.startDate) {
        where.tanggalInvoice.gte = query.startDate;
      }
      if (query?.endDate) {
        where.tanggalInvoice.lte = query.endDate;
      }
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggalInvoice: "desc" },
        include: {
          buyer: true,
          contract: {
            include: {
              contractItems: {
                include: {
                  material: {
                    include: { satuan: true },
                  },
                },
              },
              invoices: {
                where: { status: { not: "CANCELLED" } },
                select: { id: true, totalBerat: true },
              },
            },
          },
          invoiceItems: {
            include: {
              pengirimanProduct: {
                include: {
                  vendorVehicle: {
                    include: {
                      vendor: true,
                    },
                  },
                },
              },
            },
          },
          pembayaranInvoice: true,
        },
      }),
      db.invoice.count({ where }),
    ]);

    // Calculate contract summary for each invoice
    const invoicesWithSummary = invoices.map((invoice) => {
      const totalContractQuantity = invoice.contract.contractItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      const totalInvoicedQuantity = invoice.contract.invoices.reduce(
        (sum, inv) => sum + (inv.totalBerat || 0),
        0
      );
      const remainingContractQuantity = Math.max(0, totalContractQuantity - totalInvoicedQuantity);
      const invoicePercentage = totalContractQuantity > 0
        ? (totalInvoicedQuantity / totalContractQuantity) * 100
        : 0;

      return {
        ...invoice,
        contractSummary: {
          totalContractQuantity,
          totalInvoicedQuantity,
          remainingContractQuantity,
          invoicePercentage,
        },
      };
    });

    return {
      data: invoicesWithSummary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string, companyId: string) {
    const invoice = await db.invoice.findFirst({
      where: { id, companyId },
      include: {
        buyer: true,
        contract: {
          include: {
            contractItems: {
              include: {
                material: true,
              },
            },
          },
        },
        invoiceItems: {
          include: {
            pengirimanProduct: {
              include: {
                vendorVehicle: {
                  include: {
                    vendor: true,
                  },
                },
              },
            },
          },
        },
        pembayaranInvoice: {
          orderBy: { tanggalBayar: "desc" },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice tidak ditemukan");
    }

    return invoice;
  }

  /**
   * Get pengiriman yang belum di-invoice untuk kontrak tertentu
   */
  async getPengirimanBelumInvoice(contractId: string, companyId: string) {
    const pengiriman = await db.pengirimanProduct.findMany({
      where: {
        companyId,
        contractId,
        status: "COMPLETED",
        invoiceItem: null, // Belum ada invoice
      },
      include: {
        material: true,
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
        contractItem: {
          include: {
            material: true,
          },
        },
      },
      orderBy: { tanggalPengiriman: "asc" },
    });

    return pengiriman;
  }

  /**
   * Get contract invoice summary - shows how much quantity has been invoiced and remaining
   */
  async getContractInvoiceSummary(contractId: string, companyId: string) {
    const contract = await db.contract.findFirst({
      where: { id: contractId, companyId },
      include: {
        buyer: true,
        contractItems: {
          include: {
            material: {
              include: { satuan: true },
            },
          },
        },
        invoices: {
          where: { status: { not: "CANCELLED" } },
          select: {
            id: true,
            nomorInvoice: true,
            tanggalInvoice: true,
            status: true,
            totalBerat: true,
            totalNilai: true,
            totalDibayar: true,
            sisaPembayaran: true,
          },
          orderBy: { tanggalInvoice: "desc" },
        },
      },
    });

    if (!contract) {
      throw new Error("Kontrak tidak ditemukan");
    }

    // Calculate total contract quantity (kg)
    const totalContractQuantity = contract.contractItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    // Calculate total invoiced quantity (kg)
    const totalInvoicedQuantity = contract.invoices.reduce(
      (sum, inv) => sum + (inv.totalBerat || 0),
      0
    );

    // Calculate remaining quantity
    const remainingQuantity = Math.max(0, totalContractQuantity - totalInvoicedQuantity);

    // Calculate invoice percentage
    const invoicePercentage = totalContractQuantity > 0
      ? (totalInvoicedQuantity / totalContractQuantity) * 100
      : 0;

    // Calculate total invoice value and payments
    const totalInvoiceValue = contract.invoices.reduce(
      (sum, inv) => sum + (inv.totalNilai || 0),
      0
    );
    const totalPaid = contract.invoices.reduce(
      (sum, inv) => sum + (inv.totalDibayar || 0),
      0
    );

    return {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      buyer: {
        id: contract.buyer.id,
        name: contract.buyer.name,
        code: contract.buyer.code,
      },
      contractItems: contract.contractItems.map((item) => ({
        id: item.id,
        materialName: item.material.name,
        materialCode: item.material.code,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        satuan: item.material.satuan,
      })),
      // Summary
      totalContractQuantity,
      totalInvoicedQuantity,
      remainingQuantity,
      invoicePercentage,
      totalInvoiceValue,
      totalPaid,
      // Invoice list
      invoices: contract.invoices,
      // Status
      isFullyInvoiced: remainingQuantity <= 0,
      canCreateInvoice: remainingQuantity > 0,
    };
  }

  /**
   * Get contracts yang memiliki pengiriman belum di-invoice
   */
  async getContractsWithPendingInvoice(companyId: string) {
    // Get all completed pengiriman that have not been invoiced
    const pengirimanBelumInvoice = await db.pengirimanProduct.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        contractId: { not: null },
        invoiceItem: null,
      },
      select: {
        contractId: true,
      },
      distinct: ["contractId"],
    });

    if (pengirimanBelumInvoice.length === 0) {
      return [];
    }

    const contractIds = pengirimanBelumInvoice
      .map((p) => p.contractId)
      .filter((id): id is string => id !== null);

    const contracts = await db.contract.findMany({
      where: {
        id: { in: contractIds },
        companyId,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
      include: {
        buyer: true,
        contractItems: {
          include: {
            material: true,
          },
        },
        pengirimanProduct: {
          where: {
            status: "COMPLETED",
            invoiceItem: null,
          },
          include: {
            vendorVehicle: {
              include: {
                vendor: true,
              },
            },
          },
        },
      },
      orderBy: { contractDate: "desc" },
    });

    return contracts;
  }

  /**
   * Create new invoice
   */
  async createInvoice(companyId: string, data: CreateInvoiceInput, createdBy: string) {
    // Determine nomor invoice (custom or auto-generated)
    let nomorInvoice = data.nomorInvoice?.trim();
    if (nomorInvoice) {
      const existingWithNumber = await db.invoice.findFirst({
        where: { companyId, nomorInvoice },
      });
      if (existingWithNumber) {
        throw new Error(`Nomor invoice ${nomorInvoice} sudah digunakan`);
      }
    } else {
      nomorInvoice = await this.generateNomorInvoice(companyId);
    }

    // Validate contract
    const contract = await db.contract.findFirst({
      where: { id: data.contractId, companyId },
      include: {
        buyer: true,
        contractItems: {
          include: { material: true },
        },
        invoices: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true, status: true, totalNilai: true, totalDibayar: true, totalBerat: true },
        },
      },
    });

    if (!contract) {
      throw new Error("Kontrak tidak ditemukan");
    }

    // Calculate total contract quantity (kg) from all items
    const totalContractQuantity = contract.contractItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    // Calculate total invoiced quantity (kg)
    const totalInvoicedQuantity = contract.invoices.reduce(
      (sum, inv) => sum + (inv.totalBerat || 0),
      0
    );

    // Check if remaining quantity is sufficient for this invoice
    const remainingQuantity = totalContractQuantity - totalInvoicedQuantity;
    const requestedQuantity = data.totalBerat || 0;

    if (requestedQuantity > remainingQuantity && remainingQuantity > 0) {
      throw new Error(
        `Kuantitas invoice (${requestedQuantity.toLocaleString("id-ID")} kg) melebihi sisa kuantitas kontrak (${remainingQuantity.toLocaleString("id-ID")} kg). ` +
        `Total kontrak: ${totalContractQuantity.toLocaleString("id-ID")} kg, sudah diinvoice: ${totalInvoicedQuantity.toLocaleString("id-ID")} kg.`
      );
    }

    // If remaining quantity is 0, no more invoices can be created
    if (remainingQuantity <= 0) {
      throw new Error(
        `Kontrak sudah dibuatkan invoice penuh. Total kontrak: ${totalContractQuantity.toLocaleString("id-ID")} kg, ` +
        `sudah diinvoice: ${totalInvoicedQuantity.toLocaleString("id-ID")} kg.`
      );
    }

    // Only validate pengiriman if items are provided
    if (data.items && data.items.length > 0) {
      // Validate that all pengiriman in items belong to this contract and not invoiced yet
      const pengirimanIds = data.items.map((item) => item.pengirimanProductId);
      const pengirimanList = await db.pengirimanProduct.findMany({
        where: {
          id: { in: pengirimanIds },
          companyId,
          contractId: data.contractId,
          status: "COMPLETED",
        },
        include: {
          invoiceItem: true,
        },
      });

      if (pengirimanList.length !== pengirimanIds.length) {
        throw new Error("Beberapa pengiriman tidak valid atau bukan milik kontrak ini");
      }

      // Check if any pengiriman already invoiced
      const alreadyInvoiced = pengirimanList.filter((p) => p.invoiceItem !== null);
      if (alreadyInvoiced.length > 0) {
        throw new Error(
          `Pengiriman berikut sudah di-invoice: ${alreadyInvoiced.map((p) => p.nomorPengiriman).join(", ")}`
        );
      }
    }

    // Calculate totals - use provided values or calculate from items
    const totalBerat = data.totalBerat || data.items.reduce((sum, item) => sum + item.beratNetto, 0);
    const hargaPerKg = data.hargaPerKg || contract.contractItems[0]?.unitPrice || 0;
    const subtotalBruto = data.subtotalBruto || totalBerat * hargaPerKg;

    // Calculate claims - use direct values if provided, otherwise calculate from percent
    // User now inputs in kg, which is already converted to values in the form
    const klaimMutuNilai = data.klaimMutuNilai || (subtotalBruto * data.klaimMutuPersen) / 100;
    const klaimSusutNilai = data.klaimSusutNilai || (subtotalBruto * data.klaimSusutPersen) / 100;
    const totalPotongan = klaimMutuNilai + klaimSusutNilai;
    const subtotalNetto = data.subtotalNetto || (subtotalBruto - totalPotongan);

    // Calculate taxes
    let ppnPersen = data.ppnPersen;
    if (!ppnPersen && contract.buyer.taxStatus) {
      if (contract.buyer.taxStatus === "PKP_11") {
        ppnPersen = 11;
      } else if (contract.buyer.taxStatus === "PKP_1_1") {
        ppnPersen = 1.1;
      }
    }
    const ppnNilai = (subtotalNetto * (ppnPersen || 0)) / 100;
    const pphNilai = (subtotalNetto * (data.pphPersen || 0)) / 100;
    const totalNilai = subtotalNetto + ppnNilai - pphNilai;

    // Prepare invoice items if provided
    const invoiceItemsData = data.items && data.items.length > 0
      ? {
        create: data.items.map((item) => ({
          pengirimanProductId: item.pengirimanProductId,
          nomorPengiriman: item.nomorPengiriman,
          tanggalPengiriman: item.tanggalPengiriman,
          beratNetto: item.beratNetto,
          ffa: item.ffa,
          air: item.air,
          kotoran: item.kotoran,
          hargaSatuan: hargaPerKg,
          subtotal: item.beratNetto * hargaPerKg,
          klaimMutuPersen: item.klaimMutuPersen || 0,
          klaimMutuNilai: item.klaimMutuNilai || 0,
          klaimSusutPersen: item.klaimSusutPersen || 0,
          klaimSusutNilai: item.klaimSusutNilai || 0,
          totalPotongan: (item.klaimMutuNilai || 0) + (item.klaimSusutNilai || 0),
          totalBersih:
            item.beratNetto * hargaPerKg -
            ((item.klaimMutuNilai || 0) + (item.klaimSusutNilai || 0)),
          keterangan: item.keterangan,
        })),
      }
      : undefined;

    // Create invoice with items
    const invoice = await db.invoice.create({
      data: {
        companyId,
        nomorInvoice,
        tanggalInvoice: data.tanggalInvoice,
        tanggalJatuhTempo: null, // Point 4: dinonaktifkan
        contractId: data.contractId,
        buyerId: data.buyerId,
        totalBerat,
        hargaPerKg,
        subtotalBruto,
        klaimMutuPersen: data.klaimMutuPersen,
        klaimMutuNilai,
        klaimMutuKeterangan: data.klaimMutuKeterangan,
        klaimSusutPersen: data.klaimSusutPersen,
        klaimSusutNilai,
        klaimSusutKeterangan: data.klaimSusutKeterangan,
        totalPotongan,
        subtotalNetto,
        ppnPersen: ppnPersen || 0,
        ppnNilai,
        pphPersen: data.pphPersen || 0,
        pphNilai,
        totalNilai,
        sisaPembayaran: totalNilai,
        catatan: data.catatan,
        showPpnDisclaimer: data.showPpnDisclaimer || false,
        namaPenandatangan: data.namaPenandatangan || "TARA MIFTAHUR",
        jabatanPenandatangan: data.jabatanPenandatangan || "Direktur",
        status: "DRAFT",
        createdBy,
        ...(invoiceItemsData && { invoiceItems: invoiceItemsData }),
      },
      include: {
        buyer: true,
        contract: true,
        invoiceItems: {
          include: {
            pengirimanProduct: true,
          },
        },
      },
    });

    return invoice;
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, companyId: string, data: UpdateInvoiceInput) {
    const existing = await db.invoice.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new Error("Invoice tidak ditemukan");
    }

    if (existing.status !== "DRAFT") {
      throw new Error("Hanya invoice dengan status DRAFT yang dapat diubah");
    }

    // Check nomorInvoice uniqueness if changed
    let nomorInvoice = existing.nomorInvoice;
    if (data.nomorInvoice && data.nomorInvoice.trim() !== existing.nomorInvoice) {
      const trimmedNomor = data.nomorInvoice.trim();
      const duplicate = await db.invoice.findFirst({
        where: {
          companyId,
          nomorInvoice: trimmedNomor,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new Error(`Nomor invoice ${trimmedNomor} sudah digunakan`);
      }
      nomorInvoice = trimmedNomor;
    }

    // Base values
    const totalBerat = data.totalBerat !== undefined ? data.totalBerat : existing.totalBerat;
    const hargaPerKg = data.hargaPerKg !== undefined ? data.hargaPerKg : existing.hargaPerKg;
    const subtotalBruto = totalBerat * hargaPerKg;

    // Claims: either direct value or from percent
    let klaimMutuNilai = existing.klaimMutuNilai;
    let klaimMutuPersen = existing.klaimMutuPersen;
    if (data.klaimMutuNilai !== undefined) {
      klaimMutuNilai = data.klaimMutuNilai;
      klaimMutuPersen = data.klaimMutuPersen !== undefined ? data.klaimMutuPersen : existing.klaimMutuPersen;
    } else if (data.klaimMutuPersen !== undefined) {
      klaimMutuPersen = data.klaimMutuPersen;
      klaimMutuNilai = (subtotalBruto * klaimMutuPersen) / 100;
    }

    let klaimSusutNilai = existing.klaimSusutNilai;
    let klaimSusutPersen = existing.klaimSusutPersen;
    if (data.klaimSusutNilai !== undefined) {
      klaimSusutNilai = data.klaimSusutNilai;
      klaimSusutPersen = data.klaimSusutPersen !== undefined ? data.klaimSusutPersen : existing.klaimSusutPersen;
    } else if (data.klaimSusutPersen !== undefined) {
      klaimSusutPersen = data.klaimSusutPersen;
      klaimSusutNilai = (subtotalBruto * klaimSusutPersen) / 100;
    }

    const totalPotongan = klaimMutuNilai + klaimSusutNilai;
    const subtotalNetto = subtotalBruto - totalPotongan;

    const ppnPersen = data.ppnPersen !== undefined ? data.ppnPersen : existing.ppnPersen;
    const pphPersen = data.pphPersen !== undefined ? data.pphPersen : existing.pphPersen;
    const ppnNilai = (subtotalNetto * ppnPersen) / 100;
    const pphNilai = (subtotalNetto * pphPersen) / 100;
    const totalNilai = subtotalNetto + ppnNilai - pphNilai;

    const updateData: any = {
      nomorInvoice,
      tanggalInvoice: data.tanggalInvoice ?? existing.tanggalInvoice,
      tanggalJatuhTempo: null,
      totalBerat,
      hargaPerKg,
      subtotalBruto,
      klaimMutuPersen,
      klaimMutuNilai,
      klaimMutuKeterangan: data.klaimMutuKeterangan !== undefined ? data.klaimMutuKeterangan : existing.klaimMutuKeterangan,
      klaimSusutPersen,
      klaimSusutNilai,
      klaimSusutKeterangan: data.klaimSusutKeterangan !== undefined ? data.klaimSusutKeterangan : existing.klaimSusutKeterangan,
      totalPotongan,
      subtotalNetto,
      ppnPersen,
      ppnNilai,
      pphPersen,
      pphNilai,
      totalNilai,
      sisaPembayaran: totalNilai - existing.totalDibayar,
      catatan: data.catatan !== undefined ? data.catatan : existing.catatan,
      showPpnDisclaimer: data.showPpnDisclaimer !== undefined ? data.showPpnDisclaimer : existing.showPpnDisclaimer,
      namaPenandatangan: data.namaPenandatangan !== undefined ? data.namaPenandatangan : existing.namaPenandatangan,
      jabatanPenandatangan: data.jabatanPenandatangan !== undefined ? data.jabatanPenandatangan : existing.jabatanPenandatangan,
    };

    if (data.status) {
      updateData.status = data.status;
    }

    return db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        buyer: true,
        contract: true,
        invoiceItems: {
          include: {
            pengirimanProduct: true,
          },
        },
      },
    });
  }

  /**
   * Issue (terbitkan) invoice
   * For LUNAS_AWAL contracts, this automatically records payment as PAID
   */
  async issueInvoice(id: string, companyId: string, issuedBy: string) {
    const invoice = await db.invoice.findFirst({
      where: { id, companyId },
      include: {
        contract: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice tidak ditemukan");
    }

    if (invoice.status !== "DRAFT") {
      throw new Error("Hanya invoice dengan status DRAFT yang dapat diterbitkan");
    }

    // Check contract payment method
    const paymentMethod = invoice.contract?.paymentMethod;

    // For LUNAS_AWAL, automatically mark as PAID when invoice is issued (printed)
    if (paymentMethod === "LUNAS_AWAL") {
      const updatedInvoice = await db.invoice.update({
        where: { id },
        data: {
          status: "PAID",
          issuedBy,
          tanggalIssued: new Date(),
          totalDibayar: invoice.totalNilai,
          sisaPembayaran: 0,
        },
        include: {
          buyer: true,
          contract: true,
          invoiceItems: {
            include: {
              pengirimanProduct: true,
            },
          },
        },
      });

      // Auto-create pembayaran record for LUNAS_AWAL
      await db.pembayaranInvoice.create({
        data: {
          invoiceId: id,
          tanggalBayar: new Date(),
          jumlahBayar: invoice.totalNilai,
          metodePembayaran: "LUNAS_AWAL",
          keterangan: "Pembayaran otomatis - Kontrak Lunas Awal",
          diterimaOleh: issuedBy,
        },
      });

      // Update contract payment status based on total paid vs total amount
      if (invoice.contractId) {
        const updatedContract = await db.contract.update({
          where: { id: invoice.contractId },
          data: {
            paidAmount: { increment: invoice.totalNilai },
          },
          select: { id: true, totalAmount: true, paidAmount: true }
        });

        const isFullyPaid = updatedContract.paidAmount >= updatedContract.totalAmount;

        await db.contract.update({
          where: { id: invoice.contractId },
          data: {
            paymentStatus: isFullyPaid ? "PAID" : "PARTIAL",
            ...(isFullyPaid && { paymentDate: new Date() }),
          },
        });
      }

      return updatedInvoice;
    }

    // For SEBAGIAN or SETELAH_PENGIRIMAN, just issue the invoice
    return db.invoice.update({
      where: { id },
      data: {
        status: "ISSUED",
        issuedBy,
        tanggalIssued: new Date(),
      },
      include: {
        buyer: true,
        contract: true,
        invoiceItems: {
          include: {
            pengirimanProduct: true,
          },
        },
      },
    });
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(id: string, companyId: string) {
    const invoice = await db.invoice.findFirst({
      where: { id, companyId },
    });

    if (!invoice) {
      throw new Error("Invoice tidak ditemukan");
    }

    if (invoice.status === "PAID") {
      throw new Error("Invoice yang sudah lunas tidak dapat dibatalkan");
    }

    if (invoice.totalDibayar > 0) {
      throw new Error("Invoice yang sudah ada pembayaran tidak dapat dibatalkan");
    }

    return db.invoice.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });
  }

  /**
   * Delete invoice (only DRAFT)
   */
  async deleteInvoice(id: string, companyId: string) {
    const invoice = await db.invoice.findFirst({
      where: { id, companyId },
    });

    if (!invoice) {
      throw new Error("Invoice tidak ditemukan");
    }

    if (invoice.status !== "DRAFT") {
      throw new Error("Hanya invoice dengan status DRAFT yang dapat dihapus");
    }

    return db.invoice.delete({
      where: { id },
    });
  }

  /**
   * Add payment to invoice
   * For SEBAGIAN/SETELAH_PENGIRIMAN contracts, this records payments manually
   */
  async addPembayaran(companyId: string, data: PembayaranInvoiceInput, diterimaOleh: string) {
    const invoice = await db.invoice.findFirst({
      where: { id: data.invoiceId, companyId },
      include: {
        contract: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice tidak ditemukan");
    }

    if (invoice.status === "DRAFT") {
      throw new Error("Invoice belum diterbitkan");
    }

    if (invoice.status === "CANCELLED") {
      throw new Error("Invoice sudah dibatalkan");
    }

    if (invoice.status === "PAID") {
      throw new Error("Invoice sudah lunas");
    }

    if (data.jumlahBayar > invoice.sisaPembayaran) {
      throw new Error(`Jumlah bayar melebihi sisa pembayaran (Rp ${invoice.sisaPembayaran.toLocaleString("id-ID")})`);
    }

    // Create pembayaran
    const pembayaran = await db.pembayaranInvoice.create({
      data: {
        invoiceId: data.invoiceId,
        tanggalBayar: data.tanggalBayar,
        jumlahBayar: data.jumlahBayar,
        metodePembayaran: data.metodePembayaran,
        nomorReferensi: data.nomorReferensi,
        keterangan: data.keterangan,
        diterimaOleh,
      },
    });

    // Update invoice
    const newTotalDibayar = invoice.totalDibayar + data.jumlahBayar;
    const newSisaPembayaran = invoice.totalNilai - newTotalDibayar;
    const newStatus = newSisaPembayaran <= 0 ? "PAID" : "PARTIAL_PAID";

    await db.invoice.update({
      where: { id: data.invoiceId },
      data: {
        totalDibayar: newTotalDibayar,
        sisaPembayaran: newSisaPembayaran,
        status: newStatus,
      },
    });

    // Update contract payment status based on total paid vs total amount
    if (invoice.contractId) {
      const updatedContract = await db.contract.update({
        where: { id: invoice.contractId },
        data: {
          paidAmount: { increment: data.jumlahBayar },
        },
        select: { id: true, totalAmount: true, paidAmount: true }
      });

      const isFullyPaid = updatedContract.paidAmount >= updatedContract.totalAmount;

      await db.contract.update({
        where: { id: invoice.contractId },
        data: {
          paymentStatus: isFullyPaid ? "PAID" : "PARTIAL",
          ...(isFullyPaid && { paymentDate: new Date() }),
        },
      });
    }

    return pembayaran;
  }

  /**
   * Get pembayaran history for an invoice
   */
  async getPembayaranByInvoice(invoiceId: string) {
    return db.pembayaranInvoice.findMany({
      where: { invoiceId },
      orderBy: { tanggalBayar: "desc" },
    });
  }

  /**
   * Get invoice statistics
   */
  async getStatistics(companyId: string, filters?: { startDate?: Date; endDate?: Date }) {
    const where: any = { companyId };

    if (filters?.startDate || filters?.endDate) {
      where.tanggalInvoice = {};
      if (filters.startDate) {
        where.tanggalInvoice.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalInvoice.lte = filters.endDate;
      }
    }

    const [
      totalInvoice,
      draftCount,
      issuedCount,
      partialPaidCount,
      paidCount,
      cancelledCount,
      totalNilai,
      totalDibayar,
    ] = await Promise.all([
      db.invoice.count({ where }),
      db.invoice.count({ where: { ...where, status: "DRAFT" } }),
      db.invoice.count({ where: { ...where, status: "ISSUED" } }),
      db.invoice.count({ where: { ...where, status: "PARTIAL_PAID" } }),
      db.invoice.count({ where: { ...where, status: "PAID" } }),
      db.invoice.count({ where: { ...where, status: "CANCELLED" } }),
      db.invoice.aggregate({
        where: { ...where, status: { not: "CANCELLED" } },
        _sum: { totalNilai: true },
      }),
      db.invoice.aggregate({
        where: { ...where, status: { not: "CANCELLED" } },
        _sum: { totalDibayar: true },
      }),
    ]);

    return {
      totalInvoice,
      byStatus: {
        draft: draftCount,
        issued: issuedCount,
        partialPaid: partialPaidCount,
        paid: paidCount,
        cancelled: cancelledCount,
      },
      financial: {
        totalNilai: totalNilai._sum.totalNilai || 0,
        totalDibayar: totalDibayar._sum.totalDibayar || 0,
        sisaPiutang: (totalNilai._sum.totalNilai || 0) - (totalDibayar._sum.totalDibayar || 0),
      },
    };
  }
}

export const invoiceService = new InvoiceService();
