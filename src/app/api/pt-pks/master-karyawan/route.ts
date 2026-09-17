import { requireAuthWithPermission } from "@/lib/api-auth";
import { masterKaryawanService } from "@/server/services/pt-pks/master-karyawan.service";
import { masterDivisiService } from "@/server/services/pt-pks/master-divisi.service";
import { masterJabatanService } from "@/server/services/pt-pks/master-jabatan.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/master-karyawan - Get all master karyawan
export async function GET(request: Request) {
  const { error } = await requireAuthWithPermission("masterData.karyawan", "view");
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const divisiId = searchParams.get("divisiId") || undefined;
    const jabatanId = searchParams.get("jabatanId") || undefined;
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get divisi list for dropdown
    if (searchParams.get("divisiList") === "true") {
      const divisiList = await masterDivisiService.getActiveList();
      return NextResponse.json({ data: divisiList });
    }

    // Get jabatan list for dropdown
    if (searchParams.get("jabatanList") === "true") {
      const jabatanList = await masterJabatanService.getActiveList();
      return NextResponse.json({ data: jabatanList });
    }

    const result = await masterKaryawanService.getMasterKaryawan({
      search,
      divisiId,
      jabatanId,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error fetching master karyawan:", error);
    return NextResponse.json(
      { error: "Failed to fetch master karyawan" },
      { status: 500 }
    );
  }
}

// POST /api/pt-pks/master-karyawan - Create new master karyawan
export async function POST(request: Request) {
  const { error } = await requireAuthWithPermission("masterData.karyawan", "create");
  if (error) return error;

  try {
    const body = await request.json();
    const karyawan = await masterKaryawanService.createMasterKaryawan(body);

    return NextResponse.json({
      message: "Master karyawan created successfully",
      karyawan,
    });
  } catch (error: unknown) {
    console.error("Error creating master karyawan:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create master karyawan" },
      { status: 500 }
    );
  }
}
