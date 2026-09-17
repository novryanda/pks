import { NextResponse, type NextRequest } from "next/server";
import { requireAuthWithPermission } from "@/lib/api-auth";
import { contractService } from "@/server/services/pt-pks/contract.service";

// POST - Upload file(s) to contract
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuthWithPermission("pemasaran.contract", "edit");
    if (error) return error;

    try {
        const { id } = await params;

        // Get companyId from session
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json(
                { error: "Company ID not found" },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const files = formData.getAll("files") as File[];

        const result = await contractService.uploadContractFiles(id, companyId, files);

        return NextResponse.json({
            success: true,
            message: result.message,
            data: {
                attachments: result.attachments,
            },
        });
    } catch (error: any) {
        console.error("Error uploading contract files:", error);
        return NextResponse.json(
            { error: error.message || "Gagal mengupload file" },
            { status: 500 }
        );
    }
}

// DELETE - Remove a specific file from contract
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuthWithPermission("pemasaran.contract", "edit");
    if (error) return error;

    try {
        const { id } = await params;
        const body = await request.json();
        const { fileName } = body;

        // Get companyId from session
        const companyId = session.user.company?.id;
        if (!companyId) {
            return NextResponse.json(
                { error: "Company ID not found" },
                { status: 400 }
            );
        }

        const result = await contractService.deleteContractFile(id, companyId, fileName);

        return NextResponse.json({
            success: true,
            message: result.message,
            data: {
                attachments: result.attachments,
            },
        });
    } catch (error: any) {
        console.error("Error deleting contract file:", error);
        return NextResponse.json(
            { error: error.message || "Gagal menghapus file" },
            { status: 500 }
        );
    }
}
