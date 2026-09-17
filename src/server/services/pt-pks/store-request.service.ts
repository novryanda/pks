import { storeRequestRepository } from "../../repositories/store-request.repository";
import { materialInventarisRepository } from "../../repositories/material-inventaris.repository";
import type { StoreRequestInput, UpdateStoreRequestInput } from "../../schema/store-request";
import { StatusStoreRequest } from "@prisma/client";

export const storeRequestService = {
  async getAll(companyId: string, filters?: {
    status?: StatusStoreRequest;
    divisi?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return storeRequestRepository.findAll(companyId, filters);
  },

  async getById(id: string, companyId: string) {
    const sr = await storeRequestRepository.findById(id, companyId);
    if (!sr) {
      throw new Error("Store Request tidak ditemukan");
    }
    return sr;
  },

  async create(companyId: string, data: StoreRequestInput) {
    // Validate materials
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
    }

    // Generate nomor SR
    const nomorSR = await storeRequestRepository.generateNomorSR(companyId);

    return storeRequestRepository.create(companyId, nomorSR, data);
  },

  async update(id: string, companyId: string, data: UpdateStoreRequestInput) {
    // Check if SR exists and can be updated
    const sr = await this.getById(id, companyId);
    const editableStatuses = new Set<StatusStoreRequest>([
      StatusStoreRequest.PENDING,
      StatusStoreRequest.APPROVED,
      StatusStoreRequest.NEED_PR,
    ]);

    if (!editableStatuses.has(sr.status)) {
      throw new Error("Store Request tidak dapat diubah pada status saat ini");
    }

    if (sr.pengeluaranBarang || sr.purchaseRequest) {
      throw new Error("Store Request tidak dapat diubah karena sudah diproses");
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

    return storeRequestRepository.update(id, companyId, data);
  },

  async submit(id: string, companyId: string) {
    const sr = await this.getById(id, companyId);
    if (sr.status !== StatusStoreRequest.DRAFT) {
      throw new Error("Store Request tidak dapat disubmit");
    }

    return storeRequestRepository.updateStatus(id, companyId, StatusStoreRequest.PENDING);
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    const sr = await this.getById(id, companyId);
    if (sr.status !== StatusStoreRequest.PENDING) {
      throw new Error("Store Request tidak dapat diapprove");
    }

    return storeRequestRepository.approve(id, companyId, approvedBy);
  },

  async reject(id: string, companyId: string) {
    const sr = await this.getById(id, companyId);
    if (sr.status !== StatusStoreRequest.PENDING) {
      throw new Error("Store Request tidak dapat direject");
    }

    return storeRequestRepository.reject(id, companyId);
  },

  async checkStock(id: string, companyId: string): Promise<{
    canFulfill: boolean;
    items: Array<{
      materialId: string;
      namaMaterial: string;
      jumlahRequest: number;
      stockOnHand: number;
      sufficient: boolean;
    }>;
  }> {
    const sr = await this.getById(id, companyId);
    
    const items = await Promise.all(
      sr.items.map(async (item) => {
        const material = await materialInventarisRepository.findById(item.materialId, companyId);
        return {
          materialId: item.materialId,
          namaMaterial: material?.namaMaterial ?? "",
          jumlahRequest: item.jumlahRequest,
          stockOnHand: material?.stockOnHand ?? 0,
          sufficient: (material?.stockOnHand ?? 0) >= item.jumlahRequest,
        };
      })
    );

    const canFulfill = items.every(item => item.sufficient);

    return { canFulfill, items };
  },

  async markAsCompleted(id: string, companyId: string) {
    const sr = await this.getById(id, companyId);
    if (sr.status !== StatusStoreRequest.APPROVED) {
      throw new Error("Store Request harus approved terlebih dahulu");
    }

    return storeRequestRepository.complete(id, companyId);
  },

  async markAsNeedPR(id: string, companyId: string) {
    const sr = await this.getById(id, companyId);
    if (sr.status !== StatusStoreRequest.APPROVED) {
      throw new Error("Store Request harus approved terlebih dahulu");
    }

    return storeRequestRepository.needPR(id, companyId);
  },

  async delete(id: string, companyId: string) {
    const sr = await this.getById(id, companyId);
    if (sr.status !== StatusStoreRequest.DRAFT) {
      throw new Error("Hanya Store Request dengan status DRAFT yang dapat dihapus");
    }

    return storeRequestRepository.delete(id, companyId);
  },
};
