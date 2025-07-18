import { Request, Response } from 'express';
import { RequestController } from '../RequestController';
import { IRequestService } from '../../services/RequestService';
import { IPaymentService } from '../../services/PaymentService';
import { PaymentProvider } from '../../interfaces/PaymentProvider';
import { DeliveryRequest, RequestStatus } from '../../../../shared/src/types';
import { Payment, PaymentStatus } from '../../models/Payment';

// Mock services and provider
const mockRequestService: jest.Mocked<IRequestService> = {
  createRequest: jest.fn(),
  getRequestById: jest.fn(),
  getRequestsByTripId: jest.fn(),
  getRequestsByRequesterId: jest.fn(),
  acceptRequest: jest.fn(),
  updateRequestStatus: jest.fn(),
  completeRequest: jest.fn(),
  cancelRequest: jest.fn(),
  matchRequestsToTrip: jest.fn(),
  getRequestWithDetails: jest.fn()
};

const mockPaymentService: jest.Mocked<IPaymentService> = {
  createPaymentIntent: jest.fn(),
  retrievePaymentIntent: jest.fn(),
  cancelPaymentIntent: jest.fn(),
  authorizePayment: jest.fn(),
  capturePayment: jest.fn(),
  refundPayment: jest.fn(),
  transferToTraveler: jest.fn(),
  getPaymentById: jest.fn(),
  getPaymentsByRequestId: jest.fn(),
  getPaymentsByCustomerId: jest.fn(),
  calculateTotalCost: jest.fn(),
  createCustomer: jest.fn(),
  getOrCreateCustomer: jest.fn(),
  addPaymentMethod: jest.fn(),
  getPaymentMethods: jest.fn(),
  setDefaultPaymentMethod: jest.fn(),
  removePaymentMethod: jest.fn()
};

const mockPaymentProvider: jest.Mocked<PaymentProvider> = {
  createPaymentIntent: jest.fn(),
  retrievePaymentIntent: jest.fn(),
  capturePayment: jest.fn(),
  cancelPayment: jest.fn(),
  refundPayment: jest.fn(),
  transferFunds: jest.fn(),
  createCustomer: jest.fn(),
  attachPaymentMethod: jest.fn(),
  setDefaultPaymentMethod: jest.fn(),
  detachPaymentMethod: jest.fn(),
  getPaymentMethod: jest.fn(),
  handleWebhookEvent: jest.fn()
};

