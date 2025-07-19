import { AuthMiddleware } from '../authMiddleware';
import { Request, Response, NextFunction } from 'express';

// Mock dependencies
const mockAuthService = {
  validateToken: jest.fn()
};

const mockUserService = {
  getUserById: jest.fn()
};

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    jest.clearAllMocks();
    authMiddleware = new AuthMiddleware(mockAuthService as any, mockUserService as any);
    
    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock next function
    mockNext = jest.fn();
  });
  
  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      // Mock request with valid token
      mockRequest = {
        headers: {
          authorization: 'Bearer valid_token'
        }
      };
      
      // Mock auth service
      mockAuthService.validateToken.mockResolvedValue({
        valid: true,
        userId: 'user123'
      });
      
      // Mock user service
      mockUserService.getUserById.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        verificationStatus: 'FULLY_VERIFIED'
      });
      
      // Call authenticate
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid_token');
      expect(mockUserService.getUserById).toHaveBeenCalledWith('user123');
      expect(mockRequest.user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        verificationStatus: 'FULLY_VERIFIED',
        roles: ['user']
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
    
    it('should reject request without authorization header', async () => {
      // Mock request without authorization header
      mockRequest = {
        headers: {}
      };
      
      // Call authenticate
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockAuthService.validateToken).not.toHaveBeenCalled();
      expect(mockUserService.getUserById).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
    });
    
    it('should reject request with invalid token', async () => {
      // Mock request with invalid token
      mockRequest = {
        headers: {
          authorization: 'Bearer invalid_token'
        }
      };
      
      // Mock auth service
      mockAuthService.validateToken.mockResolvedValue({
        valid: false
      });
      
      // Call authenticate
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('invalid_token');
      expect(mockUserService.getUserById).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
    });
    
    it('should reject request if user not found', async () => {
      // Mock request with valid token but non-existent user
      mockRequest = {
        headers: {
          authorization: 'Bearer valid_token'
        }
      };
      
      // Mock auth service
      mockAuthService.validateToken.mockResolvedValue({
        valid: true,
        userId: 'nonexistent'
      });
      
      // Mock user service
      mockUserService.getUserById.mockResolvedValue(null);
      
      // Call authenticate
      await authMiddleware.authenticate(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid_token');
      expect(mockUserService.getUserById).toHaveBeenCalledWith('nonexistent');
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });
  
  describe('requireEmailVerification', () => {
    it('should allow request if email is verified', () => {
      // Mock request with verified email
      mockRequest = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          verificationStatus: 'EMAIL_VERIFIED',
          roles: ['user']
        }
      };
      
      // Call requireEmailVerification
      authMiddleware.requireEmailVerification(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
    
    it('should allow request if fully verified', () => {
      // Mock request with fully verified user
      mockRequest = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          verificationStatus: 'FULLY_VERIFIED',
          roles: ['user']
        }
      };
      
      // Call requireEmailVerification
      authMiddleware.requireEmailVerification(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
    
    it('should reject request if email is not verified', () => {
      // Mock request with unverified email
      mockRequest = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          verificationStatus: 'UNVERIFIED',
          roles: ['user']
        }
      };
      
      // Call requireEmailVerification
      authMiddleware.requireEmailVerification(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email verification required',
        verificationStatus: 'UNVERIFIED'
      });
    });
    
    it('should reject request if not authenticated', () => {
      // Mock request without user
      mockRequest = {};
      
      // Call requireEmailVerification
      authMiddleware.requireEmailVerification(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
    });
  });
  
  describe('hasRole', () => {
    it('should allow request if user has required role', () => {
      // Mock request with admin role
      mockRequest = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          verificationStatus: 'FULLY_VERIFIED',
          roles: ['user', 'admin']
        }
      };
      
      // Create middleware function
      const middleware = authMiddleware.hasRole('admin');
      
      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
    
    it('should reject request if user does not have required role', () => {
      // Mock request without admin role
      mockRequest = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          verificationStatus: 'FULLY_VERIFIED',
          roles: ['user']
        }
      };
      
      // Create middleware function
      const middleware = authMiddleware.hasRole('admin');
      
      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions'
      });
    });
    
    it('should reject request if not authenticated', () => {
      // Mock request without user
      mockRequest = {};
      
      // Create middleware function
      const middleware = authMiddleware.hasRole('admin');
      
      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
    });
  });
  
  describe('hasAnyRole', () => {
    it('should allow request if user has any of the required roles', () => {
      // Mock request with moderator role
      mockRequest = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          verificationStatus: 'FULLY_VERIFIED',
          roles: ['user', 'moderator']
        }
      };
      
      // Create middleware function
      const middleware = authMiddleware.hasAnyRole(['admin', 'moderator']);
      
      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
    
    it('should reject request if user does not have any of the required roles', () => {
      // Mock request without admin or moderator role
      mockRequest = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          verificationStatus: 'FULLY_VERIFIED',
          roles: ['user']
        }
      };
      
      // Create middleware function
      const middleware = authMiddleware.hasAnyRole(['admin', 'moderator']);
      
      // Call middleware
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      
      // Assertions
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions'
      });
    });
  });
});