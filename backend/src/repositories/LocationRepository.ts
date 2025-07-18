import { supabaseAdmin } from '../config/database';
import { 
  Location, 
  LocationInsert, 
  LocationUpdate, 
  LocationPresence, 
  LocationPresenceInsert, 
  LocationPresenceUpdate,
  LocationCategory 
} from '../types/database.types';

export interface ILocationRepository {
  create(locationData: LocationInsert): Promise<Location>;
  findById(id: string): Promise<Location | null>;
  searchByName(query: string, category?: LocationCategory): Promise<Location[]>;
  findNearby(latitude: number, longitude: number, radiusKm: number): Promise<Location[]>;
  updateUserCount(id: string, count: number): Promise<Location | null>;
  update(id: string, updates: LocationUpdate): Promise<Location | null>;
  delete(id: string): Promise<boolean>;
  findByCategory(category: LocationCategory): Promise<Location[]>;
}

export interface ILocationPresenceRepository {
  create(presenceData: LocationPresenceInsert): Promise<LocationPresence>;
  findById(id: string): Promise<LocationPresence | null>;
  findActiveByUserId(userId: string): Promise<LocationPresence[]>;
  findActiveByLocationId(locationId: string): Promise<LocationPresence[]>;
  checkIn(userId: string, locationId: string): Promise<LocationPresence>;
  checkOut(id: string): Promise<LocationPresence | null>;
  checkOutByUserAndLocation(userId: string, locationId: string): Promise<LocationPresence | null>;
  getActiveCountByLocation(locationId: string): Promise<number>;
  getUserActivePresence(userId: string): Promise<LocationPresence | null>;
}

export class LocationRepository implements ILocationRepository {
  /**
   * Create a new location
   */
  async create(locationData: LocationInsert): Promise<Location> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert(locationData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create location: ${error.message}`);
    }

    return data;
  }

  /**
   * Find location by ID
   */
  async findById(id: string): Promise<Location | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find location by ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Search locations by name with optional category filter
   */
  async searchByName(query: string, category?: LocationCategory): Promise<Location[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    let queryBuilder = supabaseAdmin
      .from('locations')
      .select('*')
      .ilike('name', `%${query}%`);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data, error } = await queryBuilder
      .order('name')
      .limit(50);

    if (error) {
      throw new Error(`Failed to search locations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find nearby locations using PostGIS distance calculation
   */
  async findNearby(latitude: number, longitude: number, radiusKm: number): Promise<Location[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Using PostGIS ST_DWithin for efficient spatial queries
    // Note: This requires PostGIS extension and proper coordinate handling
    const { data, error } = await supabaseAdmin
      .rpc('find_nearby_locations', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm
      });

    if (error) {
      // Fallback to basic query if PostGIS function is not available
      console.warn('PostGIS function not available, using basic query');
      
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('locations')
        .select('*')
        .limit(50);

      if (fallbackError) {
        throw new Error(`Failed to find nearby locations: ${fallbackError.message}`);
      }

      // Simple distance filtering (not as efficient as PostGIS)
      const filtered = (fallbackData || []).filter(location => {
        // Parse coordinates from PostGIS POINT format
        const coordMatch = location.coordinates.match(/POINT\(([^)]+)\)/);
        if (!coordMatch) return false;
        
        const [lng, lat] = coordMatch[1].split(' ').map(Number);
        const distance = this.calculateDistance(latitude, longitude, lat, lng);
        return distance <= radiusKm;
      });

      return filtered;
    }

    return data || [];
  }

  /**
   * Update user count for a location
   */
  async updateUserCount(id: string, count: number): Promise<Location | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .update({
        current_user_count: count,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update user count: ${error.message}`);
    }

    return data;
  }

  /**
   * Update location information
   */
  async update(id: string, updates: LocationUpdate): Promise<Location | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update location: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete location
   */
  async delete(id: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { error } = await supabaseAdmin
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete location: ${error.message}`);
    }

    return true;
  }

  /**
   * Find locations by category
   */
  async findByCategory(category: LocationCategory): Promise<Location[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('category', category)
      .order('name');

    if (error) {
      throw new Error(`Failed to find locations by category: ${error.message}`);
    }

    return data || [];
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

export class LocationPresenceRepository implements ILocationPresenceRepository {
  /**
   * Create a new location presence record
   */
  async create(presenceData: LocationPresenceInsert): Promise<LocationPresence> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('location_presence')
      .insert(presenceData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create location presence: ${error.message}`);
    }

    return data;
  }

  /**
   * Find location presence by ID
   */
  async findById(id: string): Promise<LocationPresence | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('location_presence')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find location presence by ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find active presence records for a user
   */
  async findActiveByUserId(userId: string): Promise<LocationPresence[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('location_presence')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('checked_in_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find active presence by user: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find active presence records for a location
   */
  async findActiveByLocationId(locationId: string): Promise<LocationPresence[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('location_presence')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true)
      .order('checked_in_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find active presence by location: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check in a user to a location
   */
  async checkIn(userId: string, locationId: string): Promise<LocationPresence> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // First, check out any existing active presence for this user
    await this.checkOutActivePresenceForUser(userId);

    // Create new check-in record
    const presenceData: LocationPresenceInsert = {
      user_id: userId,
      location_id: locationId,
      is_active: true
    };

    return this.create(presenceData);
  }

  /**
   * Check out from a location by presence ID
   */
  async checkOut(id: string): Promise<LocationPresence | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('location_presence')
      .update({
        checked_out_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to check out: ${error.message}`);
    }

    return data;
  }

  /**
   * Check out from a location by user and location ID
   */
  async checkOutByUserAndLocation(userId: string, locationId: string): Promise<LocationPresence | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('location_presence')
      .update({
        checked_out_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('location_id', locationId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to check out by user and location: ${error.message}`);
    }

    return data;
  }

  /**
   * Get count of active users at a location
   */
  async getActiveCountByLocation(locationId: string): Promise<number> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { count, error } = await supabaseAdmin
      .from('location_presence')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', locationId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get active count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get user's current active presence
   */
  async getUserActivePresence(userId: string): Promise<LocationPresence | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('location_presence')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('checked_in_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No active presence
      }
      throw new Error(`Failed to get user active presence: ${error.message}`);
    }

    return data;
  }

  /**
   * Helper method to check out all active presence for a user
   */
  private async checkOutActivePresenceForUser(userId: string): Promise<void> {
    if (!supabaseAdmin) {
      return;
    }

    await supabaseAdmin
      .from('location_presence')
      .update({
        checked_out_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);
  }
}