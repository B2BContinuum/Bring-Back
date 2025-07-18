import { LocationService, ILocationService } from '../LocationService';
import { ILocationRepository, ILocationPresenceRepository } from '../../repositories/LocationRepository';
import { Location } from '../../models/Location';
import { LocationPresence } from '../../models/LocationPresence';
import { LocationCategory } from '../../../../shared/src/types';
import { LocationInsert } from '../../types/database.types';

// Mock repositories
const mockLocationRepository: jest.Mocked<ILocationRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  searchByName: jest.fn(),
  findNearby: jest.fn(),
  updateUserCount: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByCategory: jest.fn(),
};

const mockLocationPresenceRepository: jest.Mocked<ILocationPresenceRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findActiveByUserId: jest.fn(),
  findActiveByLocationId: jest.fn(),
  checkIn: jest.fn(),
  checkOut: jest.fn(),
  checkOutByUserAndLocation: jest.fn(),
  getActiveCountByLocation: jest.fn(),
  getUserActivePresence: jest.fn(),
};

describe('LocationService', () => {
  let locationService: ILocationService;

  beforeEach(() => {
    locationService = new LocationService(mockLocationRepository, mockLocationPresenceRepository);
    jest.clearAllMocks();
  });

  describe('createLocation', () => {
    const validLocationData = {
      name: 'Test Store',
      address: {
        street: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US'
      },
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      category: LocationCategory.GROCERY,
      verified: true
    };

    it('should create a location with valid data', async () => {
      const mockDbLocation = {
        id: '1',
        name: 'Test Store',
        address: JSON.stringify(validLocationData.address),
        coordinates: 'POINT(-74.0060 40.7128)',
        category: 'grocery' as const,
        verified: true,
        current_user_count: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      
      mockLocationRepository.create.mockResolvedValue(mockDbLocation);

      const result = await locationService.createLocation(validLocationData);

      expect(mockLocationRepository.create).toHaveBeenCalledWith({
        name: validLocationData.name,
        address: JSON.stringify(validLocationData.address),
        coordinates: `POINT(${validLocationData.coordinates.longitude} ${validLocationData.coordinates.latitude})`,
        category: validLocationData.category,
        verified: true,
        current_user_count: 0
      });
      expect(result).toBeInstanceOf(Location);
      expect(result.name).toBe('Test Store');
      expect(result.coordinates.latitude).toBe(40.7128);
      expect(result.coordinates.longitude).toBe(-74.0060);
    });

    it('should throw error for invalid location data', async () => {
      const invalidLocationData = {
        name: '', // Invalid: empty name
        address: validLocationData.address,
        coordinates: validLocationData.coordinates,
        category: validLocationData.category
      };

      await expect(locationService.createLocation(invalidLocationData))
        .rejects.toThrow('Invalid location data');
    });
  });

  describe('getLocationById', () => {
    it('should return location when found', async () => {
      const mockDbLocation = {
        id: '1',
        name: 'Test Store',
        address: '{"street":"123 Main St","city":"Test City","state":"TS","zipCode":"12345","country":"US"}',
        coordinates: 'POINT(-74.0060 40.7128)',
        category: 'grocery' as const,
        verified: true,
        current_user_count: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      mockLocationRepository.findById.mockResolvedValue(mockDbLocation);

      const result = await locationService.getLocationById('1');

      expect(mockLocationRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toBeInstanceOf(Location);
      expect(result?.name).toBe('Test Store');
    });

    it('should return null when location not found', async () => {
      mockLocationRepository.findById.mockResolvedValue(null);

      const result = await locationService.getLocationById('1');

      expect(result).toBeNull();
    });

    it('should throw error for empty ID', async () => {
      await expect(locationService.getLocationById(''))
        .rejects.toThrow('Location ID is required');
    });
  });

  describe('searchLocations', () => {
    it('should search locations by query', async () => {
      const mockDbLocations = [{
        id: '1',
        name: 'Test Store',
        address: '{"street":"123 Main St","city":"Test City","state":"TS","zipCode":"12345","country":"US"}',
        coordinates: 'POINT(-74.0060 40.7128)',
        category: 'grocery' as const,
        verified: true,
        current_user_count: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }];
      mockLocationRepository.searchByName.mockResolvedValue(mockDbLocations);

      const result = await locationService.searchLocations('Test');

      expect(mockLocationRepository.searchByName).toHaveBeenCalledWith('Test', undefined);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Location);
      expect(result[0].name).toBe('Test Store');
    });

    it('should search locations by query and category', async () => {
      const mockDbLocations = [{
        id: '1',
        name: 'Test Grocery',
        address: '{"street":"123 Main St","city":"Test City","state":"TS","zipCode":"12345","country":"US"}',
        coordinates: 'POINT(-74.0060 40.7128)',
        category: 'grocery' as const,
        verified: true,
        current_user_count: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }];
      mockLocationRepository.searchByName.mockResolvedValue(mockDbLocations);

      const result = await locationService.searchLocations('Test', LocationCategory.GROCERY);

      expect(mockLocationRepository.searchByName).toHaveBeenCalledWith('Test', LocationCategory.GROCERY);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Location);
      expect(result[0].name).toBe('Test Grocery');
    });

    it('should throw error for empty query', async () => {
      await expect(locationService.searchLocations(''))
        .rejects.toThrow('Search query is required');
    });
  });

  describe('getNearbyLocations', () => {
    it('should get nearby locations with default radius', async () => {
      const mockDbLocations = [{
        id: '1',
        name: 'Nearby Store',
        address: '{"street":"456 Oak St","city":"Nearby City","state":"NC","zipCode":"67890","country":"US"}',
        coordinates: 'POINT(-74.0050 40.7130)',
        category: 'retail' as const,
        verified: true,
        current_user_count: 2,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }];
      mockLocationRepository.findNearby.mockResolvedValue(mockDbLocations);

      const result = await locationService.getNearbyLocations(40.7128, -74.0060);

      expect(mockLocationRepository.findNearby).toHaveBeenCalledWith(40.7128, -74.0060, 10);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Location);
      expect(result[0].name).toBe('Nearby Store');
    });

    it('should get nearby locations with custom radius', async () => {
      const mockDbLocations = [{
        id: '1',
        name: 'Nearby Store',
        address: '{"street":"456 Oak St","city":"Nearby City","state":"NC","zipCode":"67890","country":"US"}',
        coordinates: 'POINT(-74.0050 40.7130)',
        category: 'retail' as const,
        verified: true,
        current_user_count: 2,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }];
      mockLocationRepository.findNearby.mockResolvedValue(mockDbLocations);

      const result = await locationService.getNearbyLocations(40.7128, -74.0060, 5);

      expect(mockLocationRepository.findNearby).toHaveBeenCalledWith(40.7128, -74.0060, 5);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Location);
      expect(result[0].name).toBe('Nearby Store');
    });

    it('should throw error for invalid coordinates', async () => {
      await expect(locationService.getNearbyLocations(91, -74.0060))
        .rejects.toThrow('Invalid coordinates provided');

      await expect(locationService.getNearbyLocations(40.7128, -181))
        .rejects.toThrow('Invalid coordinates provided');
    });

    it('should throw error for invalid radius', async () => {
      await expect(locationService.getNearbyLocations(40.7128, -74.0060, 0))
        .rejects.toThrow('Radius must be between 0 and 100 kilometers');

      await expect(locationService.getNearbyLocations(40.7128, -74.0060, 101))
        .rejects.toThrow('Radius must be between 0 and 100 kilometers');
    });
  });

  describe('checkInToLocation', () => {
    it('should check in user to location', async () => {
      const mockDbLocation = {
        id: 'loc1',
        name: 'Test Store',
        address: '{"street":"123 Main St","city":"Test City","state":"TS","zipCode":"12345","country":"US"}',
        coordinates: 'POINT(-74.0060 40.7128)',
        category: 'grocery' as const,
        verified: true,
        current_user_count: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      const mockDbPresence = {
        id: 'pres1',
        user_id: 'user1',
        location_id: 'loc1',
        checked_in_at: '2023-01-01T10:00:00Z',
        checked_out_at: null,
        is_active: true,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:00:00Z'
      };
      
      mockLocationRepository.findById.mockResolvedValue(mockDbLocation);
      mockLocationPresenceRepository.checkIn.mockResolvedValue(mockDbPresence);
      mockLocationPresenceRepository.getActiveCountByLocation.mockResolvedValue(1);
      mockLocationRepository.updateUserCount.mockResolvedValue(mockDbLocation);

      const result = await locationService.checkInToLocation('user1', 'loc1');

      expect(mockLocationRepository.findById).toHaveBeenCalledWith('loc1');
      expect(mockLocationPresenceRepository.checkIn).toHaveBeenCalledWith('user1', 'loc1');
      expect(mockLocationRepository.updateUserCount).toHaveBeenCalledWith('loc1', 1);
      expect(result).toBeInstanceOf(LocationPresence);
      expect(result.userId).toBe('user1');
      expect(result.locationId).toBe('loc1');
      expect(result.isActive).toBe(true);
    });

    it('should throw error when location not found', async () => {
      mockLocationRepository.findById.mockResolvedValue(null);

      await expect(locationService.checkInToLocation('user1', 'loc1'))
        .rejects.toThrow('Location not found');
    });

    it('should throw error for empty user ID', async () => {
      await expect(locationService.checkInToLocation('', 'loc1'))
        .rejects.toThrow('User ID is required');
    });

    it('should throw error for empty location ID', async () => {
      await expect(locationService.checkInToLocation('user1', ''))
        .rejects.toThrow('Location ID is required');
    });
  });

  describe('checkOutFromLocation', () => {
    it('should check out user from location', async () => {
      const mockDbPresence = {
        id: 'pres1',
        user_id: 'user1',
        location_id: 'loc1',
        checked_in_at: '2023-01-01T10:00:00Z',
        checked_out_at: '2023-01-01T11:00:00Z',
        is_active: false,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T11:00:00Z'
      };
      const mockDbLocation = {
        id: 'loc1',
        name: 'Test Store',
        address: '{"street":"123 Main St","city":"Test City","state":"TS","zipCode":"12345","country":"US"}',
        coordinates: 'POINT(-74.0060 40.7128)',
        category: 'grocery' as const,
        verified: true,
        current_user_count: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      
      mockLocationPresenceRepository.checkOutByUserAndLocation.mockResolvedValue(mockDbPresence);
      mockLocationPresenceRepository.getActiveCountByLocation.mockResolvedValue(0);
      mockLocationRepository.updateUserCount.mockResolvedValue(mockDbLocation);

      const result = await locationService.checkOutFromLocation('user1', 'loc1');

      expect(mockLocationPresenceRepository.checkOutByUserAndLocation).toHaveBeenCalledWith('user1', 'loc1');
      expect(mockLocationRepository.updateUserCount).toHaveBeenCalledWith('loc1', 0);
      expect(result).toBeInstanceOf(LocationPresence);
      expect(result?.userId).toBe('user1');
      expect(result?.locationId).toBe('loc1');
      expect(result?.isActive).toBe(false);
    });

    it('should return null when no active presence found', async () => {
      mockLocationPresenceRepository.checkOutByUserAndLocation.mockResolvedValue(null);
      mockLocationPresenceRepository.getActiveCountByLocation.mockResolvedValue(0);
      mockLocationRepository.updateUserCount.mockResolvedValue(null);

      const result = await locationService.checkOutFromLocation('user1', 'loc1');

      expect(result).toBeNull();
    });

    it('should throw error for empty user ID', async () => {
      await expect(locationService.checkOutFromLocation('', 'loc1'))
        .rejects.toThrow('User ID is required');
    });

    it('should throw error for empty location ID', async () => {
      await expect(locationService.checkOutFromLocation('user1', ''))
        .rejects.toThrow('Location ID is required');
    });
  });

  describe('getUserPresenceAtLocation', () => {
    it('should return user presence at location', async () => {
      const mockDbPresences = [
        {
          id: 'pres1',
          user_id: 'user1',
          location_id: 'loc1',
          checked_in_at: '2023-01-01T10:00:00Z',
          checked_out_at: null,
          is_active: true,
          created_at: '2023-01-01T10:00:00Z',
          updated_at: '2023-01-01T10:00:00Z'
        },
        {
          id: 'pres2',
          user_id: 'user1',
          location_id: 'loc2',
          checked_in_at: '2023-01-01T09:00:00Z',
          checked_out_at: null,
          is_active: true,
          created_at: '2023-01-01T09:00:00Z',
          updated_at: '2023-01-01T09:00:00Z'
        }
      ];
      
      mockLocationPresenceRepository.findActiveByUserId.mockResolvedValue(mockDbPresences);

      const result = await locationService.getUserPresenceAtLocation('user1', 'loc1');

      expect(mockLocationPresenceRepository.findActiveByUserId).toHaveBeenCalledWith('user1');
      expect(result).toBeInstanceOf(LocationPresence);
      expect(result?.userId).toBe('user1');
      expect(result?.locationId).toBe('loc1');
      expect(result?.isActive).toBe(true);
    });

    it('should return null when user not present at location', async () => {
      mockLocationPresenceRepository.findActiveByUserId.mockResolvedValue([]);

      const result = await locationService.getUserPresenceAtLocation('user1', 'loc1');

      expect(result).toBeNull();
    });

    it('should throw error for empty user ID', async () => {
      await expect(locationService.getUserPresenceAtLocation('', 'loc1'))
        .rejects.toThrow('User ID is required');
    });

    it('should throw error for empty location ID', async () => {
      await expect(locationService.getUserPresenceAtLocation('user1', ''))
        .rejects.toThrow('Location ID is required');
    });
  });

  describe('getActiveUsersAtLocation', () => {
    it('should return active users at location', async () => {
      const mockDbPresences = [
        {
          id: 'pres1',
          user_id: 'user1',
          location_id: 'loc1',
          checked_in_at: '2023-01-01T10:00:00Z',
          checked_out_at: null,
          is_active: true,
          created_at: '2023-01-01T10:00:00Z',
          updated_at: '2023-01-01T10:00:00Z'
        },
        {
          id: 'pres2',
          user_id: 'user2',
          location_id: 'loc1',
          checked_in_at: '2023-01-01T09:30:00Z',
          checked_out_at: null,
          is_active: true,
          created_at: '2023-01-01T09:30:00Z',
          updated_at: '2023-01-01T09:30:00Z'
        }
      ];
      
      mockLocationPresenceRepository.findActiveByLocationId.mockResolvedValue(mockDbPresences);

      const result = await locationService.getActiveUsersAtLocation('loc1');

      expect(mockLocationPresenceRepository.findActiveByLocationId).toHaveBeenCalledWith('loc1');
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(LocationPresence);
      expect(result[0].userId).toBe('user1');
      expect(result[0].locationId).toBe('loc1');
      expect(result[0].isActive).toBe(true);
      expect(result[1]).toBeInstanceOf(LocationPresence);
      expect(result[1].userId).toBe('user2');
      expect(result[1].locationId).toBe('loc1');
      expect(result[1].isActive).toBe(true);
    });

    it('should throw error for empty location ID', async () => {
      await expect(locationService.getActiveUsersAtLocation(''))
        .rejects.toThrow('Location ID is required');
    });
  });

  describe('updateLocationUserCount', () => {
    it('should update location user count', async () => {
      const mockDbLocation = {
        id: 'loc1',
        name: 'Test Store',
        address: '{"street":"123 Main St","city":"Test City","state":"TS","zipCode":"12345","country":"US"}',
        coordinates: 'POINT(-74.0060 40.7128)',
        category: 'grocery' as const,
        verified: true,
        current_user_count: 3,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      
      mockLocationPresenceRepository.getActiveCountByLocation.mockResolvedValue(3);
      mockLocationRepository.updateUserCount.mockResolvedValue(mockDbLocation);

      const result = await locationService.updateLocationUserCount('loc1');

      expect(mockLocationPresenceRepository.getActiveCountByLocation).toHaveBeenCalledWith('loc1');
      expect(mockLocationRepository.updateUserCount).toHaveBeenCalledWith('loc1', 3);
      expect(result).toBeInstanceOf(Location);
      expect(result?.name).toBe('Test Store');
      expect(result?.currentUserCount).toBe(3);
    });

    it('should throw error for empty location ID', async () => {
      await expect(locationService.updateLocationUserCount(''))
        .rejects.toThrow('Location ID is required');
    });
  });
});