import { requireAuthWithPermission } from "@/lib/api-auth";
import { roleService } from "@/server/services/pt-pks/role.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/role/default-permissions - Get default permissions
export async function GET(request: Request) {
  const { error } = await requireAuthWithPermission("settings.roles", "view");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "user";

    let permissions;
    if (type === "admin") {
      permissions = roleService.getDefaultAdminPermissions();
    } else {
      permissions = roleService.getDefaultUserPermissions();
    }

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error fetching default permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch default permissions" },
      { status: 500 }
    );
  }
}
