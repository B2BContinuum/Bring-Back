import { StatusTrackingController } from '../StatusTrackingController';
import { TripStatus, RequestStatus } from '../../../../shared/src/types';
import { Request, Response } from 'express';

// Mock dependencies
const mockStatusTrackingService = {
  updateTripStatus: jest.fn(),
  updateRequestStatus: jest.fn(),
  addPhotoConfirmation: jest.fn(),
  addReceiptConfirmation: jest.fn(),
  getStatusHistory: jest.fn(),
  getLatestStatus: jest.fn()
};

// Mock Express request and response
const mockRequest = (params = {}, body = {}, query = {}) => {
  return {
    params,
    body,
    query
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('StatusTrackingController', () => {
  let statusTrackingController: StatusTrackingController;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create controller instance with mocked service
    statusTrackingController = new StatusTrackingController(mockStatusTrackingService as any);
  });
  
  describe('updateTripStatus', () => {
    const mockStatusUpdate = {
      id: 'st_123',
      entityType: 'trip',
      entityId: 'trip-123',
      status: TripStatus.TRAVELING,
      timestamp: new Date()
    };
    
    it('should update trip status successfully', async () => {
      // Setup mocks
      mockStatusTrackingService.updateTripStatus.mockResolvedValue(mockStatusUpdate);
      
      // Create mock request and response
      const req = mockRequest(
        { tripId: 'trip-123' },
        { status: TripStatus.TRAVELING }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.updateTripStatus(req, res);
      
      // Verify results
      expect(mockStatusTrackingService.updateTripStatus).toHaveBeenCalledWith(
        'trip-123',
        TripStatus.TRAVELING,
        { notifyUsers: true, sendRealTimeUpdates: true },
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStatusUpdate);
    });
    
    it('should handle invalid status', async () => {
      // Create mock request with invalid status
      const req = mockRequest(
        { tripId: 'trip-123' },
        { status: 'invalid_status' }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.updateTripStatus(req, res);
      
      // Verify results
      expect(mockStatusTrackingService.updateTripStatus).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.anything() }));
    });
    
    it('should handle service errors', async () => {
      // Setup mocks
      mockStatusTrackingService.updateTripStatus.mockRejectedValue(new Error('Service error'));
      
      // Create mock request and response
      const req = mockRequest(
        { tripId: 'trip-123' },
        { status: TripStatus.TRAVELING }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.updateTripStatus(req, res);
      
      // Verify results
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Service error' });
    });
  });
  
  describe('updateRequestStatus', () => {
    const mockStatusUpdate = {
      id: 'st_123',
      entityType: 'request',
      entityId: 'request-123',
      status: RequestStatus.ACCEPTED,
      timestamp: new Date()
    };
    
    it('should update request status successfully', async () => {
      // Setup mocks
      mockStatusTrackingService.updateRequestStatus.mockResolvedValue(mockStatusUpdate);
      
      // Create mock request and response
      const req = mockRequest(
        { requestId: 'request-123' },
        { status: RequestStatus.ACCEPTED }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.updateRequestStatus(req, res);
      
      // Verify results
      expect(mockStatusTrackingService.updateRequestStatus).toHaveBeenCalledWith(
        'request-123',
        RequestStatus.ACCEPTED,
        { notifyUsers: true, sendRealTimeUpdates: true },
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStatusUpdate);
    });
  });
  
  describe('addPhotoConfirmation', () => {
    const mockStatusUpdate = {
      id: 'st_123',
      entityType: 'request',
      entityId: 'request-123',
      status: RequestStatus.PURCHASED,
      photoUrl: 'https://example.com/photo.jpg',
      timestamp: new Date()
    };
    
    it('should add photo confirmation successfully', async () => {
      // Setup mocks
      mockStatusTrackingService.addPhotoConfirmation.mockResolvedValue(mockStatusUpdate);
      
      // Create mock request and response
      const req = mockRequest(
        {},
        {
          entityType: 'request',
          entityId: 'request-123',
          photoUrl: 'https://example.com/photo.jpg'
        }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.addPhotoConfirmation(req, res);
      
      // Verify results
      expect(mockStatusTrackingService.addPhotoConfirmation).toHaveBeenCalledWith(
        'request',
        'request-123',
        'https://example.com/photo.jpg',
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStatusUpdate);
    });
    
    it('should handle invalid URL', async () => {
      // Create mock request with invalid URL
      const req = mockRequest(
        {},
        {
          entityType: 'request',
          entityId: 'request-123',
          photoUrl: 'not-a-url'
        }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.addPhotoConfirmation(req, res);
      
      // Verify results
      expect(mockStatusTrackingService.addPhotoConfirmation).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.anything() }));
    });
  });
  
  describe('addReceiptConfirmation', () => {
    const mockStatusUpdate = {
      id: 'st_123',
      entityType: 'request',
      entityId: 'request-123',
      status: RequestStatus.PURCHASED,
      receiptUrl: 'https://example.com/receipt.jpg',
      timestamp: new Date()
    };
    
    it('should add receipt confirmation successfully', async () => {
      // Setup mocks
      mockStatusTrackingService.addReceiptConfirmation.mockResolvedValue(mockStatusUpdate);
      
      // Create mock request and response
      const req = mockRequest(
        {},
        {
          entityType: 'request',
          entityId: 'request-123',
          receiptUrl: 'https://example.com/receipt.jpg',
          metadata: { amount: 25.99 }
        }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.addReceiptConfirmation(req, res);
      
      // Verify results
      expect(mockStatusTrackingService.addReceiptConfirmation).toHaveBeenCalledWith(
        'request',
        'request-123',
        'https://example.com/receipt.jpg',
        { amount: 25.99 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStatusUpdate);
    });
  });
  
  describe('getStatusHistory', () => {
    const mockStatusHistory = [
      {
        id: 'st_123',
        entityType: 'trip',
        entityId: 'trip-123',
        status: TripStatus.ANNOUNCED,
        timestamp: new Date('2025-01-01T10:00:00Z')
      },
      {
        id: 'st_124',
        entityType: 'trip',
        entityId: 'trip-123',
        status: TripStatus.TRAVELING,
        timestamp: new Date('2025-01-01T10:30:00Z')
      }
    ];
    
    it('should get status history successfully', async () => {
      // Setup mocks
      mockStatusTrackingService.getStatusHistory.mockResolvedValue(mockStatusHistory);
      
      // Create mock request and response
      const req = mockRequest(
        { entityType: 'trip', entityId: 'trip-123' },
        {},
        { limit: '10', offset: '0' }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.getStatusHistory(req, res);
      
      // Verify results
      expect(mockStatusTrackingService.getStatusHistory).toHaveBeenCalledWith(
        'trip',
        'trip-123',
        10,
        0
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStatusHistory);
    });
    
    it('should handle invalid entity type', async () => {
      // Create mock request with invalid entity type
      const req = mockRequest(
        { entityType: 'invalid', entityId: 'trip-123' }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.getStatusHistory(req, res);
      
      // Verify results
      expect(mockStatusTrackingService.getStatusHistory).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.anything() }));
    });
  });
  
  describe('getLatestStatus', () => {
    const mockLatestStatus = {
      id: 'st_124',
      entityType: 'trip',
      entityId: 'trip-123',
      status: TripStatus.TRAVELING,
      timestamp: new Date('2025-01-01T10:30:00Z')
    };
    
    it('should get latest status successfully', async () => {
      // Setup mocks
      mockStatusTrackingService.getLatestStatus.mockResolvedValue(mockLatestStatus);
      
      // Create mock request and response
      const req = mockRequest(
        { entityType: 'trip', entityId: 'trip-123' }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.getLatestStatus(req, res);
      
      // Verify results
      expect(mockStatusTrackingService.getLatestStatus).toHaveBeenCalledWith(
        'trip',
        'trip-123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockLatestStatus);
    });
    
    it('should handle not found status', async () => {
      // Setup mocks
      mockStatusTrackingService.getLatestStatus.mockResolvedValue(null);
      
      // Create mock request and response
      const req = mockRequest(
        { entityType: 'trip', entityId: 'non-existent-trip' }
      );
      const res = mockResponse();
      
      // Call the method
      await statusTrackingController.getLatestStatus(req, res);
      
      // Verify results
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Status not found' });
    });
  });
});