import { Trip as TripModel } from '../models/Trip';
import { ITripRepository } from '../repositories/TripRepository';
import { ILocationRepository } from '../repositories/LocationRepository';
import { IUserRepository } from '../repositories/UserRepository';
import { Trip, TripStatus, Location } from '../../../shared/src/types';
import { TripInsert, Trip as DbTrip } from '../types/database.types';

export interface ITripService {
  createTrip(tripData: Partial<Trip>): Promise<Trip>;
  getTripById(id: string): Promise<Trip | null>;
  getUserTrips(userId: string): Promise<Trip[]>;
  getNearbyTrips(latitude: number, longitude: number, radiusKm?: number): Promise<Trip[]>;
  updateTripStatus(id: string, status: TripStatus): Promise<Trip | null>;
  updateTripCapacity(id: string, availableCapacity: number): Promise<Trip | null>;
  cancelTrip(id: string): Promise<Trip | null>;
  getTripWithDetails(id: string): Promise<Trip & { user: any } | null>;
}

export class TripService implements ITripService {
  constructor(
    private tripRepository: ITripRepository,
    private locationRepository: ILocationRepository,
    private userRepository: IUserRepository
  ) {}

  /**
   * Create a new trip
   * Requirements: 1.2 - Allow users to announce their trip with optional details
   */
  async createTrip(tripData: Partial<Trip>): Promise<Trip> {
    // Validate trip data
    const validation = TripModel.validateForCreation(tripData);
    if (!validation.isValid) {
      throw new Error(`Invalid trip data: ${validation.errors.join(', ')}`);
    }

    // Verify user exists
    const user = await this.userRepository.findById(tripData.userId!);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify location exists
    const location = await this.locationRepository.findById(tripData.destination!.id);
    if (!location) {
      throw new Error('Location not found');
    }

    // Convert to database insert format
    const insertData: TripInsert = {
      user_id: tripData.userId!,
      destination_id: tripData.destination!.id,
      departure_time: tripData.departureTime!.toISOString(),
      estimated_return_time: tripData.estimatedReturnTime!.toISOString(),
      capacity: tripData.capacity || 1,
      available_capacity: tripData.capacity || 1, // Initially, available capacity equals total capacity
      status: 'announced', // Default status for new trips
      description: tripData.description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const dbTrip = await this.tripRepository.create(insertData);
    
    // Get full trip details with destination info
    const tripWithDetails = await this.tripRepository.getTripWithDetails(dbTrip.id);
    if (!tripWithDetails) {
      throw new Error('Failed to retrieve created trip details');
    }

    return this.dbTripToModel(tripWithDetails);
  }

  /**
   * Get trip by ID
   * Requirements: 1.2, 1.3, 1.4 - Trip details and capacity
   */
  async getTripById(id: string): Promise<Trip | null> {
    if (!id || id.trim() === '') {
      throw new Error('Trip ID is required');
    }

    const tripWithDetails = await this.tripRepository.getTripWithDetails(id);
    return tripWithDetails ? this.dbTripToModel(tripWithDetails) : null;
  }

  /**
   * Get trips by user ID
   * Requirements: 1.2, 1.3, 1.4 - Trip details and capacity
   */
  async getUserTrips(userId: string): Promise<Trip[]> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    const dbTrips = await this.tripRepository.findByUserId(userId);
    
    // For each trip, get full details with destination info
    const tripsWithDetails = await Promise.all(
      dbTrips.map(trip => this.tripRepository.getTripWithDetails(trip.id))
    );

    return tripsWithDetails
      .filter((trip): trip is DbTrip & { destination: any; user: any } => trip !== null)
      .map(trip => this.dbTripToModel(trip));
  }

  /**
   * Get nearby trips
   * Requirements: 2.1, 2.2 - Display active trips to nearby locations
   */
  async getNearbyTrips(latitude: number, longitude: number, radiusKm: number = 10): Promise<Trip[]> {
    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Invalid coordinates provided');
    }

    if (radiusKm <= 0 || radiusKm > 100) {
      throw new Error('Radius must be between 0 and 100 kilometers');
    }

    const dbTrips = await this.tripRepository.findNearbyTrips(latitude, longitude, radiusKm);
    
