import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { materialService } from "@/server/services/pt-pks/material.service";
import {
  createKategoriMaterialSchema,
  updateKategoriMaterialSchema,
} from "@/server/schema/material";

export async function GET() {
  const { error, session } = await requireAuthWithPermission("masterData.material", "view");
  if (error) return error;

  try {
    const kategoris = await materialService.getKategoriMaterialsByCompany(
      session.user.company!.id
    );
    return NextResponse.json(kategoris);
  } catch (error) {
    console.error("Error fetching kategori materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch kategori materials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.material", "create");
  if (error) return error;

  try {
    const body = await request.json();
    const data = createKategoriMaterialSchema.parse(body);

    const kategori = await materialService.createKategoriMaterial(
      session.user.company!.id,
      data
    );
    return NextResponse.json(kategori, { status: 201 });
  } catch (error: any) {
    console.error("Error creating kategori material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create kategori material" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.material", "edit");
  if (error) return error;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const validatedData = updateKategoriMaterialSchema.parse(data);
    const kategori = await materialService.updateKategoriMaterial(id, validatedData);
    return NextResponse.json(kategori);
  } catch (error: any) {
    console.error("Error updating kategori material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update kategori material" },
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

    await materialService.deleteKategoriMaterial(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting kategori material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete kategori material" },
      { status: 400 }
    );
  }
}
