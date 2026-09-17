import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { materialService } from "@/server/services/pt-pks/material.service";
import {
  createSatuanMaterialSchema,
  updateSatuanMaterialSchema,
} from "@/server/schema/material";

export async function GET() {
  const { error, session } = await requireAuthWithPermission("masterData.material", "view");
  if (error) return error;

  try {
    const satuans = await materialService.getSatuanMaterialsByCompany(
      session.user.company!.id
    );
    return NextResponse.json(satuans);
  } catch (error) {
    console.error("Error fetching satuan materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch satuan materials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.material", "create");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createSatuanMaterialSchema.parse(body);

    const satuan = await materialService.createSatuanMaterial(
      session.user.company!.id,
      data
    );
    return NextResponse.json(satuan, { status: 201 });
  } catch (error: any) {
    console.error("Error creating satuan material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create satuan material" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  const { error } = await requireAuthWithPermission("masterData.material", "edit");
  if (error) return error;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const validatedData = updateSatuanMaterialSchema.parse(data);
    const satuan = await materialService.updateSatuanMaterial(id, validatedData);
    return NextResponse.json(satuan);
  } catch (error: any) {
    console.error("Error updating satuan material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update satuan material" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireAuthWithPermission("masterData.material", "delete");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await materialService.deleteSatuanMaterial(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting satuan material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete satuan material" },
      { status: 400 }
    );
  }
}
