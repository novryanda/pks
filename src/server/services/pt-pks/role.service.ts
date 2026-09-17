import { roleRepository } from "@/server/repositories/role.repository";
import {
  CreateRoleSchema,
  UpdateRoleSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
  type Permission,
  getAdminPermissions,
  getUserPermissions,
} from "@/server/schema/user";

export class RoleService {
  /**
   * Get all roles for a company
   */
  async getRoles(companyId: string) {
    return roleRepository.findByCompanyId(companyId);
  }

  /**
   * Get role by id
   */
  async getRoleById(id: string) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new Error("Role tidak ditemukan");
    }
    return role;
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(id: string): Promise<Permission | null> {
    const permissions = await roleRepository.getPermissions(id);
    return permissions;
  }

  /**
   * Create new role
   */
  async createRole(data: CreateRoleInput) {
    // Validate input
    const validatedData = CreateRoleSchema.parse(data);

    // Check if role name already exists in company
    const nameExists = await roleRepository.existsByNameInCompany(
      validatedData.name,
      validatedData.companyId
    );
    if (nameExists) {
      throw new Error("Nama role sudah digunakan di company ini");
    }

    // Create role
    return roleRepository.create(validatedData);
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: Partial<UpdateRoleInput>) {
    // Validate input
    const validatedData = UpdateRoleSchema.partial().parse(data);

    // Check if role exists
    const existingRole = await roleRepository.findById(id);
    if (!existingRole) {
      throw new Error("Role tidak ditemukan");
    }

    // Check if name is being updated and already exists
    if (validatedData.name && validatedData.name !== existingRole.name) {
      const nameExists = await roleRepository.existsByNameInCompany(
        validatedData.name,
        existingRole.companyId,
        id
      );
      if (nameExists) {
        throw new Error("Nama role sudah digunakan di company ini");
      }
    }

    // Update role
    return roleRepository.update(id, validatedData);
  }

  /**
   * Delete role
   */
  async deleteRole(id: string) {
    // Check if role exists
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new Error("Role tidak ditemukan");
    }

    // Prevent deletion if role has users
    const hasUsers = await roleRepository.hasUsers(id);
    if (hasUsers) {
      throw new Error("Tidak dapat menghapus role yang masih memiliki user. Pindahkan user ke role lain terlebih dahulu.");
    }

    // Prevent deletion of protected system roles
    if (role.name === "Admin" || role.name === "Super Admin") {
      throw new Error(`Role ${role.name} tidak dapat dihapus`);
    }

    // Delete role
    return roleRepository.delete(id);
  }

  /**
   * Get users by role
   */
  async getUsersByRole(roleId: string) {
    return roleRepository.getUsersByRoleId(roleId);
  }

  /**
   * Get role count for company
   */
  async getRoleCount(companyId: string) {
    return roleRepository.countByCompanyId(companyId);
  }

  /**
   * Check if role name is available
   */
  async isRoleNameAvailable(name: string, companyId: string, excludeId?: string) {
    const exists = await roleRepository.existsByNameInCompany(name, companyId, excludeId);
    return !exists;
  }

  /**
   * Get default admin permissions
   */
  getDefaultAdminPermissions(): Permission {
    return getAdminPermissions();
  }

  /**
   * Get default user permissions
   */
  getDefaultUserPermissions(): Permission {
    return getUserPermissions();
  }

  /**
   * Create default roles for a company
   */
  async createDefaultRoles(companyId: string) {
    const adminPermissions = getAdminPermissions();
    const userPermissions = getUserPermissions();

    // Create Admin role if not exists
    const adminExists = await roleRepository.existsByNameInCompany("Admin", companyId);
    if (!adminExists) {
      await roleRepository.create({
        name: "Admin",
        description: "Administrator dengan akses penuh",
        companyId,
        permissions: adminPermissions,
      });
    }

    // Create Manager role if not exists
    const managerExists = await roleRepository.existsByNameInCompany("Manager", companyId);
    if (!managerExists) {
      await roleRepository.create({
        name: "Manager",
        description: "Manager dengan akses terbatas",
        companyId,
        permissions: adminPermissions, // Same as admin but can be customized
      });
    }

    // Create User role if not exists
    const userExists = await roleRepository.existsByNameInCompany("User", companyId);
    if (!userExists) {
      await roleRepository.create({
        name: "User",
        description: "User dengan akses view only",
        companyId,
        permissions: userPermissions,
      });
    }
  }

  /**
   * Check user permission for specific action
   */
  async checkPermission(
    roleId: string,
    module: keyof Permission,
    subModule: string,
    action: "view" | "create" | "edit" | "delete" | "approve"
  ): Promise<boolean> {
    const permissions = await this.getRolePermissions(roleId);
    if (!permissions) return false;

    const modulePermissions = permissions[module] as Record<string, Record<string, boolean>> | undefined;
    if (!modulePermissions) return false;

    const subModulePermissions = modulePermissions[subModule];
    if (!subModulePermissions) return false;

    return subModulePermissions[action] ?? false;
  }
}

export const roleService = new RoleService();
