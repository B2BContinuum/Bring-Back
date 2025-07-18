import { User } from '../User';
import { VerificationStatus } from '../../../../shared/src/types';

describe('User Model', () => {
  const validUserData = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'John Doe',
    phone: '+1234567890',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    },
    rating: 4.5,
    totalDeliveries: 10,
    verificationStatus: VerificationStatus.EMAIL_VERIFIED
  };

  describe('Constructor', () => {
    it('should create a user with valid data', () => {
      const user = new User(validUserData);
      
      expect(user.id).toBe(validUserData.id);
      expect(user.email).toBe(validUserData.email);
      expect(user.name).toBe(validUserData.name);
      expect(user.phone).toBe(validUserData.phone);
      expect(user.address).toEqual(validUserData.address);
      expect(user.rating).toBe(validUserData.rating);
      expect(user.totalDeliveries).toBe(validUserData.totalDeliveries);
      expect(user.verificationStatus).toBe(validUserData.verificationStatus);
    });

    it('should create a user with default values for missing fields', () => {
      const user = new User({ email: 'test@example.com' });
      
      expect(user.id).toBe('');
      expect(user.name).toBe('');
      expect(user.phone).toBe('');
      expect(user.rating).toBe(0);
      expect(user.totalDeliveries).toBe(0);
      expect(user.verificationStatus).toBe(VerificationStatus.UNVERIFIED);
      expect(user.address).toEqual({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      });
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const beforeCreate = new Date();
      const user = new User(validUserData);
      const afterCreate = new Date();
      
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('Static Validation Methods', () => {
    describe('validateForCreation', () => {
      it('should validate complete user data successfully', () => {
        const result = User.validateForCreation(validUserData);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for missing required fields', () => {
        const incompleteData = { email: 'test@example.com' };
        const result = User.validateForCreation(incompleteData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(error => error.includes('name'))).toBe(true);
        expect(result.errors.some(error => error.includes('phone'))).toBe(true);
        expect(result.errors.some(error => error.includes('address'))).toBe(true);
      });

      it('should return errors for invalid email format', () => {
        const invalidEmailData = { ...validUserData, email: 'invalid-email' };
        const result = User.validateForCreation(invalidEmailData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('email'))).toBe(true);
      });
    });

    describe('validateEmail', () => {
      it('should validate correct email format', () => {
        const result = User.validateEmail('test@example.com');
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid email format', () => {
        const result = User.validateEmail('invalid-email');
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validatePhone', () => {
      it('should validate correct phone formats', () => {
        const validPhones = ['+1234567890', '123-456-7890', '(123) 456-7890', '123 456 7890'];
        
        validPhones.forEach(phone => {
          const result = User.validatePhone(phone);
          expect(result.isValid).toBe(true);
        });
      });

      it('should reject invalid phone format', () => {
        const result = User.validatePhone('invalid-phone');
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Instance Validation Methods', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserData);
    });

    describe('validate', () => {
      it('should validate a valid user instance', () => {
        const result = user.validate();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid user instance', () => {
        user.email = 'invalid-email';
        user.name = '';
        
        const result = user.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateEmail', () => {
      it('should validate user email', () => {
        const result = user.validateEmail();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid user email', () => {
        user.email = 'invalid-email';
        const result = user.validateEmail();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validatePhone', () => {
      it('should validate user phone', () => {
        const result = user.validatePhone();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid user phone', () => {
        user.phone = 'invalid-phone';
        const result = user.validatePhone();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateProfile', () => {
      it('should validate complete profile data', () => {
        const result = user.validateProfile();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for incomplete profile', () => {
        user.name = '';
        user.email = 'invalid-email';
        
        const result = user.validateProfile();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Utility Methods', () => {
    let user: User;

    beforeEach(() => {
      user = new User(validUserData);
    });

    describe('touch', () => {
      it('should update the updatedAt timestamp', () => {
        const originalUpdatedAt = user.updatedAt;
        
        // Wait a small amount to ensure timestamp difference
        setTimeout(() => {
          user.touch();
          expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }, 1);
      });
    });

    describe('isFullyVerified', () => {
      it('should return true for fully verified user', () => {
        user.verificationStatus = VerificationStatus.FULLY_VERIFIED;
        expect(user.isFullyVerified()).toBe(true);
      });

      it('should return false for non-fully verified user', () => {
        user.verificationStatus = VerificationStatus.EMAIL_VERIFIED;
        expect(user.isFullyVerified()).toBe(false);
      });
    });

    describe('hasVerifiedEmail', () => {
      it('should return true for email verified user', () => {
        user.verificationStatus = VerificationStatus.EMAIL_VERIFIED;
        expect(user.hasVerifiedEmail()).toBe(true);
      });

      it('should return true for fully verified user', () => {
        user.verificationStatus = VerificationStatus.FULLY_VERIFIED;
        expect(user.hasVerifiedEmail()).toBe(true);
      });

      it('should return false for unverified user', () => {
        user.verificationStatus = VerificationStatus.UNVERIFIED;
        expect(user.hasVerifiedEmail()).toBe(false);
      });

      it('should return false for phone-only verified user', () => {
        user.verificationStatus = VerificationStatus.PHONE_VERIFIED;
        expect(user.hasVerifiedEmail()).toBe(false);
      });
    });

    describe('hasVerifiedPhone', () => {
      it('should return true for phone verified user', () => {
        user.verificationStatus = VerificationStatus.PHONE_VERIFIED;
        expect(user.hasVerifiedPhone()).toBe(true);
      });

      it('should return true for fully verified user', () => {
        user.verificationStatus = VerificationStatus.FULLY_VERIFIED;
        expect(user.hasVerifiedPhone()).toBe(true);
      });

      it('should return false for unverified user', () => {
        user.verificationStatus = VerificationStatus.UNVERIFIED;
        expect(user.hasVerifiedPhone()).toBe(false);
      });

      it('should return false for email-only verified user', () => {
        user.verificationStatus = VerificationStatus.EMAIL_VERIFIED;
        expect(user.hasVerifiedPhone()).toBe(false);
      });
    });
  });
});