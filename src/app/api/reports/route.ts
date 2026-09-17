import { requireAuthWithPermission } from "@/lib/api-auth";
import { NextResponse } from "next/server";

// GET /api/reports - List reports (Admin and Manager only)
export async function GET() {
  const { error, session } = await requireAuthWithPermission("settings.reports", "view");
  if (error) return error;

  try {
    // Mock data for now - replace with actual database query
    const reports = [
      {
        id: "1",
        title: "Monthly Report",
        createdAt: new Date(),
        createdBy: session?.user.name,
        company: session?.user.company?.name,
      },
    ];

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create new report (Admin and Manager only)
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("settings.reports", "create");
  if (error) return error;

  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }

    // Mock response - replace with actual database create
    const newReport = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      content,
      createdAt: new Date(),
      createdBy: session?.user.name,
      company: session?.user.company?.name,
    };

    return NextResponse.json({ report: newReport }, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
