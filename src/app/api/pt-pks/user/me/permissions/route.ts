import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { Permission } from "@/server/schema/user";

// GET /api/pt-pks/user/me/permissions - Get current user's permissions
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.role?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const roleId = session.user.role.id;
    const roleName = session.user.role.name;

    // Global admin roles always have full access
    if (roleName === "Admin" || roleName === "Super Admin") {
      return NextResponse.json({
        isAdmin: true,
        permissions: null, // Admin has all permissions
      });
    }

    // Get role permissions from database
    const role = await db.role.findUnique({
      where: { id: roleId },
      select: { permissions: true },
    });

    if (!role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isAdmin: false,
      permissions: role.permissions as Permission | null,
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
