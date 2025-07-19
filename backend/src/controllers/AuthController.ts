import { Request, Response } from 'express';
import { IAuthService } from '../services/AuthService';
import { validateRequestBody } from '../utils/validation';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required')
  }).optional(),
  profileImage: z.string().url().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const verifyCodeSchema = z.object({
  code: z.string().min(4, 'Verification code is required')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

const resetPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export class AuthController {
  constructor(private authService: IAuthService) {}

  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(registerSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid registration data',
          details: validation.errors
        });
        return;
      }

      const { password, ...userData } = req.body;
      
      // Register user
      const user = await this.authService.register(userData, password);
      
      // Remove sensitive information before sending response
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: userResponse
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(loginSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid login data',
          details: validation.errors
        });
        return;
      }

      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];
      
      // Login user
      const tokens = await this.authService.login(email, password, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: tokens
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh-token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(refreshTokenSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid refresh token data',
          details: validation.errors
        });
        return;
      }

      const { refreshToken } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];
      
      // Refresh token
      const tokens = await this.authService.refreshToken(refreshToken, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(refreshTokenSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid logout data',
          details: validation.errors
        });
        return;
      }

      const { refreshToken } = req.body;
      
      // Logout user
      await this.authService.logout(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Logout user from all devices
   * POST /api/auth/logout-all
   */
  async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // Logout user from all devices
      await this.authService.logoutAll(userId);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send email verification code
   * POST /api/auth/send-email-verification
   */
  async sendEmailVerification(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // Send email verification
      await this.authService.sendEmailVerification(userId);

      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verify email with code
   * POST /api/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // Validate request body
      const validation = validateRequestBody(verifyCodeSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid verification data',
          details: validation.errors
        });
        return;
      }

      const { code } = req.body;
      
      // Verify email
      await this.authService.verifyEmail(userId, code);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send phone verification code
   * POST /api/auth/send-phone-verification
   */
  async sendPhoneVerification(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // Send phone verification
      await this.authService.sendPhoneVerification(userId);

      res.status(200).json({
        success: true,
        message: 'Verification SMS sent'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Verify phone with code
   * POST /api/auth/verify-phone
   */
  async verifyPhone(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // Validate request body
      const validation = validateRequestBody(verifyCodeSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid verification data',
          details: validation.errors
        });
        return;
      }

      const { code } = req.body;
      
      // Verify phone
      await this.authService.verifyPhone(userId, code);

      res.status(200).json({
        success: true,
        message: 'Phone verified successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // Validate request body
      const validation = validateRequestBody(changePasswordSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid password data',
          details: validation.errors
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      
      // Change password
      await this.authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Request password reset
   * POST /api/auth/request-password-reset
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(resetPasswordRequestSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid email',
          details: validation.errors
        });
        return;
      }

      const { email } = req.body;
      
      // Request password reset
      await this.authService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    } catch (error: any) {
      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validation = validateRequestBody(resetPasswordSchema, req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid reset data',
          details: validation.errors
        });
        return;
      }

      const { token, newPassword } = req.body;
      
      // Reset password
      await this.authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}