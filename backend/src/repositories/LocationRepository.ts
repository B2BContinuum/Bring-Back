import { Location } from '../models/Location';
import { LocationPresence } from '../models/LocationPresence';
import { LocationCategory } from 'bring-back-shared';

export interface ILocationRepository {
  create(location: Location): Promise<Location>;
  findById(id: string): Promise<Location | null>;
  searchByName(query: string, category?: LocationCategory): Promise<Location[]>;
  findNearby(latitude: number, longitude: number, radiusKm: number): Promise<Location[]>;
  updateUserCount(id: string, count: number): Promise<Location | null>;
}

export interface ILocationPresenceRepository {
  create(presence: LocationPresence): Promise<LocationPresence>;
  findById(id: string): Promise<LocationPresence | null>;
  findActiveByUserId(userId: string): Promise<LocationPresence[]>;
  findActiveByLocationId(locationId: string): Promise<LocationPresence[]>;
  checkOut(id: string): Promise<LocationPresence | null>;
  getActiveCountByLocation(locationId: string): Promise<number>;
}

export class LocationRepository implements ILocationRepository {
  async create(location: Location): Promise<Location> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findById(id: string): Promise<Location | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async searchByName(query: string, category?: LocationCategory): Promise<Location[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number): Promise<Location[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async updateUserCount(id: string, count: number): Promise<Location | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }
}

export class LocationPresenceRepository implements ILocationPresenceRepository {
  async create(presence: LocationPresence): Promise<LocationPresence> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findById(id: string): Promise<LocationPresence | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findActiveByUserId(userId: string): Promise<LocationPresence[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findActiveByLocationId(locationId: string): Promise<LocationPresence[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async checkOut(id: string): Promise<LocationPresence | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async getActiveCountByLocation(locationId: string): Promise<number> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }
}