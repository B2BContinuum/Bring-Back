import { RequestRepository } from '../RequestRepository';
import { supabaseAdmin } from '../../config/database';
import { DeliveryRequestInsert, RequestStatus } from '../../types/database.types';
import { RequestStatus as SharedRequestStatus } from '../../../../shared/src/types';

// Mock the database config
jest.mock('../../config/database', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

describe('RequestRepository', () => {
  let requestRepository: RequestRepository;
  let mockSupabaseAdmin: any;

  beforeEach(() => {
    // Reset the mock before each test
    mockSupabaseAdmin = {
      from: jest.fn()
    };
    (supabaseAdmin as any) = mockSupabaseAdmin;
    
    requestRepository = new RequestRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new delivery request successfully', async () => {
      const requestData: DeliveryRequestInsert = {
        trip_id: 'trip-123',
        requester_id: 'user-456',
        items: [
          { id: 'item-1', name: 'Milk', quantity: 1, estimatedPrice: 3.99 }
        ],
        delivery_address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        },
        max_item_budget: 50.00,
        delivery_fee: 5.00
      };

      const expectedRequest = {
        id: 'request-789',
        ...requestData,
        status: 'pending',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedRequest, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.create(requestData);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('delivery_requests');
      expect(mockChain.insert).toHaveBeenCalledWith(requestData);
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(expectedRequest);
    });

    it('should throw error when database connection is not available', async () => {
      (supabaseAdmin as any) = null;
      requestRepository = new RequestRepository();

      const requestData: DeliveryRequestInsert = {
        trip_id: 'trip-123',
        requester_id: 'user-456',
        items: [],
        delivery_address: {},
        max_item_budget: 50.00,
        delivery_fee: 5.00
      };

      await expect(requestRepository.create(requestData)).rejects.toThrow('Database connection not available');
    });

    it('should throw error when database operation fails', async () => {
      const requestData: DeliveryRequestInsert = {
        trip_id: 'trip-123',
        requester_id: 'user-456',
        items: [],
        delivery_address: {},
        max_item_budget: 50.00,
        delivery_fee: 5.00
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      await expect(requestRepository.create(requestData)).rejects.toThrow('Failed to create delivery request: Database error');
    });
  });

  describe('findById', () => {
    it('should find delivery request by ID successfully', async () => {
      const requestId = 'request-123';
      const expectedRequest = {
        id: requestId,
        trip_id: 'trip-456',
        requester_id: 'user-789',
        status: 'pending',
        max_item_budget: 50.00,
        delivery_fee: 5.00
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedRequest, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findById(requestId);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('delivery_requests');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('id', requestId);
      expect(result).toEqual(expectedRequest);
    });

    it('should return null when request not found', async () => {
      const requestId = 'non-existent-request';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findById(requestId);

      expect(result).toBeNull();
    });
  });

  describe('findByTripId', () => {
    it('should find delivery requests by trip ID successfully', async () => {
      const tripId = 'trip-123';
      const expectedRequests = [
        { id: 'request-1', trip_id: tripId, status: 'pending' },
        { id: 'request-2', trip_id: tripId, status: 'accepted' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedRequests, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findByTripId(tripId);

      expect(mockChain.eq).toHaveBeenCalledWith('trip_id', tripId);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(expectedRequests);
    });

    it('should return empty array when no requests found', async () => {
      const tripId = 'trip-123';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findByTripId(tripId);

      expect(result).toEqual([]);
    });
  });

  describe('findByRequesterId', () => {
    it('should find delivery requests by requester ID successfully', async () => {
      const requesterId = 'user-123';
      const expectedRequests = [
        { id: 'request-1', requester_id: requesterId, status: 'pending' },
        { id: 'request-2', requester_id: requesterId, status: 'delivered' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedRequests, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findByRequesterId(requesterId);

      expect(mockChain.eq).toHaveBeenCalledWith('requester_id', requesterId);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(expectedRequests);
    });
  });

  describe('findPendingRequestsForTrip', () => {
    it('should find pending requests for trip successfully', async () => {
      const tripId = 'trip-123';
      const expectedRequests = [
        { id: 'request-1', trip_id: tripId, status: 'pending' },
        { id: 'request-2', trip_id: tripId, status: 'pending' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedRequests, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findPendingRequestsForTrip(tripId);

      expect(mockChain.eq).toHaveBeenCalledWith('trip_id', tripId);
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toEqual(expectedRequests);
    });
  });

  describe('findAcceptedRequestsForTrip', () => {
    it('should find accepted requests for trip successfully', async () => {
      const tripId = 'trip-123';
      const expectedRequests = [
        { id: 'request-1', trip_id: tripId, status: 'accepted' },
        { id: 'request-2', trip_id: tripId, status: 'accepted' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedRequests, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findAcceptedRequestsForTrip(tripId);

      expect(mockChain.eq).toHaveBeenCalledWith('trip_id', tripId);
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'accepted');
      expect(mockChain.order).toHaveBeenCalledWith('accepted_at', { ascending: true });
      expect(result).toEqual(expectedRequests);
    });
  });

  describe('findMatchingRequests', () => {
    it('should find matching requests without budget filter', async () => {
      const tripId = 'trip-123';
      const expectedRequests = [
        { id: 'request-1', trip_id: tripId, status: 'pending', delivery_fee: 10.00 },
        { id: 'request-2', trip_id: tripId, status: 'pending', delivery_fee: 5.00 }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: expectedRequests, error: null })
        }))
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findMatchingRequests(tripId);

      expect(mockChain.eq).toHaveBeenCalledWith('trip_id', tripId);
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending');
      expect(result).toEqual(expectedRequests);
    });

    it('should find matching requests with budget filter', async () => {
      const tripId = 'trip-123';
      const maxBudget = 100.00;
      const expectedRequests = [
        { id: 'request-1', trip_id: tripId, status: 'pending', max_item_budget: 50.00 }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: expectedRequests, error: null })
        }))
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findMatchingRequests(tripId, maxBudget);

      expect(mockChain.lte).toHaveBeenCalledWith('max_item_budget', maxBudget);
      expect(result).toEqual(expectedRequests);
    });
  });

  describe('updateStatus', () => {
    it('should update request status successfully', async () => {
      const requestId = 'request-123';
      const status = SharedRequestStatus.ACCEPTED;
      const expectedRequest = {
        id: requestId,
        status: 'accepted',
        accepted_at: expect.any(String),
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedRequest, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.updateStatus(requestId, status);

      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'accepted',
        accepted_at: expect.any(String),
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', requestId);
      expect(result).toEqual(expectedRequest);
    });

    it('should set completed_at when status is delivered', async () => {
      const requestId = 'request-123';
      const status = SharedRequestStatus.DELIVERED;

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      await requestRepository.updateStatus(requestId, status);

      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'delivered',
        completed_at: expect.any(String),
        updated_at: expect.any(String)
      });
    });

    it('should map request status correctly', async () => {
      const requestId = 'request-123';
      
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      // Test PENDING -> pending
      await requestRepository.updateStatus(requestId, SharedRequestStatus.PENDING);
      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'pending',
        updated_at: expect.any(String)
      });

      // Test PURCHASED -> purchased
      await requestRepository.updateStatus(requestId, SharedRequestStatus.PURCHASED);
      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'purchased',
        updated_at: expect.any(String)
      });

      // Test CANCELLED -> cancelled
      await requestRepository.updateStatus(requestId, SharedRequestStatus.CANCELLED);
      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'cancelled',
        updated_at: expect.any(String)
      });
    });
  });

  describe('acceptRequest', () => {
    it('should accept request successfully', async () => {
      const requestId = 'request-123';
      const expectedRequest = {
        id: requestId,
        status: 'accepted',
        accepted_at: expect.any(String),
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedRequest, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.acceptRequest(requestId);

      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'accepted',
        accepted_at: expect.any(String),
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', requestId);
      expect(result).toEqual(expectedRequest);
    });

    it('should accept request with custom accepted_at date', async () => {
      const requestId = 'request-123';
      const customDate = new Date('2023-12-01T10:00:00Z');

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      await requestRepository.acceptRequest(requestId, customDate);

      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'accepted',
        accepted_at: customDate.toISOString(),
        updated_at: expect.any(String)
      });
    });
  });

  describe('completeRequest', () => {
    it('should complete request successfully', async () => {
      const requestId = 'request-123';
      const expectedRequest = {
        id: requestId,
        status: 'delivered',
        completed_at: expect.any(String),
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedRequest, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.completeRequest(requestId);

      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'delivered',
        completed_at: expect.any(String),
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', requestId);
      expect(result).toEqual(expectedRequest);
    });
  });

  describe('update', () => {
    it('should update request successfully', async () => {
      const requestId = 'request-123';
      const updates = { delivery_fee: 10.00 };
      const expectedRequest = {
        id: requestId,
        delivery_fee: 10.00,
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedRequest, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.update(requestId, updates);

      expect(mockChain.update).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', requestId);
      expect(result).toEqual(expectedRequest);
    });
  });

  describe('delete', () => {
    it('should delete request successfully', async () => {
      const requestId = 'request-123';

      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.delete(requestId);

      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', requestId);
      expect(result).toBe(true);
    });
  });

  describe('cancelRequest', () => {
    it('should cancel request successfully', async () => {
      const requestId = 'request-123';
      const expectedRequest = {
        id: requestId,
        status: 'cancelled',
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedRequest, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.cancelRequest(requestId);

      expect(mockChain.update).toHaveBeenCalledWith({
        status: 'cancelled',
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', requestId);
      expect(result).toEqual(expectedRequest);
    });
  });

  describe('getRequestWithDetails', () => {
    it('should get request with details successfully', async () => {
      const requestId = 'request-123';
      const expectedRequestWithDetails = {
        id: requestId,
        trip_id: 'trip-456',
        requester_id: 'user-789',
        trips: {
          id: 'trip-456',
          user_id: 'user-abc',
          destination_id: 'location-def',
          departure_time: '2023-12-01T10:00:00Z',
          status: 'announced'
        },
        users: {
          id: 'user-789',
          name: 'Jane Doe',
          rating: 4.2,
          total_deliveries: 5
        }
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedRequestWithDetails, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.getRequestWithDetails(requestId);

      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('trips!delivery_requests_trip_id_fkey'));
      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('users!delivery_requests_requester_id_fkey'));
      expect(mockChain.eq).toHaveBeenCalledWith('id', requestId);
      expect(result).toEqual(expectedRequestWithDetails);
    });

    it('should return null when request not found', async () => {
      const requestId = 'non-existent-request';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.getRequestWithDetails(requestId);

      expect(result).toBeNull();
    });
  });

  describe('findActiveRequestsByUser', () => {
    it('should find active requests by user successfully', async () => {
      const userId = 'user-123';
      const expectedRequests = [
        { id: 'request-1', requester_id: userId, status: 'pending' },
        { id: 'request-2', requester_id: userId, status: 'accepted' },
        { id: 'request-3', requester_id: userId, status: 'purchased' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedRequests, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findActiveRequestsByUser(userId);

      expect(mockChain.eq).toHaveBeenCalledWith('requester_id', userId);
      expect(mockChain.in).toHaveBeenCalledWith('status', ['pending', 'accepted', 'purchased', 'in_transit']);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(expectedRequests);
    });
  });

  describe('findRequestsByStatus', () => {
    it('should find requests by status successfully', async () => {
      const status: RequestStatus = 'pending';
      const expectedRequests = [
        { id: 'request-1', status: 'pending' },
        { id: 'request-2', status: 'pending' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: expectedRequests, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await requestRepository.findRequestsByStatus(status);

      expect(mockChain.eq).toHaveBeenCalledWith('status', status);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(expectedRequests);
    });
  });
});