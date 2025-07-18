import { TripRepository } from '../TripRepository';
import { supabaseAdmin } from '../../config/database';
import { TripInsert, TripStatus } from '../../types/database.types';
import { TripStatus as SharedTripStatus } from '../../../../shared/src/types';

// Mock the database config
jest.mock('../../config/database', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

describe('TripRepository', () => {
  let tripRepository: TripRepository;
  let mockSupabaseAdmin: any;

  beforeEach(() => {
    // Reset the mock before each test
    mockSupabaseAdmin = {
      from: jest.fn()
    };
    (supabaseAdmin as any) = mockSupabaseAdmin;
    
    tripRepository = new TripRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new trip successfully', async () => {
      const tripData: TripInsert = {
        user_id: 'user-123',
        destination_id: 'location-456',
        departure_time: '2023-12-01T10:00:00Z',
        capacity: 3,
        available_capacity: 3
      };

      const expectedTrip = {
        id: 'trip-789',
        ...tripData,
        status: 'announced',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedTrip, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.create(tripData);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('trips');
      expect(mockChain.insert).toHaveBeenCalledWith(tripData);
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(expectedTrip);
    });

    it('should throw error when database connection is not available', async () => {
      (supabaseAdmin as any) = null;
      tripRepository = new TripRepository();

      const tripData: TripInsert = {
        user_id: 'user-123',
        destination_id: 'location-456',
        departure_time: '2023-12-01T10:00:00Z'
      };

      await expect(tripRepository.create(tripData)).rejects.toThrow('Database connection not available');
    });

    it('should throw error when database operation fails', async () => {
      const tripData: TripInsert = {
        user_id: 'user-123',
        destination_id: 'location-456',
        departure_time: '2023-12-01T10:00:00Z'
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      await expect(tripRepository.create(tripData)).rejects.toThrow('Failed to create trip: Database error');
    });
  });

  describe('findById', () => {
    it('should find trip by ID successfully', async () => {
      const tripId = 'trip-123';
      const expectedTrip = {
        id: tripId,
        user_id: 'user-456',
        destination_id: 'location-789',
        status: 'announced',
        capacity: 3,
        available_capacity: 2
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedTrip, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.findById(tripId);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('trips');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('id', tripId);
      expect(result).toEqual(expectedTrip);
    });

    it('should return null when trip not found', async () => {
      const tripId = 'non-existent-trip';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.findById(tripId);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find trips by user ID successfully', async () => {
      const userId = 'user-123';
      const expectedTrips = [
        { id: 'trip-1', user_id: userId, status: 'announced' },
        { id: 'trip-2', user_id: userId, status: 'completed' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedTrips, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.findByUserId(userId);

      expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(expectedTrips);
    });

    it('should return empty array when no trips found', async () => {
      const userId = 'user-123';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.findByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findNearbyTrips', () => {
    it('should find nearby trips successfully', async () => {
      const latitude = 37.7749;
      const longitude = -122.4194;
      const radiusKm = 5;
      
      const mockTripsWithLocations = [
        {
          id: 'trip-1',
          status: 'announced',
          available_capacity: 2,
          departure_time: '2023-12-01T10:00:00Z',
          locations: {
            id: 'loc-1',
            name: 'Store 1',
            coordinates: 'POINT(-122.4194 37.7749)' // Same location
          }
        },
        {
          id: 'trip-2',
          status: 'announced',
          available_capacity: 1,
          departure_time: '2023-12-01T11:00:00Z',
          locations: {
            id: 'loc-2',
            name: 'Store 2',
            coordinates: 'POINT(-122.5000 37.8000)' // Different location
          }
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockTripsWithLocations, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.findNearbyTrips(latitude, longitude, radiusKm);

      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('locations!trips_destination_id_fkey'));
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'announced');
      expect(mockChain.gt).toHaveBeenCalledWith('available_capacity', 0);
      expect(mockChain.gte).toHaveBeenCalledWith('departure_time', expect.any(String));
      expect(result).toHaveLength(1); // Only the nearby trip should be returned
      expect(result[0].id).toBe('trip-1');
    });

    it('should return empty array when no nearby trips found', async () => {
      const latitude = 37.7749;
      const longitude = -122.4194;
      const radiusKm = 5;

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.findNearbyTrips(latitude, longitude, radiusKm);

      expect(result).toEqual([]);
    });
  });

  describe('findActiveTrips', () => {
    it('should find active trips successfully', async () => {
      const expectedTrips = [
        { id: 'trip-1', status: 'announced' },
        { id: 'trip-2', status: 'in_progress' },
        { id: 'trip-3', status: 'at_destination' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedTrips, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.findActiveTrips();

      expect(mockChain.in).toHaveBeenCalledWith('status', ['announced', 'in_progress', 'at_destination', 'returning']);
      expect(mockChain.order).toHaveBeenCalledWith('departure_time', { ascending: true });
      expect(result).toEqual(expectedTrips);
    });
  });

  describe('findTripsByStatus', () => {
    it('should find trips by status successfully', async () => {
      const status: TripStatus = 'announced';
      const expectedTrips = [
        { id: 'trip-1', status: 'announced' },
        { id: 'trip-2', status: 'announced' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedTrips, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.findTripsByStatus(status);

      expect(mockChain.eq).toHaveBeenCalledWith('status', status);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(expectedTrips);
    });
  });

  describe('findTripsByDestination', () => {
    it('should find trips by destination successfully', async () => {
      const destinationId = 'location-123';
      const expectedTrips = [
        { id: 'trip-1', destination_id: destinationId },
        { id: 'trip-2', destination_id: destinationId }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedTrips, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.findTripsByDestination(destinationId);

      expect(mockChain.eq).toHaveBeenCalledWith('destination_id', destinationId);
      expect(mockChain.order).toHaveBeenCalledWith('departure_time', { ascending: true });
      expect(result).toEqual(expectedTrips);
    });
  });

  describe('updateStatus', () => {
    it('should update trip status successfully', async () => {
      const tripId = 'trip-123';
      const status = SharedTripStatus.TRAVELING;
      const expectedTrip = {
        id: tripId,
        status: 'in_progress',
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedTrip, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.updateStatus(tripId, status);

      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'in_progress',
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', tripId);
      expect(result).toEqual(expectedTrip);
    });

    it('should map trip status correctly', async () => {
      const tripId = 'trip-123';
      
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      // Test ANNOUNCED -> announced
      await tripRepository.updateStatus(tripId, SharedTripStatus.ANNOUNCED);
      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'announced',
        updated_at: expect.any(String)
      });

      // Test COMPLETED -> completed
      await tripRepository.updateStatus(tripId, SharedTripStatus.COMPLETED);
      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'completed',
        updated_at: expect.any(String)
      });

      // Test CANCELLED -> cancelled
      await tripRepository.updateStatus(tripId, SharedTripStatus.CANCELLED);
      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'cancelled',
        updated_at: expect.any(String)
      });
    });
  });

  describe('updateCapacity', () => {
    it('should update trip capacity successfully', async () => {
      const tripId = 'trip-123';
      const availableCapacity = 2;
      const expectedTrip = {
        id: tripId,
        available_capacity: availableCapacity,
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedTrip, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.updateCapacity(tripId, availableCapacity);

      expect(mockChain.update).toHaveBeenCalledWith({
        available_capacity: availableCapacity,
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', tripId);
      expect(result).toEqual(expectedTrip);
    });
  });

  describe('update', () => {
    it('should update trip successfully', async () => {
      const tripId = 'trip-123';
      const updates = { description: 'Updated description' };
      const expectedTrip = {
        id: tripId,
        description: 'Updated description',
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedTrip, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.update(tripId, updates);

      expect(mockChain.update).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', tripId);
      expect(result).toEqual(expectedTrip);
    });
  });

  describe('delete', () => {
    it('should delete trip successfully', async () => {
      const tripId = 'trip-123';

      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.delete(tripId);

      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', tripId);
      expect(result).toBe(true);
    });
  });

  describe('cancelTrip', () => {
    it('should cancel trip successfully', async () => {
      const tripId = 'trip-123';
      const expectedTrip = {
        id: tripId,
        status: 'cancelled',
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedTrip, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.cancelTrip(tripId);

      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'cancelled',
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', tripId);
      expect(result).toEqual(expectedTrip);
    });
  });

  describe('getTripWithDetails', () => {
    it('should get trip with details successfully', async () => {
      const tripId = 'trip-123';
      const expectedTripWithDetails = {
        id: tripId,
        user_id: 'user-456',
        destination_id: 'location-789',
        locations: {
          id: 'location-789',
          name: 'Test Store',
          address: { street: '123 Main St' },
          coordinates: 'POINT(-122.4194 37.7749)',
          category: 'grocery'
        },
        users: {
          id: 'user-456',
          name: 'John Doe',
          rating: 4.5,
          total_deliveries: 10
        }
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedTripWithDetails, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.getTripWithDetails(tripId);

      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('locations!trips_destination_id_fkey'));
      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('users!trips_user_id_fkey'));
      expect(mockChain.eq).toHaveBeenCalledWith('id', tripId);
      expect(result).toEqual(expectedTripWithDetails);
    });

    it('should return null when trip not found', async () => {
      const tripId = 'non-existent-trip';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await tripRepository.getTripWithDetails(tripId);

      expect(result).toBeNull();
    });
  });
});