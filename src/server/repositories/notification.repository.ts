import { db } from "../db";
import type { NotificationType } from "@prisma/client";

export interface CreateNotificationInput {
    companyId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    referenceId?: string;
    referenceUrl?: string;
}

export interface NotificationFilters {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
}

export const notificationRepository = {
    async create(data: CreateNotificationInput) {
        return db.notification.create({
            data: {
                companyId: data.companyId,
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                referenceId: data.referenceId,
                referenceUrl: data.referenceUrl,
            },
        });
    },

    async createMany(notifications: CreateNotificationInput[]) {
        return db.notification.createMany({
            data: notifications.map((n) => ({
                companyId: n.companyId,
                userId: n.userId,
                type: n.type,
                title: n.title,
                message: n.message,
                referenceId: n.referenceId,
                referenceUrl: n.referenceUrl,
            })),
        });
    },

    async findByUserId(userId: string, companyId: string, filters?: NotificationFilters) {
        const { limit = 20, offset = 0, unreadOnly = false } = filters ?? {};

        return db.notification.findMany({
            where: {
                userId,
                companyId,
                ...(unreadOnly && { isRead: false }),
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
            skip: offset,
        });
    },

    async countUnread(userId: string, companyId: string) {
        return db.notification.count({
            where: {
                userId,
                companyId,
                isRead: false,
            },
        });
    },

    async markAsRead(id: string, userId: string) {
        return db.notification.update({
            where: {
                id,
                userId, // Ensure user can only mark their own notifications
            },
            data: {
                isRead: true,
            },
        });
    },

    async markAllAsRead(userId: string, companyId: string) {
        return db.notification.updateMany({
            where: {
                userId,
                companyId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    },

    async findById(id: string) {
        return db.notification.findUnique({
            where: { id },
        });
    },
};
