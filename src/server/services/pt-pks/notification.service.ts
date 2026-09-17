import { db } from "@/server/db";
import { notificationRepository, type CreateNotificationInput } from "@/server/repositories/notification.repository";
import type { NotificationType } from "@prisma/client";

// Type for permission checking
type PermissionModule = "gudang" | "masterData" | "supplyChain" | "produksi" | "pemasaran" | "payroll" | "keuangan" | "settings";
type PermissionSubModule = string;

export const notificationService = {
    /**
     * Find all users in a company who have a specific permission
     */
    async findUsersWithPermission(
        companyId: string,
        module: PermissionModule,
        subModule: PermissionSubModule,
        action: "view" | "create" | "edit" | "delete" | "approve"
    ) {
        // Get all roles in the company
        const roles = await db.role.findMany({
            where: { companyId },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        const usersWithPermission: Array<{ id: string; name: string | null; email: string | null }> = [];

        for (const role of roles) {
            // Check if this role has the required permission
            const permissions = role.permissions as Record<string, Record<string, Record<string, boolean>>> | null;

            if (permissions) {
                const modulePerms = permissions[module];
                if (modulePerms) {
                    const subModulePerms = modulePerms[subModule];
                    if (subModulePerms && subModulePerms[action] === true) {
                        // Add all users with this role
                        usersWithPermission.push(...role.users);
                    }
                }
            }
        }

        // Remove duplicates (in case user is in multiple matching roles)
        const uniqueUsers = usersWithPermission.filter(
            (user, index, self) => index === self.findIndex((u) => u.id === user.id)
        );

        return uniqueUsers;
    },

    /**
     * Create notifications for all users with approve permission
     */
    async notifyApprovers(
        companyId: string,
        module: PermissionModule,
        subModule: PermissionSubModule,
        type: NotificationType,
        referenceId: string,
        referenceUrl: string,
        title: string,
        message: string
    ) {
        // Find all users with approve permission
        const approvers = await this.findUsersWithPermission(companyId, module, subModule, "approve");

        if (approvers.length === 0) {
            console.log(`No approvers found for ${module}.${subModule}`);
            return { count: 0 };
        }

        // Create notifications for each approver
        const notifications: CreateNotificationInput[] = approvers.map((user) => ({
            companyId,
            userId: user.id,
            type,
            title,
            message,
            referenceId,
            referenceUrl,
        }));

        const result = await notificationRepository.createMany(notifications);

        return { count: result.count };
    },

    /**
     * Get notifications for a user
     */
    async getNotifications(
        userId: string,
        companyId: string,
        options?: { limit?: number; offset?: number; unreadOnly?: boolean }
    ) {
        return notificationRepository.findByUserId(userId, companyId, options);
    },

    /**
     * Get unread notification count for a user
     */
    async getUnreadCount(userId: string, companyId: string) {
        return notificationRepository.countUnread(userId, companyId);
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(id: string, userId: string) {
        return notificationRepository.markAsRead(id, userId);
    },

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string, companyId: string) {
        return notificationRepository.markAllAsRead(userId, companyId);
    },
};
