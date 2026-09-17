import { requireAuthWithPermission } from "@/lib/api-auth";
import { userService } from "@/server/services/pt-pks/user.service";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/pt-pks/user/[id] - Get user by id
export async function GET(request: Request, { params }: RouteParams) {
  const { error, session } = await requireAuthWithPermission("settings.users", "view");
  if (error) return error;

  try {
    const { id } = await params;
    const user = await userService.getUserById(id);

    // Ensure user belongs to the same company
    if (user.companyId !== session.user.company?.id) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch user" },
      { status: 404 }
    );
  }
}

// PUT /api/pt-pks/user/[id] - Update user
export async function PUT(request: Request, { params }: RouteParams) {
  const { error, session } = await requireAuthWithPermission("settings.users", "edit");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Check if user exists and belongs to the same company
    const existingUser = await userService.getUserById(id);
    if (existingUser.companyId !== session.user.company?.id) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const user = await userService.updateUser(id, body);

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to update user" },
      { status: 400 }
    );
  }
}

// DELETE /api/pt-pks/user/[id] - Delete user
export async function DELETE(request: Request, { params }: RouteParams) {
  const { error, session } = await requireAuthWithPermission("settings.users", "delete");
  if (error) return error;

  try {
    const { id } = await params;

    // Check if user exists and belongs to the same company
    const existingUser = await userService.getUserById(id);
    if (existingUser.companyId !== session.user.company?.id) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Prevent deleting yourself
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus akun sendiri" },
        { status: 400 }
      );
    }

    await userService.deleteUser(id);

    return NextResponse.json({ message: "User berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to delete user" },
      { status: 400 }
    );
  }
}
