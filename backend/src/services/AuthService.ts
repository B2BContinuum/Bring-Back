import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';
import { VerificationStatus } from '../types/database.types';
import { validateRequestBody, emailSchema, phoneSchema } from '../utils/validation';

// Define interfaces for auth-related data
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface VerificationCode {
  id: string;
  userId: string;
  code: string;
  type: 'email' | 'phone';
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface IAuthService {
  // Registration and account management
  register(userData: Partial<User>, password: string): Promise<User>;
  login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens>;
  refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<boolean>;
  logoutAll(userId: string): Promise<boolean>;
  
  // Email verification
  sendEmailVerification(userId: string): Promise<boolean>;
  verifyEmail(userId: string, code: string): Promise<boolean>;
  
  // Phone verification
  sendPhoneVerification(userId: string): Promise<boolean>;
  verifyPhone(userId: string, code: string): Promise<boolean>;
  
  // Password management
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  requestPasswordReset(email: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  
  // Token validation
  validateToken(token: string): Promise<{ valid: boolean; userId?: string }>;
}

export class AuthService implements IAuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly REFRESH_TOKEN_EXPIRES_IN: number; // in days
  private readonly VERIFICATION_CODE_EXPIRES_IN: number; // in minutes
  private readonly RESET_TOKEN_EXPIRES_IN: number; // in hours

  constructor(
    private userRepository: IUserRepository,
    private emailService?: any, // Will be implemented later
    private smsService?: any // Will be implemented later
  ) {
    // Load configuration from environment variables or use defaults
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
    this.REFRESH_TOKEN_EXPIRES_IN = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || '30'); // 30 days
    this.VERIFICATION_CODE_EXPIRES_IN = parseInt(process.env.VERIFICATION_CODE_EXPIRES_IN || '15'); // 15 minutes
    this.RESET_TOKEN_EXPIRES_IN = parseInt(process.env.RESET_TOKEN_EXPIRES_IN || '24'); // 24 hours
    
    if (process.env.NODE_ENV === 'production' && this.JWT_SECRET === 'your-secret-key-change-in-production') {
      console.warn('WARNING: Using default JWT secret in production environment!');
    }
  }

  /**
   * Register a new user
   */
  async register(userData: Partial<User>, password: string): Promise<User> {
    // Validate user data
    const user = new User(userData);
    const validationResult = user.validate();
    
    if (!validationResult.isValid) {
      throw new Error(`Invalid user data: ${validationResult.errors.join(', ')}`);
    }
    
    // Validate password strength
    this.validatePasswordStrength(password);
    
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + this.RESET_TOKEN_EXPIRES_IN * 60 * 60 * 1000);
    
    // Convert User model to database format with auth fields
    const userInsert = {
      email: user.email,
      name: user.name,
      phone: user.phone || null,
      profile_image: user.profileImage || null,
      address: user.address as any || null,
      rating: user.rating || 0,
      total_deliveries: user.totalDeliveries || 0,
      verification_status: 'pending' as const,
      password_hash: passwordHash,
      email_verified: false,
      phone_verified: false,
      verification_token: verificationToken,
      verification_token_expires_at: verificationTokenExpiresAt.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Create user in database
    const createdUser = await this.userRepository.create(userInsert);
    
    // Send verification email if email service is available
    if (this.emailService) {
      await this.sendEmailVerification(createdUser.id);
    }
    
    // Convert database user to model
    return this.userRepository.mapDbUserToModel(createdUser);
  }

  /**
   * Login user and generate tokens
   */
  async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    // Validate email format
    const emailValidation = validateRequestBody(emailSchema, email);
    if (!emailValidation.success) {
      throw new Error('Invalid email format');
    }
    
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check password
    if (!user.password_hash) {
      throw new Error('User account not properly set up');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Update last login timestamp
    await this.userRepository.update(user.id, {
      last_login_at: new Date().toISOString()
    });
    
    // Generate tokens
    return this.generateTokens(user.id, ipAddress, userAgent);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    // Find refresh token in database
    const tokenRecord = await this.findRefreshToken(refreshToken);
    
    if (!tokenRecord || tokenRecord.revoked_at) {
      throw new Error('Invalid refresh token');
    }
    
    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw new Error('Refresh token expired');
    }
    
    // Revoke current refresh token
    await this.revokeRefreshToken(refreshToken);
    
    // Generate new tokens
    return this.generateTokens(tokenRecord.user_id, ipAddress, userAgent);
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(refreshToken: string): Promise<boolean> {
    return await this.revokeRefreshToken(refreshToken);
  }

  /**
   * Logout user from all devices by revoking all refresh tokens
   */
  async logoutAll(userId: string): Promise<boolean> {
    try {
      // Revoke all refresh tokens for user
      await this.revokeAllRefreshTokens(userId);
      return true;
    } catch (error) {
      console.error('Error logging out all sessions:', error);
      return false;
    }
  }

  /**
   * Send email verification code
   */
  async sendEmailVerification(userId: string): Promise<boolean> {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate verification code
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + this.VERIFICATION_CODE_EXPIRES_IN * 60 * 1000);
    
    // Save verification code to database
    await this.saveVerificationCode(userId, code, 'email', expiresAt);
    
    // Send email with verification code
    if (this.emailService) {
      await this.emailService.sendVerificationEmail(user.email, code);
    } else {
      console.log(`[DEV] Email verification code for ${user.email}: ${code}`);
    }
    
    return true;
  }

  /**
   * Verify email with verification code
   */
  async verifyEmail(userId: string, code: string): Promise<boolean> {
    // Validate verification code
    const isValid = await this.validateVerificationCode(userId, code, 'email');
    
    if (!isValid) {
      throw new Error('Invalid or expired verification code');
    }
    
    // Mark email as verified
    await this.userRepository.update(userId, {
      email_verified: true
    });
    
    // Update verification status if phone is also verified
    const user = await this.userRepository.findById(userId);
    if (user && user.phone_verified) {
      await this.userRepository.updateVerificationStatus(userId, VerificationStatus.FULLY_VERIFIED);
    } else {
      await this.userRepository.updateVerificationStatus(userId, VerificationStatus.EMAIL_VERIFIED);
    }
    
    return true;
  }

  /**
   * Send phone verification code
   */
  async sendPhoneVerification(userId: string): Promise<boolean> {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.phone) {
      throw new Error('User has no phone number');
    }
    
    // Validate phone format
    const phoneValidation = validateRequestBody(phoneSchema, user.phone);
    if (!phoneValidation.success) {
      throw new Error('Invalid phone number format');
    }
    
    // Generate verification code
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + this.VERIFICATION_CODE_EXPIRES_IN * 60 * 1000);
    
    // Save verification code to database
    await this.saveVerificationCode(userId, code, 'phone', expiresAt);
    
    // Send SMS with verification code
    if (this.smsService) {
      await this.smsService.sendVerificationSMS(user.phone, code);
    } else {
      console.log(`[DEV] Phone verification code for ${user.phone}: ${code}`);
    }
    
    return true;
  }

  /**
   * Verify phone with verification code
   */
  async verifyPhone(userId: string, code: string): Promise<boolean> {
    // Validate verification code
    const isValid = await this.validateVerificationCode(userId, code, 'phone');
    
    if (!isValid) {
      throw new Error('Invalid or expired verification code');
    }
    
    // Mark phone as verified
    await this.userRepository.update(userId, {
      phone_verified: true
    });
    
    // Update verification status if email is also verified
    const user = await this.userRepository.findById(userId);
    if (user && user.email_verified) {
      await this.userRepository.updateVerificationStatus(userId, VerificationStatus.FULLY_VERIFIED);
    } else {
      await this.userRepository.updateVerificationStatus(userId, VerificationStatus.PHONE_VERIFIED);
    }
    
    return true;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user || !user.password_hash) {
      throw new Error('User not found or password not set');
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Validate new password strength
    this.validatePasswordStrength(newPassword);
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await this.userRepository.update(userId, {
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    });
    
    // Revoke all refresh tokens for security
    await this.revokeAllRefreshTokens(userId);
    
    return true;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    // Validate email format
    const emailValidation = validateRequestBody(emailSchema, email);
    if (!emailValidation.success) {
      throw new Error('Invalid email format');
    }
    
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return true;
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + this.RESET_TOKEN_EXPIRES_IN * 60 * 60 * 1000);
    
    // Save reset token to database
    await this.userRepository.update(user.id, {
      reset_password_token: resetToken,
      reset_password_token_expires_at: resetTokenExpiresAt.toISOString(),
      updated_at: new Date().toISOString()
    });
    
    // Send password reset email
    if (this.emailService) {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } else {
      console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
    }
    
    return true;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Find user by reset token
    const user = await this.findUserByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    
    // Validate new password strength
    this.validatePasswordStrength(newPassword);
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password and clear reset token
    await this.userRepository.update(user.id, {
      password_hash: passwordHash,
      reset_password_token: null,
      reset_password_token_expires_at: null,
      updated_at: new Date().toISOString()
    });
    
    // Revoke all refresh tokens for security
    await this.revokeAllRefreshTokens(user.id);
    
    return true;
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      return { valid: true, userId: decoded.userId };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(userId: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    // Generate access token
    const accessToken = jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });
    
    // Calculate expiration time in seconds
    const expiresIn = this.getJwtExpiresInSeconds(this.JWT_EXPIRES_IN);
    
    // Generate refresh token
    const refreshToken = uuidv4() + crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRES_IN * 24 * 60 * 60 * 1000);
    
    // Save refresh token to database
    await this.saveRefreshToken(userId, refreshToken, refreshTokenExpiresAt, ipAddress, userAgent);
    
    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  /**
   * Save refresh token to database
   */
  private async saveRefreshToken(
    userId: string, 
    token: string, 
    expiresAt: Date, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    const { supabaseAdmin } = await import('../config/database');
    
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }
    
    const { error } = await supabaseAdmin
      .from('refresh_tokens')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        ip_address: ipAddress || null,
        user_agent: userAgent || null
      });
    
    if (error) {
      throw new Error(`Failed to save refresh token: ${error.message}`);
    }
  }

  /**
   * Find refresh token in database
   */
  private async findRefreshToken(token: string): Promise<RefreshToken | null> {
    const { supabaseAdmin } = await import('../config/database');
    
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('refresh_tokens')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      token: data.token,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      revokedAt: data.revoked_at ? new Date(data.revoked_at) : undefined,
      ipAddress: data.ip_address,
      userAgent: data.user_agent
    };
  }

  /**
   * Revoke refresh token
   */
  private async revokeRefreshToken(token: string): Promise<boolean> {
    const { supabaseAdmin } = await import('../config/database');
    
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }
    
    const { error } = await supabaseAdmin
      .from('refresh_tokens')
      .update({
        revoked_at: new Date().toISOString()
      })
      .eq('token', token);
    
    if (error) {
      console.error('Error revoking refresh token:', error);
      return false;
    }
    
    return true;
  }

  /**
   * Revoke all refresh tokens for a user
   */
  private async revokeAllRefreshTokens(userId: string): Promise<boolean> {
    const { supabaseAdmin } = await import('../config/database');
    
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }
    
    const { error } = await supabaseAdmin
      .from('refresh_tokens')
      .update({
        revoked_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .is('revoked_at', null);
    
    if (error) {
      console.error('Error revoking all refresh tokens:', error);
      return false;
    }
    
    return true;
  }

  /**
   * Save verification code to database
   */
  private async saveVerificationCode(
    userId: string, 
    code: string, 
    type: 'email' | 'phone', 
    expiresAt: Date
  ): Promise<void> {
    const { supabaseAdmin } = await import('../config/database');
    
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }
    
    const { error } = await supabaseAdmin
      .from('verification_codes')
      .insert({
        user_id: userId,
        code,
        type,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });
    
    if (error) {
      throw new Error(`Failed to save verification code: ${error.message}`);
    }
  }

  /**
   * Validate verification code
   */
  private async validateVerificationCode(userId: string, code: string, type: 'email' | 'phone'): Promise<boolean> {
    const { supabaseAdmin } = await import('../config/database');
    
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }
    
    // Find verification code
    const { data, error } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('type', type)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    // Check if code is expired
    if (new Date(data.expires_at) < new Date()) {
      return false;
    }
    
    // Mark code as used
    await supabaseAdmin
      .from('verification_codes')
      .update({
        used_at: new Date().toISOString()
      })
      .eq('id', data.id);
    
    return true;
  }

  /**
   * Find user by reset token
   */
  private async findUserByResetToken(token: string): Promise<User | null> {
    const { supabaseAdmin } = await import('../config/database');
    
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('reset_password_token', token)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Check if token is expired
    if (!data.reset_password_token_expires_at || new Date(data.reset_password_token_expires_at) < new Date()) {
      return null;
    }
    
    return data;
  }

  /**
   * Generate random verification code
   */
  private generateVerificationCode(): string {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    
    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
    
    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  /**
   * Convert JWT expiration time to seconds
   */
  private getJwtExpiresInSeconds(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 3600; // Default to 1 hour
    }
  }
}