import { Trip as ITrip, TripStatus, Location, LocationCategory } from '../../../shared/src/types';
import { validateRequestBody, createTripSchema } from '../utils/validation';
import { z } from 'zod';

export interface TripValidationResult {
  isValid: boolean;
  errors: string[];
}

// Enhanced validation schema for Trip creation
const tripCreationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  destination: z.object({
    id: z.string().min(1, 'Destination ID is required'),
    name: z.string().min(1, 'Destination name is required'),
    address: z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      zipCode: z.string().min(1, 'Zip code is required'),
      country: z.string().min(1, 'Country is required')
    }),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }),
    category: z.nativeEnum(LocationCategory),
    verified: z.boolean(),
    currentUserCount: z.number().min(0)
  }),
  departureTime: z.date(),
  estimatedReturnTime: z.date(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(10, 'Capacity cannot exceed 10'),
  description: z.string().optional()
}).refine(data => {
  // Ensure estimated return time is after departure time
  return data.estimatedReturnTime > data.departureTime;
}, {
  message: 'Estimated return time must be after departure time'
}).refine(data => {
  // Ensure departure time is in the future
  return data.departureTime > new Date();
}, {
  message: 'Departure time must be in the future'
});

export class Trip implements ITrip {
  id: string;
  userId: string;
  destination: Location;
  departureTime: Date;
  estimatedReturnTime: Date;
  capacity: number;
  availableCapacity: number;
  status: TripStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<ITrip>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.destination = data.destination || {
      id: '',
      name: '',
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      coordinates: { latitude: 0, longitude: 0 },
      category: LocationCategory.OTHER,
      verified: false,
      currentUserCount: 0
    };
    this.departureTime = data.departureTime || new Date();
    this.estimatedReturnTime = data.estimatedReturnTime || new Date();
    this.capacity = data.capacity || 1;
    this.availableCapacity = data.availableCapacity !== undefined ? data.availableCapacity : this.capacity;
    this.status = data.status || TripStatus.ANNOUNCED;
    this.description = data.description;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validates the complete trip data for creation
   */
  static validateForCreation(tripData: Partial<ITrip>): TripValidationResult {
    const result = validateRequestBody(tripCreationSchema, tripData);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Validates capacity constraints
   */
  static validateCapacity(capacity: number, availableCapacity?: number): TripValidationResult {
    const errors: string[] = [];
    
    if (capacity < 1) {
      errors.push('Capacity must be at least 1');
    }
    
    if (capacity > 10) {
      errors.push('Capacity cannot exceed 10');
    }
    
    if (availableCapacity !== undefined) {
      if (availableCapacity < 0) {
        errors.push('Available capacity cannot be negative');
      }
      
      if (availableCapacity > capacity) {
        errors.push('Available capacity cannot exceed total capacity');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates trip timing
   */
  static validateTiming(departureTime: Date, estimatedReturnTime: Date): TripValidationResult {
    const errors: string[] = [];
    const now = new Date();
    
    if (departureTime <= now) {
      errors.push('Departure time must be in the future');
    }
    
    if (estimatedReturnTime <= departureTime) {
      errors.push('Estimated return time must be after departure time');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates the current trip instance
   */
  validate(): TripValidationResult {
    return Trip.validateForCreation(this);
  }

  /**
   * Validates capacity for this trip instance
   */
  validateCapacity(): TripValidationResult {
    return Trip.validateCapacity(this.capacity, this.availableCapacity);
  }

  /**
   * Validates timing for this trip instance
   */
  validateTiming(): TripValidationResult {
    return Trip.validateTiming(this.departureTime, this.estimatedReturnTime);
  }

  /**
   * Check if trip has available capacity
   */
  hasAvailableCapacity(): boolean {
    return this.availableCapacity > 0;
  }

  /**
   * Check if trip can accept new requests
   */
  canAcceptRequests(): boolean {
    return this.status === TripStatus.ANNOUNCED && this.hasAvailableCapacity();
  }

  /**
   * Reserve capacity for a request
   */
  reserveCapacity(amount: number = 1): boolean {
    if (this.availableCapacity >= amount) {
      this.availableCapacity -= amount;
      this.touch();
      return true;
    }
    return false;
  }

  /**
   * Release reserved capacity
   */
  releaseCapacity(amount: number = 1): void {
    this.availableCapacity = Math.min(this.availableCapacity + amount, this.capacity);
    this.touch();
  }

  /**
   * Update trip status
   */
  updateStatus(newStatus: TripStatus): void {
    this.status = newStatus;
    this.touch();
  }

  /**
   * Check if trip is active (not completed or cancelled)
   */
  isActive(): boolean {
    return this.status !== TripStatus.COMPLETED && this.status !== TripStatus.CANCELLED;
  }

  /**
   * Check if trip is in progress (traveling or at destination)
   */
  isInProgress(): boolean {
    return this.status === TripStatus.TRAVELING || this.status === TripStatus.AT_DESTINATION || this.status === TripStatus.RETURNING;
  }

  /**
   * Get trip duration in hours
   */
  getDurationHours(): number {
    return Math.ceil((this.estimatedReturnTime.getTime() - this.departureTime.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Get time until departure in minutes
   */
  getTimeUntilDepartureMinutes(): number {
    const now = new Date();
    return Math.max(0, Math.floor((this.departureTime.getTime() - now.getTime()) / (1000 * 60)));
  }

  /**
   * Check if trip is departing soon (within specified minutes)
   */
  isDepartingSoon(withinMinutes: number = 30): boolean {
    return this.getTimeUntilDepartureMinutes() <= withinMinutes && this.getTimeUntilDepartureMinutes() > 0;
  }

  /**
   * Updates the updatedAt timestamp
   */
  touch(): void {
    this.updatedAt = new Date();
  }
}