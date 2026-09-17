import { requireAuthWithPermission } from "@/lib/api-auth";
import { roleService } from "@/server/services/pt-pks/role.service";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/pt-pks/role/[id]
export async function GET(request: Request, { params }: RouteParams) {
  const { error, session } = await requireAuthWithPermission("settings.roles", "view");
  if (error) return error;

  try {
    const { id } = await params;
    const role = await roleService.getRoleById(id);

    // Ensure role belongs to the same company
    if (role.companyId !== session.user.company?.id) {
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ role });
  } catch (error: any) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch role" },
      { status: 404 }
    );
  }
}

// PUT /api/pt-pks/role/[id] - Update role
export async function PUT(request: Request, { params }: RouteParams) {
  const { error, session } = await requireAuthWithPermission("settings.roles", "edit");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Check if role exists and belongs to the same company
    const existingRole = await roleService.getRoleById(id);
    if (existingRole.companyId !== session.user.company?.id) {
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    const role = await roleService.updateRole(id, body);

    return NextResponse.json({ role });
  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to update role" },
      { status: 400 }
    );
  }
}

// DELETE /api/pt-pks/role/[id] - Delete role
export async function DELETE(request: Request, { params }: RouteParams) {
  const { error, session } = await requireAuthWithPermission("settings.roles", "delete");
  if (error) return error;

  try {
    const { id } = await params;

    // Check if role exists and belongs to the same company
    const existingRole = await roleService.getRoleById(id);
    if (existingRole.companyId !== session.user.company?.id) {
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    await roleService.deleteRole(id);

    return NextResponse.json({ message: "Role berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to delete role" },
      { status: 400 }
    );
  }
}
