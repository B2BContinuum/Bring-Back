import { LocationPresence as ILocationPresence } from '../../../shared/src/types';
import { z } from 'zod';
import { validateRequestBody } from '../utils/validation';

export interface LocationPresenceValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validation schema for LocationPresence
const createLocationPresenceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  locationId: z.string().min(1, 'Location ID is required'),
  checkedInAt: z.date().optional(),
  checkedOutAt: z.date().optional(),
  isActive: z.boolean().optional()
}).refine(data => {
  // If checkedOutAt is provided, it should be after checkedInAt
  if (data.checkedOutAt && data.checkedInAt) {
    return data.checkedOutAt > data.checkedInAt;
  }
  return true;
}, {
  message: 'Check-out time must be after check-in time'
});

export class LocationPresence implements ILocationPresence {
  id: string;
  userId: string;
  locationId: string;
  checkedInAt: Date;
  checkedOutAt?: Date;
  isActive: boolean;

  constructor(data: Partial<ILocationPresence>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.locationId = data.locationId || '';
    this.checkedInAt = data.checkedInAt || new Date();
    this.checkedOutAt = data.checkedOutAt;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  /**
   * Check out user from location
   */
  checkOut(): void {
    this.checkedOutAt = new Date();
    this.isActive = false;
  }

  /**
   * Get duration of presence in minutes
   */
  getDurationMinutes(): number | null {
    const endTime = this.checkedOutAt || new Date();
    return Math.floor((endTime.getTime() - this.checkedInAt.getTime()) / (1000 * 60));
  }

  /**
   * Check if presence is currently active
   */
  isCurrentlyActive(): boolean {
    return this.isActive && !this.checkedOutAt;
  }

  /**
   * Check if presence was active within specified minutes
   */
  wasActiveWithin(minutes: number): boolean {
    if (this.isActive) return true;
    
    if (!this.checkedOutAt) return false;
    
    const minutesAgo = new Date(Date.now() - minutes * 60 * 1000);
    return this.checkedOutAt > minutesAgo;
  }

  /**
   * Get formatted duration string
   */
  getFormattedDuration(): string {
    const duration = this.getDurationMinutes();
    if (duration === null) return 'Unknown';
    
    if (duration < 60) {
      return `${duration} minutes`;
    } else {
      const hours = Math.floor(duration / 60);
      const remainingMinutes = duration % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  /**
   * Validates the complete location presence data for creation
   */
  static validateForCreation(presenceData: Partial<ILocationPresence>): LocationPresenceValidationResult {
    const result = validateRequestBody(createLocationPresenceSchema, presenceData);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Validates the current location presence instance
   */
  validate(): LocationPresenceValidationResult {
    return LocationPresence.validateForCreation(this);
  }

  /**
   * Validates that check-out time is after check-in time
   */
  validateTimeSequence(): LocationPresenceValidationResult {
    if (this.checkedOutAt && this.checkedInAt && this.checkedOutAt <= this.checkedInAt) {
      return {
        isValid: false,
        errors: ['Check-out time must be after check-in time']
      };
    }
    return {
      isValid: true,
      errors: []
    };
  }

  /**
   * Validates that required IDs are present
   */
  validateIds(): LocationPresenceValidationResult {
    const errors: string[] = [];
    
    if (!this.userId || this.userId.trim() === '') {
      errors.push('User ID is required');
    }
    
    if (!this.locationId || this.locationId.trim() === '') {
      errors.push('Location ID is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}