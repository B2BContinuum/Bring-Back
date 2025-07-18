import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        verified: boolean;
      };
    }
  }
}

/**
 * Authentication middleware - validates JWT token
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  // Implementation will be added in later tasks
  // For now, just pass through
  next();
}

/**
 * Authorization middleware - checks if user has required permissions
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Implementation will be added in later tasks
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }
  next();
}

/**
 * Verification middleware - checks if user is verified
 */
export function requireVerification(req: Request, res: Response, next: NextFunction): void {
  // Implementation will be added in later tasks
  if (!req.user?.verified) {
    sendError(res, 'Account verification required', 403);
    return;
  }
  next();
}