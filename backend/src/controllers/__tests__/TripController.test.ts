import { Request, Response } from 'express';
import { TripController } from '../TripController';
import { ITripService } from '../../services/TripService';
import { Trip, TripStatus, Location } from '../../../../shared/src/types';

// Mock trip service
const mockTripService: jest.Mocked<ITripService> = {
  createTrip: jest.fn(),
  getTripById: jest.fn(),
  getUserTrips: jest.fn(),
  getNearbyTrips: jest.fn(),
  updateTripStatus: jest.fn(),
  updateTripCapacity: jest.fn(),
  cancelTrip: jest.fn(),
  getTripWithDetails: jest.fn()
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

const sampleTrip: Trip = {
  id: 'trip-123',
  userId: 'user-123',
  destination: sampleLocation,
  departureTime: new Date('2023-01-01T12:00:00Z'),
  estimatedReturnTime: new Date('2023-01-01T14:00:00Z'),
  capacity: 3,
  availableCapacity: 2,
  status: TripStatus.ANNOUNCED,
  description: 'Going to the grocery store',
  createdAt: new Date('2023-01-01T10:00:00Z'),
  updatedAt: new Date('2023-01-01T10:00:00Z')
};

describe('TripController', () => {
  let tripController: TripController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any = {};

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create controller with mock service
    tripController = new TripController(mockTripService);
    
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

  describe('createTrip', () => {
    it('should create a new trip', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-123',
        destination: sampleLocation,
        departureTime: '2023-01-01T12:00:00Z',
        estimatedReturnTime: '2023-01-01T14:00:00Z',
        capacity: 3,
        description: 'Going to the grocery store'
      };
      mockTripService.createTrip.mockResolvedValue(sampleTrip);

      // Act
      await tripController.createTrip(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTripService.createTrip).toHaveBeenCalledWith({
        ...mockRequest.body,
        departureTime: expect.any(Date),
        estimatedReturnTime: expect.any(Date)
      });
      expect(responseObject.statusCode).toBe(201);
      expect(responseObject.body).toEqual({
        success: true,
        data: sampleTrip
      });
    });

    it('should require a user ID', async () => {
      // Arrange
      mockRequest.body = {
        destination: sampleLocation,
        departureTime: '2023-01-01T12:00:00Z',
        estimatedReturnTime: '2023-01-01T14:00:00Z',
        capacity: 3
      };

      // Act
      await tripController.createTrip(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTripService.createTrip).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(401);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'User ID is required'
      });
    });

    it('should handle errors', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user-123',
        destination: sampleLocation,
        departureTime: '2023-01-01T12:00:00Z',
        estimatedReturnTime: '2023-01-01T14:00:00Z',
        capacity: 3
      };
      mockTripService.createTrip.mockRejectedValue(new Error('Invalid trip data'));

      // Act
      await tripController.createTrip(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Invalid trip data'
      });
    });
  });

  describe('getNearbyTrips', () => {
    it('should return nearby trips', async () => {
      // Arrange
      mockRequest.query = {
        latitude: '37.7749',
        longitude: '-122.4194',
        radius: '5'
      };
      mockTripService.getNearbyTrips.mockResolvedValue([sampleTrip]);

      // Act
      await tripController.getNearbyTrips(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTripService.getNearbyTrips).toHaveBeenCalledWith(37.7749, -122.4194, 5);
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: [sampleTrip]
      });
    });

    it('should require valid coordinates', async () => {
      // Arrange
      mockRequest.query = {
        latitude: 'invalid',
        longitude: '-122.4194'
      };

      // Act
      await tripController.getNearbyTrips(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTripService.getNearbyTrips).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Valid latitude and longitude are required'
      });
    });
  });

  describe('updateTripStatus', () => {
    it('should update trip status', async () => {
      // Arrange
      mockRequest.params = {
        id: 'trip-123'
      };
      mockRequest.body = {
        status: TripStatus.TRAVELING
      };
      mockTripService.updateTripStatus.mockResolvedValue({
        ...sampleTrip,
        status: TripStatus.TRAVELING
      });

      // Act
      await tripController.updateTripStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTripService.updateTripStatus).toHaveBeenCalledWith('trip-123', TripStatus.TRAVELING);
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: {
          ...sampleTrip,
          status: TripStatus.TRAVELING
        }
      });
    });

    it('should require a valid status', async () => {
      // Arrange
      mockRequest.params = {
        id: 'trip-123'
      };
      mockRequest.body = {
        status: 'invalid-status'
      };

      // Act
      await tripController.updateTripStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTripService.updateTripStatus).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Valid trip status is required'
      });
    });

    it('should handle trip not found', async () => {
      // Arrange
      mockRequest.params = {
        id: 'trip-123'
      };
      mockRequest.body = {
        status: TripStatus.TRAVELING
      };
      mockTripService.updateTripStatus.mockResolvedValue(null);

      // Act
      await tripController.updateTripStatus(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseObject.statusCode).toBe(404);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Trip not found'
      });
    });
  });

  describe('cancelTrip', () => {
    it('should cancel a trip', async () => {
      // Arrange
      mockRequest.params = {
        id: 'trip-123'
      };
      mockTripService.cancelTrip.mockResolvedValue({
        ...sampleTrip,
        status: TripStatus.CANCELLED
      });

      // Act
      await tripController.cancelTrip(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockTripService.cancelTrip).toHaveBeenCalledWith('trip-123');
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: {
          ...sampleTrip,
          status: TripStatus.CANCELLED
        }
      });
    });

    it('should handle trip not found', async () => {
      // Arrange
      mockRequest.params = {
        id: 'trip-123'
      };
      mockTripService.cancelTrip.mockResolvedValue(null);

      // Act
      await tripController.cancelTrip(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(responseObject.statusCode).toBe(404);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Trip not found'
      });
    });
  });
});