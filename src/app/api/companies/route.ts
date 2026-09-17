import { requireAuthWithPermission } from "@/lib/api-auth";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

// GET /api/companies - List all companies (Admin only)
export async function GET() {
  const { error } = await requireAuthWithPermission("settings.companies", "view");
  if (error) return error;

  try {
    const companies = await db.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create new company (Admin only)
export async function POST(request: Request) {
  const { error } = await requireAuthWithPermission("settings.companies", "create");
  if (error) return error;

  try {
    const body = await request.json();
    const { code, name } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: "Missing required fields: code and name" },
        { status: 400 }
      );
    }

    // Check if company already exists
    const existingCompany = await db.company.findUnique({
      where: { code },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "Company with this code already exists" },
        { status: 409 }
      );
    }

    // Create new company
    const newCompany = await db.company.create({
      data: {
        code: code.toUpperCase(),
        name,
      },
    });

    return NextResponse.json({ company: newCompany }, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
