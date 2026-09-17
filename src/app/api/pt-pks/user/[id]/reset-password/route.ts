import { requireAuthWithPermission } from "@/lib/api-auth";
import { userService } from "@/server/services/pt-pks/user.service";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/pt-pks/user/[id]/reset-password - Reset user password (admin only)
export async function POST(request: Request, { params }: RouteParams) {
  const { error, session } = await requireAuthWithPermission("settings.users", "edit");
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password baru minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Check if user exists and belongs to the same company
    const existingUser = await userService.getUserById(id);
    if (existingUser.companyId !== session.user.company?.id) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    await userService.resetPassword(id, newPassword);

    return NextResponse.json({ message: "Password berhasil direset" });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to reset password" },
      { status: 400 }
    );
  }
}
