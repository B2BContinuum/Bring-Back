import { IRoleRepository, Role, Permission } from '../repositories/RoleRepository';

export interface IRoleService {
  // Role methods
  getAllRoles(): Promise<Role[]>;
  getRoleById(id: string): Promise<Role | null>;
  getRoleByName(name: string): Promise<Role | null>;
  createRole(name: string, description?: string): Promise<Role>;
  updateRole(id: string, name: string, description?: string): Promise<Role | null>;
  deleteRole(id: string): Promise<boolean>;
  
  // Permission methods
  getAllPermissions(): Promise<Permission[]>;
  getPermissionById(id: string): Promise<Permission | null>;
  getPermissionByName(name: string): Promise<Permission | null>;
  createPermission(name: string, description?: string): Promise<Permission>;
  updatePermission(id: string, name: string, description?: string): Promise<Permission | null>;
  deletePermission(id: string): Promise<boolean>;
  
  // User role methods
  getUserRoles(userId: string): Promise<Role[]>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  assignRoleToUser(userId: string, roleId: string): Promise<boolean>;
  assignRoleToUserByName(userId: string, roleName: string): Promise<boolean>;
  removeRoleFromUser(userId: string, roleId: string): Promise<boolean>;
  removeRoleFromUserByName(userId: string, roleName: string): Promise<boolean>;
  hasRole(userId: string, roleName: string): Promise<boolean>;
  hasPermission(userId: string, permissionName: string): Promise<boolean>;
  
  // Role permission methods
  getRolePermissions(roleId: string): Promise<Permission[]>;
  assignPermissionToRole(roleId: string, permissionId: string): Promise<boolean>;
  assignPermissionToRoleByName(roleName: string, permissionName: string): Promise<boolean>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean>;
  removePermissionFromRoleByName(roleName: string, permissionName: string): Promise<boolean>;
}

