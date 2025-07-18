import { Location as ILocation, LocationCategory, Address, Coordinates } from '../../../shared/src/types';
import { validateRequestBody, createLocationSchema, coordinatesSchema, addressSchema } from '../utils/validation';

export interface LocationValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Location implements ILocation {
  id: string;
  name: string;
  address: Address;
  coordinates: Coordinates;
  category: LocationCategory;
  verified: boolean;
  currentUserCount: number;

  constructor(data: Partial<ILocation>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.address = data.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };
    this.coordinates = data.coordinates || {
      latitude: 0,
      longitude: 0
    };
    this.category = data.category || LocationCategory.OTHER;
    this.verified = data.verified || false;
    this.currentUserCount = data.currentUserCount || 0;
  }

  /**
   * Calculate distance to another location in kilometers
   */
  distanceTo(other: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(other.coordinates.latitude - this.coordinates.latitude);
    const dLon = this.toRadians(other.coordinates.longitude - this.coordinates.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(this.coordinates.latitude)) * 
              Math.cos(this.toRadians(other.coordinates.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if location is within specified radius of another location
   */
  isWithinRadius(other: Location, radiusKm: number): boolean {
    return this.distanceTo(other) <= radiusKm;
  }

  /**
   * Get formatted address string
   */
  getFormattedAddress(): string {
    return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
  }

  /**
   * Check if location has active users
   */
  hasActiveUsers(): boolean {
    return this.currentUserCount > 0;
  }

  /**
   * Validates the complete location data for creation
   */
  static validateForCreation(locationData: Partial<ILocation>): LocationValidationResult {
    const result = validateRequestBody(createLocationSchema, locationData);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Validates coordinates
   */
  static validateCoordinates(coordinates: Coordinates): LocationValidationResult {
    const result = validateRequestBody(coordinatesSchema, coordinates);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Validates address
   */
  static validateAddress(address: Address): LocationValidationResult {
    const result = validateRequestBody(addressSchema, address);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Validates the current location instance
   */
  validate(): LocationValidationResult {
    return Location.validateForCreation(this);
  }

  /**
   * Validates coordinates for this location instance
   */
  validateCoordinates(): LocationValidationResult {
    return Location.validateCoordinates(this.coordinates);
  }

  /**
   * Validates address for this location instance
   */
  validateAddress(): LocationValidationResult {
    return Location.validateAddress(this.address);
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}