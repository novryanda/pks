import { requireAuth } from "@/lib/api-auth";
import { notificationService } from "@/server/services/pt-pks/notification.service";
import { NextResponse } from "next/server";

// GET /api/notifications/unread-count - Get unread notification count
export async function GET() {
    const { error, session } = await requireAuth();
    if (error) return error;

    try {
        const userId = session.user.id;
        const companyId = session.user.company?.id;

        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const count = await notificationService.getUnreadCount(userId, companyId);

        return NextResponse.json({ count });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
