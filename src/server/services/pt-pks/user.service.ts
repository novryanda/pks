import { userRepository } from "@/server/repositories/user.repository";
import { roleRepository } from "@/server/repositories/role.repository";
import {
  CreateUserSchema,
  UpdateUserSchema,
  ChangePasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ChangePasswordInput,
} from "@/server/schema/user";

export class UserService {
  /**
   * Get all users for a company
   */
  async getUsers(companyId: string) {
    return userRepository.findByCompanyId(companyId);
  }

  /**
   * Get user by id
   */
  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }
    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }
    return user;
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserInput) {
    // Validate input
    const validatedData = CreateUserSchema.parse(data);

    // Check if email already exists
    const emailExists = await userRepository.existsByEmail(validatedData.email);
    if (emailExists) {
      throw new Error("Email sudah terdaftar");
    }

    // Check if role exists
    const role = await roleRepository.findById(validatedData.roleId);
    if (!role) {
      throw new Error("Role tidak ditemukan");
    }

    // Ensure role belongs to the same company
    if (role.companyId !== validatedData.companyId) {
      throw new Error("Role tidak valid untuk company ini");
    }

    // Create user
    return userRepository.create(validatedData);
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: Partial<UpdateUserInput>) {
    // Validate input
    const validatedData = UpdateUserSchema.partial().parse(data);

    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      throw new Error("User tidak ditemukan");
    }

    // Check if email already exists (if updating email)
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await userRepository.existsByEmail(validatedData.email, id);
      if (emailExists) {
        throw new Error("Email sudah terdaftar");
      }
    }

    // Check if role exists (if updating role)
    if (validatedData.roleId) {
      const role = await roleRepository.findById(validatedData.roleId);
      if (!role) {
        throw new Error("Role tidak ditemukan");
      }

      // Ensure role belongs to the same company
      if (role.companyId !== existingUser.companyId) {
        throw new Error("Role tidak valid untuk company ini");
      }
    }

    // Update user
    return userRepository.update(id, validatedData);
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordInput) {
    // Validate input
    const validatedData = ChangePasswordSchema.parse(data);

    // Check if user exists
    const user = await userRepository.findById(validatedData.id);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    // Verify current password
    const isCurrentPasswordValid = await userRepository.verifyPassword(
      validatedData.id,
      validatedData.currentPassword
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Password saat ini tidak valid");
    }

    // Update password
    return userRepository.updatePassword(validatedData.id, validatedData.newPassword);
  }

  /**
   * Reset user password (admin only)
   */
  async resetPassword(id: string, newPassword: string) {
    // Check if user exists
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    // Update password
    return userRepository.updatePassword(id, newPassword);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string) {
    // Check if user exists
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("User tidak ditemukan");
    }

    // Delete user
    return userRepository.delete(id);
  }

  /**
   * Search users
   */
  async searchUsers(companyId: string, searchTerm?: string) {
    return userRepository.search(companyId, searchTerm);
  }

  /**
   * Get user count for company
   */
  async getUserCount(companyId: string) {
    return userRepository.countByCompanyId(companyId);
  }

  /**
   * Check if email is available
   */
  async isEmailAvailable(email: string, excludeId?: string) {
    const exists = await userRepository.existsByEmail(email, excludeId);
    return !exists;
  }
}

export const userService = new UserService();
