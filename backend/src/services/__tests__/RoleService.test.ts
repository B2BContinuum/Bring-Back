import { RoleService } from '../RoleService';

// Mock dependencies
const mockRoleRepository = {
  getAllRoles: jest.fn(),
  getRoleById: jest.fn(),
  getRoleByName: jest.fn(),
  createRole: jest.fn(),
  updateRole: jest.fn(),
  deleteRole: jest.fn(),
  getAllPermissions: jest.fn(),
  getPermissionById: jest.fn(),
  getPermissionByName: jest.fn(),
  createPermission: jest.fn(),
  updatePermission: jest.fn(),
  deletePermission: jest.fn(),
  getUserRoles: jest.fn(),
  getUserPermissions: jest.fn(),
  assignRoleToUser: jest.fn(),
  removeRoleFromUser: jest.fn(),
  hasRole: jest.fn(),
  hasPermission: jest.fn(),
  getRolePermissions: jest.fn(),
  assignPermissionToRole: jest.fn(),
  removePermissionFromRole: jest.fn()
};

describe('RoleService', () => {
  let roleService: RoleService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    roleService = new RoleService(mockRoleRepository);
  });
  
  describe('createRole', () => {
    it('should create a role successfully', async () => {
      // Mock repository
      mockRoleRepository.getRoleByName.mockResolvedValue(null);
      mockRoleRepository.createRole.mockResolvedValue({
        id: 'role123',
        name: 'test-role',
        description: 'Test role',
        createdAt: new Date()
      });
      
      // Call createRole
      const result = await roleService.createRole('test-role', 'Test role');
      
      // Assertions
      expect(mockRoleRepository.getRoleByName).toHaveBeenCalledWith('test-role');
      expect(mockRoleRepository.createRole).toHaveBeenCalledWith('test-role', 'Test role');
      expect(result).toHaveProperty('id', 'role123');
      expect(result).toHaveProperty('name', 'test-role');
    });
    
    it('should throw an error if role name already exists', async () => {
      // Mock repository
      mockRoleRepository.getRoleByName.mockResolvedValue({
        id: 'role123',
        name: 'test-role',
        description: 'Test role',
        createdAt: new Date()
      });
      
      // Call createRole and expect error
      await expect(roleService.createRole('test-role', 'Test role'))
        .rejects.toThrow("Role with name 'test-role' already exists");
      
      // Assertions
      expect(mockRoleRepository.getRoleByName).toHaveBeenCalledWith('test-role');
      expect(mockRoleRepository.createRole).not.toHaveBeenCalled();
    });
    
    it('should throw an error if role name is empty', async () => {
      // Call createRole with empty name and expect error
      await expect(roleService.createRole('', 'Test role'))
        .rejects.toThrow('Role name is required');
      
      // Assertions
      expect(mockRoleRepository.getRoleByName).not.toHaveBeenCalled();
      expect(mockRoleRepository.createRole).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteRole', () => {
    it('should delete a role successfully', async () => {
      // Mock repository
      mockRoleRepository.getRoleById.mockResolvedValue({
        id: 'role123',
        name: 'custom-role',
        description: 'Custom role',
        createdAt: new Date()
      });
      mockRoleRepository.deleteRole.mockResolvedValue(true);
      
      // Call deleteRole
      const result = await roleService.deleteRole('role123');
      
      // Assertions
      expect(mockRoleRepository.getRoleById).toHaveBeenCalledWith('role123');
      expect(mockRoleRepository.deleteRole).toHaveBeenCalledWith('role123');
      expect(result).toBe(true);
    });
    
    it('should return false if role does not exist', async () => {
      // Mock repository
      mockRoleRepository.getRoleById.mockResolvedValue(null);
      
      // Call deleteRole
      const result = await roleService.deleteRole('nonexistent');
      
      // Assertions
      expect(mockRoleRepository.getRoleById).toHaveBeenCalledWith('nonexistent');
      expect(mockRoleRepository.deleteRole).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
    
    it('should throw an error when trying to delete a system role', async () => {
      // Mock repository for system roles
      const systemRoles = ['user', 'admin', 'traveler', 'requester', 'moderator'];
      
      for (const roleName of systemRoles) {
        mockRoleRepository.getRoleById.mockResolvedValue({
          id: `role-${roleName}`,
          name: roleName,
          description: `${roleName} role`,
          createdAt: new Date()
        });
        
        // Call deleteRole and expect error
        await expect(roleService.deleteRole(`role-${roleName}`))
          .rejects.toThrow(`Cannot delete system role '${roleName}'`);
        
        // Assertions
        expect(mockRoleRepository.getRoleById).toHaveBeenCalledWith(`role-${roleName}`);
        expect(mockRoleRepository.deleteRole).not.toHaveBeenCalled();
      }
    });
  });
  
  describe('hasPermission', () => {
    it('should check if user has permission', async () => {
      // Mock repository
      mockRoleRepository.hasPermission.mockResolvedValue(true);
      
      // Call hasPermission
      const result = await roleService.hasPermission('user123', 'trip:create');
      
      // Assertions
      expect(mockRoleRepository.hasPermission).toHaveBeenCalledWith('user123', 'trip:create');
      expect(result).toBe(true);
    });
  });
  
  describe('assignRoleToUserByName', () => {
    it('should assign role to user by name', async () => {
      // Mock repository
      mockRoleRepository.getRoleByName.mockResolvedValue({
        id: 'role123',
        name: 'traveler',
        description: 'Traveler role',
        createdAt: new Date()
      });
      mockRoleRepository.assignRoleToUser.mockResolvedValue({
        id: 'user-role-123',
        userId: 'user123',
        roleId: 'role123',
        createdAt: new Date()
      });
      
      // Call assignRoleToUserByName
      const result = await roleService.assignRoleToUserByName('user123', 'traveler');
      
      // Assertions
      expect(mockRoleRepository.getRoleByName).toHaveBeenCalledWith('traveler');
      expect(mockRoleRepository.assignRoleToUser).toHaveBeenCalledWith('user123', 'role123');
      expect(result).toBe(true);
    });
    
    it('should throw an error if role does not exist', async () => {
      // Mock repository
      mockRoleRepository.getRoleByName.mockResolvedValue(null);
      
      // Call assignRoleToUserByName and expect error
      await expect(roleService.assignRoleToUserByName('user123', 'nonexistent'))
        .rejects.toThrow("Role 'nonexistent' not found");
      
      // Assertions
      expect(mockRoleRepository.getRoleByName).toHaveBeenCalledWith('nonexistent');
      expect(mockRoleRepository.assignRoleToUser).not.toHaveBeenCalled();
    });
  });
  
  describe('removeRoleFromUserByName', () => {
    it('should remove role from user by name', async () => {
      // Mock repository
      mockRoleRepository.getRoleByName.mockResolvedValue({
        id: 'role123',
        name: 'traveler',
        description: 'Traveler role',
        createdAt: new Date()
      });
      mockRoleRepository.removeRoleFromUser.mockResolvedValue(true);
      
      // Call removeRoleFromUserByName
      const result = await roleService.removeRoleFromUserByName('user123', 'traveler');
      
      // Assertions
      expect(mockRoleRepository.getRoleByName).toHaveBeenCalledWith('traveler');
      expect(mockRoleRepository.removeRoleFromUser).toHaveBeenCalledWith('user123', 'role123');
      expect(result).toBe(true);
    });
    
    it('should throw an error when trying to remove user role', async () => {
      // Call removeRoleFromUserByName and expect error
      await expect(roleService.removeRoleFromUserByName('user123', 'user'))
        .rejects.toThrow("Cannot remove 'user' role from user");
      
      // Assertions
      expect(mockRoleRepository.getRoleByName).not.toHaveBeenCalled();
      expect(mockRoleRepository.removeRoleFromUser).not.toHaveBeenCalled();
    });
  });
});