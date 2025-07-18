import { Location } from '../models/Location';
import { LocationPresence } from '../models/LocationPresence';
import { ILocationRepository, ILocationPresenceRepository } from '../repositories/LocationRepository';
import { LocationCategory } from '../../../shared/src/types';
import { 
  LocationInsert, 
  Location as DbLocation, 
  LocationPresence as DbLocationPresence 
} from '../types/database.types';

export interface ILocationService {
  createLocation(locationData: Partial<Location>): Promise<Location>;
  getLocationById(id: string): Promise<Location | null>;
  searchLocations(query: string, category?: LocationCategory): Promise<Location[]>;
  getNearbyLocations(latitude: number, longitude: number, radiusKm?: number): Promise<Location[]>;
  checkInToLocation(userId: string, locationId: string): Promise<LocationPresence>;
  checkOutFromLocation(userId: string, locationId: string): Promise<LocationPresence | null>;
  getUserPresenceAtLocation(userId: string, locationId: string): Promise<LocationPresence | null>;
  getActiveUsersAtLocation(locationId: string): Promise<LocationPresence[]>;
  updateLocationUserCount(locationId: string): Promise<Location | null>;
}

export class LocationService implements ILocationService {
  constructor(
    private locationRepository: ILocationRepository,
    private locationPresenceRepository: ILocationPresenceRepository
  ) {}

  /**
   * Create a new location
   * Requirements: 1.1 - Display nearby locations for check-in
   */
  async createLocation(locationData: Partial<Location>): Promise<Location> {
    // Validate location data
    const validation = Location.validateForCreation(locationData);
    if (!validation.isValid) {
      throw new Error(`Invalid location data: ${validation.errors.join(', ')}`);
    }

    // Convert to database insert format
    const insertData: LocationInsert = {
      name: locationData.name!,
      address: JSON.stringify(locationData.address),
      coordinates: `POINT(${locationData.coordinates!.longitude} ${locationData.coordinates!.latitude})`,
      category: locationData.category!,
      verified: locationData.verified || false,
      current_user_count: 0
    };

    const dbLocation = await this.locationRepository.create(insertData);
    return this.dbLocationToModel(dbLocation);
  }

  /**
   * Get location by ID
   * Requirements: 1.1 - Display nearby locations for check-in
   */
  async getLocationById(id: string): Promise<Location | null> {
    if (!id || id.trim() === '') {
      throw new Error('Location ID is required');
    }

    const dbLocation = await this.locationRepository.findById(id);
    return dbLocation ? this.dbLocationToModel(dbLocation) : null;
  }

  /**
   * Search locations by name and optional category
   * Requirements: 1.1 - Display nearby locations for check-in
   */
  async searchLocations(query: string, category?: LocationCategory): Promise<Location[]> {
    if (!query || query.trim() === '') {
      throw new Error('Search query is required');
    }

    const dbLocations = await this.locationRepository.searchByName(query.trim(), category);
    return dbLocations.map(dbLocation => this.dbLocationToModel(dbLocation));
  }

  /**
   * Get nearby locations within specified radius
   * Requirements: 1.1 - Display nearby locations for check-in
   */
  async getNearbyLocations(latitude: number, longitude: number, radiusKm: number = 10): Promise<Location[]> {
    // Validate coordinates
    if (!this.isValidCoordinate(latitude, longitude)) {
      throw new Error('Invalid coordinates provided');
    }

    if (radiusKm <= 0 || radiusKm > 100) {
      throw new Error('Radius must be between 0 and 100 kilometers');
    }

    const dbLocations = await this.locationRepository.findNearby(latitude, longitude, radiusKm);
    return dbLocations.map(dbLocation => this.dbLocationToModel(dbLocation));
  }

