import { db } from "@/server/db";
import type { CreateRoleInput, UpdateRoleInput, Permission } from "@/server/schema/user";
import type { Prisma } from "@prisma/client";

export class RoleRepository {
  /**
   * Get all roles by companyId
   */
  async findByCompanyId(companyId: string) {
    return db.role.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get role by id
   */
  async findById(id: string) {
    return db.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  /**
   * Get role by name and companyId
   */
  async findByNameAndCompanyId(name: string, companyId: string) {
    return db.role.findFirst({
      where: {
        name,
        companyId,
      },
    });
  }

  /**
   * Create new role
   */
  async create(data: CreateRoleInput) {
    return db.role.create({
      data: {
        name: data.name,
        description: data.description,
        companyId: data.companyId,
        permissions: data.permissions as unknown as Prisma.InputJsonValue,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  /**
   * Update role
   */
  async update(id: string, data: Partial<UpdateRoleInput>) {
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.permissions !== undefined) {
      updateData.permissions = data.permissions as unknown as Prisma.InputJsonValue;
    }

    return db.role.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  /**
   * Delete role
   */
  async delete(id: string) {
    return db.role.delete({
      where: { id },
    });
  }

  /**
   * Check if role name exists in company
   */
  async existsByNameInCompany(name: string, companyId: string, excludeId?: string) {
    const role = await db.role.findFirst({
      where: {
        name,
        companyId,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return !!role;
  }

  /**
   * Get role permissions
   */
  async getPermissions(id: string): Promise<Permission | null> {
    const role = await db.role.findUnique({
      where: { id },
      select: { permissions: true },
    });
    return role?.permissions as Permission | null;
  }

  /**
   * Count roles by companyId
   */
  async countByCompanyId(companyId: string) {
    return db.role.count({
      where: { companyId },
    });
  }

  /**
   * Check if role has users
   */
  async hasUsers(id: string) {
    const count = await db.user.count({
      where: { roleId: id },
    });
    return count > 0;
  }

  /**
   * Get users by role id
   */
  async getUsersByRoleId(roleId: string) {
    return db.user.findMany({
      where: { roleId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }
}

export const roleRepository = new RoleRepository();
