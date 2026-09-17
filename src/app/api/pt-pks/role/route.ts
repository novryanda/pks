import { requireAuthWithPermission } from "@/lib/api-auth";
import { roleService } from "@/server/services/pt-pks/role.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/role - Get all roles for current company
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("settings.roles", "view");
  if (error) return error;

  try {
    // Get companyId from session
    const companyId = session.user.company?.id;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const roles = await roleService.getRoles(companyId);

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST /api/pt-pks/role - Create new role
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("settings.roles", "create");
  if (error) return error;

  try {
    const body = await request.json();

    // Get companyId from session or use from body
    const companyId = session.user.company?.id ?? body.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    // Create role
    const roleData = {
      ...body,
      companyId,
    };

    const role = await roleService.createRole(roleData);

    return NextResponse.json({ role }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to create role" },
      { status: 400 }
    );
  }
}
