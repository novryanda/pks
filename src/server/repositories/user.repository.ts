import { db } from "@/server/db";
import type { CreateUserInput, UpdateUserInput } from "@/server/schema/user";
import bcrypt from "bcryptjs";

export class UserRepository {
  /**
   * Get all users by companyId
   */
  async findByCompanyId(companyId: string) {
    return db.user.findMany({
      where: { companyId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        company: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get user by id
   */
  async findById(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
          },
        },
        company: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        company: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Create new user
   */
  async create(data: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    return db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        companyId: data.companyId,
        roleId: data.roleId,
        image: data.image,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        company: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<UpdateUserInput>) {
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.image !== undefined) updateData.image = data.image;
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    return db.user.update({
      where: { id },
      data: updateData,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        company: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    return db.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Delete user
   */
  async delete(id: string) {
    return db.user.delete({
      where: { id },
    });
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string, excludeId?: string) {
    const user = await db.user.findFirst({
      where: {
        email,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return !!user;
  }

  /**
   * Search users by name or email
   */
  async search(companyId: string, searchTerm?: string) {
    return db.user.findMany({
      where: {
        companyId,
        ...(searchTerm
          ? {
              OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { email: { contains: searchTerm, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        company: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get user password for verification
   */
  async getUserPassword(id: string) {
    const user = await db.user.findUnique({
      where: { id },
      select: { password: true },
    });
    return user?.password;
  }

  /**
   * Verify user password
   */
  async verifyPassword(id: string, password: string) {
    const storedPassword = await this.getUserPassword(id);
    if (!storedPassword) return false;
    return bcrypt.compare(password, storedPassword);
  }

  /**
   * Count users by companyId
   */
  async countByCompanyId(companyId: string) {
    return db.user.count({
      where: { companyId },
    });
  }

  /**
   * Count users by roleId
   */
  async countByRoleId(roleId: string) {
    return db.user.count({
      where: { roleId },
    });
  }
}

export const userRepository = new UserRepository();
