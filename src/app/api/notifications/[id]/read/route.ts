import { requireAuth } from "@/lib/api-auth";
import { notificationService } from "@/server/services/pt-pks/notification.service";
import { NextResponse } from "next/server";

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAuth();
    if (error) return error;

    try {
        const userId = session.user.id;
        const { id } = await params;

        const notification = await notificationService.markAsRead(id, userId);

        return NextResponse.json(notification);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
