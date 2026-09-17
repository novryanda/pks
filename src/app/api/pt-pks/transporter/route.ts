import { NextResponse } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { transporterService } from "@/server/services/pt-pks/transporter.service";
import {
  createTransporterSchema,
  updateTransporterSchema,
} from "@/server/schema/transporter";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.driver", "view");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const id = searchParams.get("id");

    if (id) {
      const transporter = await transporterService.getTransporterById(id);
      return NextResponse.json(transporter);
    }

    if (search) {
      const transporters = await transporterService.searchTransporters(
        session.user.company!.id,
        search
      );
      return NextResponse.json(transporters);
    }

    const transporters = await transporterService.getTransportersByCompany(
      session.user.company!.id
    );
    return NextResponse.json(transporters);
  } catch (error) {
    console.error("Error fetching transporters:", error);
    return NextResponse.json(
      { error: "Failed to fetch transporters" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.driver", "create");
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const data = createTransporterSchema.parse(body);

    const transporter = await transporterService.createTransporter(
      companyId,
      data
    );
    return NextResponse.json(transporter, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transporter:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create transporter" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  const { error, session } = await requireAuthWithPermission("masterData.driver", "edit");
  if (error) return error;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const validatedData = updateTransporterSchema.parse(data);
    const transporter = await transporterService.updateTransporter(id, validatedData);
    return NextResponse.json(transporter);
  } catch (error: any) {
    console.error("Error updating transporter:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update transporter" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireAuthWithPermission("masterData.driver", "delete");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await transporterService.deleteTransporter(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting transporter:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete transporter" },
      { status: 400 }
    );
  }
}