  /**
   * Check in user to a location
   * Requirements: 2.1 - Display active trips to nearby locations, 2.2 - Show traveler profile and timeline
   */
  async checkInToLocation(userId: string, locationId: string): Promise<LocationPresence> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!locationId || locationId.trim() === '') {
      throw new Error('Location ID is required');
    }

    // Verify location exists
    const location = await this.locationRepository.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    // Check in user
    const dbPresence = await this.locationPresenceRepository.checkIn(userId, locationId);

    // Update location user count
    await this.updateLocationUserCount(locationId);

    return this.dbLocationPresenceToModel(dbPresence);
  }

  /**
   * Check out user from a location
   * Requirements: 2.1 - Display active trips to nearby locations, 2.2 - Show traveler profile and timeline
   */
  async checkOutFromLocation(userId: string, locationId: string): Promise<LocationPresence | null> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!locationId || locationId.trim() === '') {
      throw new Error('Location ID is required');
    }

    // Check out user
    const dbPresence = await this.locationPresenceRepository.checkOutByUserAndLocation(userId, locationId);

    // Update location user count
    await this.updateLocationUserCount(locationId);

    return dbPresence ? this.dbLocationPresenceToModel(dbPresence) : null;
  }

  /**
   * Get user's presence at a specific location
   * Requirements: 2.1 - Display active trips to nearby locations
   */
  async getUserPresenceAtLocation(userId: string, locationId: string): Promise<LocationPresence | null> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!locationId || locationId.trim() === '') {
      throw new Error('Location ID is required');
    }

    const activePresences = await this.locationPresenceRepository.findActiveByUserId(userId);
    const dbPresence = activePresences.find(p => p.location_id === locationId);
    return dbPresence ? this.dbLocationPresenceToModel(dbPresence) : null;
  }

  /**
   * Get all active users at a location
   * Requirements: 2.1 - Display active trips to nearby locations, 2.2 - Show traveler profile and timeline
   */
  async getActiveUsersAtLocation(locationId: string): Promise<LocationPresence[]> {
    if (!locationId || locationId.trim() === '') {
      throw new Error('Location ID is required');
    }

    const dbPresences = await this.locationPresenceRepository.findActiveByLocationId(locationId);
    return dbPresences.map(dbPresence => this.dbLocationPresenceToModel(dbPresence));
  }

  /**
   * Update the user count for a location based on active presence records
   * Requirements: 2.1 - Display active trips to nearby locations, 2.2 - Show traveler profile and timeline
   */
  async updateLocationUserCount(locationId: string): Promise<Location | null> {
    if (!locationId || locationId.trim() === '') {
      throw new Error('Location ID is required');
    }

    // Get current active user count
    const activeCount = await this.locationPresenceRepository.getActiveCountByLocation(locationId);

    // Update location with current count
    const dbLocation = await this.locationRepository.updateUserCount(locationId, activeCount);
    return dbLocation ? this.dbLocationToModel(dbLocation) : null;
  }

  /**
   * Convert database location to model location
   */
  private dbLocationToModel(dbLocation: DbLocation): Location {
    // Parse coordinates from PostGIS POINT format
    let coordinates = { latitude: 0, longitude: 0 };
    
    if (dbLocation.coordinates && typeof dbLocation.coordinates === 'string') {
      const coordMatch = dbLocation.coordinates.match(/POINT\(([^)]+)\)/);
      if (coordMatch) {
        const [lng, lat] = coordMatch[1].split(' ').map(Number);
        coordinates = { latitude: lat, longitude: lng };
      }
    }

    // Parse address from JSON
    let address = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };

    if (typeof dbLocation.address === 'string') {
      try {
        address = JSON.parse(dbLocation.address);
      } catch (e) {
        // Keep default address if parsing fails
      }
    } else if (typeof dbLocation.address === 'object' && dbLocation.address !== null) {
      address = dbLocation.address as any;
    }

    return new Location({
      id: dbLocation.id,
      name: dbLocation.name,
      address,
      coordinates,
      category: dbLocation.category as LocationCategory,
      verified: dbLocation.verified,
      currentUserCount: dbLocation.current_user_count
    });
  }

  /**
   * Convert database location presence to model location presence
   */
  private dbLocationPresenceToModel(dbPresence: DbLocationPresence): LocationPresence {
    return new LocationPresence({
      id: dbPresence.id,
      userId: dbPresence.user_id,
      locationId: dbPresence.location_id,
      checkedInAt: new Date(dbPresence.checked_in_at),
      checkedOutAt: dbPresence.checked_out_at ? new Date(dbPresence.checked_out_at) : undefined,
      isActive: dbPresence.is_active
    });
  }

  /**
   * Validate coordinates
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }
}