// Sample data
const sampleRequest: DeliveryRequest = {
  id: 'request-123',
  tripId: 'trip-123',
  requesterId: 'user-456',
  items: [
    {
      id: 'item-1',
      name: 'Test Item',
      description: 'Test Description',
      quantity: 2,
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
  maxItemBudget: 30,
  deliveryFee: 5,
  specialInstructions: 'Leave at door',
  status: RequestStatus.PENDING,
  createdAt: new Date('2023-01-01T10:00:00Z')
};

const samplePayment = new Payment({
  id: 'payment-123',
  requestId: 'request-123',
  paymentIntentId: 'pi_123456',
  customerId: 'cus_123456',
  amount: 26.98,
  currency: 'usd',
  status: PaymentStatus.PENDING,
  createdAt: new Date('2023-01-01T10:00:00Z')
});

describe('RequestController', () => {
  let requestController: RequestController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let responseObject: any = {};

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create controller with mock services
    requestController = new RequestController(
      mockRequestService,
      mockPaymentService,
      mockPaymentProvider
    );
    
    // Setup mock request and response
    mockReq = {};
    responseObject = {
      statusCode: 0,
      body: {}
    };
    mockRes = {
      status: jest.fn().mockImplementation((code) => {
        responseObject.statusCode = code;
        return mockRes;
      }),
      json: jest.fn().mockImplementation((data) => {
        responseObject.body = data;
        return mockRes;
      })
    };
  });

  describe('createRequest', () => {
    it('should create a new delivery request with payment intent', async () => {
      // Arrange
      mockReq.body = {
        tripId: 'trip-123',
        requesterId: 'user-456',
        items: [
          {
            id: 'item-1',
            name: 'Test Item',
            description: 'Test Description',
            quantity: 2,
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
        maxItemBudget: 30,
        deliveryFee: 5,
        tip: 2
      };
      
      mockRequestService.createRequest.mockResolvedValue(sampleRequest);
      mockPaymentService.calculateTotalCost.mockResolvedValue({
        itemsCost: 21.98,
        deliveryFee: 5,
        tip: 2,
        total: 28.98
      });
      mockPaymentService.getOrCreateCustomer.mockResolvedValue('cus_123456');
      mockPaymentService.createPaymentIntent.mockResolvedValue({
        clientSecret: 'cs_test_123',
        paymentIntentId: 'pi_123456'
      });

      // Act
      await requestController.createRequest(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRequestService.createRequest).toHaveBeenCalledWith(mockReq.body);
      expect(mockPaymentService.calculateTotalCost).toHaveBeenCalledWith('request-123', 2);
      expect(mockPaymentService.getOrCreateCustomer).toHaveBeenCalledWith('user-456', expect.any(String), expect.any(String));
      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith('request-123', 28.98, 'cus_123456', expect.any(String));
      
      expect(responseObject.statusCode).toBe(201);
      expect(responseObject.body).toEqual({
        success: true,
        data: {
          request: sampleRequest,
          payment: {
            clientSecret: 'cs_test_123',
            amount: 28.98
          }
        }
      });
    });

    it('should require a requester ID', async () => {
      // Arrange
      mockReq.body = {
        tripId: 'trip-123',
        items: [
          {
            id: 'item-1',
            name: 'Test Item',
            quantity: 2,
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
        maxItemBudget: 30,
        deliveryFee: 5
      };

      // Act
      await requestController.createRequest(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRequestService.createRequest).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(401);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Requester ID is required'
      });
    });

    it('should handle errors', async () => {
      // Arrange
      mockReq.body = {
        tripId: 'trip-123',
        requesterId: 'user-456',
        items: [
          {
            id: 'item-1',
            name: 'Test Item',
            quantity: 2,
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
        maxItemBudget: 30,
        deliveryFee: 5
      };
      
      mockRequestService.createRequest.mockRejectedValue(new Error('Invalid request data'));

      // Act
      await requestController.createRequest(mockReq as Request, mockRes as Response);

      // Assert
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Invalid request data'
      });
    });
  });

  describe('acceptRequest', () => {
    it('should accept a delivery request', async () => {
      // Arrange
      mockReq.params = {
        id: 'request-123'
      };
      mockReq.body = {};
      
      const acceptedRequest = {
        ...sampleRequest,
        status: RequestStatus.ACCEPTED,
        acceptedAt: new Date('2023-01-01T11:00:00Z')
      };
      
      mockRequestService.acceptRequest.mockResolvedValue(acceptedRequest);

      // Act
      await requestController.acceptRequest(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRequestService.acceptRequest).toHaveBeenCalledWith('request-123', undefined);
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: acceptedRequest
      });
    });

    it('should handle request not found', async () => {
      // Arrange
      mockReq.params = {
        id: 'request-123'
      };
      mockReq.body = {};
      
      mockRequestService.acceptRequest.mockResolvedValue(null);

      // Act
      await requestController.acceptRequest(mockReq as Request, mockRes as Response);

      // Assert
      expect(responseObject.statusCode).toBe(404);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Delivery request not found'
      });
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status and capture payment when status is PURCHASED', async () => {
      // Arrange
      mockReq.params = {
        id: 'request-123'
      };
      mockReq.body = {
        status: RequestStatus.PURCHASED
      };
      
      const updatedRequest = {
        ...sampleRequest,
        status: RequestStatus.PURCHASED
      };
      
      mockRequestService.updateRequestStatus.mockResolvedValue(updatedRequest);
      mockPaymentService.getPaymentsByRequestId.mockResolvedValue([samplePayment]);
      mockPaymentService.capturePayment.mockResolvedValue({
        ...samplePayment,
        status: PaymentStatus.CAPTURED
      });

      // Act
      await requestController.updateRequestStatus(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRequestService.updateRequestStatus).toHaveBeenCalledWith('request-123', RequestStatus.PURCHASED);
      expect(mockPaymentService.getPaymentsByRequestId).toHaveBeenCalledWith('request-123');
      expect(mockPaymentService.capturePayment).toHaveBeenCalledWith('payment-123');
      
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: updatedRequest
      });
    });

    it('should require a valid status', async () => {
      // Arrange
      mockReq.params = {
        id: 'request-123'
      };
      mockReq.body = {
        status: 'invalid-status'
      };

      // Act
      await requestController.updateRequestStatus(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRequestService.updateRequestStatus).not.toHaveBeenCalled();
      expect(responseObject.statusCode).toBe(400);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Valid request status is required'
      });
    });
  });

  describe('completeRequest', () => {
    it('should complete a delivery request and transfer funds to traveler', async () => {
      // Arrange
      mockReq.params = {
        id: 'request-123'
      };
      mockReq.body = {};
      
      const completedRequest = {
        ...sampleRequest,
        status: RequestStatus.DELIVERED,
        completedAt: new Date('2023-01-01T12:00:00Z')
      };
      
      mockRequestService.completeRequest.mockResolvedValue(completedRequest);
      mockPaymentService.getPaymentsByRequestId.mockResolvedValue([samplePayment]);
      mockPaymentService.transferToTraveler.mockResolvedValue({
        ...samplePayment,
        status: PaymentStatus.TRANSFERRED
      });

      // Act
      await requestController.completeRequest(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRequestService.completeRequest).toHaveBeenCalledWith('request-123', undefined);
      expect(mockPaymentService.getPaymentsByRequestId).toHaveBeenCalledWith('request-123');
      expect(mockPaymentService.transferToTraveler).toHaveBeenCalledWith('payment-123', 'traveler-123');
      
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: completedRequest
      });
    });
  });

  describe('cancelRequest', () => {
    it('should cancel a delivery request and refund payment', async () => {
      // Arrange
      mockReq.params = {
        id: 'request-123'
      };
      
      mockRequestService.cancelRequest.mockResolvedValue(true);
      mockPaymentService.getPaymentsByRequestId.mockResolvedValue([samplePayment]);
      mockPaymentService.refundPayment.mockResolvedValue({
        ...samplePayment,
        status: PaymentStatus.REFUNDED
      });

      // Act
      await requestController.cancelRequest(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRequestService.cancelRequest).toHaveBeenCalledWith('request-123');
      expect(mockPaymentService.getPaymentsByRequestId).toHaveBeenCalledWith('request-123');
      expect(mockPaymentService.refundPayment).toHaveBeenCalledWith('payment-123', undefined, 'Request cancelled');
      
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: { success: true }
      });
    });

    it('should handle request not found', async () => {
      // Arrange
      mockReq.params = {
        id: 'request-123'
      };
      
      mockRequestService.cancelRequest.mockResolvedValue(false);

      // Act
      await requestController.cancelRequest(mockReq as Request, mockRes as Response);

      // Assert
      expect(responseObject.statusCode).toBe(404);
      expect(responseObject.body).toEqual({
        success: false,
        error: 'Delivery request not found'
      });
    });
  });

  describe('matchRequestsToTrip', () => {
    it('should match requests to a trip', async () => {
      // Arrange
      mockReq.params = {
        tripId: 'trip-123'
      };
      mockReq.query = {
        maxResults: '5'
      };
      
      mockRequestService.matchRequestsToTrip.mockResolvedValue([sampleRequest]);

      // Act
      await requestController.matchRequestsToTrip(mockReq as Request, mockRes as Response);

      // Assert
      expect(mockRequestService.matchRequestsToTrip).toHaveBeenCalledWith('trip-123', 5);
      expect(responseObject.statusCode).toBe(200);
      expect(responseObject.body).toEqual({
        success: true,
        data: [sampleRequest]
      });
    });
  });
});