export class RoleService implements IRoleService {
  constructor(private roleRepository: IRoleRepository) {}

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    return await this.roleRepository.getAllRoles();
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role | null> {
    return await this.roleRepository.getRoleById(id);
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role | null> {
    return await this.roleRepository.getRoleByName(name);
  }

  /**
   * Create a new role
   */
  async createRole(name: string, description?: string): Promise<Role> {
    // Validate role name
    if (!name || name.trim() === '') {
      throw new Error('Role name is required');
    }
    
    // Check if role already exists
    const existingRole = await this.roleRepository.getRoleByName(name);
    if (existingRole) {
      throw new Error(`Role with name '${name}' already exists`);
    }
    
    return await this.roleRepository.createRole(name, description);
  }

  /**
   * Update a role
   */
  async updateRole(id: string, name: string, description?: string): Promise<Role | null> {
    // Validate role name
    if (!name || name.trim() === '') {
      throw new Error('Role name is required');
    }
    
    // Check if role exists
    const existingRole = await this.roleRepository.getRoleById(id);
    if (!existingRole) {
      return null;
    }
    
    // Check if name is already taken by another role
    if (name !== existingRole.name) {
      const roleWithSameName = await this.roleRepository.getRoleByName(name);
      if (roleWithSameName && roleWithSameName.id !== id) {
        throw new Error(`Role with name '${name}' already exists`);
      }
    }
    
    return await this.roleRepository.updateRole(id, name, description);
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<boolean> {
    // Check if role exists
    const existingRole = await this.roleRepository.getRoleById(id);
    if (!existingRole) {
      return false;
    }
    
    // Prevent deletion of system roles
    const systemRoles = ['user', 'admin', 'traveler', 'requester', 'moderator'];
    if (systemRoles.includes(existingRole.name)) {
      throw new Error(`Cannot delete system role '${existingRole.name}'`);
    }
    
    return await this.roleRepository.deleteRole(id);
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await this.roleRepository.getAllPermissions();
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(id: string): Promise<Permission | null> {
    return await this.roleRepository.getPermissionById(id);
  }

  /**
   * Get permission by name
   */
  async getPermissionByName(name: string): Promise<Permission | null> {
    return await this.roleRepository.getPermissionByName(name);
  }

  /**
   * Create a new permission
   */
  async createPermission(name: string, description?: string): Promise<Permission> {
    // Validate permission name
    if (!name || name.trim() === '') {
      throw new Error('Permission name is required');
    }
    
    // Check if permission already exists
    const existingPermission = await this.roleRepository.getPermissionByName(name);
    if (existingPermission) {
      throw new Error(`Permission with name '${name}' already exists`);
    }
    
    return await this.roleRepository.createPermission(name, description);
  }

  /**
   * Update a permission
   */
  async updatePermission(id: string, name: string, description?: string): Promise<Permission | null> {
    // Validate permission name
    if (!name || name.trim() === '') {
      throw new Error('Permission name is required');
    }
    
    // Check if permission exists
    const existingPermission = await this.roleRepository.getPermissionById(id);
    if (!existingPermission) {
      return null;
    }
    
    // Check if name is already taken by another permission
    if (name !== existingPermission.name) {
      const permissionWithSameName = await this.roleRepository.getPermissionByName(name);
      if (permissionWithSameName && permissionWithSameName.id !== id) {
        throw new Error(`Permission with name '${name}' already exists`);
      }
    }
    
    return await this.roleRepository.updatePermission(id, name, description);
  }

  /**
   * Delete a permission
   */
  async deletePermission(id: string): Promise<boolean> {
    // Check if permission exists
    const existingPermission = await this.roleRepository.getPermissionById(id);
    if (!existingPermission) {
      return false;
    }
    
    // Prevent deletion of system permissions
    const systemPermissions = [
      'user:read', 'user:update', 'user:delete',
      'trip:create', 'trip:read', 'trip:update', 'trip:delete',
      'request:create', 'request:read', 'request:update', 'request:delete',
      'payment:create', 'payment:read',
      'rating:create', 'rating:read',
      'admin:access', 'system:manage'
    ];
    
    if (systemPermissions.includes(existingPermission.name)) {
      throw new Error(`Cannot delete system permission '${existingPermission.name}'`);
    }
    
    return await this.roleRepository.deletePermission(id);
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    return await this.roleRepository.getUserRoles(userId);
  }

  /**
   * Get all permissions assigned to a user through their roles
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    return await this.roleRepository.getUserPermissions(userId);
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    // Check if role exists
    const existingRole = await this.roleRepository.getRoleById(roleId);
    if (!existingRole) {
      throw new Error('Role not found');
    }
    
    await this.roleRepository.assignRoleToUser(userId, roleId);
    return true;
  }

  /**
   * Assign a role to a user by role name
   */
  async assignRoleToUserByName(userId: string, roleName: string): Promise<boolean> {
    // Get role by name
    const role = await this.roleRepository.getRoleByName(roleName);
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }
    
    await this.roleRepository.assignRoleToUser(userId, role.id);
    return true;
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    // Check if role exists
    const existingRole = await this.roleRepository.getRoleById(roleId);
    if (!existingRole) {
      throw new Error('Role not found');
    }
    
    // Prevent removal of 'user' role
    if (existingRole.name === 'user') {
      throw new Error("Cannot remove 'user' role from user");
    }
    
    return await this.roleRepository.removeRoleFromUser(userId, roleId);
  }

  /**
   * Remove a role from a user by role name
   */
  async removeRoleFromUserByName(userId: string, roleName: string): Promise<boolean> {
    // Prevent removal of 'user' role
    if (roleName === 'user') {
      throw new Error("Cannot remove 'user' role from user");
    }
    
    // Get role by name
    const role = await this.roleRepository.getRoleByName(roleName);
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }
    
    return await this.roleRepository.removeRoleFromUser(userId, role.id);
  }

  /**
   * Check if a user has a specific role
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    return await this.roleRepository.hasRole(userId, roleName);
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    return await this.roleRepository.hasPermission(userId, permissionName);
  }

  /**
   * Get all permissions assigned to a role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    return await this.roleRepository.getRolePermissions(roleId);
  }

  /**
   * Assign a permission to a role
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<boolean> {
    // Check if role exists
    const existingRole = await this.roleRepository.getRoleById(roleId);
    if (!existingRole) {
      throw new Error('Role not found');
    }
    
    // Check if permission exists
    const existingPermission = await this.roleRepository.getPermissionById(permissionId);
    if (!existingPermission) {
      throw new Error('Permission not found');
    }
    
    await this.roleRepository.assignPermissionToRole(roleId, permissionId);
    return true;
  }

  /**
   * Assign a permission to a role by name
   */
  async assignPermissionToRoleByName(roleName: string, permissionName: string): Promise<boolean> {
    // Get role by name
    const role = await this.roleRepository.getRoleByName(roleName);
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }
    
    // Get permission by name
    const permission = await this.roleRepository.getPermissionByName(permissionName);
    if (!permission) {
      throw new Error(`Permission '${permissionName}' not found`);
    }
    
    await this.roleRepository.assignPermissionToRole(role.id, permission.id);
    return true;
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    // Check if role exists
    const existingRole = await this.roleRepository.getRoleById(roleId);
    if (!existingRole) {
      throw new Error('Role not found');
    }
    
    // Check if permission exists
    const existingPermission = await this.roleRepository.getPermissionById(permissionId);
    if (!existingPermission) {
      throw new Error('Permission not found');
    }
    
    return await this.roleRepository.removePermissionFromRole(roleId, permissionId);
  }

  /**
   * Remove a permission from a role by name
   */
  async removePermissionFromRoleByName(roleName: string, permissionName: string): Promise<boolean> {
    // Get role by name
    const role = await this.roleRepository.getRoleByName(roleName);
    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }
    
    // Get permission by name
    const permission = await this.roleRepository.getPermissionByName(permissionName);
    if (!permission) {
      throw new Error(`Permission '${permissionName}' not found`);
    }
    
    return await this.roleRepository.removePermissionFromRole(role.id, permission.id);
  }
}