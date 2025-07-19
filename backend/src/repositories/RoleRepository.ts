import { supabaseAdmin } from '../config/database';

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  createdAt: Date;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
}

export interface IRoleRepository {
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
  assignRoleToUser(userId: string, roleId: string): Promise<UserRole>;
  removeRoleFromUser(userId: string, roleId: string): Promise<boolean>;
  hasRole(userId: string, roleName: string): Promise<boolean>;
  hasPermission(userId: string, permissionName: string): Promise<boolean>;
  
  // Role permission methods
  getRolePermissions(roleId: string): Promise<Permission[]>;
  assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean>;
}

export class RoleRepository implements IRoleRepository {
  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to get roles: ${error.message}`);
    }

    return data.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: new Date(role.created_at)
    }));
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to get role by ID: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to get role by name: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Create a new role
   */
  async createRole(name: string, description?: string): Promise<Role> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('roles')
      .insert({
        name,
        description,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create role: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Update a role
   */
  async updateRole(id: string, name: string, description?: string): Promise<Role | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('roles')
      .update({
        name,
        description
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update role: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { error } = await supabaseAdmin
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete role: ${error.message}`);
    }

    return true;
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('permissions')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to get permissions: ${error.message}`);
    }

    return data.map(permission => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      createdAt: new Date(permission.created_at)
    }));
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(id: string): Promise<Permission | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('permissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to get permission by ID: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Get permission by name
   */
  async getPermissionByName(name: string): Promise<Permission | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('permissions')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to get permission by name: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Create a new permission
   */
  async createPermission(name: string, description?: string): Promise<Permission> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('permissions')
      .insert({
        name,
        description,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create permission: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Update a permission
   */
  async updatePermission(id: string, name: string, description?: string): Promise<Permission | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('permissions')
      .update({
        name,
        description
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update permission: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Delete a permission
   */
  async deletePermission(id: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { error } = await supabaseAdmin
      .from('permissions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete permission: ${error.message}`);
    }

    return true;
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles(*)')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get user roles: ${error.message}`);
    }

    return data.map(item => ({
      id: item.roles.id,
      name: item.roles.name,
      description: item.roles.description,
      createdAt: new Date(item.roles.created_at)
    }));
  }

  /**
   * Get all permissions assigned to a user through their roles
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select(`
        role_id,
        roles!inner(
          role_permissions(
            permission_id,
            permissions!inner(*)
          )
        )
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get user permissions: ${error.message}`);
    }

    // Extract unique permissions from the nested structure
    const permissionsMap = new Map<string, Permission>();
    
    data.forEach(userRole => {
      userRole.roles.role_permissions.forEach((rolePermission: any) => {
        const permission = rolePermission.permissions;
        permissionsMap.set(permission.id, {
          id: permission.id,
          name: permission.name,
          description: permission.description,
          createdAt: new Date(permission.created_at)
        });
      });
    });
    
    return Array.from(permissionsMap.values());
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<UserRole> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign role to user: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      roleId: data.role_id,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) {
      throw new Error(`Failed to remove role from user: ${error.message}`);
    }

    return true;
  }

  /**
   * Check if a user has a specific role
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('roles!inner(*)')
      .eq('user_id', userId)
      .eq('roles.name', roleName);

    if (error) {
      throw new Error(`Failed to check user role: ${error.message}`);
    }

    return data.length > 0;
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select(`
        roles!inner(
          role_permissions!inner(
            permissions!inner(*)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('roles.role_permissions.permissions.name', permissionName);

    if (error) {
      throw new Error(`Failed to check user permission: ${error.message}`);
    }

    return data.length > 0;
  }

  /**
   * Get all permissions assigned to a role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .select('permission_id, permissions(*)')
      .eq('role_id', roleId);

    if (error) {
      throw new Error(`Failed to get role permissions: ${error.message}`);
    }

    return data.map(item => ({
      id: item.permissions.id,
      name: item.permissions.name,
      description: item.permissions.description,
      createdAt: new Date(item.permissions.created_at)
    }));
  }

  /**
   * Assign a permission to a role
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .insert({
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign permission to role: ${error.message}`);
    }

    return {
      id: data.id,
      roleId: data.role_id,
      permissionId: data.permission_id,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { error } = await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);

    if (error) {
      throw new Error(`Failed to remove permission from role: ${error.message}`);
    }

    return true;
  }
}