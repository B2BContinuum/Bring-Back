import express from 'express';
import { RoleController } from '../controllers/RoleController';
import { RoleService } from '../services/RoleService';
import { RoleRepository } from '../repositories/RoleRepository';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { sanitizeRequest, validateIdParam } from '../middleware/validationMiddleware';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';

const router = express.Router();

// Initialize repositories
const roleRepository = new RoleRepository();
const userRepository = new UserRepository();

// Initialize services
const roleService = new RoleService(roleRepository);
const userService = new UserService(userRepository);
const authService = new AuthService(userRepository);

// Initialize controllers
const roleController = new RoleController(roleService);

// Initialize middleware
const authMiddleware = new AuthMiddleware(authService, userService);

// Apply sanitization middleware to all routes
router.use(sanitizeRequest);

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Role routes
router.get('/', 
  authMiddleware.hasPermission('admin:access'), 
  roleController.getAllRoles.bind(roleController)
);

router.get('/:id', 
  validateIdParam(),
  authMiddleware.hasPermission('admin:access'), 
  roleController.getRoleById.bind(roleController)
);

router.post('/', 
  authMiddleware.hasPermission('admin:access'), 
  roleController.createRole.bind(roleController)
);

router.put('/:id', 
  validateIdParam(),
  authMiddleware.hasPermission('admin:access'), 
  roleController.updateRole.bind(roleController)
);

router.delete('/:id', 
  validateIdParam(),
  authMiddleware.hasPermission('admin:access'), 
  roleController.deleteRole.bind(roleController)
);

// Permission routes
router.get('/permissions', 
  authMiddleware.hasPermission('admin:access'), 
  roleController.getAllPermissions.bind(roleController)
);

router.get('/permissions/:id', 
  validateIdParam(),
  authMiddleware.hasPermission('admin:access'), 
  roleController.getPermissionById.bind(roleController)
);

router.post('/permissions', 
  authMiddleware.hasPermission('admin:access'), 
  roleController.createPermission.bind(roleController)
);

router.put('/permissions/:id', 
  validateIdParam(),
  authMiddleware.hasPermission('admin:access'), 
  roleController.updatePermission.bind(roleController)
);

router.delete('/permissions/:id', 
  validateIdParam(),
  authMiddleware.hasPermission('admin:access'), 
  roleController.deletePermission.bind(roleController)
);

// Role-Permission routes
router.get('/:roleId/permissions', 
  validateIdParam('roleId'),
  authMiddleware.hasPermission('admin:access'), 
  roleController.getRolePermissions.bind(roleController)
);

router.post('/permissions/assign', 
  authMiddleware.hasPermission('admin:access'), 
  roleController.assignPermissionToRole.bind(roleController)
);

router.post('/permissions/assign-by-name', 
  authMiddleware.hasPermission('admin:access'), 
  roleController.assignPermissionToRoleByName.bind(roleController)
);

router.delete('/:roleId/permissions/:permissionId', 
  validateIdParam('roleId'),
  validateIdParam('permissionId'),
  authMiddleware.hasPermission('admin:access'), 
  roleController.removePermissionFromRole.bind(roleController)
);

// User-Role routes
router.get('/users/:userId/roles', 
  validateIdParam('userId'),
  authMiddleware.hasAnyRole(['admin', 'moderator']), 
  roleController.getUserRoles.bind(roleController)
);

router.get('/users/:userId/permissions', 
  validateIdParam('userId'),
  authMiddleware.hasAnyRole(['admin', 'moderator']), 
  roleController.getUserPermissions.bind(roleController)
);

router.post('/users/assign', 
  authMiddleware.hasPermission('admin:access'), 
  roleController.assignRoleToUser.bind(roleController)
);

router.post('/users/assign-by-name', 
  authMiddleware.hasPermission('admin:access'), 
  roleController.assignRoleToUserByName.bind(roleController)
);

router.delete('/users/:userId/roles/:roleId', 
  validateIdParam('userId'),
  validateIdParam('roleId'),
  authMiddleware.hasPermission('admin:access'), 
  roleController.removeRoleFromUser.bind(roleController)
);

router.get('/users/:userId/has-role/:roleName', 
  validateIdParam('userId'),
  authMiddleware.hasAnyRole(['admin', 'moderator']), 
  roleController.hasRole.bind(roleController)
);

router.get('/users/:userId/has-permission/:permissionName', 
  validateIdParam('userId'),
  authMiddleware.hasAnyRole(['admin', 'moderator']), 
  roleController.hasPermission.bind(roleController)
);

export default router;