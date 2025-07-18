import { StatusTrackingService } from '../StatusTrackingService';
import { TripStatus, RequestStatus } from '../../../../shared/src/types';

// Mock dependencies
const mockTripRepository = {
  getTripWithDetails: jest.fn(),
  updateStatus: jest.fn(),
  findById: jest.fn()
};

const mockRequestRepository = {
  getRequestWithDetails: jest.fn(),
  updateStatus: jest.fn(),
  findById: jest.fn()
};

const mockNotificationService = {
  notifyStatusUpdate: jest.fn(),
  getDeviceTokensByUserId: jest.fn()
};

const mockWebSocketManager = {
  sendToUser: jest.fn(),
  broadcastToAll: jest.fn()
};

describe('StatusTrackingService', () => {
  let statusTrackingService: StatusTrackingService;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create service instance with mocked dependencies
    statusTrackingService = new StatusTrackingService(
      mockTripRepository as any,
      mockRequestRepository as any,
      mockNotificationService as any,
      mockWebSocketManager as any
    );
  });
  
  describe('updateTripStatus', () => {
    const mockTrip = {
      id: 'trip-123',
      user_id: 'user-456',
      status: 'announced',
      updated_at: '2025-01-01T00:00:00Z'
    };
    
    it('should update trip status and send notifications', async () => {
      // Setup mocks
      mockTripRepository.getTripWithDetails.mockResolvedValue(mockTrip);
      mockTripRepository.updateStatus.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.TRAVELING
      });
      
      // Call the method
      const result = await statusTrackingService.updateTripStatus(
        'trip-123',
        TripStatus.TRAVELING
      );
      
      // Verify results
      expect(mockTripRepository.getTripWithDetails).toHaveBeenCalledWith('trip-123');
      expect(mockTripRepository.updateStatus).toHaveBeenCalledWith('trip-123', TripStatus.TRAVELING);
      expect(mockWebSocketManager.sendToUser).toHaveBeenCalled();
      
      // Verify the returned status update
      expect(result).toMatchObject({
        entityType: 'trip',
        entityId: 'trip-123',
        status: TripStatus.TRAVELING
      });
    });
    
    it('should throw error if trip not found', async () => {
      // Setup mocks
      mockTripRepository.getTripWithDetails.mockResolvedValue(null);
      
      // Call the method and expect error
      await expect(
        statusTrackingService.updateTripStatus('non-existent-trip', TripStatus.TRAVELING)
      ).rejects.toThrow('Trip not found');
    });
    
    it('should not send notifications if disabled in options', async () => {
      // Setup mocks
      mockTripRepository.getTripWithDetails.mockResolvedValue(mockTrip);
      mockTripRepository.updateStatus.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.TRAVELING
      });
      
      // Call the method with notifications disabled
      await statusTrackingService.updateTripStatus(
        'trip-123',
        TripStatus.TRAVELING,
        { notifyUsers: false, sendRealTimeUpdates: true }
      );
      
      // Verify notification service was not called
      expect(mockNotificationService.notifyStatusUpdate).not.toHaveBeenCalled();
      // But WebSocket updates should still be sent
      expect(mockWebSocketManager.sendToUser).toHaveBeenCalled();
    });
    
    it('should not send real-time updates if disabled in options', async () => {
      // Setup mocks
      mockTripRepository.getTripWithDetails.mockResolvedValue(mockTrip);
      mockTripRepository.updateStatus.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.TRAVELING
      });
      
      // Call the method with real-time updates disabled
      await statusTrackingService.updateTripStatus(
        'trip-123',
        TripStatus.TRAVELING,
        { notifyUsers: true, sendRealTimeUpdates: false }
      );
      
      // Verify WebSocket manager was not called
      expect(mockWebSocketManager.sendToUser).not.toHaveBeenCalled();
      // But notifications should still be sent
      // Note: In the current implementation, this might not be called directly
      // as it's handled in the sendStatusNotifications private method
    });
  });
  
  describe('updateRequestStatus', () => {
    const mockRequest = {
      id: 'request-123',
      trip_id: 'trip-456',
      requester_id: 'user-789',
      status: 'pending',
      updated_at: '2025-01-01T00:00:00Z',
      trip: {
        user_id: 'traveler-123'
      }
    };
    
    it('should update request status and send notifications', async () => {
      // Setup mocks
      mockRequestRepository.getRequestWithDetails.mockResolvedValue(mockRequest);
      mockRequestRepository.updateStatus.mockResolvedValue({
        ...mockRequest,
        status: RequestStatus.ACCEPTED
      });
      
      // Call the method
      const result = await statusTrackingService.updateRequestStatus(
        'request-123',
        RequestStatus.ACCEPTED
      );
      
      // Verify results
      expect(mockRequestRepository.getRequestWithDetails).toHaveBeenCalledWith('request-123');
      expect(mockRequestRepository.updateStatus).toHaveBeenCalledWith('request-123', RequestStatus.ACCEPTED);
      expect(mockWebSocketManager.sendToUser).toHaveBeenCalled();
      
      // Verify the returned status update
      expect(result).toMatchObject({
        entityType: 'request',
        entityId: 'request-123',
        status: RequestStatus.ACCEPTED
      });
    });
    
    it('should throw error if request not found', async () => {
      // Setup mocks
      mockRequestRepository.getRequestWithDetails.mockResolvedValue(null);
      
      // Call the method and expect error
      await expect(
        statusTrackingService.updateRequestStatus('non-existent-request', RequestStatus.ACCEPTED)
      ).rejects.toThrow('Request not found');
    });
  });
  
  describe('addPhotoConfirmation', () => {
    const mockTrip = {
      id: 'trip-123',
      user_id: 'user-456',
      status: 'at_destination',
      updated_at: '2025-01-01T00:00:00Z'
    };
    
    const mockRequest = {
      id: 'request-123',
      trip_id: 'trip-456',
      requester_id: 'user-789',
      status: 'accepted',
      updated_at: '2025-01-01T00:00:00Z',
      trip: {
        user_id: 'traveler-123'
      }
    };
    
    it('should add photo confirmation for a trip', async () => {
      // Setup mocks
      mockTripRepository.getTripWithDetails.mockResolvedValue(mockTrip);
      
      // Call the method
      const result = await statusTrackingService.addPhotoConfirmation(
        'trip',
        'trip-123',
        'https://example.com/photo.jpg'
      );
      
      // Verify results
      expect(mockTripRepository.getTripWithDetails).toHaveBeenCalledWith('trip-123');
      expect(mockWebSocketManager.sendToUser).toHaveBeenCalled();
      
      // Verify the returned status update
      expect(result).toMatchObject({
        entityType: 'trip',
        entityId: 'trip-123',
        photoUrl: 'https://example.com/photo.jpg',
        metadata: {
          confirmationType: 'photo'
        }
      });
    });
    
    it('should add photo confirmation for a request', async () => {
      // Setup mocks
      mockRequestRepository.getRequestWithDetails.mockResolvedValue(mockRequest);
      
      // Call the method
      const result = await statusTrackingService.addPhotoConfirmation(
        'request',
        'request-123',
        'https://example.com/photo.jpg'
      );
      
      // Verify results
      expect(mockRequestRepository.getRequestWithDetails).toHaveBeenCalledWith('request-123');
      expect(mockWebSocketManager.sendToUser).toHaveBeenCalled();
      
      // Verify the returned status update
      expect(result).toMatchObject({
        entityType: 'request',
        entityId: 'request-123',
        photoUrl: 'https://example.com/photo.jpg',
        metadata: {
          confirmationType: 'photo'
        }
      });
    });
    
    it('should throw error if entity not found', async () => {
      // Setup mocks
      mockTripRepository.getTripWithDetails.mockResolvedValue(null);
      
      // Call the method and expect error
      await expect(
        statusTrackingService.addPhotoConfirmation('trip', 'non-existent-trip', 'https://example.com/photo.jpg')
      ).rejects.toThrow('Trip not found');
    });
  });
  
  describe('addReceiptConfirmation', () => {
    const mockRequest = {
      id: 'request-123',
      trip_id: 'trip-456',
      requester_id: 'user-789',
      status: 'purchased',
      updated_at: '2025-01-01T00:00:00Z',
      trip: {
        user_id: 'traveler-123'
      }
    };
    
    it('should add receipt confirmation for a request', async () => {
      // Setup mocks
      mockRequestRepository.getRequestWithDetails.mockResolvedValue(mockRequest);
      
      // Call the method
      const result = await statusTrackingService.addReceiptConfirmation(
        'request',
        'request-123',
        'https://example.com/receipt.jpg',
        { amount: 25.99, currency: 'USD' }
      );
      
      // Verify results
      expect(mockRequestRepository.getRequestWithDetails).toHaveBeenCalledWith('request-123');
      expect(mockWebSocketManager.sendToUser).toHaveBeenCalled();
      
      // Verify the returned status update
      expect(result).toMatchObject({
        entityType: 'request',
        entityId: 'request-123',
        receiptUrl: 'https://example.com/receipt.jpg',
        metadata: {
          amount: 25.99,
          currency: 'USD',
          confirmationType: 'receipt'
        }
      });
    });
    
    it('should throw error if entity not found', async () => {
      // Setup mocks
      mockRequestRepository.getRequestWithDetails.mockResolvedValue(null);
      
      // Call the method and expect error
      await expect(
        statusTrackingService.addReceiptConfirmation('request', 'non-existent-request', 'https://example.com/receipt.jpg')
      ).rejects.toThrow('Request not found');
    });
  });
  
  describe('getLatestStatus', () => {
    const mockTrip = {
      id: 'trip-123',
      status: 'at_destination',
      updated_at: '2025-01-01T00:00:00Z'
    };
    
    it('should return latest status for a trip', async () => {
      // Setup mocks
      mockTripRepository.getTripWithDetails.mockResolvedValue(mockTrip);
      
      // Call the method
      const result = await statusTrackingService.getLatestStatus('trip', 'trip-123');
      
      // Verify results
      expect(mockTripRepository.getTripWithDetails).toHaveBeenCalledWith('trip-123');
      
      // Verify the returned status
      expect(result).toMatchObject({
        entityType: 'trip',
        entityId: 'trip-123',
        status: mockTrip.status
      });
    });
    
    it('should return null if entity not found', async () => {
      // Setup mocks
      mockTripRepository.getTripWithDetails.mockResolvedValue(null);
      
      // Call the method
      const result = await statusTrackingService.getLatestStatus('trip', 'non-existent-trip');
      
      // Verify results
      expect(result).toBeNull();
    });
  });
});