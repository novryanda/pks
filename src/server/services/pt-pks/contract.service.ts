import { contractRepository } from "@/server/repositories/contract.repository";
import {
  createContractSchema,
  updateContractSchema,
  type CreateContractInput,
  type UpdateContractInput,
  type ContractQueryInput,
} from "@/server/schema/contract";
import { env } from "@/env.js";
import type { StatusContract } from "@prisma/client";
import {
  assertFileSize,
  buildObjectKey,
  deleteObjectFromR2,
  getKeyFromStoredPath,
  uploadBufferToR2,
} from "@/lib/storage/r2";
import { unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Type for attachment
export interface ContractAttachment {
  key?: string;
  id?: string;
  fileName: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export class ContractService {
  /**
   * Get all contracts for a company with pagination and filters
   */
  async getContracts(companyId: string, query?: ContractQueryInput) {
    return contractRepository.findByCompanyId(companyId, query);
  }

  /**
   * Get contract by id
   */
  async getContractById(id: string, companyId: string) {
    const contract = await contractRepository.findById(id, companyId);
    if (!contract) {
      throw new Error("Kontrak tidak ditemukan");
    }
    return contract;
  }

  /**
   * Get contracts by buyer
   */
  async getContractsByBuyer(buyerId: string, companyId: string) {
    return contractRepository.findByBuyerId(buyerId, companyId);
  }

  /**
   * Create new contract
   */
  async createContract(companyId: string, data: CreateContractInput) {
    // Validate input
    const validatedData = createContractSchema.parse(data);

    // Create contract
    return contractRepository.create(companyId, validatedData);
  }

  /**
   * Update contract
   */
  async updateContract(
    id: string,
    companyId: string,
    data: UpdateContractInput
  ) {
    // Validate input
    const validatedData = updateContractSchema.parse(data);

    // Check if contract exists
    const existing = await contractRepository.findById(id, companyId);
    if (!existing) {
      throw new Error("Kontrak tidak ditemukan");
    }

    if (validatedData.contractNumber) {
      const numberExists = await contractRepository.isContractNumberExists(
        validatedData.contractNumber,
        companyId,
        id
      );

      if (numberExists) {
        throw new Error(
          `Nomor kontrak "${validatedData.contractNumber}" sudah digunakan`
        );
      }
    }

    // Validate dates if both are provided
    if (validatedData.startDate && validatedData.endDate) {
      if (validatedData.endDate < validatedData.startDate) {
        throw new Error(
          "Tanggal berakhir harus setelah atau sama dengan tanggal mulai"
        );
      }
    }

    // Update contract
    return contractRepository.update(id, companyId, validatedData);
  }

  /**
   * Delete contract
   */
  async deleteContract(id: string, companyId: string) {
    // Check if contract exists
    const existing = await contractRepository.findById(id, companyId);
    if (!existing) {
      throw new Error("Kontrak tidak ditemukan");
    }

    // Check if contract can be deleted (only DRAFT or CANCELLED contracts)
    if (existing.status !== "DRAFT" && existing.status !== "CANCELLED") {
      throw new Error(
        "Hanya kontrak dengan status DRAFT atau CANCELLED yang dapat dihapus"
      );
    }

    // Delete contract
    return contractRepository.delete(id, companyId);
  }

  /**
   * Update contract status
   */
  async updateContractStatus(
    id: string,
    companyId: string,
    status: StatusContract
  ) {
    // Check if contract exists
    const existing = await contractRepository.findById(id, companyId);
    if (!existing) {
      throw new Error("Kontrak tidak ditemukan");
    }

    // Validate status transition
    const currentStatus = existing.status;

    // Business rules for status transitions
    if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
      throw new Error(
        "Kontrak yang sudah COMPLETED atau CANCELLED tidak dapat diubah statusnya"
      );
    }

    if (currentStatus === "DRAFT" && status === "COMPLETED") {
      throw new Error(
        "Kontrak tidak dapat langsung dari DRAFT ke COMPLETED. Ubah ke ACTIVE terlebih dahulu"
      );
    }

    // Update status
    return contractRepository.updateStatus(id, companyId, status);
  }

  /**
   * Generate contract number
   */
  async generateContractNumber(companyId: string) {
    return contractRepository.generateContractNumber(companyId);
  }

  /**
   * Upload file(s) to contract
   */
  async uploadContractFiles(id: string, companyId: string, files: File[]) {
    // Check if contract exists and belongs to this company
    const contract = await contractRepository.findById(id, companyId);
    if (!contract) {
      throw new Error("Kontrak tidak ditemukan");
    }

    if (!files || files.length === 0) {
      throw new Error("File tidak ditemukan");
    }

    // Validate all files first
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(
          `Tipe file "${file.name}" tidak diizinkan. Hanya PDF, PNG, JPG yang diperbolehkan.`
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File "${file.name}" melebihi ukuran maksimal 10MB`);
      }
    }

    const newAttachments: ContractAttachment[] = [];
    const contractNumber = (contract as any).contractNumber || "unknown";
    const prefix = env.R2_CONTRACT_PREFIX || "contracts";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      assertFileSize(file.size);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const key = buildObjectKey({
        prefix,
        entityId: contractNumber,
        originalName: file.name,
      });
      const uploadedFile = await uploadBufferToR2({
        buffer,
        key,
        contentType: file.type || "application/octet-stream",
        contentDisposition: `inline; filename="${encodeURIComponent(file.name)}"`,
      });

      newAttachments.push({
        id: uploadedFile.key,
        key: uploadedFile.key,
        fileName: uploadedFile.key,
        originalName: file.name,
        path: uploadedFile.url,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
      });
    }

    // Merge with existing attachments
    const existingAttachments =
      ((contract as any).attachments as ContractAttachment[] | null) || [];
    const allAttachments = [...existingAttachments, ...newAttachments];

    // Update database using repository
    await contractRepository.updateAttachments(id, companyId, allAttachments);

    return {
      success: true,
      message: `${files.length} file berhasil diupload`,
      attachments: allAttachments,
    };
  }

  /**
   * Delete a specific file from contract
   */
  async deleteContractFile(id: string, companyId: string, fileName: string) {
    if (!fileName) {
      throw new Error("Nama file tidak ditemukan");
    }

    // Check if contract exists and belongs to this company
    const contract = await contractRepository.findById(id, companyId);
    if (!contract) {
      throw new Error("Kontrak tidak ditemukan");
    }

    const existingAttachments =
      ((contract as any).attachments as ContractAttachment[] | null) || [];
    const fileToDelete = existingAttachments.find(
      (a) => a.fileName === fileName || a.key === fileName || a.id === fileName
    );

    if (!fileToDelete) {
      throw new Error("File tidak ditemukan di kontrak ini");
    }

    const fileKey = fileToDelete.key || fileToDelete.id || getKeyFromStoredPath(fileToDelete.path);

    if (fileKey) {
      await deleteObjectFromR2(fileKey);
    } else {
      await this.deleteLegacyLocalFile(fileToDelete.path);
    }

    // Remove from attachments array
    const updatedAttachments = existingAttachments.filter(
      (a) =>
        a.fileName !== fileName &&
        a.key !== fileName &&
        a.id !== fileName
    );

    // Update database using repository
    await contractRepository.updateAttachments(
      id,
      companyId,
      updatedAttachments.length > 0 ? updatedAttachments : []
    );

    return {
      success: true,
      message: "File berhasil dihapus",
      attachments: updatedAttachments,
    };
  }

  private async deleteLegacyLocalFile(filePathOrUrl?: string | null) {
    if (!filePathOrUrl || !filePathOrUrl.startsWith("/uploads/")) {
      return;
    }

    const filePath = path.join(process.cwd(), "public", filePathOrUrl);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }
}

export const contractService = new ContractService();
