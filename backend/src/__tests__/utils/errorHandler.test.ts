import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { 
  AppError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ValidationError, 
  ConflictError, 
  ServiceUnavailableError, 
  errorHandler, 
  asyncHandler 
} from '../../utils/errorHandler';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Error Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      path: '/test',
      method: 'GET',
      headers: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    nextFunction = jest.fn();
  });

  describe('Custom Error Classes', () => {
    test('AppError should set statusCode and isOperational', () => {
      const error = new AppError('Test error', 400);
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.message).toBe('Test error');
    });

    test('NotFoundError should have 404 status code', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    test('UnauthorizedError should have 401 status code', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized access');
    });

    test('ForbiddenError should have 403 status code', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden access');
    });

    test('ValidationError should have 400 status code and errors array', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', errors);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toEqual(errors);
    });

    test('ConflictError should have 409 status code', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource conflict');
    });

    test('ServiceUnavailableError should have 503 status code', () => {
      const error = new ServiceUnavailableError();
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Service temporarily unavailable');
    });
  });

  describe('Error Handler Middleware', () => {
    test('should handle AppError', () => {
      const error = new NotFoundError('User not found');
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          timestamp: expect.any(String),
        }
      });
    });

    test('should handle ValidationError with details', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', errors);
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION',
          message: 'Validation failed',
          details: errors,
          timestamp: expect.any(String),
        }
      });
    });

    test('should handle ZodError', () => {
      const schema = z.object({
        email: z.string().email(),
      });
      
      let zodError: ZodError;
      try {
        schema.parse({ email: 'invalid-email' });
      } catch (error) {
        zodError = error as ZodError;
        errorHandler(zodError, mockRequest as Request, mockResponse as Response, nextFunction);
        
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: expect.any(Array),
            timestamp: expect.any(String),
          }
        });
      }
    });

    test('should handle database duplicate key error', () => {
      const error = new Error('duplicate key value violates unique constraint');
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
          timestamp: expect.any(String),
        }
      });
    });

    test('should handle JWT errors', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
          timestamp: expect.any(String),
        }
      });
    });

    test('should handle unknown errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Some unexpected error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp: expect.any(String),
        }
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should include error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Some unexpected error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Some unexpected error',
          timestamp: expect.any(String),
          stack: expect.any(String),
        }
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Async Handler', () => {
    test('should handle resolved promises', async () => {
      const handler = asyncHandler(async (req, res) => {
        res.status(200).json({ success: true });
      });
      
      await handler(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
    });

    test('should catch rejected promises', async () => {
      const error = new Error('Async error');
      const handler = asyncHandler(async () => {
        throw error;
      });
      
      await handler(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(error);
    });
  });
});