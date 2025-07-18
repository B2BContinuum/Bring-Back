import { TripService } from '../TripService';
import { Trip } from '../../models/Trip';
import { TripStatus, LocationCategory } from '../../../../shared/src/types';

// Mock repositories
const mockTripRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findNearbyTrips: jest.fn(),
  findActiveTrips: jest.fn(),
  findTripsByStatus: jest.fn(),
  findTripsByDestination: jest.fn(),
  updateStatus: jest.fn(),
  updateCapacity: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  cancelTrip: jest.fn(),
  getTripWithDetails: jest.fn()
};

const mockLocationRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  findNearby: jest.fn(),
  searchByName: jest.fn(),
  update: jest.fn(),
  updateUserCount: jest.fn(),
  delete: jest.fn()
};

const mockUserRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  updateRating: jest.fn(),
  delete: jest.fn(),
  addRating: jest.fn(),
  getUserRatings: jest.fn()
};

describe('TripService', () => {
  let tripService: TripService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    tripService = new TripService(
      mockTripRepository as any,
      mockLocationRepository as any,
      mockUserRepository as any
    );
  });

  describe('createTrip', () => {
    const mockUser = { id: 'user-123', name: 'Test User' };
    const mockLocation = { 
      id: 'loc-123', 
      name: 'Test Location',
      coordinates: 'POINT(10.0 20.0)',
      address: JSON.stringify({
        street: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country'
      }),
      category: 'grocery',
      verified: true,
      current_user_count: 5
    };
    
    const mockTripData = {
      userId: 'user-123',
      destination: {
        id: 'loc-123',
        name: 'Test Location',
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        },
        coordinates: {
          latitude: 20.0,
          longitude: 10.0
        },
        category: LocationCategory.GROCERY,
        verified: true,
        currentUserCount: 5
      },
      departureTime: new Date(Date.now() + 3600000), // 1 hour in the future
      estimatedReturnTime: new Date(Date.now() + 7200000), // 2 hours in the future
      capacity: 3,
      description: 'Test trip'
    };

    const mockDbTrip = {
      id: 'trip-123',
      user_id: 'user-123',
      destination_id: 'loc-123',
      departure_time: mockTripData.departureTime.toISOString(),
      estimated_return_time: mockTripData.estimatedReturnTime.toISOString(),
      capacity: 3,
      available_capacity: 3,
      status: 'announced',
      description: 'Test trip',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockTripWithDetails = {
      ...mockDbTrip,
      destination: mockLocation,
      user: mockUser
    };

    it('should create a trip successfully', async () => {
      // Setup mocks
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockLocationRepository.findById.mockResolvedValue(mockLocation);
      mockTripRepository.create.mockResolvedValue(mockDbTrip);
      mockTripRepository.getTripWithDetails.mockResolvedValue(mockTripWithDetails);

      // Execute
      const result = await tripService.createTrip(mockTripData);

      // Verify
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockLocationRepository.findById).toHaveBeenCalledWith('loc-123');
      expect(mockTripRepository.create).toHaveBeenCalled();
      expect(mockTripRepository.getTripWithDetails).toHaveBeenCalledWith('trip-123');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('trip-123');
      expect(result.userId).toBe('user-123');
      expect(result.destination.id).toBe('loc-123');
      expect(result.capacity).toBe(3);
      expect(result.availableCapacity).toBe(3);
      expect(result.status).toBe(TripStatus.ANNOUNCED);
    });

    it('should throw error if user not found', async () => {
      // Setup mocks
      mockUserRepository.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(tripService.createTrip(mockTripData))
        .rejects.toThrow('User not found');
      
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockLocationRepository.findById).not.toHaveBeenCalled();
      expect(mockTripRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if location not found', async () => {
      // Setup mocks
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockLocationRepository.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(tripService.createTrip(mockTripData))
        .rejects.toThrow('Location not found');
      
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockLocationRepository.findById).toHaveBeenCalledWith('loc-123');
      expect(mockTripRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if trip data is invalid', async () => {
      // Setup invalid trip data (departure time in the past)
      const invalidTripData = {
        ...mockTripData,
        departureTime: new Date(Date.now() - 3600000) // 1 hour in the past
      };

      // Execute & Verify
      await expect(tripService.createTrip(invalidTripData))
        .rejects.toThrow('Invalid trip data');
      
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockLocationRepository.findById).not.toHaveBeenCalled();
      expect(mockTripRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getTripById', () => {
    const mockTripWithDetails = {
      id: 'trip-123',
      user_id: 'user-123',
      destination_id: 'loc-123',
      departure_time: new Date().toISOString(),
      estimated_return_time: new Date().toISOString(),
      capacity: 3,
      available_capacity: 3,
      status: 'announced',
      description: 'Test trip',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      destination: {
        id: 'loc-123',
        name: 'Test Location',
        coordinates: 'POINT(10.0 20.0)',
        address: JSON.stringify({
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        }),
        category: 'grocery',
        verified: true,
        current_user_count: 5
      },
      user: {
        id: 'user-123',
        name: 'Test User',
        rating: 4.5,
        total_deliveries: 10
      }
    };

    it('should get trip by ID successfully', async () => {
      // Setup mocks
      mockTripRepository.getTripWithDetails.mockResolvedValue(mockTripWithDetails);

      // Execute
      const result = await tripService.getTripById('trip-123');

      // Verify
      expect(mockTripRepository.getTripWithDetails).toHaveBeenCalledWith('trip-123');
      expect(result).toBeDefined();
      expect(result?.id).toBe('trip-123');
      expect(result?.userId).toBe('user-123');
      expect(result?.destination.id).toBe('loc-123');
      expect(result?.status).toBe(TripStatus.ANNOUNCED);
      expect((result as any).user).toBeDefined();
      expect((result as any).user.name).toBe('Test User');
    });

    it('should return null if trip not found', async () => {
      // Setup mocks
      mockTripRepository.getTripWithDetails.mockResolvedValue(null);

      // Execute
      const result = await tripService.getTripById('non-existent-trip');

      // Verify
      expect(mockTripRepository.getTripWithDetails).toHaveBeenCalledWith('non-existent-trip');
      expect(result).toBeNull();
    });

    it('should throw error if trip ID is empty', async () => {
      // Execute & Verify
      await expect(tripService.getTripById('')).rejects.toThrow('Trip ID is required');
      expect(mockTripRepository.getTripWithDetails).not.toHaveBeenCalled();
    });
  });

  describe('updateTripStatus', () => {
    const mockTrip = {
      id: 'trip-123',
      user_id: 'user-123',
      destination_id: 'loc-123',
      departure_time: new Date().toISOString(),
      estimated_return_time: new Date().toISOString(),
      capacity: 3,
      available_capacity: 3,
      status: 'announced',
      description: 'Test trip',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockUpdatedTrip = {
      ...mockTrip,
      status: 'in_progress',
      updated_at: new Date().toISOString()
    };

    const mockTripWithDetails = {
      ...mockUpdatedTrip,
      destination: {
        id: 'loc-123',
        name: 'Test Location',
        coordinates: 'POINT(10.0 20.0)',
        address: JSON.stringify({
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        }),
        category: 'grocery',
        verified: true,
        current_user_count: 5
      },
      user: {
        id: 'user-123',
        name: 'Test User',
        rating: 4.5,
        total_deliveries: 10
      }
    };

    it('should update trip status successfully', async () => {
      // Setup mocks
      mockTripRepository.findById.mockResolvedValue(mockTrip);
      mockTripRepository.updateStatus.mockResolvedValue(mockUpdatedTrip);
      mockTripRepository.getTripWithDetails.mockResolvedValue(mockTripWithDetails);

      // Execute
      const result = await tripService.updateTripStatus('trip-123', TripStatus.TRAVELING);

      // Verify
      expect(mockTripRepository.findById).toHaveBeenCalledWith('trip-123');
      expect(mockTripRepository.updateStatus).toHaveBeenCalledWith('trip-123', TripStatus.TRAVELING);
      expect(mockTripRepository.getTripWithDetails).toHaveBeenCalledWith('trip-123');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('trip-123');
      expect(result?.status).toBe(TripStatus.TRAVELING);
    });

    it('should throw error if trip not found', async () => {
      // Setup mocks
      mockTripRepository.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(tripService.updateTripStatus('non-existent-trip', TripStatus.TRAVELING))
        .rejects.toThrow('Trip not found');
      
      expect(mockTripRepository.findById).toHaveBeenCalledWith('non-existent-trip');
      expect(mockTripRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw error if status transition is invalid', async () => {
      // Setup mocks for completed trip
      const completedTrip = { ...mockTrip, status: 'completed' };
      mockTripRepository.findById.mockResolvedValue(completedTrip);

      // Execute & Verify - can't transition from completed to traveling
      await expect(tripService.updateTripStatus('trip-123', TripStatus.TRAVELING))
        .rejects.toThrow('Invalid status transition');
      
      expect(mockTripRepository.findById).toHaveBeenCalledWith('trip-123');
      expect(mockTripRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('cancelTrip', () => {
    const mockTrip = {
      id: 'trip-123',
      user_id: 'user-123',
      destination_id: 'loc-123',
      departure_time: new Date().toISOString(),
      estimated_return_time: new Date().toISOString(),
      capacity: 3,
      available_capacity: 3,
      status: 'announced',
      description: 'Test trip',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockCancelledTrip = {
      ...mockTrip,
      status: 'cancelled',
      updated_at: new Date().toISOString()
    };

    const mockTripWithDetails = {
      ...mockCancelledTrip,
      destination: {
        id: 'loc-123',
        name: 'Test Location',
        coordinates: 'POINT(10.0 20.0)',
        address: JSON.stringify({
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        }),
        category: 'grocery',
        verified: true,
        current_user_count: 5
      },
      user: {
        id: 'user-123',
        name: 'Test User',
        rating: 4.5,
        total_deliveries: 10
      }
    };

    it('should cancel trip successfully', async () => {
      // Setup mocks
      mockTripRepository.findById.mockResolvedValue(mockTrip);
      mockTripRepository.cancelTrip.mockResolvedValue(mockCancelledTrip);
      mockTripRepository.getTripWithDetails.mockResolvedValue(mockTripWithDetails);

      // Execute
      const result = await tripService.cancelTrip('trip-123');

      // Verify
      expect(mockTripRepository.findById).toHaveBeenCalledWith('trip-123');
      expect(mockTripRepository.cancelTrip).toHaveBeenCalledWith('trip-123');
      expect(mockTripRepository.getTripWithDetails).toHaveBeenCalledWith('trip-123');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('trip-123');
      expect(result?.status).toBe(TripStatus.CANCELLED);
    });

    it('should throw error if trip not found', async () => {
      // Setup mocks
      mockTripRepository.findById.mockResolvedValue(null);

      // Execute & Verify
      await expect(tripService.cancelTrip('non-existent-trip'))
        .rejects.toThrow('Trip not found');
      
      expect(mockTripRepository.findById).toHaveBeenCalledWith('non-existent-trip');
      expect(mockTripRepository.cancelTrip).not.toHaveBeenCalled();
    });

    it('should throw error if trip is not in announced status', async () => {
      // Setup mocks for in-progress trip
      const inProgressTrip = { ...mockTrip, status: 'in_progress' };
      mockTripRepository.findById.mockResolvedValue(inProgressTrip);

      // Execute & Verify
      await expect(tripService.cancelTrip('trip-123'))
        .rejects.toThrow('Only announced trips can be cancelled');
      
      expect(mockTripRepository.findById).toHaveBeenCalledWith('trip-123');
      expect(mockTripRepository.cancelTrip).not.toHaveBeenCalled();
    });
  });

  describe('getNearbyTrips', () => {
    const mockNearbyTrips = [
      {
        id: 'trip-123',
        user_id: 'user-123',
        destination_id: 'loc-123',
        departure_time: new Date().toISOString(),
        estimated_return_time: new Date().toISOString(),
        capacity: 3,
        available_capacity: 3,
        status: 'announced',
        description: 'Test trip',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        locations: {
          id: 'loc-123',
          name: 'Test Location',
          coordinates: 'POINT(10.0 20.0)',
          address: JSON.stringify({
            street: '123 Main St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'Test Country'
          }),
          category: 'grocery',
          verified: true,
          current_user_count: 5
        }
      }
    ];

    it('should get nearby trips successfully', async () => {
      // Setup mocks
      mockTripRepository.findNearbyTrips.mockResolvedValue(mockNearbyTrips);

      // Execute
      const result = await tripService.getNearbyTrips(20.0, 10.0, 5);

      // Verify
      expect(mockTripRepository.findNearbyTrips).toHaveBeenCalledWith(20.0, 10.0, 5);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('trip-123');
      expect(result[0].destination.id).toBe('loc-123');
    });

    it('should throw error if coordinates are invalid', async () => {
      // Execute & Verify
      await expect(tripService.getNearbyTrips(100.0, 10.0, 5))
        .rejects.toThrow('Invalid coordinates provided');
      
      expect(mockTripRepository.findNearbyTrips).not.toHaveBeenCalled();
    });

    it('should throw error if radius is invalid', async () => {
      // Execute & Verify
      await expect(tripService.getNearbyTrips(20.0, 10.0, 0))
        .rejects.toThrow('Radius must be between 0 and 100 kilometers');
      
      expect(mockTripRepository.findNearbyTrips).not.toHaveBeenCalled();
    });
  });
});