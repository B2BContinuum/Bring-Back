import { AuthService } from '../AuthService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
const mockUserRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  update: jest.fn(),
  updateRating: jest.fn(),
  updateVerificationStatus: jest.fn(),
  delete: jest.fn(),
  addRating: jest.fn(),
  getUserRatings: jest.fn(),
  getUserAverageRating: jest.fn(),
  mapDbUserToModel: jest.fn()
};

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn().mockReturnValue({ userId: 'user123' })
}));

// Mock database
jest.mock('../../config/database', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation(callback => callback({ data: {}, error: null }))
    })
  }
}));

describe('AuthService', () => {
  let authService: AuthService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(mockUserRepository);
    
    // Set environment variables for testing
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });
  
  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock validation
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        validate: jest.fn().mockReturnValue({ isValid: true, errors: [] })
      };
      
      // Mock user repository
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      });
      mockUserRepository.mapDbUserToModel.mockReturnValue(mockUser);
      
      // Call register
      const result = await authService.register({
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890'
      }, 'Password123!');
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
    
    it('should throw an error if user already exists', async () => {
      // Mock user repository
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com'
      });
      
      // Call register and expect error
      await expect(authService.register({
        email: 'test@example.com',
        name: 'Test User'
      }, 'Password123!')).rejects.toThrow('User with this email already exists');
    });
    
    it('should throw an error if password is weak', async () => {
      // Mock user repository
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Call register with weak password and expect error
      await expect(authService.register({
        email: 'test@example.com',
        name: 'Test User'
      }, 'password')).rejects.toThrow('Password must contain at least one uppercase letter');
    });
  });
  
  describe('login', () => {
    it('should login user successfully', async () => {
      // Mock user repository
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      });
      
      // Call login
      const result = await authService.login('test@example.com', 'Password123!');
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });
    
    it('should throw an error if user not found', async () => {
      // Mock user repository
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Call login and expect error
      await expect(authService.login('test@example.com', 'Password123!')).rejects.toThrow('Invalid email or password');
    });
    
    it('should throw an error if password is incorrect', async () => {
      // Mock user repository
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      });
      
      // Mock bcrypt compare to return false
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      
      // Call login and expect error
      await expect(authService.login('test@example.com', 'WrongPassword123!')).rejects.toThrow('Invalid email or password');
    });
  });
  
  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      // Call validateToken
      const result = await authService.validateToken('valid_token');
      
      // Assertions
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', 'test_secret');
      expect(result).toEqual({ valid: true, userId: 'user123' });
    });
    
    it('should return invalid for an invalid token', async () => {
      // Mock jwt verify to throw error
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      // Call validateToken
      const result = await authService.validateToken('invalid_token');
      
      // Assertions
      expect(result).toEqual({ valid: false });
    });
  });
  
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Mock user repository
      mockUserRepository.findById.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'old_hashed_password'
      });
      
      // Call changePassword
      const result = await authService.changePassword('user123', 'OldPassword123!', 'NewPassword123!');
      
      // Assertions
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user123');
      expect(bcrypt.compare).toHaveBeenCalledWith('OldPassword123!', 'old_hashed_password');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should throw an error if current password is incorrect', async () => {
      // Mock user repository
      mockUserRepository.findById.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'old_hashed_password'
      });
      
      // Mock bcrypt compare to return false
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      
      // Call changePassword and expect error
      await expect(authService.changePassword('user123', 'WrongPassword123!', 'NewPassword123!')).rejects.toThrow('Current password is incorrect');
    });
  });
  
  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      // Mock user repository
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com'
      });
      
      // Call requestPasswordReset
      const result = await authService.requestPasswordReset('test@example.com');
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should return true even if email does not exist (for security)', async () => {
      // Mock user repository
      mockUserRepository.findByEmail.mockResolvedValue(null);
      
      // Call requestPasswordReset
      const result = await authService.requestPasswordReset('nonexistent@example.com');
      
      // Assertions
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
  
  // Additional tests for other methods would follow the same pattern
});