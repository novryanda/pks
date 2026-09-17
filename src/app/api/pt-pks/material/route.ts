import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { materialService } from "@/server/services/pt-pks/material.service";
import {
  createMaterialSchema,
  updateMaterialSchema,
} from "@/server/schema/material";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.material", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const dropdown = searchParams.get("dropdown");
    const kategori = searchParams.get("kategori");

    // If dropdown parameter is present, return simplified data for dropdowns
    if (dropdown === "true") {
      const materials = await materialService.getMaterialsForDropdown(
        session.user.company!.id,
        kategori || undefined
      );
      return NextResponse.json({ materials });
    }

    const materials = await materialService.getMaterialsByCompany(
      session.user.company!.id
    );
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.material", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const data = createMaterialSchema.parse(body);

    const material = await materialService.createMaterial(
      companyId,
      data
    );
    return NextResponse.json(material, { status: 201 });
  } catch (error: any) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create material" },
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

    const validatedData = updateMaterialSchema.parse(data);
    const material = await materialService.updateMaterial(id, validatedData);
    return NextResponse.json(material);
  } catch (error: any) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update material" },
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

    await materialService.deleteMaterial(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete material" },
      { status: 400 }
    );
  }
}
