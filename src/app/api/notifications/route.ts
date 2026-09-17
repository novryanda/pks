import { requireAuth } from "@/lib/api-auth";
import { notificationService } from "@/server/services/pt-pks/notification.service";
import { NextResponse } from "next/server";

// GET /api/notifications - List notifications for current user
export async function GET(request: Request) {
    const { error, session } = await requireAuth();
    if (error) return error;

    try {
        const userId = session.user.id;
        const companyId = session.user.company?.id;

        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") ?? "20");
        const offset = parseInt(searchParams.get("offset") ?? "0");
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        const notifications = await notificationService.getNotifications(userId, companyId, {
            limit,
            offset,
            unreadOnly,
        });

        return NextResponse.json(notifications);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
