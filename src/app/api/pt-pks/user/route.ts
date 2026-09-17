import { requireAuthWithPermission } from "@/lib/api-auth";
import { userService } from "@/server/services/pt-pks/user.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/user - Get all users
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("settings.users", "view");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    // Get companyId from session
    const companyId = session.user.company?.id;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    let users;

    if (search) {
      // Search users
      users = await userService.searchUsers(companyId, search);
    } else {
      // Get all users
      users = await userService.getUsers(companyId);
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/pt-pks/user - Create new user
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("settings.users", "create");
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

    // Create user
    const userData = {
      ...body,
      companyId,
    };

    const user = await userService.createUser(userData);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to create user" },
      { status: 400 }
    );
  }
}
