import { Request, Response } from 'express';
import { LocationController } from '../LocationController';
import { ILocationService } from '../../services/LocationService';
import { Location, LocationPresence } from '../../../../shared/src/types';

// Mock location service
const mockLocationService: jest.Mocked<ILocationService> = {
  searchLocations: jest.fn(),
  getNearbyLocations: jest.fn(),
  getLocationById: jest.fn(),
  getLocationPresence: jest.fn(),
  checkInUser: jest.fn(),
  checkOutUser: jest.fn(),
  createLocation: jest.fn(),
  updateLocation: jest.fn()
};

// Sample data
const sampleLocation: Location = {
  id: 'location-123',
  name: 'Test Store',
  address: {
    street: '123 Main St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  },
  coordinates: {
    latitude: 37.7749,
    longitude: -122.4194
  },
  category: 'grocery',
  verified: true,
  currentUserCount: 5
};

const samplePresence: LocationPresence[] = [
  {
    id: 'presence-1',
    userId: 'user-1',
    locationId: 'location-123',
    checkedInAt: new Date(),
    isActive: true
  },
  {
    id: 'presence-2',
    userId: 'user-2',
    locationId: 'location-123',
    checkedInAt: new Date(),
    isActive: true
  }
];

describe('LocationController', () => {
  let locationController: LocationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any = {};

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create controller with mock service
    locationController = new LocationController(mockLocationService);
    
    // Setup mock request and response
    mockRequest = {};
    responseObject = {
      statusCode: 0,
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockImplementation((code) => {
        responseObject.statusCode = code;
        return mockResponse;
      }),
      json: jest.fn().mockImplementation((data) => {
        responseObject.body = data;
        return mockResponse;
      })
    };
  });

  describe('searchLocations', () => {
    it('should return locations based on search parameters', async () => {
      // Arrange
      mockRequest.query = {
        query: 'grocery',
        latitude: '37.7749',
        longitude: '-122.4194',
        radius: '5'
      };
      mockLocationService.searchLocations.mockResolvedValue([sampleLocation]);

      // Act
      await locationController.searchLocations(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockLocationService.searchLocations).toHaveBeenCalledWith({
        query: 'grocery',
        latitude: 37.7749,
        longitude: -122.4194,
        radius: 5
      });
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: [sampleLocation]
      });
    });

    it('should handle errors', async () => {
      // Arrange
      mockRequest.query = {
        query: 'grocery'
      };
      mockLocationService.searchLocations.mockRejectedValue(new Error('Search failed'));

      // Act
      await locationController.searchLocations(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Search failed'
      });
    });
  });

  describe('getLocationPresence', () => {
    it('should return user presence for a location', async () => {
      // Arrange
      mockRequest.params = {
        id: 'location-123'
      };
      mockLocationService.getLocationPresence.mockResolvedValue(samplePresence);

      // Act
      await locationController.getLocationPresence(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockLocationService.getLocationPresence).toHaveBeenCalledWith('location-123');
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: {
          locationId: 'location-123',
          userCount: 2,
          users: samplePresence
        }
      });
    });
  });

  describe('checkInToLocation', () => {
    it('should check in a user to a location', async () => {
      // Arrange
      mockRequest.params = {
        id: 'location-123'
      };
      mockRequest.body = {
        userId: 'user-1'
      };
      mockLocationService.checkInUser.mockResolvedValue(samplePresence[0]);

      // Act
      await locationController.checkInToLocation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockLocationService.checkInUser).toHaveBeenCalledWith('user-1', 'location-123');
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: samplePresence[0]
      });
    });

    it('should require a user ID', async () => {
      // Arrange
      mockRequest.params = {
        id: 'location-123'
      };
      mockRequest.body = {};

      // Act
      await locationController.checkInToLocation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockLocationService.checkInUser).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(401);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'User ID is required'
      });
    });
  });
});