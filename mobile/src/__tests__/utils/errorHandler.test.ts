import { createError, retryWithBackoff, ErrorType } from '../../utils/errorHandler';

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
  describe('createError', () => {
    test('should handle network errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined,
        message: 'Network Error',
      };
      
      const appError = createError(axiosError);
      expect(appError.type).toBe(ErrorType.NETWORK);
      expect(appError.message).toContain('Network connection error');
      expect(appError.originalError).toBe(axiosError);
    });

    test('should handle validation errors (400)', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            error: {
              message: 'Invalid email format',
              code: 'VALIDATION_ERROR',
              details: [{ field: 'email', message: 'Invalid format' }],
            },
          },
        },
      };
      
      const appError = createError(axiosError);
      expect(appError.type).toBe(ErrorType.VALIDATION);
      expect(appError.message).toBe('Invalid email format');
      expect(appError.code).toBe('VALIDATION_ERROR');
      expect(appError.details).toEqual([{ field: 'email', message: 'Invalid format' }]);
    });

    test('should handle authentication errors (401)', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            error: {
              message: 'Authentication required',
              code: 'UNAUTHORIZED',
            },
          },
        },
      };
      
      const appError = createError(axiosError);
      expect(appError.type).toBe(ErrorType.AUTHENTICATION);
      expect(appError.message).toBe('Authentication required');
      expect(appError.code).toBe('UNAUTHORIZED');
    });

    test('should handle permission errors (403)', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {
            error: {
              message: 'Insufficient permissions',
              code: 'FORBIDDEN',
            },
          },
        },
      };
      
      const appError = createError(axiosError);
      expect(appError.type).toBe(ErrorType.PERMISSION);
      expect(appError.message).toBe('Insufficient permissions');
      expect(appError.code).toBe('FORBIDDEN');
    });

    test('should handle not found errors (404)', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            error: {
              message: 'Resource not found',
              code: 'NOT_FOUND',
            },
          },
        },
      };
      
      const appError = createError(axiosError);
      expect(appError.type).toBe(ErrorType.NOT_FOUND);
      expect(appError.message).toBe('Resource not found');
      expect(appError.code).toBe('NOT_FOUND');
    });

    test('should handle timeout errors (408)', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 408,
          data: {
            error: {
              message: 'Request timed out',
              code: 'TIMEOUT',
            },
          },
        },
      };
      
      const appError = createError(axiosError);
      expect(appError.type).toBe(ErrorType.TIMEOUT);
      expect(appError.message).toBe('Request timed out');
      expect(appError.code).toBe('TIMEOUT');
    });

    test('should handle server errors (500)', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            error: {
              message: 'Internal server error',
              code: 'SERVER_ERROR',
            },
          },
        },
      };
      
      const appError = createError(axiosError);
      expect(appError.type).toBe(ErrorType.SERVER);
      expect(appError.message).toBe('Internal server error');
      expect(appError.code).toBe('SERVER_ERROR');
    });

    test('should handle standard JS errors', () => {
      const error = new Error('Something went wrong');
      const appError = createError(error);
      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.message).toBe('Something went wrong');
      expect(appError.originalError).toBe(error);
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should return result if function succeeds', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce({ isAxiosError: true, response: undefined })
        .mockResolvedValueOnce('success');
      
      const resultPromise = retryWithBackoff(fn, 3);
      
      // Fast-forward timers
      jest.runAllTimers();
      
      const result = await resultPromise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('should not retry on validation errors', async () => {
      const validationError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: { message: 'Validation error' } },
        },
      };
      
      const fn = jest.fn().mockRejectedValue(validationError);
      
      await expect(retryWithBackoff(fn, 3)).rejects.toEqual(
        expect.objectContaining({
          type: ErrorType.VALIDATION,
        })
      );
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should not retry on authentication errors', async () => {
      const authError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { error: { message: 'Authentication error' } },
        },
      };
      
      const fn = jest.fn().mockRejectedValue(authError);
      
      await expect(retryWithBackoff(fn, 3)).rejects.toEqual(
        expect.objectContaining({
          type: ErrorType.AUTHENTICATION,
        })
      );
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should give up after max retries', async () => {
      const networkError = {
        isAxiosError: true,
        response: undefined,
        message: 'Network Error',
      };
      
      const fn = jest.fn().mockRejectedValue(networkError);
      
      const resultPromise = retryWithBackoff(fn, 3);
      
      // Fast-forward all timers multiple times
      jest.runAllTimers(); // First retry
      jest.runAllTimers(); // Second retry
      jest.runAllTimers(); // Third retry
      
      await expect(resultPromise).rejects.toEqual(
        expect.objectContaining({
          type: ErrorType.NETWORK,
        })
      );
      
      expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });
});