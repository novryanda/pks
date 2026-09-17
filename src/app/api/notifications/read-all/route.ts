import { requireAuth } from "@/lib/api-auth";
import { notificationService } from "@/server/services/pt-pks/notification.service";
import { NextResponse } from "next/server";

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST() {
    const { error, session } = await requireAuth();
    if (error) return error;

    try {
        const userId = session.user.id;
        const companyId = session.user.company?.id;

        if (!companyId) {
            return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
        }

        const result = await notificationService.markAllAsRead(userId, companyId);

        return NextResponse.json({ success: true, count: result.count });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
