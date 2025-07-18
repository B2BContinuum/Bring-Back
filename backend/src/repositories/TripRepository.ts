import { supabaseAdmin } from '../config/database';
import { Trip, TripInsert, TripUpdate, TripStatus } from '../types/database.types';
import { TripStatus as SharedTripStatus } from '../../../shared/src/types';

export interface ITripRepository {
  create(tripData: TripInsert): Promise<Trip>;
  findById(id: string): Promise<Trip | null>;
  findByUserId(userId: string): Promise<Trip[]>;
  findNearbyTrips(latitude: number, longitude: number, radiusKm: number): Promise<Trip[]>;
  findActiveTrips(): Promise<Trip[]>;
  findTripsByStatus(status: TripStatus): Promise<Trip[]>;
  findTripsByDestination(destinationId: string): Promise<Trip[]>;
  updateStatus(id: string, status: SharedTripStatus): Promise<Trip | null>;
  updateCapacity(id: string, availableCapacity: number): Promise<Trip | null>;
  update(id: string, updates: TripUpdate): Promise<Trip | null>;
  delete(id: string): Promise<boolean>;
  cancelTrip(id: string): Promise<Trip | null>;
  getTripWithDetails(id: string): Promise<Trip & { destination: any; user: any } | null>;
}

export class TripRepository implements ITripRepository {
  /**
   * Create a new trip
   */
  async create(tripData: TripInsert): Promise<Trip> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('trips')
      .insert(tripData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create trip: ${error.message}`);
    }

    return data;
  }

  /**
   * Find trip by ID
   */
  async findById(id: string): Promise<Trip | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find trip by ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find trips by user ID
   */
  async findByUserId(userId: string): Promise<Trip[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find trips by user ID: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find nearby trips based on destination location
   */
  async findNearbyTrips(latitude: number, longitude: number, radiusKm: number): Promise<Trip[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Join with locations table to get destination coordinates
    const { data, error } = await supabaseAdmin
      .from('trips')
      .select(`
        *,
        locations!trips_destination_id_fkey (
          id,
          name,
          coordinates,
          address
        )
      `)
      .eq('status', 'announced')
      .gt('available_capacity', 0)
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to find nearby trips: ${error.message}`);
    }

    if (!data) return [];

    // Filter by distance (simplified approach)
    // In a real implementation, you'd use PostGIS for efficient spatial queries
    const filteredTrips = data.filter(trip => {
      if (!trip.locations || !trip.locations.coordinates) return false;
      
      // Parse coordinates from PostGIS POINT format
      const coordMatch = trip.locations.coordinates.match(/POINT\(([^)]+)\)/);
      if (!coordMatch) return false;
      
      const [lng, lat] = coordMatch[1].split(' ').map(Number);
      const distance = this.calculateDistance(latitude, longitude, lat, lng);
      return distance <= radiusKm;
    });

    return filteredTrips;
  }

  /**
   * Find all active trips (announced or in progress)
   */
  async findActiveTrips(): Promise<Trip[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .in('status', ['announced', 'in_progress', 'at_destination', 'returning'])
      .order('departure_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to find active trips: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find trips by status
   */
  async findTripsByStatus(status: TripStatus): Promise<Trip[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find trips by status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find trips by destination
   */
  async findTripsByDestination(destinationId: string): Promise<Trip[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('destination_id', destinationId)
      .order('departure_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to find trips by destination: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update trip status
   */
  async updateStatus(id: string, status: SharedTripStatus): Promise<Trip | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Map shared enum to database enum
    const dbStatus = this.mapTripStatusToDb(status);

    const { data, error } = await supabaseAdmin
      .from('trips')
      .update({
        status: dbStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update trip status: ${error.message}`);
    }

    return data;
  }

  /**
   * Update trip available capacity
   */
  async updateCapacity(id: string, availableCapacity: number): Promise<Trip | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('trips')
      .update({
        available_capacity: availableCapacity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update trip capacity: ${error.message}`);
    }

    return data;
  }

  /**
   * Update trip information
   */
  async update(id: string, updates: TripUpdate): Promise<Trip | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('trips')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update trip: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete trip
   */
  async delete(id: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { error } = await supabaseAdmin
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete trip: ${error.message}`);
    }

    return true;
  }

  /**
   * Cancel trip (soft delete by updating status)
   */
  async cancelTrip(id: string): Promise<Trip | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('trips')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to cancel trip: ${error.message}`);
    }

    return data;
  }

  /**
   * Get trip with related details (destination and user info)
   */
  async getTripWithDetails(id: string): Promise<Trip & { destination: any; user: any } | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('trips')
      .select(`
        *,
        locations!trips_destination_id_fkey (
          id,
          name,
          address,
          coordinates,
          category
        ),
        users!trips_user_id_fkey (
          id,
          name,
          rating,
          total_deliveries
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to get trip with details: ${error.message}`);
    }

    return data as Trip & { destination: any; user: any };
  }

  /**
   * Map shared TripStatus enum to database enum
   */
  private mapTripStatusToDb(status: SharedTripStatus): TripStatus {
    switch (status) {
      case SharedTripStatus.ANNOUNCED:
        return 'announced';
      case SharedTripStatus.TRAVELING:
        return 'in_progress';
      case SharedTripStatus.AT_DESTINATION:
        return 'at_destination';
      case SharedTripStatus.RETURNING:
        return 'returning';
      case SharedTripStatus.COMPLETED:
        return 'completed';
      case SharedTripStatus.CANCELLED:
        return 'cancelled';
      default:
        return 'announced';
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }
}