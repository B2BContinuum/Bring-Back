import { RequestService } from '../RequestService';
import { DeliveryRequest } from '../../models/DeliveryRequest';
import { RequestStatus } from '../../../../shared/src/types';

// Mock repositories
const mockRequestRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByTripId: jest.fn(),
  findByRequesterId: jest.fn(),
  findPendingRequestsForTrip: jest.fn(),
  findAcceptedRequestsForTrip: jest.fn(),
  findMatchingRequests: jest.fn(),
  updateStatus: jest.fn(),
  acceptRequest: jest.fn(),
  completeRequest: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  cancelRequest: jest.fn(),
  getRequestWithDetails: jest.fn(),
  findActiveRequestsByUser: jest.fn(),
  findRequestsByStatus: jest.fn()
};

const mockTripRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findNearbyTrips: jest.fn(),
  updateStatus: jest.fn(),
  updateCapacity: jest.fn(),
  cancelTrip: jest.fn(),
  getTripWithDetails: jest.fn()
};

const mockUserRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  updateRating: jest.fn(),
  delete: jest.fn()
};

// Sample data for tests
const sampleTrip = {
  id: 'trip-123',
  user_id: 'user-123',
  destination_id: 'location-123',
  departure_time: new Date().toISOString(),
  estimated_return_time: new Date(Date.now() + 3600000).toISOString(),
  capacity: 3,
  available_capacity: 2,
  status: 'announced',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const sampleUser = {
  id: 'user-456',
  email: 'user@example.com',
  name: 'Test User',
  phone: '123-456-7890',
  rating: 4.5,
  total_deliveries: 10,
  verification_status: 'verified',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const sampleRequestData = {
  tripId: 'trip-123',
  requesterId: 'user-456',
  items: [
    {
      id: 'item-1',
      name: 'Test Item',
      description: 'Test Description',
      quantity: 1,
      estimatedPrice: 10.99
    }
  ],
  deliveryAddress: {
    street: '123 Main St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  },
  maxItemBudget: 20,
  deliveryFee: 5,
  specialInstructions: 'Leave at door'
};

const sampleDbRequest = {
  id: 'request-123',
  trip_id: 'trip-123',
  requester_id: 'user-456',
  items: [
    {
      id: 'item-1',
      name: 'Test Item',
      description: 'Test Description',
      quantity: 1,
      estimatedPrice: 10.99
    }
  ],
  delivery_address: {
    street: '123 Main St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  },
  max_item_budget: 20,
  delivery_fee: 5,
  special_instructions: 'Leave at door',
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  accepted_at: null,
  completed_at: null
};

const sampleDbRequestWithDetails = {
  ...sampleDbRequest,
  trip: {
    id: 'trip-123',
    user_id: 'user-123',
    destination_id: 'location-123',
    departure_time: new Date().toISOString(),
    estimated_return_time: new Date(Date.now() + 3600000).toISOString(),
    capacity: 3,
    available_capacity: 2,
    status: 'announced'
  },
  requester: {
    id: 'user-456',
    name: 'Test User',
    rating: 4.5,
    total_deliveries: 10
  }
};

describe('RequestService', () => {
  let requestService: RequestService;

  beforeEach(() => {
    jest.clearAllMocks();
    requestService = new RequestService(
      mockRequestRepository,
      mockTripRepository,
      mockUserRepository
    );

    // Mock DeliveryRequest.validateForCreation
    jest.spyOn(DeliveryRequest, 'validateForCreation').mockReturnValue({
      isValid: true,
      errors: []
    });
  });

  describe('createRequest', () => {
    it('should create a new request successfully', async () => {
      // Arrange
      mockTripRepository.findById.mockResolvedValue(sampleTrip);
      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockRequestRepository.create.mockResolvedValue(sampleDbRequest);
      mockRequestRepository.getRequestWithDetails.mockResolvedValue(sampleDbRequestWithDetails);

      // Act
      const result = await requestService.createRequest(sampleRequestData);

      // Assert
      expect(mockTripRepository.findById).toHaveBeenCalledWith('trip-123');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-456');
      expect(mockRequestRepository.create).toHaveBeenCalled();
      expect(mockRequestRepository.getRequestWithDetails).toHaveBeenCalledWith('request-123');
      expect(result).toBeInstanceOf(DeliveryRequest);
      expect(result.id).toBe('request-123');
      expect(result.tripId).toBe('trip-123');
      expect(result.requesterId).toBe('user-456');
      expect(result.status).toBe(RequestStatus.PENDING);
    });

    it('should throw error if validation fails', async () => {
      // Arrange
      jest.spyOn(DeliveryRequest, 'validateForCreation').mockReturnValue({
        isValid: false,
        errors: ['Invalid data']
      });

      // Act & Assert
      await expect(requestService.createRequest(sampleRequestData))
        .rejects.toThrow('Invalid request data: Invalid data');
    });

    it('should throw error if trip not found', async () => {
      // Arrange
      mockTripRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(requestService.createRequest(sampleRequestData))
        .rejects.toThrow('Trip not found');
    });

    it('should throw error if trip has no capacity', async () => {
      // Arrange
      mockTripRepository.findById.mockResolvedValue({
        ...sampleTrip,
        available_capacity: 0
      });

      // Act & Assert
      await expect(requestService.createRequest(sampleRequestData))
        .rejects.toThrow('Trip has no available capacity');
    });

    it('should throw error if trip is not in announced status', async () => {
      // Arrange
      mockTripRepository.findById.mockResolvedValue({
        ...sampleTrip,
        status: 'in_progress'
      });

      // Act & Assert
      await expect(requestService.createRequest(sampleRequestData))
        .rejects.toThrow('Trip is not accepting requests');
    });

    it('should throw error if requester not found', async () => {
      // Arrange
      mockTripRepository.findById.mockResolvedValue(sampleTrip);
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(requestService.createRequest(sampleRequestData))
        .rejects.toThrow('Requester not found');
    });
  });

  describe('getRequestById', () => {
    it('should return request by ID', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(sampleDbRequest);

      // Act
      const result = await requestService.getRequestById('request-123');

      // Assert
      expect(mockRequestRepository.findById).toHaveBeenCalledWith('request-123');
      expect(result).toBeInstanceOf(DeliveryRequest);
      expect(result?.id).toBe('request-123');
    });

    it('should return null if request not found', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(null);

      // Act
      const result = await requestService.getRequestById('non-existent');

      // Assert
      expect(mockRequestRepository.findById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should throw error if ID is empty', async () => {
      // Act & Assert
      await expect(requestService.getRequestById('')).rejects.toThrow('Request ID is required');
    });
  });

  describe('getRequestsByTripId', () => {
    it('should return requests for a trip', async () => {
      // Arrange
      const requests = [sampleDbRequest, { ...sampleDbRequest, id: 'request-456' }];
      mockRequestRepository.findByTripId.mockResolvedValue(requests);

      // Act
      const result = await requestService.getRequestsByTripId('trip-123');

      // Assert
      expect(mockRequestRepository.findByTripId).toHaveBeenCalledWith('trip-123');
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(DeliveryRequest);
      expect(result[0].id).toBe('request-123');
      expect(result[1].id).toBe('request-456');
    });

    it('should throw error if trip ID is empty', async () => {
      // Act & Assert
      await expect(requestService.getRequestsByTripId('')).rejects.toThrow('Trip ID is required');
    });
  });

  describe('acceptRequest', () => {
    it('should accept a request and update trip capacity', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(sampleDbRequest);
      mockTripRepository.findById.mockResolvedValue(sampleTrip);
      mockRequestRepository.acceptRequest.mockResolvedValue({
        ...sampleDbRequest,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      });
      mockRequestRepository.getRequestWithDetails.mockResolvedValue({
        ...sampleDbRequestWithDetails,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      });

      // Act
      const result = await requestService.acceptRequest('request-123');

      // Assert
      expect(mockRequestRepository.findById).toHaveBeenCalledWith('request-123');
      expect(mockTripRepository.findById).toHaveBeenCalledWith('trip-123');
      expect(mockRequestRepository.acceptRequest).toHaveBeenCalledWith('request-123', expect.any(Date));
      expect(mockTripRepository.updateCapacity).toHaveBeenCalledWith('trip-123', 1); // 2 - 1 = 1
      expect(result).toBeInstanceOf(DeliveryRequest);
      expect(result?.status).toBe(RequestStatus.ACCEPTED);
    });

    it('should throw error if request not found', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(requestService.acceptRequest('non-existent')).rejects.toThrow('Request not found');
    });

    it('should throw error if request is not in pending status', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue({
        ...sampleDbRequest,
        status: 'accepted'
      });

      // Act & Assert
      await expect(requestService.acceptRequest('request-123')).rejects.toThrow('Request is not in pending status');
    });

    it('should throw error if trip not found', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(sampleDbRequest);
      mockTripRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(requestService.acceptRequest('request-123')).rejects.toThrow('Associated trip not found');
    });

    it('should throw error if trip has no capacity', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(sampleDbRequest);
      mockTripRepository.findById.mockResolvedValue({
        ...sampleTrip,
        available_capacity: 0
      });

      // Act & Assert
      await expect(requestService.acceptRequest('request-123')).rejects.toThrow('Trip has no available capacity');
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(sampleDbRequest);
      mockRequestRepository.updateStatus.mockResolvedValue({
        ...sampleDbRequest,
        status: 'purchased'
      });
      mockRequestRepository.getRequestWithDetails.mockResolvedValue({
        ...sampleDbRequestWithDetails,
        status: 'purchased'
      });

      // Act
      const result = await requestService.updateRequestStatus('request-123', RequestStatus.PURCHASED);

      // Assert
      expect(mockRequestRepository.findById).toHaveBeenCalledWith('request-123');
      expect(mockRequestRepository.updateStatus).toHaveBeenCalledWith('request-123', RequestStatus.PURCHASED);
      expect(result).toBeInstanceOf(DeliveryRequest);
      expect(result?.status).toBe(RequestStatus.PURCHASED);
    });

    it('should throw error if request not found', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(requestService.updateRequestStatus('non-existent', RequestStatus.PURCHASED))
        .rejects.toThrow('Request not found');
    });

    it('should throw error if status transition is invalid', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(sampleDbRequest); // pending status

      // Act & Assert
      await expect(requestService.updateRequestStatus('request-123', RequestStatus.DELIVERED))
        .rejects.toThrow('Invalid status transition from pending to delivered');
    });
  });

  describe('completeRequest', () => {
    it('should complete a request', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue({
        ...sampleDbRequest,
        status: 'purchased'
      });
      mockRequestRepository.completeRequest.mockResolvedValue({
        ...sampleDbRequest,
        status: 'delivered',
        completed_at: new Date().toISOString()
      });
      mockRequestRepository.getRequestWithDetails.mockResolvedValue({
        ...sampleDbRequestWithDetails,
        status: 'delivered',
        completed_at: new Date().toISOString()
      });

      // Act
      const result = await requestService.completeRequest('request-123');

      // Assert
      expect(mockRequestRepository.findById).toHaveBeenCalledWith('request-123');
      expect(mockRequestRepository.completeRequest).toHaveBeenCalledWith('request-123', expect.any(Date));
      expect(result).toBeInstanceOf(DeliveryRequest);
      expect(result?.status).toBe(RequestStatus.DELIVERED);
    });

    it('should throw error if request not found', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(requestService.completeRequest('non-existent')).rejects.toThrow('Request not found');
    });

    it('should throw error if request is not in purchased status', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue({
        ...sampleDbRequest,
        status: 'pending'
      });

      // Act & Assert
      await expect(requestService.completeRequest('request-123'))
        .rejects.toThrow('Request must be in purchased status to be completed');
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a pending request', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(sampleDbRequest);
      mockRequestRepository.cancelRequest.mockResolvedValue({
        ...sampleDbRequest,
        status: 'cancelled'
      });

      // Act
      const result = await requestService.cancelRequest('request-123');

      // Assert
      expect(mockRequestRepository.findById).toHaveBeenCalledWith('request-123');
      expect(mockRequestRepository.cancelRequest).toHaveBeenCalledWith('request-123');
      expect(result).toBe(true);
    });

    it('should cancel an accepted request and restore trip capacity', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue({
        ...sampleDbRequest,
        status: 'accepted'
      });
      mockTripRepository.findById.mockResolvedValue(sampleTrip);
      mockRequestRepository.cancelRequest.mockResolvedValue({
        ...sampleDbRequest,
        status: 'cancelled'
      });

      // Act
      const result = await requestService.cancelRequest('request-123');

      // Assert
      expect(mockRequestRepository.findById).toHaveBeenCalledWith('request-123');
      expect(mockTripRepository.findById).toHaveBeenCalledWith('trip-123');
      expect(mockTripRepository.updateCapacity).toHaveBeenCalledWith('trip-123', 3); // 2 + 1 = 3
      expect(mockRequestRepository.cancelRequest).toHaveBeenCalledWith('request-123');
      expect(result).toBe(true);
    });

    it('should throw error if request not found', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(requestService.cancelRequest('non-existent')).rejects.toThrow('Request not found');
    });

    it('should throw error if request cannot be cancelled', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue({
        ...sampleDbRequest,
        status: 'delivered'
      });

      // Act & Assert
      await expect(requestService.cancelRequest('request-123'))
        .rejects.toThrow('Only pending or accepted requests can be cancelled');
    });
  });

  describe('matchRequestsToTrip', () => {
    it('should match and sort requests for a trip', async () => {
      // Arrange
      const pendingRequests = [
        { ...sampleDbRequest, id: 'request-1', delivery_fee: 5, created_at: '2023-01-01T12:00:00Z' },
        { ...sampleDbRequest, id: 'request-2', delivery_fee: 10, created_at: '2023-01-01T13:00:00Z' },
        { ...sampleDbRequest, id: 'request-3', delivery_fee: 10, created_at: '2023-01-01T11:00:00Z' }
      ];
      
      mockTripRepository.findById.mockResolvedValue(sampleTrip);
      mockRequestRepository.findPendingRequestsForTrip.mockResolvedValue(pendingRequests);

      // Act
      const result = await requestService.matchRequestsToTrip('trip-123');

      // Assert
      expect(mockTripRepository.findById).toHaveBeenCalledWith('trip-123');
      expect(mockRequestRepository.findPendingRequestsForTrip).toHaveBeenCalledWith('trip-123');
      expect(result).toHaveLength(3);
      
      // Should be sorted by delivery fee (higher first) and then by creation time (earlier first)
      expect(result[0].id).toBe('request-3'); // Higher fee (10) and earlier time
      expect(result[1].id).toBe('request-2'); // Higher fee (10) but later time
      expect(result[2].id).toBe('request-1'); // Lower fee (5)
    });

    it('should limit results based on maxResults parameter', async () => {
      // Arrange
      const pendingRequests = [
        { ...sampleDbRequest, id: 'request-1', delivery_fee: 5 },
        { ...sampleDbRequest, id: 'request-2', delivery_fee: 10 },
        { ...sampleDbRequest, id: 'request-3', delivery_fee: 7 }
      ];
      
      mockTripRepository.findById.mockResolvedValue(sampleTrip);
      mockRequestRepository.findPendingRequestsForTrip.mockResolvedValue(pendingRequests);

      // Act
      const result = await requestService.matchRequestsToTrip('trip-123', 2);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('request-2'); // Highest fee
      expect(result[1].id).toBe('request-3'); // Second highest fee
    });

    it('should throw error if trip ID is empty', async () => {
      // Act & Assert
      await expect(requestService.matchRequestsToTrip('')).rejects.toThrow('Trip ID is required');
    });

    it('should throw error if trip not found', async () => {
      // Arrange
      mockTripRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(requestService.matchRequestsToTrip('non-existent')).rejects.toThrow('Trip not found');
    });
  });

  describe('getRequestWithDetails', () => {
    it('should return request with trip and requester details', async () => {
      // Arrange
      mockRequestRepository.getRequestWithDetails.mockResolvedValue(sampleDbRequestWithDetails);

      // Act
      const result = await requestService.getRequestWithDetails('request-123');

      // Assert
      expect(mockRequestRepository.getRequestWithDetails).toHaveBeenCalledWith('request-123');
      expect(result).toBeInstanceOf(DeliveryRequest);
      expect(result?.id).toBe('request-123');
      expect(result?.trip).toBeDefined();
      expect(result?.requester).toBeDefined();
      expect(result?.trip.id).toBe('trip-123');
      expect(result?.requester.id).toBe('user-456');
    });

    it('should return null if request not found', async () => {
      // Arrange
      mockRequestRepository.getRequestWithDetails.mockResolvedValue(null);

      // Act
      const result = await requestService.getRequestWithDetails('non-existent');

      // Assert
      expect(mockRequestRepository.getRequestWithDetails).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should throw error if ID is empty', async () => {
      // Act & Assert
      await expect(requestService.getRequestWithDetails('')).rejects.toThrow('Request ID is required');
    });
  });
});