import { User as IUser, VerificationStatus } from '../../../shared/src/types';
import { validateRequestBody, createUserSchema, emailSchema, phoneSchema } from '../utils/validation';

export interface UserValidationResult {
  isValid: boolean;
  errors: string[];
}

export class User implements IUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  address: IUser['address'];
  rating: number;
  totalDeliveries: number;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<IUser>) {
    this.id = data.id || '';
    this.email = data.email || '';
    this.name = data.name || '';
    this.phone = data.phone || '';
    this.profileImage = data.profileImage;
    this.address = data.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };
    this.rating = data.rating || 0;
    this.totalDeliveries = data.totalDeliveries || 0;
    this.verificationStatus = data.verificationStatus || VerificationStatus.UNVERIFIED;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validates the complete user data for creation
   */
  static validateForCreation(userData: Partial<IUser>): UserValidationResult {
    const result = validateRequestBody(createUserSchema, userData);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Validates email format
   */
  static validateEmail(email: string): UserValidationResult {
    const result = validateRequestBody(emailSchema, email);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Validates phone number format
   */
  static validatePhone(phone: string): UserValidationResult {
    const result = validateRequestBody(phoneSchema, phone);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Validates the current user instance
   */
  validate(): UserValidationResult {
    return User.validateForCreation(this);
  }

  /**
   * Validates email format for this user instance
   */
  validateEmail(): UserValidationResult {
    return User.validateEmail(this.email);
  }

  /**
   * Validates phone format for this user instance
   */
  validatePhone(): UserValidationResult {
    return User.validatePhone(this.phone);
  }

  /**
   * Validates profile data (name, email, phone, address)
   */
  validateProfile(): UserValidationResult {
    const profileData = {
      name: this.name,
      email: this.email,
      phone: this.phone,
      address: this.address
    };
    
    const result = validateRequestBody(createUserSchema.pick({
      name: true,
      email: true,
      phone: true,
      address: true
    }), profileData);
    
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Updates the updatedAt timestamp
   */
  touch(): void {
    this.updatedAt = new Date();
  }

  /**
   * Checks if user is fully verified
   */
  isFullyVerified(): boolean {
    return this.verificationStatus === VerificationStatus.FULLY_VERIFIED;
  }

  /**
   * Checks if user has verified email
   */
  hasVerifiedEmail(): boolean {
    return this.verificationStatus === VerificationStatus.EMAIL_VERIFIED || 
           this.verificationStatus === VerificationStatus.FULLY_VERIFIED;
  }

  /**
   * Checks if user has verified phone
   */
  hasVerifiedPhone(): boolean {
    return this.verificationStatus === VerificationStatus.PHONE_VERIFIED || 
           this.verificationStatus === VerificationStatus.FULLY_VERIFIED;
  }
}