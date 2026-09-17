import { requireAuthWithPermission } from "@/lib/api-auth";
import {
  assertFileSize,
  buildObjectKey,
  deleteObjectFromR2,
  getKeyFromStoredPath,
  uploadBufferToR2,
} from "@/lib/storage/r2";
import { db } from "@/server/db";
import { NextResponse, type NextRequest } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { env } from "@/env.js";

// Max file size 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuthWithPermission("gudang.purchaseOrder", "edit");
  if (error) return error;

  try {
    const { id } = await params;

    // Check if PO exists
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      select: { id: true, nomorPO: true, brosurPdfPath: true },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase Order tidak ditemukan" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Hanya file PDF yang diizinkan" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 10MB" },
        { status: 400 }
      );
    }

    if (purchaseOrder.brosurPdfPath) {
      const oldKey = getKeyFromStoredPath(purchaseOrder.brosurPdfPath);
      if (oldKey) {
        await deleteObjectFromR2(oldKey);
      } else {
        const oldFilePath = path.join(process.cwd(), "public", purchaseOrder.brosurPdfPath);
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath);
        }
      }
    }

    assertFileSize(file.size);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadResult = await uploadBufferToR2({
      buffer,
      key: buildObjectKey({
        prefix: env.R2_PO_PREFIX || "purchase-orders",
        entityId: purchaseOrder.nomorPO,
        originalName: file.name,
      }),
      contentType: file.type || "application/pdf",
      contentDisposition: `inline; filename="${encodeURIComponent(file.name)}"`,
    });

    const updatedPO = await db.purchaseOrder.update({
      where: { id },
      data: {
        brosurPdfPath: uploadResult.url,
        brosurPdfName: file.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "File berhasil diupload",
      data: {
        brosurPdfPath: updatedPO.brosurPdfPath,
        brosurPdfName: updatedPO.brosurPdfName,
      },
    });
  } catch (error) {
    console.error("Error uploading brosur PDF:", error);
    return NextResponse.json(
      { error: "Gagal mengupload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuthWithPermission("gudang.purchaseOrder", "edit");
  if (error) return error;

  try {
    const { id } = await params;

    // Check if PO exists
    const purchaseOrder = await db.purchaseOrder.findUnique({
      where: { id },
      select: { id: true, brosurPdfPath: true },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase Order tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!purchaseOrder.brosurPdfPath) {
      return NextResponse.json(
        { error: "Tidak ada file brosur yang tersimpan" },
        { status: 400 }
      );
    }

    const fileKey = getKeyFromStoredPath(purchaseOrder.brosurPdfPath);
    if (fileKey) {
      await deleteObjectFromR2(fileKey);
    } else {
      const filePath = path.join(process.cwd(), "public", purchaseOrder.brosurPdfPath);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }

    await db.purchaseOrder.update({
      where: { id },
      data: {
        brosurPdfPath: null,
        brosurPdfName: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "File brosur berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting brosur PDF:", error);
    return NextResponse.json(
      { error: "Gagal menghapus file" },
      { status: 500 }
    );
  }
}
