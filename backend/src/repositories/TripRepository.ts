import { Trip } from '../models/Trip';
import { TripStatus } from 'bring-back-shared';

export interface ITripRepository {
  create(trip: Trip): Promise<Trip>;
  findById(id: string): Promise<Trip | null>;
  findByUserId(userId: string): Promise<Trip[]>;
  findNearbyTrips(latitude: number, longitude: number, radiusKm: number): Promise<Trip[]>;
  updateStatus(id: string, status: TripStatus): Promise<Trip | null>;
  updateCapacity(id: string, availableCapacity: number): Promise<Trip | null>;
  delete(id: string): Promise<boolean>;
}

export class TripRepository implements ITripRepository {
  async create(trip: Trip): Promise<Trip> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findById(id: string): Promise<Trip | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findByUserId(userId: string): Promise<Trip[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findNearbyTrips(latitude: number, longitude: number, radiusKm: number): Promise<Trip[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async updateStatus(id: string, status: TripStatus): Promise<Trip | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async updateCapacity(id: string, availableCapacity: number): Promise<Trip | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async delete(id: string): Promise<boolean> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }
}