    return dbTrips.map(trip => this.dbTripToModel(trip));
  }

  /**
   * Update trip status
   * Requirements: 5.1, 5.2 - Real-time status updates and notifications
   */
  async updateTripStatus(id: string, status: TripStatus): Promise<Trip | null> {
    if (!id || id.trim() === '') {
      throw new Error('Trip ID is required');
    }

    // Verify trip exists
    const existingTrip = await this.tripRepository.findById(id);
    if (!existingTrip) {
      throw new Error('Trip not found');
    }

    // Validate status transition
    this.validateStatusTransition(existingTrip.status as any, status);

    const updatedDbTrip = await this.tripRepository.updateStatus(id, status);
    if (!updatedDbTrip) {
      return null;
    }

    const tripWithDetails = await this.tripRepository.getTripWithDetails(id);
    return tripWithDetails ? this.dbTripToModel(tripWithDetails) : null;
  }

  /**
   * Update trip capacity
   * Requirements: 1.4, 4.4 - Trip capacity management
   */
  async updateTripCapacity(id: string, availableCapacity: number): Promise<Trip | null> {
    if (!id || id.trim() === '') {
      throw new Error('Trip ID is required');
    }

    // Verify trip exists
    const existingTrip = await this.tripRepository.findById(id);
    if (!existingTrip) {
      throw new Error('Trip not found');
    }

    // Validate capacity
    const validation = TripModel.validateCapacity(existingTrip.capacity, availableCapacity);
    if (!validation.isValid) {
      throw new Error(`Invalid capacity: ${validation.errors.join(', ')}`);
    }

    const updatedDbTrip = await this.tripRepository.updateCapacity(id, availableCapacity);
    if (!updatedDbTrip) {
      return null;
    }

    const tripWithDetails = await this.tripRepository.getTripWithDetails(id);
    return tripWithDetails ? this.dbTripToModel(tripWithDetails) : null;
  }

  /**
   * Cancel trip
   * Requirements: 1.2, 1.3 - Trip management
   */
  async cancelTrip(id: string): Promise<Trip | null> {
    if (!id || id.trim() === '') {
      throw new Error('Trip ID is required');
    }

    // Verify trip exists
    const existingTrip = await this.tripRepository.findById(id);
    if (!existingTrip) {
      throw new Error('Trip not found');
    }

    // Only allow cancellation of trips that haven't started yet
    if (existingTrip.status !== 'announced') {
      throw new Error('Only announced trips can be cancelled');
    }

    const cancelledDbTrip = await this.tripRepository.cancelTrip(id);
    if (!cancelledDbTrip) {
      return null;
    }

    const tripWithDetails = await this.tripRepository.getTripWithDetails(id);
    return tripWithDetails ? this.dbTripToModel(tripWithDetails) : null;
  }

  /**
   * Get trip with user and destination details
   * Requirements: 2.2 - Show traveler profile, destination, timeline, and capacity
   */
  async getTripWithDetails(id: string): Promise<Trip & { user: any } | null> {
    if (!id || id.trim() === '') {
      throw new Error('Trip ID is required');
    }

    const tripWithDetails = await this.tripRepository.getTripWithDetails(id);
    if (!tripWithDetails) {
      return null;
    }

    return this.dbTripToModel(tripWithDetails) as Trip & { user: any };
  }

  /**
   * Convert database trip to model trip
   */
  private dbTripToModel(dbTrip: DbTrip & { destination?: any; user?: any }): Trip {
    // Create location object from destination data if available
    let destination: Location = {
      id: dbTrip.destination_id,
      name: '',
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      coordinates: { latitude: 0, longitude: 0 },
      category: 'other',
      verified: false,
      currentUserCount: 0
    };

    if (dbTrip.destination) {
      // Parse coordinates from PostGIS POINT format
      let coordinates = { latitude: 0, longitude: 0 };
      
      if (dbTrip.destination.coordinates && typeof dbTrip.destination.coordinates === 'string') {
        const coordMatch = dbTrip.destination.coordinates.match(/POINT\(([^)]+)\)/);
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

      if (typeof dbTrip.destination.address === 'string') {
        try {
          address = JSON.parse(dbTrip.destination.address);
        } catch (e) {
          // Keep default address if parsing fails
        }
      } else if (typeof dbTrip.destination.address === 'object' && dbTrip.destination.address !== null) {
        address = dbTrip.destination.address as any;
      }

      destination = {
        id: dbTrip.destination.id,
        name: dbTrip.destination.name,
        address,
        coordinates,
        category: dbTrip.destination.category,
        verified: dbTrip.destination.verified,
        currentUserCount: dbTrip.destination.current_user_count
      };
    }

    // Create trip model
    const trip = new TripModel({
      id: dbTrip.id,
      userId: dbTrip.user_id,
      destination,
      departureTime: new Date(dbTrip.departure_time),
      estimatedReturnTime: dbTrip.estimated_return_time ? new Date(dbTrip.estimated_return_time) : undefined,
      capacity: dbTrip.capacity,
      availableCapacity: dbTrip.available_capacity,
      status: this.mapDbTripStatusToShared(dbTrip.status),
      description: dbTrip.description || undefined,
      createdAt: new Date(dbTrip.created_at),
      updatedAt: new Date(dbTrip.updated_at)
    });

    // Add user data if available
    const result = trip as any;
    if (dbTrip.user) {
      result.user = {
        id: dbTrip.user.id,
        name: dbTrip.user.name,
        rating: dbTrip.user.rating,
        totalDeliveries: dbTrip.user.total_deliveries
      };
    }

    return result;
  }

  /**
   * Map database trip status to shared enum
   */
  private mapDbTripStatusToShared(dbStatus: string): TripStatus {
    switch (dbStatus) {
      case 'announced':
        return TripStatus.ANNOUNCED;
      case 'in_progress':
        return TripStatus.TRAVELING;
      case 'at_destination':
        return TripStatus.AT_DESTINATION;
      case 'returning':
        return TripStatus.RETURNING;
      case 'completed':
        return TripStatus.COMPLETED;
      case 'cancelled':
        return TripStatus.CANCELLED;
      default:
        return TripStatus.ANNOUNCED;
    }
  }

  /**
   * Validate trip status transition
   */
  private validateStatusTransition(currentStatus: string, newStatus: TripStatus): void {
    // Define valid status transitions
    const validTransitions: Record<string, TripStatus[]> = {
      'announced': [TripStatus.TRAVELING, TripStatus.CANCELLED],
      'in_progress': [TripStatus.AT_DESTINATION, TripStatus.CANCELLED],
      'at_destination': [TripStatus.RETURNING, TripStatus.CANCELLED],
      'returning': [TripStatus.COMPLETED, TripStatus.CANCELLED],
      'completed': [],
      'cancelled': []
    };

    // Check if transition is valid
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }
}