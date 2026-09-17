import { purchaseOrderRepository } from "../../repositories/purchase-order.repository";
import { purchaseRequestRepository } from "../../repositories/purchase-request.repository";
import { materialInventarisRepository } from "../../repositories/material-inventaris.repository";
import type { PurchaseOrderInput, UpdatePurchaseOrderInput } from "../../schema/purchase-order";
import { StatusPurchaseOrder, StatusPurchaseRequest } from "@prisma/client";

export const purchaseOrderService = {
  async getAll(companyId: string, filters?: {
    status?: StatusPurchaseOrder;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return purchaseOrderRepository.findAll(companyId, filters);
  },

  async getById(id: string, companyId: string) {
    const po = await purchaseOrderRepository.findById(id, companyId);
    if (!po) {
      throw new Error("Purchase Order tidak ditemukan");
    }
    return po;
  },

  async create(companyId: string, data: PurchaseOrderInput) {
    // Validate materials
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
      
      // Validate PR Item mappings if provided
      if (item.prItemMappings && item.prItemMappings.length > 0) {
        for (const mapping of item.prItemMappings) {
          const prItem = await purchaseRequestRepository.findItemById(mapping.purchaseRequestItemId);
          if (!prItem) {
            throw new Error(`PR Item dengan ID ${mapping.purchaseRequestItemId} tidak ditemukan`);
          }
          
          // Check if mapping quantity exceeds remaining quantity
          const remaining = prItem.jumlahRequest - prItem.jumlahPOCreated;
          if (mapping.quantity > remaining) {
            throw new Error(
              `Jumlah PO (${mapping.quantity}) melebihi sisa quantity PR (${remaining}) untuk material ${prItem.material.namaMaterial}`
            );
          }
        }
      }
    }

    // If linked to PR, validate PR status (allow APPROVED or PO_CREATED for partial)
    if (data.purchaseRequestId) {
      const pr = await purchaseRequestRepository.findById(data.purchaseRequestId, companyId);
      if (!pr) {
        throw new Error("Purchase Request tidak ditemukan");
      }
      if (pr.status !== StatusPurchaseRequest.APPROVED && pr.status !== StatusPurchaseRequest.PO_CREATED) {
        throw new Error("Purchase Request harus approved terlebih dahulu");
      }
    }

    // Generate nomor PO
    const nomorPO = await purchaseOrderRepository.generateNomorPO(companyId);

    const po = await purchaseOrderRepository.create(companyId, nomorPO, data);

    // Update PR status if linked and check if fully converted
    if (data.purchaseRequestId) {
      const pr = await purchaseRequestRepository.findById(data.purchaseRequestId, companyId);
      if (pr) {
        // Check if all items are fully converted to PO
        const allFullyConverted = pr.items.every(item => {
          const remaining = item.jumlahRequest - item.jumlahPOCreated;
          return remaining <= 0;
        });
        
        // Only update to PO_CREATED if not already (or keep as is if partial)
        if (pr.status === StatusPurchaseRequest.APPROVED) {
          await purchaseRequestRepository.updateStatus(
            data.purchaseRequestId,
            companyId,
            StatusPurchaseRequest.PO_CREATED
          );
        }
      }
    }

    return po;
  },

  async update(id: string, companyId: string, data: UpdatePurchaseOrderInput) {
    const po = await this.getById(id, companyId);
    if (po.status !== StatusPurchaseOrder.DRAFT) {
      throw new Error("Purchase Order tidak dapat diubah karena sudah diterbitkan");
    }

    // Validate materials if items are provided
    if (data.items) {
      const currentAllocations = new Map<string, number>();
      for (const item of po.items as any[]) {
        for (const mapping of item.prItemMappings || []) {
          currentAllocations.set(
            mapping.purchaseRequestItemId,
            (currentAllocations.get(mapping.purchaseRequestItemId) || 0) + mapping.quantity
          );
        }
      }

      for (const item of data.items) {
        const material = await materialInventarisRepository.findById(item.materialId, companyId);
        if (!material) {
          throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
        }

        if (item.prItemMappings?.length) {
          for (const mapping of item.prItemMappings) {
            const prItem = await purchaseRequestRepository.findItemById(mapping.purchaseRequestItemId);
            if (!prItem) {
              throw new Error(`PR Item dengan ID ${mapping.purchaseRequestItemId} tidak ditemukan`);
            }

            const currentAllocation = currentAllocations.get(mapping.purchaseRequestItemId) || 0;
            const available = prItem.jumlahRequest - prItem.jumlahPOCreated + currentAllocation;

            if (mapping.quantity > available) {
              throw new Error(
                `Jumlah PO (${mapping.quantity}) melebihi sisa quantity PR (${available}) untuk material ${prItem.material.namaMaterial}`
              );
            }
          }
        }
      }
    }

    return purchaseOrderRepository.update(id, companyId, data);
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    const po = await this.getById(id, companyId);
    if (po.status !== StatusPurchaseOrder.DRAFT) {
      throw new Error("Purchase Order tidak dapat diapprove");
    }

    return purchaseOrderRepository.approve(id, companyId, approvedBy);
  },

  async issue(id: string, companyId: string) {
    const po = await this.getById(id, companyId);
    if (po.status !== StatusPurchaseOrder.DRAFT) {
      throw new Error("Purchase Order harus dalam status DRAFT");
    }
    if (!po.approvedBy) {
      throw new Error("Purchase Order harus diapprove terlebih dahulu");
    }

    return purchaseOrderRepository.issue(id, companyId);
  },

  async cancel(id: string, companyId: string) {
    const po = await this.getById(id, companyId);
    if (po.status === StatusPurchaseOrder.COMPLETED) {
      throw new Error("Purchase Order yang sudah completed tidak dapat dibatalkan");
    }

    return purchaseOrderRepository.updateStatus(id, companyId, StatusPurchaseOrder.CANCELLED);
  },

  async delete(id: string, companyId: string) {
    const po = await this.getById(id, companyId);
    if (po.status !== StatusPurchaseOrder.DRAFT) {
      throw new Error("Hanya Purchase Order dengan status DRAFT yang dapat dihapus");
    }

    return purchaseOrderRepository.delete(id, companyId);
  },

  // Get pending PRs yang siap untuk dijadikan referensi PO
  async getPendingPRsForPO(companyId: string) {
    return purchaseOrderRepository.findPendingPRsForPO(companyId);
  },
};
