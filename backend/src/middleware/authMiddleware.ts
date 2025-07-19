import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../services/AuthService';
import { IUserService } from '../services/UserService';
import rateLimit from 'express-rate-limit';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        verificationStatus: string;
        roles: string[];
      };
    }
  }
}

export class AuthMiddleware {
  constructor(
    private authService: IAuthService,
    private userService: IUserService
  ) {}

  /**
   * Middleware to authenticate requests using JWT
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const token = authHeader.split(' ')[1];
      
      // Validate token
      const { valid, userId } = await this.authService.validateToken(token);
      
      if (!valid || !userId) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
        return;
      }
      
      // Get user from database
      const user = await this.userService.getUserById(userId);
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // Add user to request object
      req.user = {
        id: user.id,
        email: user.email,
        verificationStatus: user.verificationStatus,
        roles: ['user'] // Default role, can be expanded later
      };
      
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  };

  /**
   * Middleware to require email verification
   */
  requireEmailVerification = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const user = req.user;
    
    if (user.verificationStatus !== 'EMAIL_VERIFIED' && 
        user.verificationStatus !== 'FULLY_VERIFIED') {
      res.status(403).json({
        success: false,
        error: 'Email verification required',
        verificationStatus: user.verificationStatus
      });
      return;
    }
    
    next();
  };

  /**
   * Middleware to require phone verification
   */
  requirePhoneVerification = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const user = req.user;
    
    if (user.verificationStatus !== 'PHONE_VERIFIED' && 
        user.verificationStatus !== 'FULLY_VERIFIED') {
      res.status(403).json({
        success: false,
        error: 'Phone verification required',
        verificationStatus: user.verificationStatus
      });
      return;
    }
    
    next();
  };

  /**
   * Middleware to require full verification
   */
  requireFullVerification = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const user = req.user;
    
    if (user.verificationStatus !== 'FULLY_VERIFIED') {
      res.status(403).json({
        success: false,
        error: 'Full verification required',
        verificationStatus: user.verificationStatus
      });
      return;
    }
    
    next();
  };

  /**
   * Middleware to check if user has required role
   */
  hasRole = (role: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const user = req.user;
      
      if (!user.roles.includes(role)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
        return;
      }
      
      next();
    };
  };

  /**
   * Middleware to check if user has any of the required roles
   */
  hasAnyRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const user = req.user;
      
      const hasRequiredRole = roles.some(role => user.roles.includes(role));
      
      if (!hasRequiredRole) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
        return;
      }
      
      next();
    };
  };
}

/**
 * Rate limiting middleware for login attempts
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later'
  }
});

/**
 * Rate limiting middleware for registration
 */
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 accounts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many registration attempts, please try again later'
  }
});

/**
 * Rate limiting middleware for password reset requests
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many password reset attempts, please try again later'
  }
});

/**
 * Rate limiting middleware for verification code requests
 */
export const verificationCodeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many verification code requests, please try again later'
  }
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});