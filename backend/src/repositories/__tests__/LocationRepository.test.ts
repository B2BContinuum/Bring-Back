import { LocationRepository, LocationPresenceRepository } from '../LocationRepository';
import { supabaseAdmin } from '../../config/database';
import { LocationInsert, LocationPresenceInsert, LocationCategory } from '../../types/database.types';

// Mock the database config
jest.mock('../../config/database', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

describe('LocationRepository', () => {
  let locationRepository: LocationRepository;
  let mockSupabaseAdmin: any;

  beforeEach(() => {
    // Reset the mock before each test
    mockSupabaseAdmin = {
      from: jest.fn(),
      rpc: jest.fn()
    };
    (supabaseAdmin as any) = mockSupabaseAdmin;
    
    locationRepository = new LocationRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new location successfully', async () => {
      const locationData: LocationInsert = {
        name: 'Test Store',
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        },
        coordinates: 'POINT(-122.4194 37.7749)',
        category: 'grocery' as LocationCategory
      };

      const expectedLocation = {
        id: 'location-123',
        ...locationData,
        verified: false,
        current_user_count: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedLocation, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await locationRepository.create(locationData);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('locations');
      expect(mockChain.insert).toHaveBeenCalledWith(locationData);
      expect(result).toEqual(expectedLocation);
    });

    it('should throw error when database connection is not available', async () => {
      (supabaseAdmin as any) = null;
      locationRepository = new LocationRepository();

      const locationData: LocationInsert = {
        name: 'Test Store',
        address: {},
        coordinates: 'POINT(-122.4194 37.7749)',
        category: 'grocery' as LocationCategory
      };

      await expect(locationRepository.create(locationData)).rejects.toThrow('Database connection not available');
    });
  });

  describe('findById', () => {
    it('should find location by ID successfully', async () => {
      const locationId = 'location-123';
      const expectedLocation = {
        id: locationId,
        name: 'Test Store',
        category: 'grocery',
        current_user_count: 5
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedLocation, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await locationRepository.findById(locationId);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('locations');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('id', locationId);
      expect(result).toEqual(expectedLocation);
    });

    it('should return null when location not found', async () => {
      const locationId = 'non-existent-location';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await locationRepository.findById(locationId);

      expect(result).toBeNull();
    });
  });

  describe('searchByName', () => {
    it('should search locations by name successfully', async () => {
      const query = 'grocery';
      const expectedLocations = [
        { id: 'loc-1', name: 'Grocery Store 1', category: 'grocery' },
        { id: 'loc-2', name: 'Grocery Store 2', category: 'grocery' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: expectedLocations, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await locationRepository.searchByName(query);

      expect(mockChain.ilike).toHaveBeenCalledWith('name', `%${query}%`);
      expect(mockChain.order).toHaveBeenCalledWith('name');
      expect(mockChain.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(expectedLocations);
    });

    it('should search locations by name with category filter', async () => {
      const query = 'store';
      const category = 'grocery' as LocationCategory;

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      await locationRepository.searchByName(query, category);

      expect(mockChain.eq).toHaveBeenCalledWith('category', category);
    });
  });

  describe('findNearby', () => {
    it('should find nearby locations using PostGIS function', async () => {
      const latitude = 37.7749;
      const longitude = -122.4194;
      const radiusKm = 5;
      const expectedLocations = [
        { id: 'loc-1', name: 'Nearby Store 1' },
        { id: 'loc-2', name: 'Nearby Store 2' }
      ];

      mockSupabaseAdmin.rpc.mockResolvedValue({ data: expectedLocations, error: null });

      const result = await locationRepository.findNearby(latitude, longitude, radiusKm);

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('find_nearby_locations', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm
      });
      expect(result).toEqual(expectedLocations);
    });

    it('should fallback to basic query when PostGIS function fails', async () => {
      const latitude = 37.7749;
      const longitude = -122.4194;
      const radiusKm = 5;
      const fallbackLocations = [
        { 
          id: 'loc-1', 
          name: 'Store 1', 
          coordinates: 'POINT(-122.4194 37.7749)' // Same location
        },
        { 
          id: 'loc-2', 
          name: 'Store 2', 
          coordinates: 'POINT(-122.5000 37.8000)' // Different location
        }
      ];

      // Mock PostGIS function failure
      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: { message: 'Function not found' } });

      // Mock fallback query
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: fallbackLocations, error: null })
      };
      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await locationRepository.findNearby(latitude, longitude, radiusKm);

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalled();
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('locations');
      expect(result).toHaveLength(1); // Only the nearby location should be returned
      expect(result[0].id).toBe('loc-1');
    });
  });

  describe('updateUserCount', () => {
    it('should update user count successfully', async () => {
      const locationId = 'location-123';
      const count = 10;
      const expectedLocation = {
        id: locationId,
        current_user_count: count,
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedLocation, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await locationRepository.updateUserCount(locationId, count);

      expect(mockChain.update).toHaveBeenCalledWith({
        current_user_count: count,
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', locationId);
      expect(result).toEqual(expectedLocation);
    });
  });

  describe('findByCategory', () => {
    it('should find locations by category successfully', async () => {
      const category = 'grocery' as LocationCategory;
      const expectedLocations = [
        { id: 'loc-1', name: 'Grocery 1', category: 'grocery' },
        { id: 'loc-2', name: 'Grocery 2', category: 'grocery' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedLocations, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await locationRepository.findByCategory(category);

      expect(mockChain.eq).toHaveBeenCalledWith('category', category);
      expect(mockChain.order).toHaveBeenCalledWith('name');
      expect(result).toEqual(expectedLocations);
    });
  });

  describe('delete', () => {
    it('should delete location successfully', async () => {
      const locationId = 'location-123';

      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await locationRepository.delete(locationId);

      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', locationId);
      expect(result).toBe(true);
    });
  });
});

describe('LocationPresenceRepository', () => {
  let presenceRepository: LocationPresenceRepository;
  let mockSupabaseAdmin: any;

  beforeEach(() => {
    // Reset the mock before each test
    mockSupabaseAdmin = {
      from: jest.fn()
    };
    (supabaseAdmin as any) = mockSupabaseAdmin;
    
    presenceRepository = new LocationPresenceRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create location presence successfully', async () => {
      const presenceData: LocationPresenceInsert = {
        user_id: 'user-123',
        location_id: 'location-456',
        is_active: true
      };

      const expectedPresence = {
        id: 'presence-789',
        ...presenceData,
        checked_in_at: '2023-01-01T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedPresence, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await presenceRepository.create(presenceData);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('location_presence');
      expect(mockChain.insert).toHaveBeenCalledWith(presenceData);
      expect(result).toEqual(expectedPresence);
    });
  });

  describe('findActiveByUserId', () => {
    it('should find active presence by user ID', async () => {
      const userId = 'user-123';
      const expectedPresences = [
        { id: 'presence-1', user_id: userId, is_active: true },
        { id: 'presence-2', user_id: userId, is_active: true }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedPresences, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await presenceRepository.findActiveByUserId(userId);

      expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.order).toHaveBeenCalledWith('checked_in_at', { ascending: false });
      expect(result).toEqual(expectedPresences);
    });
  });

  describe('checkIn', () => {
    it('should check in user to location successfully', async () => {
      const userId = 'user-123';
      const locationId = 'location-456';

      // Mock the checkout of existing presence
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      };

      // Mock the creation of new presence
      const mockInsertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'presence-new', user_id: userId, location_id: locationId, is_active: true }, 
          error: null 
        })
      };

      mockSupabaseAdmin.from
        .mockReturnValueOnce(mockUpdateChain) // For checkout
        .mockReturnValueOnce(mockInsertChain); // For create

      const result = await presenceRepository.checkIn(userId, locationId);

      expect(result.user_id).toBe(userId);
      expect(result.location_id).toBe(locationId);
      expect(result.is_active).toBe(true);
    });
  });

  describe('checkOut', () => {
    it('should check out from location successfully', async () => {
      const presenceId = 'presence-123';
      const expectedPresence = {
        id: presenceId,
        is_active: false,
        checked_out_at: expect.any(String),
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedPresence, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await presenceRepository.checkOut(presenceId);

      expect(mockChain.update).toHaveBeenCalledWith({
        checked_out_at: expect.any(String),
        is_active: false,
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', presenceId);
      expect(result).toEqual(expectedPresence);
    });
  });

  describe('getActiveCountByLocation', () => {
    it('should get active count by location successfully', async () => {
      const locationId = 'location-123';
      const expectedCount = 5;

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ count: expectedCount, error: null })
        }))
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await presenceRepository.getActiveCountByLocation(locationId);

      expect(mockChain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no active users', async () => {
      const locationId = 'location-123';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ count: null, error: null })
        }))
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await presenceRepository.getActiveCountByLocation(locationId);

      expect(result).toBe(0);
    });
  });

  describe('getUserActivePresence', () => {
    it('should get user active presence successfully', async () => {
      const userId = 'user-123';
      const expectedPresence = {
        id: 'presence-active',
        user_id: userId,
        is_active: true
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedPresence, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await presenceRepository.getUserActivePresence(userId);

      expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.order).toHaveBeenCalledWith('checked_in_at', { ascending: false });
      expect(mockChain.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedPresence);
    });

    it('should return null when no active presence', async () => {
      const userId = 'user-123';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await presenceRepository.getUserActivePresence(userId);

      expect(result).toBeNull();
    });
  });
});