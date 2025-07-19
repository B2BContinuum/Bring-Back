import { Request, Response } from 'express';
import { IRoleService } from '../services/RoleService';
import { validateRequestBody } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional()
});

const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional()
});

const createPermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required'),
  description: z.string().optional()
});

const updatePermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required'),
  description: z.string().optional()
});

const assignRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  roleId: z.string().uuid('Invalid role ID')
});

const assignRoleByNameSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  roleName: z.string().min(1, 'Role name is required')
});

const assignPermissionSchema = z.object({
  roleId: z.string().uuid('Invalid role ID'),
  permissionId: z.string().uuid('Invalid permission ID')
});

const assignPermissionByNameSchema = z.object({
  roleName: z.string().min(1, 'Role name is required'),
  permissionName: z.string().min(1, 'Permission name is required')
});

export class RoleController {
  constructor(private roleService: IRoleService) {}

  /**
   * Get all roles
   * GET /api/roles
   */
  async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await this.roleService.getAllRoles();
      
      res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get role by ID
   * GET /api/roles/:id
   */
  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const roleId = req.params.id;
      const role = await this.roleService.getRoleById(roleId);
      
      if (!role) {
        res.status(404).json({
          success: false,
          error: 'Role not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: role
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create a new role
   * POST /api/roles
   */
  async createRole(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(createRoleSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid role data',
          details: validation.errors
        });
        return;
      }
      
      const { name, description } = req.body;
      const role = await this.roleService.createRole(name, description);
      
      res.status(201).json({
        success: true,
        data: role
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update a role
   * PUT /api/roles/:id
   */
  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(updateRoleSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid role data',
          details: validation.errors
        });
        return;
      }
      
      const roleId = req.params.id;
      const { name, description } = req.body;
      
      const role = await this.roleService.updateRole(roleId, name, description);
      
      if (!role) {
        res.status(404).json({
          success: false,
          error: 'Role not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: role
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete a role
   * DELETE /api/roles/:id
   */
  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const roleId = req.params.id;
      const success = await this.roleService.deleteRole(roleId);
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Role not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all permissions
   * GET /api/permissions
   */
  async getAllPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await this.roleService.getAllPermissions();
      
      res.status(200).json({
        success: true,
        data: permissions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get permission by ID
   * GET /api/permissions/:id
   */
  async getPermissionById(req: Request, res: Response): Promise<void> {
    try {
      const permissionId = req.params.id;
      const permission = await this.roleService.getPermissionById(permissionId);
      
      if (!permission) {
        res.status(404).json({
          success: false,
          error: 'Permission not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: permission
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create a new permission
   * POST /api/permissions
   */
  async createPermission(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(createPermissionSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid permission data',
          details: validation.errors
        });
        return;
      }
      
      const { name, description } = req.body;
      const permission = await this.roleService.createPermission(name, description);
      
      res.status(201).json({
        success: true,
        data: permission
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update a permission
   * PUT /api/permissions/:id
   */
  async updatePermission(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(updatePermissionSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid permission data',
          details: validation.errors
        });
        return;
      }
      
      const permissionId = req.params.id;
      const { name, description } = req.body;
      
      const permission = await this.roleService.updatePermission(permissionId, name, description);
      
      if (!permission) {
        res.status(404).json({
          success: false,
          error: 'Permission not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: permission
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete a permission
   * DELETE /api/permissions/:id
   */
  async deletePermission(req: Request, res: Response): Promise<void> {
    try {
      const permissionId = req.params.id;
      const success = await this.roleService.deletePermission(permissionId);
      
      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Permission not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Permission deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user roles
   * GET /api/users/:userId/roles
   */
  async getUserRoles(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const roles = await this.roleService.getUserRoles(userId);
      
      res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user permissions
   * GET /api/users/:userId/permissions
   */
  async getUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const permissions = await this.roleService.getUserPermissions(userId);
      
      res.status(200).json({
        success: true,
        data: permissions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Assign role to user
   * POST /api/users/roles
   */
  async assignRoleToUser(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(assignRoleSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid data',
          details: validation.errors
        });
        return;
      }
      
      const { userId, roleId } = req.body;
      await this.roleService.assignRoleToUser(userId, roleId);
      
      res.status(200).json({
        success: true,
        message: 'Role assigned successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Assign role to user by name
   * POST /api/users/roles/by-name
   */
  async assignRoleToUserByName(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(assignRoleByNameSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid data',
          details: validation.errors
        });
        return;
      }
      
      const { userId, roleName } = req.body;
      await this.roleService.assignRoleToUserByName(userId, roleName);
      
      res.status(200).json({
        success: true,
        message: 'Role assigned successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Remove role from user
   * DELETE /api/users/:userId/roles/:roleId
   */
  async removeRoleFromUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const roleId = req.params.roleId;
      
      await this.roleService.removeRoleFromUser(userId, roleId);
      
      res.status(200).json({
        success: true,
        message: 'Role removed successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Check if user has role
   * GET /api/users/:userId/has-role/:roleName
   */
  async hasRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const roleName = req.params.roleName;
      
      const hasRole = await this.roleService.hasRole(userId, roleName);
      
      res.status(200).json({
        success: true,
        data: { hasRole }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Check if user has permission
   * GET /api/users/:userId/has-permission/:permissionName
   */
  async hasPermission(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const permissionName = req.params.permissionName;
      
      const hasPermission = await this.roleService.hasPermission(userId, permissionName);
      
      res.status(200).json({
        success: true,
        data: { hasPermission }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get role permissions
   * GET /api/roles/:roleId/permissions
   */
  async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const roleId = req.params.roleId;
      const permissions = await this.roleService.getRolePermissions(roleId);
      
      res.status(200).json({
        success: true,
        data: permissions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Assign permission to role
   * POST /api/roles/permissions
   */
  async assignPermissionToRole(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(assignPermissionSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid data',
          details: validation.errors
        });
        return;
      }
      
      const { roleId, permissionId } = req.body;
      await this.roleService.assignPermissionToRole(roleId, permissionId);
      
      res.status(200).json({
        success: true,
        message: 'Permission assigned successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Assign permission to role by name
   * POST /api/roles/permissions/by-name
   */
  async assignPermissionToRoleByName(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(assignPermissionByNameSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid data',
          details: validation.errors
        });
        return;
      }
      
      const { roleName, permissionName } = req.body;
      await this.roleService.assignPermissionToRoleByName(roleName, permissionName);
      
      res.status(200).json({
        success: true,
        message: 'Permission assigned successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Remove permission from role
   * DELETE /api/roles/:roleId/permissions/:permissionId
   */
  async removePermissionFromRole(req: Request, res: Response): Promise<void> {
    try {
      const roleId = req.params.roleId;
      const permissionId = req.params.permissionId;
      
      await this.roleService.removePermissionFromRole(roleId, permissionId);
      
      res.status(200).json({
        success: true,
        message: 'Permission removed successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}