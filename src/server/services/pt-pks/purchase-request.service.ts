import { purchaseRequestRepository } from "../../repositories/purchase-request.repository";
import { storeRequestRepository } from "../../repositories/store-request.repository";
import { materialInventarisRepository } from "../../repositories/material-inventaris.repository";
import { notificationService } from "./notification.service";
import type { PurchaseRequestInput, UpdatePurchaseRequestInput } from "../../schema/purchase-request";
import { StatusPurchaseRequest, StatusStoreRequest, TipePembelianPR, NotificationType } from "@prisma/client";

export const purchaseRequestService = {
  async getAll(companyId: string, filters?: {
    status?: StatusPurchaseRequest;
    tipePembelian?: TipePembelianPR;
    startDate?: Date;
    endDate?: Date;
  }) {
    return purchaseRequestRepository.findAll(companyId, filters);
  },

  async getById(id: string, companyId: string) {
    const pr = await purchaseRequestRepository.findById(id, companyId);
    if (!pr) {
      throw new Error("Purchase Request tidak ditemukan");
    }
    return pr;
  },

  async create(companyId: string, data: PurchaseRequestInput) {
    // Validate materials
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
    }

    // Validate vendor info for direct purchase
    if (data.tipePembelian === "PEMBELIAN_LANGSUNG" && !data.vendorNameDirect) {
      throw new Error("Nama vendor wajib diisi untuk pembelian langsung");
    }

    // If linked to SR, validate SR status
    if (data.storeRequestId) {
      const sr = await storeRequestRepository.findById(data.storeRequestId, companyId);
      if (!sr) {
        throw new Error("Store Request tidak ditemukan");
      }
      if (sr.status !== StatusStoreRequest.NEED_PR) {
        throw new Error("Store Request harus memiliki status NEED_PR");
      }
    }

    // Generate nomor PR
    const nomorPR = await purchaseRequestRepository.generateNomorPR(companyId);

    return purchaseRequestRepository.create(companyId, nomorPR, data);
  },

  async update(id: string, companyId: string, data: UpdatePurchaseRequestInput) {
    const pr = await this.getById(id, companyId);
    const editableStatuses = new Set<StatusPurchaseRequest>([
      StatusPurchaseRequest.DRAFT,
      StatusPurchaseRequest.PENDING,
      StatusPurchaseRequest.APPROVED,
    ]);

    if (!editableStatuses.has(pr.status)) {
      throw new Error("Purchase Request tidak dapat diubah pada status saat ini");
    }

    if (pr.purchaseOrders.length > 0) {
      throw new Error("Purchase Request tidak dapat diubah karena sudah digunakan dalam Purchase Order");
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

    const nextPurchaseType = data.tipePembelian ?? pr.tipePembelian;
    const nextVendorName = data.vendorNameDirect ?? pr.vendorNameDirect;

    if (nextPurchaseType === "PEMBELIAN_LANGSUNG" && !nextVendorName) {
      throw new Error("Nama vendor wajib diisi untuk pembelian langsung");
    }

    return purchaseRequestRepository.update(id, companyId, data);
  },

  async submit(id: string, companyId: string) {
    const pr = await this.getById(id, companyId);
    if (pr.status !== StatusPurchaseRequest.DRAFT) {
      throw new Error("Purchase Request tidak dapat disubmit");
    }

    const updatedPR = await purchaseRequestRepository.updateStatus(id, companyId, StatusPurchaseRequest.PENDING);

    // Trigger notification to all users with approve permission for Purchase Request
    try {
      await notificationService.notifyApprovers(
        companyId,
        "gudang",
        "purchaseRequest",
        NotificationType.PR_PENDING_APPROVAL,
        id,
        `/dashboard/pt-pks/gudang/purchase-request?id=${id}`,
        `PR ${updatedPR.nomorPR} Menunggu Approval`,
        `Purchase Request ${updatedPR.nomorPR} membutuhkan persetujuan Anda`
      );
    } catch (notifError) {
      // Log error but don't fail the submit operation
      console.error("Failed to send notifications:", notifError);
    }

    return updatedPR;
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    const pr = await this.getById(id, companyId);
    if (pr.status !== StatusPurchaseRequest.PENDING) {
      throw new Error("Purchase Request tidak dapat diapprove");
    }

    return purchaseRequestRepository.approve(id, companyId, approvedBy);
  },

  async reject(id: string, companyId: string) {
    const pr = await this.getById(id, companyId);
    if (pr.status !== StatusPurchaseRequest.PENDING) {
      throw new Error("Purchase Request tidak dapat direject");
    }

    return purchaseRequestRepository.reject(id, companyId);
  },

  async delete(id: string, companyId: string) {
    const pr = await this.getById(id, companyId);
    if (pr.status !== StatusPurchaseRequest.DRAFT) {
      throw new Error("Hanya Purchase Request dengan status DRAFT yang dapat dihapus");
    }

    return purchaseRequestRepository.delete(id, companyId);
  },

  // Get approved PRs untuk dijadikan referensi PO
  async getApprovedForPO(companyId: string) {
    return purchaseRequestRepository.findApprovedForPO(companyId);
  },

  // Get approved PRs untuk pembelian langsung (siap penerimaan barang)
  async getApprovedDirectPurchase(companyId: string) {
    return purchaseRequestRepository.findApprovedDirectPurchase(companyId);
  },
};
